import { format } from "date-fns";
import {
  Package,
  User,
  CalendarCheck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Layers,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import type { PutawayTask } from "@/hooks/usePutawayTasks";

interface PutawayDetailsPanelProps {
  task: PutawayTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-600",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  normal: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

export function PutawayDetailsPanel({
  task,
  open,
  onOpenChange,
}: PutawayDetailsPanelProps) {
  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-1 pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" />
              {task.task_number}
            </SheetTitle>
            <Badge className={statusColors[task.status] || ""}>
              {task.status.replace("_", " ")}
            </Badge>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Product Info */}
          <Card>
            <CardContent className="pt-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Product
              </h4>
              <div className="flex items-start gap-3">
                <Layers className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">{task.products?.name || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground">
                    SKU: {task.products?.sku}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">Qty: {task.quantity}</Badge>
                    <Badge
                      variant="outline"
                      className={priorityColors[task.priority] || ""}
                    >
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GRN Source */}
          {task.inbound_deliveries && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Source GRN</p>
              <p className="font-medium">{task.inbound_deliveries.delivery_number}</p>
            </div>
          )}

          <Separator />

          {/* Location Info */}
          <div className="space-y-3">
            <h4 className="font-medium">Location Details</h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground mb-1">Source</p>
                <p className="font-medium">
                  {task.source_location || "Receiving Dock"}
                </p>
              </div>

              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Suggested Bin
                </p>
                <div className="flex items-center gap-1">
                  {task.suggested_bin ? (
                    <>
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="font-mono font-medium">
                        {task.suggested_bin.bin_code}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            </div>

            {task.assigned_bin && (
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 border border-green-200 dark:border-green-800">
                <p className="text-xs text-green-600 dark:text-green-400 mb-1">
                  Assigned Bin
                </p>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <span className="font-mono font-bold text-green-700 dark:text-green-300">
                    {task.assigned_bin.bin_code}
                  </span>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Timeline */}
          <div className="space-y-3">
            <h4 className="font-medium">Timeline</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created:</span>
                <span className="font-medium">
                  {format(new Date(task.created_at), "MMM d, yyyy HH:mm")}
                </span>
              </div>

              {task.started_at && (
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-muted-foreground">Started:</span>
                  <span className="font-medium">
                    {format(new Date(task.started_at), "MMM d, yyyy HH:mm")}
                  </span>
                </div>
              )}

              {task.completed_at && (
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">Completed:</span>
                  <span className="font-medium">
                    {format(new Date(task.completed_at), "MMM d, yyyy HH:mm")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Worker */}
          {task.profiles && (
            <>
              <Separator />
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Assigned to:</span>
                <span className="text-sm font-medium">
                  {task.profiles.full_name || "Unknown"}
                </span>
              </div>
            </>
          )}

          {/* Notes */}
          {task.notes && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2 text-sm">Notes</h4>
                <p className="text-sm text-muted-foreground">{task.notes}</p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
