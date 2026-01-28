import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, MapPin, Lightbulb, Package } from "lucide-react";
import { useStorageBins } from "@/hooks/useStorageZones";
import { useCompletePutaway, useSuggestedBin } from "@/hooks/usePutawayTasks";
import type { PutawayTask } from "@/hooks/usePutawayTasks";

interface PutawayFormDialogProps {
  task: PutawayTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PutawayFormDialog({
  task,
  open,
  onOpenChange,
}: PutawayFormDialogProps) {
  const [selectedBinId, setSelectedBinId] = useState<string>("");
  const [notes, setNotes] = useState("");

  const { data: bins = [], isLoading: binsLoading } = useStorageBins();
  const { data: suggestedBin } = useSuggestedBin(task?.product_id);
  const completePutaway = useCompletePutaway();

  // Filter to only available/occupied bins
  const availableBins = bins.filter(
    (bin) => bin.status === "available" || bin.status === "occupied"
  );

  useEffect(() => {
    if (open && task) {
      // Pre-select suggested bin or assigned bin if exists
      if (task.assigned_bin_id) {
        setSelectedBinId(task.assigned_bin_id);
      } else if (task.suggested_bin_id) {
        setSelectedBinId(task.suggested_bin_id);
      } else if (suggestedBin) {
        setSelectedBinId(suggestedBin.id);
      }
      setNotes(task.notes || "");
    }
  }, [open, task, suggestedBin]);

  const handleSubmit = async () => {
    if (!task || !selectedBinId) return;

    await completePutaway.mutateAsync({
      taskId: task.id,
      binId: selectedBinId,
      notes: notes || undefined,
    });

    onOpenChange(false);
    setSelectedBinId("");
    setNotes("");
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Putaway - {task.task_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Product Info */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Package className="h-10 w-10 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{task.products?.name || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground">
                    SKU: {task.products?.sku}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">Qty: {task.quantity}</Badge>
                    {task.products?.unit_of_measure && (
                      <Badge variant="secondary">
                        {task.products.unit_of_measure}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Suggested Bin */}
          {suggestedBin && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <Lightbulb className="h-4 w-4 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                  Suggested: {suggestedBin.bin_code}
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-500">
                  {suggestedBin.reason}
                </p>
              </div>
            </div>
          )}

          {/* Bin Selection */}
          <div className="space-y-2">
            <Label htmlFor="bin">Assign Storage Bin *</Label>
            <Select value={selectedBinId} onValueChange={setSelectedBinId}>
              <SelectTrigger id="bin">
                <SelectValue placeholder="Select a bin" />
              </SelectTrigger>
              <SelectContent>
                {binsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : availableBins.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No available bins
                  </div>
                ) : (
                  availableBins.map((bin) => (
                    <SelectItem key={bin.id} value={bin.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>{bin.bin_code}</span>
                        {bin.storage_zones && (
                          <span className="text-muted-foreground">
                            ({bin.storage_zones.zone_code})
                          </span>
                        )}
                        <Badge
                          variant="outline"
                          className={
                            bin.status === "available"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }
                        >
                          {bin.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this putaway..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedBinId || completePutaway.isPending}
          >
            {completePutaway.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Completing...
              </>
            ) : (
              "Complete Putaway"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
