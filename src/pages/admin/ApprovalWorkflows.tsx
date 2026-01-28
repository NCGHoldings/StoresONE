import { useState } from "react";
import { format } from "date-fns";
import {
  Plus,
  Settings,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Users,
  GitBranch,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useApprovalWorkflows,
  useApprovalWorkflow,
  useCreateWorkflow,
  useUpdateWorkflow,
  useDeleteWorkflow,
  useAddStep,
  useUpdateStep,
  useDeleteStep,
  useSaveApprovers,
  useSaveConditions,
  ApprovalWorkflow,
  ApprovalStep,
  CreateWorkflowInput,
  CreateStepInput,
  CreateConditionInput,
  CreateApproverInput,
  ENTITY_TYPES,
  APPROVAL_TYPES,
  APPROVER_TYPES,
  CONDITION_OPERATORS,
  CONDITION_ACTIONS,
  ESCALATION_ACTIONS,
} from "@/hooks/useApprovalWorkflow";
import { useRoleDescriptions } from "@/hooks/useRoles";
import { useUsers, UserWithRoles, ROLE_LABELS, ROLE_COLORS } from "@/hooks/useUsers";

export default function ApprovalWorkflows() {
  const [activeEntityType, setActiveEntityType] = useState("purchase_requisition");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);
  const [stepDialogOpen, setStepDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "workflow" | "step"; id: string; workflowId?: string } | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  // Form states
  const [workflowForm, setWorkflowForm] = useState<CreateWorkflowInput>({
    entity_type: "purchase_requisition",
    name: "",
    description: "",
    is_active: true,
  });
  const [stepForm, setStepForm] = useState<CreateStepInput>({
    workflow_id: "",
    step_order: 1,
    step_name: "",
    approval_type: "any",
    can_skip: false,
    escalation_action: "notify",
  });
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(null);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);

  // Queries
  const { data: workflows = [], isLoading } = useApprovalWorkflows(activeEntityType);
  const { data: selectedWorkflow, isLoading: loadingWorkflow } = useApprovalWorkflow(selectedWorkflowId);
  const { data: roleDescriptions = [] } = useRoleDescriptions();
  
  // Transform role descriptions to simple role list for approver selection
  const roles = roleDescriptions.map(rd => ({ role: rd.role, description: rd.description }));

  // Fetch users for user-based approver selection
  const { data: users = [] } = useUsers();

  // Mutations
  const createWorkflow = useCreateWorkflow();
  const updateWorkflow = useUpdateWorkflow();
  const deleteWorkflow = useDeleteWorkflow();
  const addStep = useAddStep();
  const updateStep = useUpdateStep();
  const deleteStep = useDeleteStep();
  const saveApprovers = useSaveApprovers();
  const saveConditions = useSaveConditions();

  const handleCreateWorkflow = async () => {
    try {
      if (editingWorkflowId) {
        await updateWorkflow.mutateAsync({ id: editingWorkflowId, ...workflowForm });
      } else {
        const result = await createWorkflow.mutateAsync(workflowForm);
        setSelectedWorkflowId(result.id);
      }
      setWorkflowDialogOpen(false);
      resetWorkflowForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleCreateStep = async () => {
    try {
      if (editingStepId && selectedWorkflowId) {
        await updateStep.mutateAsync({ 
          id: editingStepId, 
          workflowId: selectedWorkflowId,
          ...stepForm 
        });
      } else if (selectedWorkflowId) {
        const nextOrder = (selectedWorkflow?.steps?.length || 0) + 1;
        await addStep.mutateAsync({ 
          ...stepForm, 
          workflow_id: selectedWorkflowId,
          step_order: nextOrder,
        });
      }
      setStepDialogOpen(false);
      resetStepForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "workflow") {
        await deleteWorkflow.mutateAsync(deleteTarget.id);
        if (selectedWorkflowId === deleteTarget.id) {
          setSelectedWorkflowId(null);
        }
      } else if (deleteTarget.type === "step" && deleteTarget.workflowId) {
        await deleteStep.mutateAsync({ id: deleteTarget.id, workflowId: deleteTarget.workflowId });
      }
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleSaveApprovers = async (stepId: string, approvers: CreateApproverInput[]) => {
    if (!selectedWorkflowId) return;
    await saveApprovers.mutateAsync({ stepId, workflowId: selectedWorkflowId, approvers });
  };

  const handleSaveConditions = async (stepId: string, conditions: CreateConditionInput[]) => {
    if (!selectedWorkflowId) return;
    await saveConditions.mutateAsync({ stepId, workflowId: selectedWorkflowId, conditions });
  };

  const resetWorkflowForm = () => {
    setWorkflowForm({
      entity_type: activeEntityType,
      name: "",
      description: "",
      is_active: true,
    });
    setEditingWorkflowId(null);
  };

  const resetStepForm = () => {
    setStepForm({
      workflow_id: selectedWorkflowId || "",
      step_order: 1,
      step_name: "",
      approval_type: "any",
      can_skip: false,
      escalation_action: "notify",
    });
    setEditingStepId(null);
  };

  const openEditWorkflow = (workflow: ApprovalWorkflow) => {
    setWorkflowForm({
      entity_type: workflow.entity_type,
      name: workflow.name,
      description: workflow.description || "",
      is_active: workflow.is_active,
    });
    setEditingWorkflowId(workflow.id);
    setWorkflowDialogOpen(true);
  };

  const openEditStep = (step: ApprovalStep) => {
    setStepForm({
      workflow_id: step.workflow_id,
      step_order: step.step_order,
      step_name: step.step_name,
      approval_type: step.approval_type,
      required_percentage: step.required_percentage || undefined,
      can_skip: step.can_skip,
      timeout_hours: step.timeout_hours || undefined,
      escalation_action: step.escalation_action,
    });
    setEditingStepId(step.id);
    setStepDialogOpen(true);
  };

  const toggleStepExpanded = (stepId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Approval Workflows"
          subtitle="Configure multi-step approval workflows with conditions and approvers"
          actions={
            <Button onClick={() => {
              resetWorkflowForm();
              setWorkflowForm(prev => ({ ...prev, entity_type: activeEntityType }));
              setWorkflowDialogOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              New Workflow
            </Button>
          }
        />

        {/* Entity Type Tabs */}
        <Tabs value={activeEntityType} onValueChange={(v) => {
          setActiveEntityType(v);
          setSelectedWorkflowId(null);
        }}>
          <TabsList>
            {ENTITY_TYPES.map((type) => (
              <TabsTrigger key={type.value} value={type.value}>
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workflow List */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="font-semibold text-lg">Workflows</h3>
            
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : workflows.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <GitBranch className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>No workflows configured for this entity type.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      resetWorkflowForm();
                      setWorkflowForm(prev => ({ ...prev, entity_type: activeEntityType }));
                      setWorkflowDialogOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Workflow
                  </Button>
                </CardContent>
              </Card>
            ) : (
              workflows.map((workflow) => (
                <Card 
                  key={workflow.id}
                  className={`cursor-pointer transition-all ${
                    selectedWorkflowId === workflow.id 
                      ? "ring-2 ring-primary" 
                      : "hover:shadow-md"
                  }`}
                  onClick={() => setSelectedWorkflowId(workflow.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{workflow.name}</span>
                          {workflow.is_active ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-500">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Version {workflow.version}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditWorkflow(workflow);
                          }}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget({ type: "workflow", id: workflow.id });
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Workflow Designer */}
          <div className="lg:col-span-2">
            {!selectedWorkflowId ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a workflow to view and edit its steps</p>
                </CardContent>
              </Card>
            ) : loadingWorkflow ? (
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-8 w-1/2 mb-4" />
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : selectedWorkflow ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{selectedWorkflow.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedWorkflow.description || "No description"}
                    </p>
                  </div>
                  <Button onClick={() => {
                    resetStepForm();
                    setStepDialogOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Step
                  </Button>
                </CardHeader>
                <CardContent>
                  {!selectedWorkflow.steps || selectedWorkflow.steps.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No steps configured. Add your first approval step.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedWorkflow.steps.map((step, index) => (
                        <StepCard
                          key={step.id}
                          step={step}
                          index={index}
                          isExpanded={expandedSteps.has(step.id)}
                          onToggle={() => toggleStepExpanded(step.id)}
                          onEdit={() => openEditStep(step)}
                          onDelete={() => {
                            setDeleteTarget({ 
                              type: "step", 
                              id: step.id, 
                              workflowId: selectedWorkflowId 
                            });
                            setDeleteDialogOpen(true);
                          }}
                          onSaveApprovers={(approvers) => handleSaveApprovers(step.id, approvers)}
                          onSaveConditions={(conditions) => handleSaveConditions(step.id, conditions)}
                          roles={roles}
                          users={users}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>

      {/* Workflow Dialog */}
      <Dialog open={workflowDialogOpen} onOpenChange={setWorkflowDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingWorkflowId ? "Edit Workflow" : "Create Workflow"}
            </DialogTitle>
            <DialogDescription>
              Configure the approval workflow settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Entity Type</Label>
              <Select 
                value={workflowForm.entity_type} 
                onValueChange={(v) => setWorkflowForm(prev => ({ ...prev, entity_type: v }))}
                disabled={!!editingWorkflowId}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Workflow Name</Label>
              <Input
                value={workflowForm.name}
                onChange={(e) => setWorkflowForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Standard PR Approval"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={workflowForm.description}
                onChange={(e) => setWorkflowForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the workflow purpose..."
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={workflowForm.is_active}
                onCheckedChange={(checked) => setWorkflowForm(prev => ({ ...prev, is_active: checked }))}
              />
              <Label>Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWorkflowDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateWorkflow}
              disabled={!workflowForm.name.trim() || createWorkflow.isPending || updateWorkflow.isPending}
            >
              {editingWorkflowId ? "Save Changes" : "Create Workflow"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Step Dialog */}
      <Dialog open={stepDialogOpen} onOpenChange={setStepDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStepId ? "Edit Step" : "Add Approval Step"}
            </DialogTitle>
            <DialogDescription>
              Configure the approval step settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Step Name</Label>
              <Input
                value={stepForm.step_name}
                onChange={(e) => setStepForm(prev => ({ ...prev, step_name: e.target.value }))}
                placeholder="e.g., Department Head Approval"
              />
            </div>

            <div className="space-y-2">
              <Label>Approval Type</Label>
              <Select 
                value={stepForm.approval_type} 
                onValueChange={(v) => setStepForm(prev => ({ ...prev, approval_type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPROVAL_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {stepForm.approval_type === "percentage" && (
              <div className="space-y-2">
                <Label>Required Percentage (%)</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={stepForm.required_percentage || ""}
                  onChange={(e) => setStepForm(prev => ({ 
                    ...prev, 
                    required_percentage: parseInt(e.target.value) || undefined 
                  }))}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Timeout (hours)</Label>
              <Input
                type="number"
                min="1"
                value={stepForm.timeout_hours || ""}
                onChange={(e) => setStepForm(prev => ({ 
                  ...prev, 
                  timeout_hours: parseInt(e.target.value) || undefined 
                }))}
                placeholder="Optional - leave empty for no timeout"
              />
            </div>

            <div className="space-y-2">
              <Label>On Timeout</Label>
              <Select 
                value={stepForm.escalation_action} 
                onValueChange={(v) => setStepForm(prev => ({ ...prev, escalation_action: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESCALATION_ACTIONS.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={stepForm.can_skip}
                onCheckedChange={(checked) => setStepForm(prev => ({ ...prev, can_skip: checked }))}
              />
              <Label>Can be skipped</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStepDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateStep}
              disabled={!stepForm.step_name.trim() || addStep.isPending || updateStep.isPending}
            >
              {editingStepId ? "Save Changes" : "Add Step"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {deleteTarget?.type}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}

// Step Card Component
interface StepCardProps {
  step: ApprovalStep;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSaveApprovers: (approvers: CreateApproverInput[]) => void;
  onSaveConditions: (conditions: CreateConditionInput[]) => void;
  roles: { role: string; description: string | null }[];
  users: UserWithRoles[];
}

function StepCard({ 
  step, 
  index, 
  isExpanded, 
  onToggle, 
  onEdit, 
  onDelete,
  onSaveApprovers,
  onSaveConditions,
  roles,
  users,
}: StepCardProps) {
  const [localApprovers, setLocalApprovers] = useState<CreateApproverInput[]>(
    step.approvers?.map(a => ({ 
      approver_type: a.approver_type, 
      approver_value: a.approver_value || undefined 
    })) || []
  );
  const [localConditions, setLocalConditions] = useState<CreateConditionInput[]>(
    step.conditions?.map(c => ({
      field_path: c.field_path,
      operator: c.operator,
      value: c.value,
      action: c.action,
      route_to_role: c.route_to_role || undefined,
    })) || []
  );

  const addApprover = () => {
    setLocalApprovers([...localApprovers, { approver_type: "role", approver_value: "" }]);
  };

  const removeApprover = (index: number) => {
    setLocalApprovers(localApprovers.filter((_, i) => i !== index));
  };

  const updateApprover = (index: number, field: keyof CreateApproverInput, value: string) => {
    const updated = [...localApprovers];
    updated[index] = { ...updated[index], [field]: value };
    setLocalApprovers(updated);
  };

  const addCondition = () => {
    setLocalConditions([...localConditions, { 
      field_path: "", 
      operator: "eq", 
      value: "",
      action: "require" 
    }]);
  };

  const removeCondition = (index: number) => {
    setLocalConditions(localConditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, field: keyof CreateConditionInput, value: unknown) => {
    const updated = [...localConditions];
    updated[index] = { ...updated[index], [field]: value };
    setLocalConditions(updated);
  };

  return (
    <div className="border rounded-lg">
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <div className="flex items-center gap-3 p-4 bg-muted/30">
          <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
          
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
            {index + 1}
          </div>
          
          <div className="flex-1">
            <div className="font-medium">{step.step_name}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <span>{APPROVAL_TYPES.find(t => t.value === step.approval_type)?.label}</span>
              {step.timeout_hours && (
                <Badge variant="outline" className="text-xs">
                  {step.timeout_hours}h timeout
                </Badge>
              )}
              {step.can_skip && (
                <Badge variant="outline" className="text-xs">
                  Skippable
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Users className="w-3 h-3" />
              {step.approvers?.length || 0}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <GitBranch className="w-3 h-3" />
              {step.conditions?.length || 0}
            </Badge>
            <Button size="icon" variant="ghost" onClick={onEdit}>
              <Settings className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" className="text-destructive" onClick={onDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
            <CollapsibleTrigger asChild>
              <Button size="icon" variant="ghost">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent>
          <div className="p-4 border-t space-y-6">
            {/* Approvers Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Approvers
                </h4>
                <Button size="sm" variant="outline" onClick={addApprover}>
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
              
              {localApprovers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No approvers configured</p>
              ) : (
                <div className="space-y-2">
                  {localApprovers.map((approver, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Select 
                        value={approver.approver_type}
                        onValueChange={(v) => updateApprover(i, "approver_type", v)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {APPROVER_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {approver.approver_type === "role" && (
                        <Select 
                          value={approver.approver_value || ""}
                          onValueChange={(v) => updateApprover(i, "approver_value", v)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.role} value={role.role}>
                                {role.role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {approver.approver_type === "user" && (
                        <Select 
                          value={approver.approver_value || "none"}
                          onValueChange={(v) => updateApprover(i, "approver_value", v === "none" ? "" : v)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select a user">
                              {approver.approver_value && approver.approver_value !== "none" && (() => {
                                const selectedUser = users.find(u => u.id === approver.approver_value);
                                if (selectedUser) {
                                  return (
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-5 w-5">
                                        <AvatarImage src={selectedUser.avatar_url || undefined} />
                                        <AvatarFallback className="text-[10px]">
                                          {(selectedUser.full_name || selectedUser.email || "?")
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")
                                            .toUpperCase()
                                            .slice(0, 2)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="truncate">{selectedUser.full_name || selectedUser.email}</span>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            <SelectItem value="none">Select a user...</SelectItem>
                            {users.filter(u => u.is_active !== false).map((user) => {
                              const initials = (user.full_name || user.email || "?")
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2);
                              return (
                                <SelectItem key={user.id} value={user.id}>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={user.avatar_url || undefined} />
                                      <AvatarFallback className="text-xs">
                                        {initials}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{user.full_name || user.email}</span>
                                      {user.full_name && user.email && (
                                        <span className="text-xs text-muted-foreground">{user.email}</span>
                                      )}
                                    </div>
                                    {user.roles.length > 0 && (
                                      <div className="ml-auto flex gap-1">
                                        {user.roles.slice(0, 2).map((role) => (
                                          <Badge 
                                            key={role} 
                                            variant="secondary" 
                                            className={`text-[10px] px-1.5 py-0 ${ROLE_COLORS[role]}`}
                                          >
                                            {ROLE_LABELS[role]}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      )}

                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="text-destructive"
                        onClick={() => removeApprover(i)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <Button 
                size="sm" 
                className="mt-3"
                onClick={() => onSaveApprovers(localApprovers)}
              >
                Save Approvers
              </Button>
            </div>

            {/* Conditions Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  Conditions (IF rules)
                </h4>
                <Button size="sm" variant="outline" onClick={addCondition}>
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
              
              {localConditions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No conditions - step always executes</p>
              ) : (
                <div className="space-y-2">
                  {localConditions.map((condition, i) => (
                    <div key={i} className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">IF</span>
                      <Input
                        value={condition.field_path}
                        onChange={(e) => updateCondition(i, "field_path", e.target.value)}
                        placeholder="field (e.g. total_estimated_value)"
                        className="w-[200px]"
                      />
                      <Select 
                        value={condition.operator}
                        onValueChange={(v) => updateCondition(i, "operator", v)}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONDITION_OPERATORS.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={String(condition.value || "")}
                        onChange={(e) => {
                          const val = e.target.value;
                          // Try to parse as number
                          const numVal = parseFloat(val);
                          updateCondition(i, "value", isNaN(numVal) ? val : numVal);
                        }}
                        placeholder="value"
                        className="w-[120px]"
                      />
                      <span className="text-sm font-medium">THEN</span>
                      <Select 
                        value={condition.action}
                        onValueChange={(v) => updateCondition(i, "action", v)}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONDITION_ACTIONS.map((action) => (
                            <SelectItem key={action.value} value={action.value}>
                              {action.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="text-destructive"
                        onClick={() => removeCondition(i)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <Button 
                size="sm" 
                className="mt-3"
                onClick={() => onSaveConditions(localConditions)}
              >
                Save Conditions
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
