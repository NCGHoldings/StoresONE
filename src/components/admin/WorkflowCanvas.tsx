import { useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ApprovalStep } from "@/hooks/useApprovalWorkflow";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GripVertical,
  CheckCircle2,
  Users,
  Settings,
  Trash2,
  ChevronDown,
  GitBranch,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkflowCanvasProps {
  steps: ApprovalStep[];
  onReorder: (steps: ApprovalStep[]) => void;
  onEditStep: (step: ApprovalStep) => void;
  onDeleteStep: (stepId: string) => void;
  onExpandStep: (stepId: string) => void;
  expandedStepId: string | null;
}

export function WorkflowCanvas({
  steps,
  onReorder,
  onEditStep,
  onDeleteStep,
  onExpandStep,
  expandedStepId,
}: WorkflowCanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortedSteps = useMemo(
    () => [...steps].sort((a, b) => a.step_order - b.step_order),
    [steps]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedSteps.findIndex((s) => s.id === active.id);
      const newIndex = sortedSteps.findIndex((s) => s.id === over.id);

      const newSteps = [...sortedSteps];
      const [removed] = newSteps.splice(oldIndex, 1);
      newSteps.splice(newIndex, 0, removed);

      // Update step_order for all affected steps
      const reordered = newSteps.map((step, index) => ({
        ...step,
        step_order: index + 1,
      }));

      onReorder(reordered);
    }
  };

  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <GitBranch className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No steps configured</p>
        <p className="text-sm">Add your first approval step to get started</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sortedSteps.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {/* Start node */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Document Submitted
            </div>
          </div>

          {sortedSteps.map((step, index) => (
            <div key={step.id}>
              {/* Connector arrow */}
              <div className="flex justify-center py-2">
                <ArrowDown className="h-5 w-5 text-muted-foreground" />
              </div>

              <SortableStepCard
                step={step}
                index={index}
                isExpanded={expandedStepId === step.id}
                onEdit={() => onEditStep(step)}
                onDelete={() => onDeleteStep(step.id)}
                onToggle={() => onExpandStep(step.id)}
              />
            </div>
          ))}

          {/* End connector */}
          <div className="flex justify-center py-2">
            <ArrowDown className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* End node */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Approved
            </div>
          </div>
        </div>
      </SortableContext>
    </DndContext>
  );
}

interface SortableStepCardProps {
  step: ApprovalStep;
  index: number;
  isExpanded: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}

function SortableStepCard({
  step,
  index,
  isExpanded,
  onEdit,
  onDelete,
  onToggle,
}: SortableStepCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const approverCount = step.approvers?.length || 0;
  const conditionCount = step.conditions?.length || 0;

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={cn(
          "relative transition-all",
          isDragging && "shadow-lg ring-2 ring-primary z-50",
          isExpanded && "ring-1 ring-primary"
        )}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Drag handle */}
            <button
              className="mt-1 p-1 rounded hover:bg-muted cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Step number */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              {index + 1}
            </div>

            {/* Step content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold truncate">{step.step_name}</span>
                <Badge variant="outline" className="text-xs">
                  {step.approval_type === "any" ? "Any one" : step.approval_type === "all" ? "All" : `${step.required_percentage}%`}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {approverCount} approver{approverCount !== 1 ? "s" : ""}
                </span>
                {conditionCount > 0 && (
                  <span className="flex items-center gap-1">
                    <GitBranch className="h-3 w-3" />
                    {conditionCount} condition{conditionCount !== 1 ? "s" : ""}
                  </span>
                )}
                {step.timeout_hours && (
                  <span>⏱️ {step.timeout_hours}h timeout</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={onToggle}
                className="h-8 w-8"
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isExpanded && "rotate-180"
                  )}
                />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={onEdit}
                className="h-8 w-8"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={onDelete}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Expanded content */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t space-y-3">
              {/* Approvers */}
              <div>
                <h4 className="text-sm font-medium mb-2">Approvers</h4>
                {step.approvers && step.approvers.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {step.approvers.map((approver, idx) => (
                      <Badge key={idx} variant="secondary">
                        {approver.approver_type === "role" && `Role: ${approver.approver_value}`}
                        {approver.approver_type === "user" && `User: ${approver.approver_value?.substring(0, 8)}...`}
                        {approver.approver_type === "department_head" && "Department Head"}
                        {approver.approver_type === "requestor_manager" && "Requestor's Manager"}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No approvers configured</p>
                )}
              </div>

              {/* Conditions */}
              {step.conditions && step.conditions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Conditions</h4>
                  <div className="space-y-1">
                    {step.conditions.map((condition, idx) => (
                      <div
                        key={idx}
                        className="text-xs bg-muted/50 rounded px-2 py-1"
                      >
                        <span className="text-muted-foreground">IF</span>{" "}
                        <span className="font-mono">{condition.field_path}</span>{" "}
                        <span className="text-muted-foreground">{condition.operator}</span>{" "}
                        <span className="font-mono">{String(condition.value)}</span>{" "}
                        <span className="text-muted-foreground">THEN</span>{" "}
                        <span className="text-primary">{condition.action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
