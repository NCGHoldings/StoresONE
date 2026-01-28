import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { hasActiveWorkflow } from "@/hooks/useDocumentStatusSync";

export interface PurchaseRequisition {
  id: string;
  pr_number: string;
  requestor_id: string | null;
  department: string | null;
  urgency: string;
  status: string;
  total_estimated_value: number;
  currency: string;
  required_date: string | null;
  justification: string | null;
  cost_center_id: string | null;
  approved_by: string | null;
  approved_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
  cost_centers?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export interface PRLine {
  id: string;
  pr_id: string;
  product_id: string | null;
  product_name: string | null;
  quantity: number;
  unit_of_measure: string;
  estimated_price: number;
  total_price: number;
  delivery_date_required: string | null;
  specifications: string | null;
  suggested_supplier_id: string | null;
  notes: string | null;
  created_at: string;
  products?: {
    id: string;
    sku: string;
    name: string;
    unit_of_measure: string | null;
    unit_cost: number | null;
  } | null;
  suppliers?: {
    id: string;
    company_name: string;
  } | null;
}

export type PRInsert = {
  pr_number: string;
  requestor_id?: string | null;
  department?: string | null;
  urgency?: string;
  status?: string;
  total_estimated_value?: number;
  currency?: string;
  required_date?: string | null;
  justification?: string | null;
  cost_center_id?: string | null;
  notes?: string | null;
};

export type PRUpdate = Partial<PRInsert> & {
  approved_by?: string | null;
  approved_date?: string | null;
};

export type PRLineInsert = {
  pr_id: string;
  product_id?: string | null;
  product_name?: string | null;
  quantity: number;
  unit_of_measure?: string;
  estimated_price: number;
  total_price?: number;
  delivery_date_required?: string | null;
  specifications?: string | null;
  suggested_supplier_id?: string | null;
  notes?: string | null;
};

// Fetch all purchase requisitions
export function usePurchaseRequisitions() {
  return useQuery({
    queryKey: ["purchase-requisitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_requisitions")
        .select(`
          *,
          cost_centers (id, name, code)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as PurchaseRequisition[];
    },
  });
}

// Fetch single PR
export function usePurchaseRequisition(id: string | undefined) {
  return useQuery({
    queryKey: ["purchase-requisitions", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("purchase_requisitions")
        .select(`
          *,
          cost_centers (id, name, code),
          profiles:requestor_id (id, full_name, email)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as unknown as PurchaseRequisition;
    },
    enabled: !!id,
  });
}

// Fetch PR lines
export function usePRLines(prId: string | undefined) {
  return useQuery({
    queryKey: ["pr-lines", prId],
    queryFn: async () => {
      if (!prId) return [];
      const { data, error } = await supabase
        .from("purchase_requisition_lines")
        .select(`
          *,
          products (id, sku, name, unit_of_measure, unit_cost),
          suppliers:suggested_supplier_id (id, company_name)
        `)
        .eq("pr_id", prId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as PRLine[];
    },
    enabled: !!prId,
  });
}

// Stats for PR dashboard
export function usePRStats() {
  return useQuery({
    queryKey: ["pr-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_requisitions")
        .select("id, status, total_estimated_value, created_at");

      if (error) throw error;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      return {
        total: data.length,
        draft: data.filter((pr) => pr.status === "draft").length,
        submitted: data.filter((pr) => pr.status === "submitted").length,
        underReview: data.filter((pr) => pr.status === "under_review").length,
        approved: data.filter((pr) => pr.status === "approved").length,
        converted: data.filter((pr) => pr.status === "converted").length,
        thisMonthValue: data
          .filter((pr) => new Date(pr.created_at) >= startOfMonth)
          .reduce((sum, pr) => sum + (pr.total_estimated_value || 0), 0),
        totalValue: data.reduce((sum, pr) => sum + (pr.total_estimated_value || 0), 0),
      };
    },
  });
}

// Generate next PR number
export function useNextPRNumber() {
  return useQuery({
    queryKey: ["next-pr-number"],
    queryFn: async () => {
      const year = new Date().getFullYear();
      const prefix = `PR-${year}-`;

      const { data, error } = await supabase
        .from("purchase_requisitions")
        .select("pr_number")
        .ilike("pr_number", `${prefix}%`)
        .order("pr_number", { ascending: false })
        .limit(1);

      if (error) throw error;

      let nextNumber = 1;
      if (data && data.length > 0) {
        const lastNumber = parseInt(data[0].pr_number.replace(prefix, ""), 10);
        nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
      }

      return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
    },
  });
}

// Helper to update PR total
async function updatePRTotal(prId: string) {
  const { data: lines } = await supabase
    .from("purchase_requisition_lines")
    .select("total_price")
    .eq("pr_id", prId);

  const total = lines?.reduce((sum, line) => sum + (line.total_price || 0), 0) || 0;

  await supabase
    .from("purchase_requisitions")
    .update({ total_estimated_value: total })
    .eq("id", prId);
}

// Create PR
export function useCreatePR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pr: PRInsert) => {
      const { data, error } = await supabase
        .from("purchase_requisitions")
        .insert(pr as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["pr-stats"] });
      queryClient.invalidateQueries({ queryKey: ["next-pr-number"] });
      toast.success("Purchase requisition created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create requisition: ${error.message}`);
    },
  });
}

// Update PR
export function useUpdatePR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: PRUpdate }) => {
      const { data, error } = await supabase
        .from("purchase_requisitions")
        .update(updates as never)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-requisitions", id] });
      queryClient.invalidateQueries({ queryKey: ["pr-stats"] });
      toast.success("Requisition updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update requisition: ${error.message}`);
    },
  });
}

// Delete PR
export function useDeletePR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("purchase_requisitions")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["pr-stats"] });
      toast.success("Requisition deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete requisition: ${error.message}`);
    },
  });
}

// Add PR line
export function useAddPRLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (line: PRLineInsert) => {
      const totalPrice = line.quantity * line.estimated_price;
      const { data, error } = await supabase
        .from("purchase_requisition_lines")
        .insert({ ...line, total_price: totalPrice })
        .select()
        .single();

      if (error) throw error;
      await updatePRTotal(line.pr_id);
      return data;
    },
    onSuccess: (_, line) => {
      queryClient.invalidateQueries({ queryKey: ["pr-lines", line.pr_id] });
      queryClient.invalidateQueries({ queryKey: ["purchase-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["pr-stats"] });
    },
    onError: (error) => {
      toast.error(`Failed to add line item: ${error.message}`);
    },
  });
}

// Update PR line
export function useUpdatePRLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, prId, updates }: { id: string; prId: string; updates: Partial<PRLineInsert> }) => {
      const updateData: Partial<PRLineInsert> & { total_price?: number } = { ...updates };

      if (updates.quantity !== undefined && updates.estimated_price !== undefined) {
        updateData.total_price = updates.quantity * updates.estimated_price;
      }

      const { data, error } = await supabase
        .from("purchase_requisition_lines")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      await updatePRTotal(prId);
      return data;
    },
    onSuccess: (_, { prId }) => {
      queryClient.invalidateQueries({ queryKey: ["pr-lines", prId] });
      queryClient.invalidateQueries({ queryKey: ["purchase-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["pr-stats"] });
    },
    onError: (error) => {
      toast.error(`Failed to update line item: ${error.message}`);
    },
  });
}

// Remove PR line
export function useRemovePRLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, prId }: { id: string; prId: string }) => {
      const { error } = await supabase
        .from("purchase_requisition_lines")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await updatePRTotal(prId);
    },
    onSuccess: (_, { prId }) => {
      queryClient.invalidateQueries({ queryKey: ["pr-lines", prId] });
      queryClient.invalidateQueries({ queryKey: ["purchase-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["pr-stats"] });
    },
    onError: (error) => {
      toast.error(`Failed to remove line item: ${error.message}`);
    },
  });
}

// Submit PR for approval
export function useSubmitPR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get PR details for workflow
      const { data: pr, error: prError } = await supabase
        .from("purchase_requisitions")
        .select("pr_number")
        .eq("id", id)
        .single();

      if (prError) throw prError;

      // Update PR status
      const { data, error } = await supabase
        .from("purchase_requisitions")
        .update({ status: "submitted" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Check if there's an active workflow and create approval request
      const hasWorkflow = await hasActiveWorkflow("purchase_requisition");
      if (hasWorkflow) {
        // Find active workflow
        const { data: workflow } = await supabase
          .from("approval_workflows")
          .select(`*, steps:approval_steps(*)`)
          .eq("entity_type", "purchase_requisition")
          .eq("is_active", true)
          .order("version", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (workflow && workflow.steps && (workflow.steps as unknown[]).length > 0) {
          const sortedSteps = (workflow.steps as Array<{ id: string; step_order: number }>)
            .sort((a, b) => a.step_order - b.step_order);
          const firstStep = sortedSteps[0];

          const { data: userData } = await supabase.auth.getUser();

          // Create approval request
          const { data: request } = await supabase
            .from("approval_requests")
            .insert([{
              workflow_id: workflow.id,
              entity_type: "purchase_requisition",
              entity_id: id,
              entity_number: pr.pr_number,
              status: 'pending',
              current_step_id: firstStep.id,
              current_step_order: firstStep.step_order,
              submitted_by: userData?.user?.id,
            }])
            .select()
            .single();

          // Log submit action
          if (request) {
            await supabase.from("approval_actions").insert([{
              request_id: request.id,
              step_id: firstStep.id,
              user_id: userData?.user?.id,
              action: 'submit',
              comment: 'Submitted for approval',
            }]);
          }
        }
      }

      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-requisitions", id] });
      queryClient.invalidateQueries({ queryKey: ["pr-stats"] });
      queryClient.invalidateQueries({ queryKey: ["approval-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-pending-approvals"] });
      toast.success("Requisition submitted for approval");
    },
    onError: (error) => {
      toast.error(`Failed to submit requisition: ${error.message}`);
    },
  });
}

// Approve PR
export function useApprovePR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("purchase_requisitions")
        .update({
          status: "approved",
          approved_date: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-requisitions", id] });
      queryClient.invalidateQueries({ queryKey: ["pr-stats"] });
      toast.success("Requisition approved");
    },
    onError: (error) => {
      toast.error(`Failed to approve requisition: ${error.message}`);
    },
  });
}

// Reject PR
export function useRejectPR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data, error } = await supabase
        .from("purchase_requisitions")
        .update({
          status: "rejected",
          notes: reason,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-requisitions", id] });
      queryClient.invalidateQueries({ queryKey: ["pr-stats"] });
      toast.success("Requisition rejected");
    },
    onError: (error) => {
      toast.error(`Failed to reject requisition: ${error.message}`);
    },
  });
}

// Convert PR to PO
export function useConvertPRToPO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ prId, supplierId }: { prId: string; supplierId: string }) => {
      // Get PR and lines
      const { data: pr } = await supabase
        .from("purchase_requisitions")
        .select("*")
        .eq("id", prId)
        .single();

      const { data: lines } = await supabase
        .from("purchase_requisition_lines")
        .select("*")
        .eq("pr_id", prId);

      if (!pr || !lines) throw new Error("PR not found");

      // Generate PO number
      const year = new Date().getFullYear();
      const prefix = `PO-${year}-`;
      const { data: existingPOs } = await supabase
        .from("purchase_orders")
        .select("po_number")
        .ilike("po_number", `${prefix}%`)
        .order("po_number", { ascending: false })
        .limit(1);

      let nextNumber = 1;
      if (existingPOs && existingPOs.length > 0) {
        const lastNumber = parseInt(existingPOs[0].po_number.replace(prefix, ""), 10);
        nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
      }
      const poNumber = `${prefix}${nextNumber.toString().padStart(4, "0")}`;

      // Create PO
      const { data: po, error: poError } = await supabase
        .from("purchase_orders")
        .insert({
          po_number: poNumber,
          supplier_id: supplierId,
          pr_id: prId,
          order_date: new Date().toISOString().split("T")[0],
          expected_delivery: pr.required_date,
          status: "draft",
          total_amount: pr.total_estimated_value,
          currency: pr.currency,
          notes: `Created from ${pr.pr_number}`,
        })
        .select()
        .single();

      if (poError) throw poError;

      // Create PO lines
      for (const line of lines) {
        await supabase.from("purchase_order_lines").insert({
          po_id: po.id,
          product_id: line.product_id,
          pr_line_id: line.id,
          quantity: line.quantity,
          unit_price: line.estimated_price,
          total_price: line.total_price,
          notes: line.notes,
        });
      }

      // Mark PR as converted
      await supabase
        .from("purchase_requisitions")
        .update({ status: "converted" })
        .eq("id", prId);

      return po;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["pr-stats"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order-stats"] });
      toast.success("Requisition converted to Purchase Order");
    },
    onError: (error) => {
      toast.error(`Failed to convert to PO: ${error.message}`);
    },
  });
}
