import { format } from "date-fns";
import { Package, User, CalendarCheck, Layers, MapPin, ArrowRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGRNLines } from "@/hooks/useGRNLines";
import { useCreatePutawayTasksFromGRN, usePutawayTasksByGRN } from "@/hooks/usePutawayTasks";
import { Skeleton } from "@/components/ui/skeleton";
import type { InboundDelivery } from "@/hooks/useInboundDeliveries";

interface GRNDetailsPanelProps {
  grn: InboundDelivery | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GRNDetailsPanel({ grn, open, onOpenChange }: GRNDetailsPanelProps) {
  const { data: lines = [], isLoading } = useGRNLines(grn?.id);
  const { data: existingTasks = [] } = usePutawayTasksByGRN(grn?.id);
  const createPutawayTasks = useCreatePutawayTasksFromGRN();

  if (!grn) return null;

  const totalQuantity = lines.reduce((sum, line) => sum + line.quantity_received, 0);
  
  // Find lines without bin assignment that don't have putaway tasks yet
  const linesNeedingPutaway = lines.filter(
    (line) => !line.bin_id && !existingTasks.some((t) => t.grn_line_id === line.id)
  );

  const handleCreatePutawayTasks = async () => {
    if (!grn || linesNeedingPutaway.length === 0) return;
    
    await createPutawayTasks.mutateAsync({
      grnId: grn.id,
      lines: linesNeedingPutaway.map((line) => ({
        grnLineId: line.id,
        productId: line.product_id,
        quantity: line.quantity_received,
        batchId: line.batch_id,
      })),
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-1 pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" />
              {grn.delivery_number}
            </SheetTitle>
            <Badge
              variant={grn.status === "completed" ? "default" : "secondary"}
              className={grn.status === "completed" ? "bg-green-100 text-green-700" : ""}
            >
              {grn.status}
            </Badge>
          </div>
        </SheetHeader>

        {/* Header Info */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarCheck className="h-4 w-4" />
              <span>Received:</span>
              <span className="text-foreground font-medium">
                {grn.actual_date
                  ? format(new Date(grn.actual_date), "MMM d, yyyy")
                  : "—"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>By:</span>
              <span className="text-foreground font-medium">
                {(grn as any).profiles?.full_name || "Unknown"}
              </span>
            </div>
          </div>

          {grn.purchase_orders && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Source PO</p>
              <p className="font-medium">{grn.purchase_orders.po_number}</p>
            </div>
          )}

          <Separator />

          {/* Line Items */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              Line Items
              <Badge variant="outline" className="ml-auto">
                {lines.length} item{lines.length !== 1 ? "s" : ""}
              </Badge>
            </h4>

            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : lines.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No line details recorded</p>
                <p className="text-xs">This GRN was created before line tracking was enabled</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right w-20">Qty</TableHead>
                      <TableHead className="w-28">Batch</TableHead>
                      <TableHead className="w-20">Bin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{line.products?.name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{line.products?.sku}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {line.quantity_received}
                        </TableCell>
                        <TableCell>
                          {line.inventory_batches ? (
                            <div className="flex items-center gap-1">
                              <Layers className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs font-mono">
                                {line.inventory_batches.batch_number}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {line.storage_bins ? (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs font-mono">
                                {line.storage_bins.bin_code}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Summary */}
          {lines.length > 0 && (
            <div className="rounded-lg bg-muted/50 p-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Received</span>
                <span className="text-lg font-bold">{totalQuantity} items</span>
              </div>
            </div>
          )}

          {/* Putaway Action */}
          {linesNeedingPutaway.length > 0 && (
            <>
              <Separator />
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      {linesNeedingPutaway.length} item{linesNeedingPutaway.length > 1 ? "s" : ""} need putaway
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Create putaway tasks to assign storage bins
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleCreatePutawayTasks}
                    disabled={createPutawayTasks.isPending}
                  >
                    <ArrowRight className="h-4 w-4 mr-1" />
                    Create Tasks
                  </Button>
                </div>
              </div>
            </>
          )}

          {existingTasks.length > 0 && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Putaway Tasks</p>
              <p className="font-medium text-sm">
                {existingTasks.filter((t) => t.status === "completed").length} of {existingTasks.length} completed
              </p>
            </div>
          )}

          {/* Notes */}
          {grn.notes && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2 text-sm">Notes</h4>
                <p className="text-sm text-muted-foreground">{grn.notes}</p>
              </div>
            </>
          )}

          {/* Discrepancy notes if any */}
          {grn.discrepancy_notes && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2 text-sm text-warning">Discrepancy Notes</h4>
                <p className="text-sm text-muted-foreground">{grn.discrepancy_notes}</p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
