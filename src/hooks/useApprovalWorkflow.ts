import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAudit, AuditActions } from "@/lib/auditLog";
import { Json } from "@/integrations/supabase/types";
import { syncDocumentStatus } from "@/hooks/useDocumentStatusSync";
// Types - using string for DB enums to match Supabase returns
export interface ApprovalWorkflow {
  id: string;
  entity_type: string;
  name: string;
  description: string | null;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  steps?: ApprovalStep[];
}

export interface ApprovalStep {
  id: string;
  workflow_id: string;
  step_order: number;
  step_name: string;
  approval_type: string;
  required_percentage: number | null;
  can_skip: boolean;
  timeout_hours: number | null;
  escalation_action: string;
  created_at: string;
  conditions?: ApprovalCondition[];
  approvers?: StepApprover[];
}

export interface ApprovalCondition {
  id: string;
  step_id: string;
  field_path: string;
  operator: string;
  value: Json;
  action: string;
  route_to_role: string | null;
  condition_order: number;
  created_at: string;
}

export interface StepApprover {
  id: string;
  step_id: string;
  approver_type: string;
  approver_value: string | null;
  created_at: string;
}

export interface ApprovalRequest {
  id: string;
  workflow_id: string | null;
  entity_type: string;
  entity_id: string;
  entity_number: string | null;
  status: string;
  current_step_id: string | null;
  current_step_order: number;
  submitted_by: string | null;
  submitted_at: string;
  completed_at: string | null;
  created_at: string;
  workflow?: ApprovalWorkflow;
  current_step?: ApprovalStep;
  submitter?: { id: string; full_name: string | null; email: string | null };
  actions?: ApprovalAction[];
}

export interface ApprovalAction {
  id: string;
  request_id: string;
  step_id: string | null;
  user_id: string | null;
  action: string;
  comment: string | null;
  delegated_to: string | null;
  action_date: string;
  user?: { id: string; full_name: string | null; email: string | null };
  step?: ApprovalStep;
}

// Input types for mutations
export interface CreateWorkflowInput {
  entity_type: string;
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface CreateStepInput {
  workflow_id: string;
  step_order: number;
  step_name: string;
  approval_type?: string;
  required_percentage?: number;
  can_skip?: boolean;
  timeout_hours?: number;
  escalation_action?: string;
}

export interface CreateConditionInput {
  step_id?: string;
  field_path: string;
  operator: string;
  value: Json;
  action: string;
  route_to_role?: string;
  condition_order?: number;
}

export interface CreateApproverInput {
  step_id?: string;
  approver_type: string;
  approver_value?: string;
}

// =====================================================
// WORKFLOW QUERIES
// =====================================================

export function useApprovalWorkflows(entityType?: string) {
  return useQuery({
    queryKey: ["approval-workflows", entityType],
    queryFn: async () => {
      let query = supabase
        .from("approval_workflows")
        .select("*")
        .order("entity_type")
        .order("name");
      
      if (entityType) {
        query = query.eq("entity_type", entityType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ApprovalWorkflow[];
    },
  });
}

export function useApprovalWorkflow(id: string | null) {
  return useQuery({
    queryKey: ["approval-workflow", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("approval_workflows")
        .select(`
          *,
          steps:approval_steps(
            *,
            conditions:approval_conditions(*),
            approvers:step_approvers(*)
          )
        `)
        .eq("id", id)
        .single();
      
      if (error) throw error;
      
      // Sort steps by order
      if (data?.steps) {
        (data.steps as ApprovalStep[]).sort((a, b) => a.step_order - b.step_order);
      }
      
      return data as ApprovalWorkflow;
    },
    enabled: !!id,
  });
}

export function useActiveWorkflow(entityType: string) {
  return useQuery({
    queryKey: ["active-workflow", entityType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("approval_workflows")
        .select(`
          *,
          steps:approval_steps(
            *,
            conditions:approval_conditions(*),
            approvers:step_approvers(*)
          )
        `)
        .eq("entity_type", entityType)
        .eq("is_active", true)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data?.steps) {
        (data.steps as ApprovalStep[]).sort((a, b) => a.step_order - b.step_order);
      }
      
      return data as ApprovalWorkflow | null;
    },
  });
}

// =====================================================
// WORKFLOW MUTATIONS
// =====================================================

export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (workflow: CreateWorkflowInput) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("approval_workflows")
        .insert([{
          entity_type: workflow.entity_type,
          name: workflow.name,
          description: workflow.description || null,
          is_active: workflow.is_active ?? true,
          created_by: userData?.user?.id,
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      await logAudit({
        action: AuditActions.CREATE,
        entityType: 'approval_workflow',
        entityId: data.id,
        newValues: { ...workflow },
      });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-workflows"] });
      toast.success("Workflow created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create workflow: " + error.message);
    },
  });
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<CreateWorkflowInput>) => {
      const { data, error } = await supabase
        .from("approval_workflows")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      
      await logAudit({
        action: AuditActions.UPDATE,
        entityType: 'approval_workflow',
        entityId: id,
        newValues: updates as Record<string, unknown>,
      });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-workflows"] });
      queryClient.invalidateQueries({ queryKey: ["approval-workflow"] });
      toast.success("Workflow updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update workflow: " + error.message);
    },
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("approval_workflows")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      await logAudit({
        action: AuditActions.DELETE,
        entityType: 'approval_workflow',
        entityId: id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-workflows"] });
      toast.success("Workflow deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete workflow: " + error.message);
    },
  });
}

// =====================================================
// STEP MUTATIONS
// =====================================================

export function useAddStep() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (step: CreateStepInput) => {
      const { data, error } = await supabase
        .from("approval_steps")
        .insert([{
          workflow_id: step.workflow_id,
          step_order: step.step_order,
          step_name: step.step_name,
          approval_type: step.approval_type || 'any',
          required_percentage: step.required_percentage,
          can_skip: step.can_skip || false,
          timeout_hours: step.timeout_hours,
          escalation_action: step.escalation_action || 'notify',
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["approval-workflow", variables.workflow_id] });
      toast.success("Step added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add step: " + error.message);
    },
  });
}

export function useUpdateStep() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, workflowId, ...updates }: { id: string; workflowId: string } & Partial<CreateStepInput>) => {
      const { data, error } = await supabase
        .from("approval_steps")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["approval-workflow", variables.workflowId] });
      toast.success("Step updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update step: " + error.message);
    },
  });
}

export function useDeleteStep() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, workflowId }: { id: string; workflowId: string }) => {
      // Check if any approval requests are currently at this step
      const { data: linkedRequests, error: checkError } = await supabase
        .from("approval_requests")
        .select("id, entity_number, status")
        .eq("current_step_id", id)
        .limit(5);
      
      if (checkError) throw checkError;
      
      if (linkedRequests && linkedRequests.length > 0) {
        const pendingCount = linkedRequests.filter(r => r.status === "pending").length;
        if (pendingCount > 0) {
          throw new Error(
            `Cannot delete this step: ${pendingCount} pending approval request(s) are currently at this step. ` +
            `Please complete or reassign these requests first.`
          );
        }
        // If there are completed requests, clear the reference first
        const { error: clearError } = await supabase
          .from("approval_requests")
          .update({ current_step_id: null })
          .eq("current_step_id", id);
        
        if (clearError) throw clearError;
      }
      
      const { error } = await supabase
        .from("approval_steps")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["approval-workflow", variables.workflowId] });
      toast.success("Step deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete step: " + error.message);
    },
  });
}

// =====================================================
// CONDITION MUTATIONS
// =====================================================

export function useSaveConditions() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ stepId, workflowId, conditions }: { 
      stepId: string; 
      workflowId: string;
      conditions: CreateConditionInput[] 
    }) => {
      // Delete existing conditions
      await supabase
        .from("approval_conditions")
        .delete()
        .eq("step_id", stepId);
      
      // Insert new conditions
      if (conditions.length > 0) {
        const insertData = conditions.map((c, i) => ({
          step_id: stepId,
          field_path: c.field_path,
          operator: c.operator,
          value: c.value,
          action: c.action,
          route_to_role: c.route_to_role || null,
          condition_order: i,
        }));
        
        const { error } = await supabase
          .from("approval_conditions")
          .insert(insertData);
        
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["approval-workflow", variables.workflowId] });
      toast.success("Conditions saved successfully");
    },
    onError: (error) => {
      toast.error("Failed to save conditions: " + error.message);
    },
  });
}

// =====================================================
// APPROVER MUTATIONS
// =====================================================

export function useSaveApprovers() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ stepId, workflowId, approvers }: { 
      stepId: string; 
      workflowId: string;
      approvers: CreateApproverInput[] 
    }) => {
      // Delete existing approvers
      await supabase
        .from("step_approvers")
        .delete()
        .eq("step_id", stepId);
      
      // Insert new approvers
      if (approvers.length > 0) {
        const insertData = approvers.map(a => ({
          step_id: stepId,
          approver_type: a.approver_type,
          approver_value: a.approver_value || null,
        }));
        
        const { error } = await supabase
          .from("step_approvers")
          .insert(insertData);
        
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["approval-workflow", variables.workflowId] });
      toast.success("Approvers saved successfully");
    },
    onError: (error) => {
      toast.error("Failed to save approvers: " + error.message);
    },
  });
}

// =====================================================
// APPROVAL REQUEST QUERIES
// =====================================================

export function useApprovalRequests(filters?: { 
  status?: string; 
  entityType?: string;
  submittedBy?: string;
}) {
  return useQuery({
    queryKey: ["approval-requests", filters],
    queryFn: async () => {
      let query = supabase
        .from("approval_requests")
        .select(`
          *,
          workflow:approval_workflows(*),
          current_step:approval_steps(*),
          submitter:profiles!approval_requests_submitted_by_fkey(id, full_name, email)
        `)
        .order("submitted_at", { ascending: false });
      
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.entityType) {
        query = query.eq("entity_type", filters.entityType);
      }
      if (filters?.submittedBy) {
        query = query.eq("submitted_by", filters.submittedBy);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ApprovalRequest[];
    },
  });
}

export function useMyPendingApprovals() {
  return useQuery({
    queryKey: ["my-pending-approvals"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) return [];
      
      // Get user's roles
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id);
      
      const roles = userRoles?.map(r => r.role) || [];
      
      // Get pending requests
      const { data: requests, error } = await supabase
        .from("approval_requests")
        .select(`
          *,
          workflow:approval_workflows(*),
          current_step:approval_steps(
            *,
            approvers:step_approvers(*)
          ),
          submitter:profiles!approval_requests_submitted_by_fkey(id, full_name, email)
        `)
        .eq("status", "pending")
        .order("submitted_at", { ascending: false });
      
      if (error) throw error;
      
      // Filter requests where user can approve current step
      const filtered = (requests || []).filter((req) => {
        const step = req.current_step as ApprovalStep | null;
        if (!step?.approvers) return false;
        
        return (step.approvers as StepApprover[]).some((approver) => {
          if (approver.approver_type === 'role') {
            return roles.includes(approver.approver_value as never);
          }
          if (approver.approver_type === 'user') {
            return approver.approver_value === userData.user.id;
          }
          // TODO: Handle department_head, requestor_manager, cost_center_owner
          return false;
        });
      });
      
      return filtered as ApprovalRequest[];
    },
  });
}

export function useApprovalRequest(id: string | null) {
  return useQuery({
    queryKey: ["approval-request", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("approval_requests")
        .select(`
          *,
          workflow:approval_workflows(
            *,
            steps:approval_steps(
              *,
              approvers:step_approvers(*)
            )
          ),
          current_step:approval_steps(*),
          submitter:profiles!approval_requests_submitted_by_fkey(id, full_name, email),
          actions:approval_actions(
            *,
            user:profiles!approval_actions_user_id_fkey(id, full_name, email),
            step:approval_steps(*)
          )
        `)
        .eq("id", id)
        .single();
      
      if (error) throw error;
      
      // Sort actions by date
      if (data?.actions) {
        (data.actions as ApprovalAction[]).sort((a, b) => 
          new Date(a.action_date).getTime() - new Date(b.action_date).getTime()
        );
      }
      
      // Sort workflow steps
      if (data?.workflow?.steps) {
        (data.workflow.steps as ApprovalStep[]).sort((a, b) => a.step_order - b.step_order);
      }
      
      return data as ApprovalRequest;
    },
    enabled: !!id,
  });
}

export function useApprovalRequestByEntity(entityType: string, entityId: string | null) {
  return useQuery({
    queryKey: ["approval-request-entity", entityType, entityId],
    queryFn: async () => {
      if (!entityId) return null;
      
      const { data, error } = await supabase
        .from("approval_requests")
        .select(`
          *,
          workflow:approval_workflows(
            *,
            steps:approval_steps(
              *,
              approvers:step_approvers(*)
            )
          ),
          current_step:approval_steps(*),
          submitter:profiles!approval_requests_submitted_by_fkey(id, full_name, email),
          actions:approval_actions(
            *,
            user:profiles!approval_actions_user_id_fkey(id, full_name, email),
            step:approval_steps(*)
          )
        `)
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data?.actions) {
        (data.actions as ApprovalAction[]).sort((a, b) => 
          new Date(a.action_date).getTime() - new Date(b.action_date).getTime()
        );
      }
      
      if (data?.workflow?.steps) {
        (data.workflow.steps as ApprovalStep[]).sort((a, b) => a.step_order - b.step_order);
      }
      
      return data as ApprovalRequest | null;
    },
    enabled: !!entityId,
  });
}

// =====================================================
// APPROVAL REQUEST MUTATIONS
// =====================================================

export function useSubmitForApproval() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      entityType, 
      entityId, 
      entityNumber 
    }: { 
      entityType: string; 
      entityId: string; 
      entityNumber: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      // Find active workflow
      const { data: workflow, error: workflowError } = await supabase
        .from("approval_workflows")
        .select(`
          *,
          steps:approval_steps(*)
        `)
        .eq("entity_type", entityType)
        .eq("is_active", true)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (workflowError) throw workflowError;
      
      if (!workflow) {
        throw new Error("No active approval workflow found for this entity type");
      }
      
      // Get first step
      const sortedSteps = ((workflow.steps || []) as ApprovalStep[]).sort(
        (a, b) => a.step_order - b.step_order
      );
      const firstStep = sortedSteps[0];
      
      if (!firstStep) {
        throw new Error("Workflow has no steps configured");
      }
      
      // Create approval request
      const { data: request, error: requestError } = await supabase
        .from("approval_requests")
        .insert([{
          workflow_id: workflow.id,
          entity_type: entityType,
          entity_id: entityId,
          entity_number: entityNumber,
          status: 'pending',
          current_step_id: firstStep.id,
          current_step_order: firstStep.step_order,
          submitted_by: userData?.user?.id,
        }])
        .select()
        .single();
      
      if (requestError) throw requestError;
      
      // Log submit action
      await supabase.from("approval_actions").insert([{
        request_id: request.id,
        step_id: firstStep.id,
        user_id: userData?.user?.id,
        action: 'submit',
        comment: 'Submitted for approval',
      }]);
      
      await logAudit({
        action: 'SUBMIT_FOR_APPROVAL',
        entityType: entityType,
        entityId: entityId,
        newValues: { workflow_id: workflow.id, request_id: request.id },
      });
      
      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-pending-approvals"] });
      toast.success("Submitted for approval successfully");
    },
    onError: (error) => {
      toast.error("Failed to submit for approval: " + error.message);
    },
  });
}

// Helper function to validate if user is authorized to act on an approval step
async function validateApproverAuthorization(
  requestId: string, 
  userId: string
): Promise<{ authorized: boolean; reason?: string }> {
  // 1. Get user's roles
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const roles = userRoles?.map(r => r.role) || [];
  
  // 2. Get request with current step approvers
  const { data: request, error } = await supabase
    .from("approval_requests")
    .select(`
      *,
      current_step:approval_steps(
        *,
        approvers:step_approvers(*)
      ),
      submitter:profiles!submitted_by(id, manager_id, department)
    `)
    .eq("id", requestId)
    .single();
  
  if (error || !request) {
    return { authorized: false, reason: "Request not found" };
  }
  
  if (request.status !== "pending") {
    return { authorized: false, reason: "Request is not pending" };
  }
  
  const step = request.current_step as ApprovalStep | null;
  if (!step?.approvers || (step.approvers as StepApprover[]).length === 0) {
    return { authorized: false, reason: "No approvers configured for this step" };
  }
  
  // 3. Check if user is authorized
  const isAuthorized = (step.approvers as StepApprover[]).some((approver) => {
    if (approver.approver_type === 'role') {
      return roles.includes(approver.approver_value as never);
    }
    if (approver.approver_type === 'user') {
      return approver.approver_value === userId;
    }
    if (approver.approver_type === 'requestor_manager') {
      const submitter = request.submitter as { id: string; manager_id?: string } | null;
      return submitter?.manager_id === userId;
    }
    // TODO: Handle department_head, cost_center_owner
    return false;
  });
  
  if (!isAuthorized) {
    return { 
      authorized: false, 
      reason: "You are not authorized to approve this request at the current step" 
    };
  }
  
  return { authorized: true };
}

export function useApproveRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ requestId, comment }: { requestId: string; comment?: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) throw new Error("Not authenticated");
      
      // ✅ AUTHORIZATION CHECK
      const authResult = await validateApproverAuthorization(requestId, userData.user.id);
      if (!authResult.authorized) {
        throw new Error(authResult.reason || "Not authorized to approve");
      }
      
      // Get current request with workflow steps
      const { data: request, error: reqError } = await supabase
        .from("approval_requests")
        .select(`
          *,
          workflow:approval_workflows(
            steps:approval_steps(*)
          )
        `)
        .eq("id", requestId)
        .single();
      
      if (reqError) throw reqError;
      
      // Log approve action
      await supabase.from("approval_actions").insert([{
        request_id: requestId,
        step_id: request.current_step_id,
        user_id: userData?.user?.id,
        action: 'approve',
        comment,
      }]);
      
      // Get sorted steps
      const sortedSteps = ((request.workflow?.steps || []) as ApprovalStep[]).sort(
        (a, b) => a.step_order - b.step_order
      );
      
      // Find next step
      const currentIndex = sortedSteps.findIndex(
        (s) => s.id === request.current_step_id
      );
      const nextStep = sortedSteps[currentIndex + 1];
      
      if (nextStep) {
        // Move to next step
        await supabase
          .from("approval_requests")
          .update({
            current_step_id: nextStep.id,
            current_step_order: nextStep.step_order,
          })
          .eq("id", requestId);
      } else {
        // Final approval - mark as approved
        await supabase
          .from("approval_requests")
          .update({
            status: 'approved',
            completed_at: new Date().toISOString(),
          })
          .eq("id", requestId);

        // Sync status back to source document
        await syncDocumentStatus({
          entityType: request.entity_type,
          entityId: request.entity_id,
          status: "approved",
          userId: userData?.user?.id,
        });
      }
      await logAudit({
        action: AuditActions.APPROVAL,
        entityType: request.entity_type,
        entityId: request.entity_id,
        newValues: { approved: true, step: request.current_step_order },
      });
      
      return { isComplete: !nextStep };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["approval-requests"] });
      queryClient.invalidateQueries({ queryKey: ["approval-request"] });
      queryClient.invalidateQueries({ queryKey: ["my-pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["approval-request-entity"] });
      
      if (result.isComplete) {
        toast.success("Approval complete - request fully approved");
      } else {
        toast.success("Step approved - moved to next step");
      }
    },
    onError: (error) => {
      toast.error("Failed to approve: " + error.message);
    },
  });
}

export function useRejectRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ requestId, comment }: { requestId: string; comment: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) throw new Error("Not authenticated");
      
      // ✅ AUTHORIZATION CHECK
      const authResult = await validateApproverAuthorization(requestId, userData.user.id);
      if (!authResult.authorized) {
        throw new Error(authResult.reason || "Not authorized to reject");
      }
      
      // Get request info for audit
      const { data: request } = await supabase
        .from("approval_requests")
        .select("*")
        .eq("id", requestId)
        .single();
      
      // Log reject action
      await supabase.from("approval_actions").insert([{
        request_id: requestId,
        step_id: request?.current_step_id,
        user_id: userData?.user?.id,
        action: 'reject',
        comment,
      }]);
      
      // Update request status
      const { error } = await supabase
        .from("approval_requests")
        .update({
          status: 'rejected',
          completed_at: new Date().toISOString(),
        })
        .eq("id", requestId);
      
      if (error) throw error;

      // Sync status back to source document
      await syncDocumentStatus({
        entityType: request?.entity_type || "",
        entityId: request?.entity_id || "",
        status: "rejected",
        userId: userData?.user?.id,
        comment,
      });
      
      await logAudit({
        action: 'REJECT',
        entityType: request?.entity_type,
        entityId: request?.entity_id,
        newValues: { rejected: true, reason: comment },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-requests"] });
      queryClient.invalidateQueries({ queryKey: ["approval-request"] });
      queryClient.invalidateQueries({ queryKey: ["my-pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["approval-request-entity"] });
      toast.success("Request rejected");
    },
    onError: (error) => {
      toast.error("Failed to reject: " + error.message);
    },
  });
}

export function useAddApprovalComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ requestId, comment }: { requestId: string; comment: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data: request } = await supabase
        .from("approval_requests")
        .select("current_step_id")
        .eq("id", requestId)
        .single();
      
      const { error } = await supabase.from("approval_actions").insert([{
        request_id: requestId,
        step_id: request?.current_step_id,
        user_id: userData?.user?.id,
        action: 'comment',
        comment,
      }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-request"] });
      queryClient.invalidateQueries({ queryKey: ["approval-request-entity"] });
      toast.success("Comment added");
    },
    onError: (error) => {
      toast.error("Failed to add comment: " + error.message);
    },
  });
}

export function useDelegateApproval() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      requestId, 
      delegateTo, 
      comment 
    }: { 
      requestId: string; 
      delegateTo: string; 
      comment?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data: request } = await supabase
        .from("approval_requests")
        .select("current_step_id")
        .eq("id", requestId)
        .single();
      
      const { error } = await supabase.from("approval_actions").insert([{
        request_id: requestId,
        step_id: request?.current_step_id,
        user_id: userData?.user?.id,
        action: 'delegate',
        comment,
        delegated_to: delegateTo,
      }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-request"] });
      queryClient.invalidateQueries({ queryKey: ["approval-request-entity"] });
      toast.success("Approval delegated");
    },
    onError: (error) => {
      toast.error("Failed to delegate: " + error.message);
    },
  });
}

// =====================================================
// SEND BACK (RETURN FOR REVISION) MUTATION
// =====================================================

export function useSendBackRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ requestId, comment }: { requestId: string; comment: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) throw new Error("Not authenticated");
      
      // ✅ AUTHORIZATION CHECK
      const authResult = await validateApproverAuthorization(requestId, userData.user.id);
      if (!authResult.authorized) {
        throw new Error(authResult.reason || "Not authorized to send back");
      }
      
      // Get request info
      const { data: request, error: reqError } = await supabase
        .from("approval_requests")
        .select("*")
        .eq("id", requestId)
        .single();
      
      if (reqError) throw reqError;
      
      // Log send back action
      await supabase.from("approval_actions").insert([{
        request_id: requestId,
        step_id: request?.current_step_id,
        user_id: userData?.user?.id,
        action: 'send_back',
        comment,
      }]);
      
      // Update request status to indicate it needs revision
      // Reset to step 1 so it can be re-submitted
      const { data: workflow } = await supabase
        .from("approval_workflows")
        .select("steps:approval_steps(*)")
        .eq("id", request.workflow_id)
        .single();
      
      const sortedSteps = ((workflow?.steps || []) as ApprovalStep[]).sort(
        (a, b) => a.step_order - b.step_order
      );
      const firstStep = sortedSteps[0];
      
      const { error } = await supabase
        .from("approval_requests")
        .update({
          status: 'returned',
          current_step_id: firstStep?.id || request.current_step_id,
          current_step_order: firstStep?.step_order || 1,
        })
        .eq("id", requestId);
      
      if (error) throw error;

      // Sync status back to source document (set to draft/revision_required)
      await syncDocumentStatusToRevision({
        entityType: request.entity_type,
        entityId: request.entity_id,
        userId: userData?.user?.id,
        comment,
      });
      
      await logAudit({
        action: 'SEND_BACK',
        entityType: request.entity_type,
        entityId: request.entity_id,
        newValues: { sent_back: true, reason: comment },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-requests"] });
      queryClient.invalidateQueries({ queryKey: ["approval-request"] });
      queryClient.invalidateQueries({ queryKey: ["my-pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["approval-request-entity"] });
      toast.success("Request sent back for revision");
    },
    onError: (error) => {
      toast.error("Failed to send back: " + error.message);
    },
  });
}

async function syncDocumentStatusToRevision({
  entityType,
  entityId,
  userId,
  comment,
}: {
  entityType: string;
  entityId: string;
  userId?: string;
  comment?: string;
}): Promise<void> {
  try {
    switch (entityType) {
      case "purchase_requisition":
        await supabase
          .from("purchase_requisitions")
          .update({
            status: "draft",
            notes: comment ? `Returned for revision: ${comment}` : undefined,
          })
          .eq("id", entityId);
        break;

      case "purchase_order":
        await supabase
          .from("purchase_orders")
          .update({
            status: "draft",
            notes: comment ? `Returned for revision: ${comment}` : undefined,
          })
          .eq("id", entityId);
        break;

      case "supplier_registration":
        await supabase
          .from("suppliers")
          .update({
            status: "pending",
          })
          .eq("id", entityId);
        break;

      case "goods_receipt":
        await supabase
          .from("inbound_deliveries")
          .update({
            status: "scheduled" as const,
            discrepancy_notes: comment || undefined,
          })
          .eq("id", entityId);
        break;

      default:
        console.warn(`Unknown entity type for revision sync: ${entityType}`);
    }

    await logAudit({
      action: 'SEND_BACK',
      entityType,
      entityId,
      newValues: { status: 'revision_required', synced_from_workflow: true },
    });
  } catch (error) {
    console.error(`Failed to sync revision status for ${entityType}:${entityId}`, error);
    throw error;
  }
}

export function evaluateCondition(entity: Record<string, unknown>, condition: ApprovalCondition): boolean {
  const value = getNestedValue(entity, condition.field_path);
  const compareValue = condition.value as unknown;
  
  switch (condition.operator) {
    case 'eq':
      return value === compareValue;
    case 'neq':
      return value !== compareValue;
    case 'gt':
      return Number(value) > Number(compareValue);
    case 'lt':
      return Number(value) < Number(compareValue);
    case 'gte':
      return Number(value) >= Number(compareValue);
    case 'lte':
      return Number(value) <= Number(compareValue);
    case 'in':
      return Array.isArray(compareValue) && (compareValue as unknown[]).includes(value);
    case 'not_in':
      return Array.isArray(compareValue) && !(compareValue as unknown[]).includes(value);
    case 'contains':
      return String(value).includes(String(compareValue));
    case 'not_contains':
      return !String(value).includes(String(compareValue));
    default:
      return false;
  }
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object') {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function getEntityTypeLabel(entityType: string): string {
  const labels: Record<string, string> = {
    purchase_requisition: 'Purchase Requisition',
    purchase_order: 'Purchase Order',
    supplier_registration: 'Supplier Registration',
    goods_receipt: 'Goods Receipt',
  };
  return labels[entityType] || entityType;
}

export function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    submit: 'Submitted',
    approve: 'Approved',
    reject: 'Rejected',
    delegate: 'Delegated',
    comment: 'Commented',
    escalate: 'Escalated',
    skip: 'Skipped',
    send_back: 'Sent Back',
    return: 'Returned for Revision',
  };
  return labels[action] || action;
}

export const ENTITY_TYPES = [
  { value: 'purchase_requisition', label: 'Purchase Requisition' },
  { value: 'purchase_order', label: 'Purchase Order' },
  { value: 'supplier_registration', label: 'Supplier Registration' },
  { value: 'goods_receipt', label: 'Goods Receipt' },
];

export const APPROVAL_TYPES = [
  { value: 'any', label: 'Any (Single approval)' },
  { value: 'all', label: 'All (Unanimous)' },
  { value: 'percentage', label: 'Percentage' },
];

export const APPROVER_TYPES = [
  { value: 'role', label: 'Role' },
  { value: 'user', label: 'Specific User' },
  { value: 'department_head', label: 'Department Head' },
  { value: 'requestor_manager', label: "Requestor's Manager" },
  { value: 'cost_center_owner', label: 'Cost Center Owner' },
];

export const CONDITION_OPERATORS = [
  { value: 'eq', label: 'Equals' },
  { value: 'neq', label: 'Not Equals' },
  { value: 'gt', label: 'Greater Than' },
  { value: 'lt', label: 'Less Than' },
  { value: 'gte', label: 'Greater Than or Equal' },
  { value: 'lte', label: 'Less Than or Equal' },
  { value: 'in', label: 'In List' },
  { value: 'not_in', label: 'Not In List' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
];

export const CONDITION_ACTIONS = [
  { value: 'require', label: 'Require Step' },
  { value: 'skip', label: 'Skip Step' },
  { value: 'route_to', label: 'Route To' },
];

export const ESCALATION_ACTIONS = [
  { value: 'notify', label: 'Notify Manager' },
  { value: 'auto_approve', label: 'Auto Approve' },
  { value: 'auto_reject', label: 'Auto Reject' },
];
