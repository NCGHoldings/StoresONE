import { useState } from "react";
import { GitBranch, Plus, Settings, Trash2, ChevronRight, Users, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KPICard } from "../KPICard";
import {
  useApprovalWorkflows,
  useApprovalWorkflow,
  ENTITY_TYPES,
  ApprovalWorkflow,
} from "@/hooks/useApprovalWorkflow";

// Filter to only show finance-relevant entity types
const FINANCE_ENTITY_TYPES = ENTITY_TYPES.filter((type) =>
  ["purchase_requisition", "purchase_order", "goods_receipt", "supplier"].includes(type.value)
);

export function ApprovalWorkflowTab() {
  const [activeEntityType, setActiveEntityType] = useState("purchase_requisition");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);

  const { data: workflows = [], isLoading } = useApprovalWorkflows(activeEntityType);
  const { data: selectedWorkflow, isLoading: loadingWorkflow } = useApprovalWorkflow(selectedWorkflowId);

  // Calculate stats
  const totalWorkflows = workflows.length;
  const activeWorkflows = workflows.filter((w) => w.is_active).length;
  const totalSteps = selectedWorkflow?.steps?.length || 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <KPICard
          icon={GitBranch}
          label="Workflows"
          value={totalWorkflows}
          subtitle="Configured"
          variant="primary"
        />
        <KPICard
          icon={CheckCircle2}
          label="Active"
          value={activeWorkflows}
          subtitle="Enabled"
          variant="success"
        />
        <KPICard
          icon={Users}
          label="Steps"
          value={totalSteps}
          subtitle="In selected workflow"
          variant="default"
        />
        <KPICard
          icon={GitBranch}
          label="Entity Types"
          value={FINANCE_ENTITY_TYPES.length}
          subtitle="Supported"
          variant="default"
        />
      </div>

      {/* Entity Type Tabs */}
      <Tabs
        value={activeEntityType}
        onValueChange={(v) => {
          setActiveEntityType(v);
          setSelectedWorkflowId(null);
        }}
      >
        <TabsList>
          {FINANCE_ENTITY_TYPES.map((type) => (
            <TabsTrigger key={type.value} value={type.value}>
              {type.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflow List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Workflows</h3>
            <Button variant="outline" size="sm" asChild>
              <a href="/admin/approval-workflows" target="_blank" rel="noopener">
                <Settings className="w-4 h-4 mr-2" />
                Full Editor
              </a>
            </Button>
          </div>

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
                <Button variant="outline" className="mt-4" asChild>
                  <a href="/admin/approval-workflows" target="_blank" rel="noopener">
                    <Plus className="w-4 h-4 mr-2" />
                    Create in Workflow Editor
                  </a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            workflows.map((workflow) => (
              <Card
                key={workflow.id}
                className={`cursor-pointer transition-all ${
                  selectedWorkflowId === workflow.id ? "ring-2 ring-primary" : "hover:shadow-md"
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
                          <Badge variant="outline" className="bg-muted">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Version {workflow.version} • {workflow.steps?.length || 0} steps
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Workflow Preview */}
        <div className="lg:col-span-2">
          {!selectedWorkflowId ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a workflow to view its steps</p>
              </CardContent>
            </Card>
          ) : loadingWorkflow ? (
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-1/2 mb-4" />
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : selectedWorkflow ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedWorkflow.name}</CardTitle>
                    <CardDescription>
                      {selectedWorkflow.description || "No description"}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/admin/approval-workflows" target="_blank" rel="noopener">
                      <Settings className="w-4 h-4 mr-2" />
                      Edit
                    </a>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!selectedWorkflow.steps || selectedWorkflow.steps.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No steps configured for this workflow.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedWorkflow.steps.map((step, index) => (
                      <div key={step.id} className="relative">
                        {/* Connector line */}
                        {index > 0 && (
                          <div className="absolute -top-4 left-6 h-4 w-0.5 bg-border" />
                        )}
                        
                        <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
                          {/* Step number */}
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </div>
                          
                          {/* Step content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{step.step_name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {step.approval_type === "any" ? "Any Approver" :
                                 step.approval_type === "all" ? "All Approvers" :
                                 step.approval_type === "percentage" ? `${step.required_percentage}% Required` :
                                 step.approval_type}
                              </Badge>
                            </div>
                            
                            {/* Approvers */}
                            {step.approvers && step.approvers.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {step.approvers.map((approver) => (
                                  <Badge key={approver.id} variant="outline" className="text-xs">
                                    {approver.approver_type === "role" ? `Role: ${approver.approver_value}` :
                                     approver.approver_type === "user" ? "Specific User" :
                                     approver.approver_type === "requestor_manager" ? "Requestor's Manager" :
                                     approver.approver_type === "department_head" ? "Department Head" :
                                     approver.approver_value}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            
                            {/* Escalation info */}
                            {step.timeout_hours && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Timeout: {step.timeout_hours}h → {step.escalation_action}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> To create or modify approval workflows, use the{" "}
            <a href="/admin/approval-workflows" className="text-primary underline" target="_blank" rel="noopener">
              full Workflow Editor
            </a>{" "}
            in the Administration module. This view provides a read-only summary of configured workflows.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
