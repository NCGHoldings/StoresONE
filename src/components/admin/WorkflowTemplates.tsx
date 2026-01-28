import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Users, DollarSign, Zap } from "lucide-react";

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  steps: {
    step_name: string;
    approval_type: string;
    approvers: { approver_type: string; approver_value?: string }[];
    conditions?: { field_path: string; operator: string; value: number; action: string }[];
  }[];
}

const templates: WorkflowTemplate[] = [
  {
    id: "simple",
    name: "Simple Approval",
    description: "Single-step approval by manager or admin",
    icon: <User className="h-5 w-5" />,
    steps: [
      {
        step_name: "Manager Approval",
        approval_type: "any",
        approvers: [{ approver_type: "role", approver_value: "admin" }],
      },
    ],
  },
  {
    id: "two-level",
    name: "Two-Level Approval",
    description: "Department head then finance approval",
    icon: <Users className="h-5 w-5" />,
    steps: [
      {
        step_name: "Department Approval",
        approval_type: "any",
        approvers: [{ approver_type: "role", approver_value: "procurement" }],
      },
      {
        step_name: "Finance Approval",
        approval_type: "any",
        approvers: [{ approver_type: "role", approver_value: "finance" }],
      },
    ],
  },
  {
    id: "value-based",
    name: "Value-Based Routing",
    description: "Different approval levels based on document value",
    icon: <DollarSign className="h-5 w-5" />,
    steps: [
      {
        step_name: "Standard Approval",
        approval_type: "any",
        approvers: [{ approver_type: "role", approver_value: "procurement" }],
        conditions: [
          { field_path: "total_amount", operator: "lte", value: 10000, action: "approve" },
        ],
      },
      {
        step_name: "Management Approval",
        approval_type: "any",
        approvers: [{ approver_type: "role", approver_value: "admin" }],
        conditions: [
          { field_path: "total_amount", operator: "gt", value: 10000, action: "require" },
        ],
      },
    ],
  },
  {
    id: "fast-track",
    name: "Fast Track",
    description: "Quick approval for low-value, urgent items",
    icon: <Zap className="h-5 w-5" />,
    steps: [
      {
        step_name: "Quick Approval",
        approval_type: "any",
        approvers: [
          { approver_type: "role", approver_value: "procurement" },
          { approver_type: "role", approver_value: "warehouse_manager" },
        ],
      },
    ],
  },
];

interface WorkflowTemplatesProps {
  onSelect: (template: WorkflowTemplate) => void;
}

export function WorkflowTemplates({ onSelect }: WorkflowTemplatesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {templates.map((template) => (
        <Card
          key={template.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onSelect(template)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  {template.icon}
                </div>
                <div>
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {template.description}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {template.steps.length} step{template.steps.length > 1 ? "s" : ""}
              </Badge>
              {template.steps.some((s) => s.conditions?.length) && (
                <Badge variant="outline" className="text-xs">
                  Conditional
                </Badge>
              )}
            </div>
            <div className="mt-3 flex justify-end">
              <Button size="sm" variant="outline">
                Use Template
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export { templates as workflowTemplates };
