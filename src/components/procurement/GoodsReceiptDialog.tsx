import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePurchaseOrderLines, useReceiveGoods } from "@/hooks/usePurchaseOrders";
import { useStorageBins } from "@/hooks/useWarehouse";
import { useCreateBatch } from "@/hooks/useBatches";
import { Loader2, Package, AlertTriangle, Plus, Trash2, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface GoodsReceiptDialogProps {
  poId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BatchEntry {
  id: string;
  batchNumber: string;
  quantity: number;
  manufacturingDate: string;
  expiryDate: string;
  binId: string;
}

interface ReceiptLine {
  lineId: string;
  productId: string;
  productName: string;
  sku: string;
  ordered: number;
  previouslyReceived: number;
  receiving: number;
  isBatchTracked: boolean;
  batches: BatchEntry[];
}

export function GoodsReceiptDialog({ poId, open, onOpenChange }: GoodsReceiptDialogProps) {
  const { data: lines, isLoading } = usePurchaseOrderLines(poId);
  const { data: bins = [] } = useStorageBins();
  const receiveGoods = useReceiveGoods();
  const createBatch = useCreateBatch();
  const [receiptLines, setReceiptLines] = useState<ReceiptLine[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadProductsAndSetLines = async () => {
      if (!lines || !open) return;

      // Get product IDs and fetch batch_tracked status
      const productIds = lines.map(l => l.product_id).filter(Boolean) as string[];
      
      let productsWithTracking: Record<string, boolean> = {};
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from("products")
          .select("id, batch_tracked")
          .in("id", productIds);
        
        if (products) {
          productsWithTracking = products.reduce((acc, p) => {
            acc[p.id] = p.batch_tracked || false;
            return acc;
          }, {} as Record<string, boolean>);
        }
      }

      setReceiptLines(
        lines.map((line) => {
          const isBatchTracked = line.product_id ? productsWithTracking[line.product_id] || false : false;
          const remaining = Math.max(0, line.quantity - line.received_quantity);
          
          return {
            lineId: line.id,
            productId: line.product_id || "",
            productName: line.products?.name || "Unknown",
            sku: line.products?.sku || "",
            ordered: line.quantity,
            previouslyReceived: line.received_quantity,
            receiving: remaining,
            isBatchTracked,
            batches: isBatchTracked ? [{
              id: crypto.randomUUID(),
              batchNumber: `BAT-${format(new Date(), "yyyyMMdd")}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
              quantity: remaining,
              manufacturingDate: "",
              expiryDate: "",
              binId: "",
            }] : [],
          };
        })
      );
    };

    loadProductsAndSetLines();
  }, [lines, open]);

  const handleQuantityChange = (index: number, value: number) => {
    setReceiptLines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], receiving: Math.max(0, value) };
      return updated;
    });
  };

  const handleBatchChange = (lineIndex: number, batchIndex: number, field: keyof BatchEntry, value: string | number) => {
    setReceiptLines((prev) => {
      const updated = [...prev];
      const batches = [...updated[lineIndex].batches];
      batches[batchIndex] = { ...batches[batchIndex], [field]: value };
      updated[lineIndex] = { ...updated[lineIndex], batches };
      return updated;
    });
  };

  const addBatchRow = (lineIndex: number) => {
    setReceiptLines((prev) => {
      const updated = [...prev];
      updated[lineIndex].batches.push({
        id: crypto.randomUUID(),
        batchNumber: `BAT-${format(new Date(), "yyyyMMdd")}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        quantity: 0,
        manufacturingDate: "",
        expiryDate: "",
        binId: "",
      });
      return updated;
    });
  };

  const removeBatchRow = (lineIndex: number, batchIndex: number) => {
    setReceiptLines((prev) => {
      const updated = [...prev];
      updated[lineIndex].batches = updated[lineIndex].batches.filter((_, i) => i !== batchIndex);
      return updated;
    });
  };

  const handleReceiveAll = () => {
    setReceiptLines((prev) =>
      prev.map((line) => {
        const receiving = Math.max(0, line.ordered - line.previouslyReceived);
        return {
          ...line,
          receiving,
          batches: line.isBatchTracked && line.batches.length > 0
            ? [{ ...line.batches[0], quantity: receiving }]
            : line.batches,
        };
      })
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // For batch-tracked items, create batch records first and collect batch IDs
      const batchIdMap: Record<string, string> = {}; // lineId -> batchId (last created batch for the line)
      const binIdMap: Record<string, string> = {}; // lineId -> binId
      
      for (const line of receiptLines) {
        if (line.isBatchTracked && line.batches.length > 0) {
          for (const batch of line.batches) {
            if (batch.quantity > 0) {
              const result = await createBatch.mutateAsync({
                product_id: line.productId,
                batch_number: batch.batchNumber,
                po_id: poId,
                po_line_id: line.lineId,
                manufacturing_date: batch.manufacturingDate || null,
                expiry_date: batch.expiryDate || null,
                initial_quantity: batch.quantity,
                current_quantity: batch.quantity,
                bin_id: batch.binId || null,
                status: "active",
                quality_status: "pending",
              });
              // Store the last batch/bin ID for this line
              if (result?.id) {
                batchIdMap[line.lineId] = result.id;
              }
              if (batch.binId) {
                binIdMap[line.lineId] = batch.binId;
              }
            }
          }
        }
      }

      // Calculate total receiving per line (sum of batches for batch-tracked, or direct value)
      const updates = receiptLines
        .map((line) => {
          const receivingNow = line.isBatchTracked
            ? line.batches.reduce((sum, b) => sum + b.quantity, 0)
            : line.receiving;
          return {
            lineId: line.lineId,
            productId: line.productId,
            receivedQuantity: line.previouslyReceived + receivingNow,
            receivingDelta: receivingNow,
            batchId: batchIdMap[line.lineId] || null,
            binId: binIdMap[line.lineId] || null,
          };
        })
        .filter((update) => update.receivingDelta > 0);

      if (updates.length > 0) {
        await receiveGoods.mutateAsync({ poId, lineUpdates: updates });
      }
      
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutations
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTotalReceiving = (line: ReceiptLine) => {
    return line.isBatchTracked
      ? line.batches.reduce((sum, b) => sum + b.quantity, 0)
      : line.receiving;
  };

  const totalReceiving = receiptLines.reduce((sum, line) => sum + getTotalReceiving(line), 0);

  const hasVariance = receiptLines.some((line) => {
    const receiving = getTotalReceiving(line);
    return line.previouslyReceived + receiving !== line.ordered;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Goods Receipt
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Enter the quantities received for each line item
              </p>
              <Button variant="outline" size="sm" onClick={handleReceiveAll}>
                Receive All
              </Button>
            </div>

            <div className="space-y-4">
              {receiptLines.map((line, lineIndex) => {
                const remaining = line.ordered - line.previouslyReceived - getTotalReceiving(line);
                const hasOverReceive = remaining < 0;
                
                return (
                  <div key={line.lineId} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{line.productName}</p>
                          {line.isBatchTracked && (
                            <Badge variant="secondary" className="gap-1">
                              <Layers className="h-3 w-3" />
                              Batch Tracked
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{line.sku}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p>Ordered: <span className="font-medium">{line.ordered}</span></p>
                        <p>Previously: <span className="font-medium">{line.previouslyReceived}</span></p>
                        <p className={cn(
                          remaining > 0 && "text-warning",
                          remaining === 0 && "text-success",
                          hasOverReceive && "text-destructive"
                        )}>
                          Remaining: <span className="font-medium">{remaining}</span>
                        </p>
                      </div>
                    </div>

                    {line.isBatchTracked ? (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Batch Details</div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Batch Number</TableHead>
                              <TableHead className="w-24">Qty</TableHead>
                              <TableHead>Mfg Date</TableHead>
                              <TableHead>Expiry Date</TableHead>
                              <TableHead>Bin</TableHead>
                              <TableHead className="w-10"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {line.batches.map((batch, batchIndex) => (
                              <TableRow key={batch.id}>
                                <TableCell>
                                  <Input
                                    value={batch.batchNumber}
                                    onChange={(e) => handleBatchChange(lineIndex, batchIndex, "batchNumber", e.target.value)}
                                    placeholder="BAT-XXXXXX"
                                    className="font-mono"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={batch.quantity}
                                    onChange={(e) => handleBatchChange(lineIndex, batchIndex, "quantity", parseInt(e.target.value) || 0)}
                                    className="text-right"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="date"
                                    value={batch.manufacturingDate}
                                    onChange={(e) => handleBatchChange(lineIndex, batchIndex, "manufacturingDate", e.target.value)}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="date"
                                    value={batch.expiryDate}
                                    onChange={(e) => handleBatchChange(lineIndex, batchIndex, "expiryDate", e.target.value)}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={batch.binId || "none"}
                                    onValueChange={(v) => handleBatchChange(lineIndex, batchIndex, "binId", v === "none" ? "" : v)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">No Bin</SelectItem>
                                      {bins.filter(b => b.status === "available").map((bin) => (
                                        <SelectItem key={bin.id} value={bin.id}>
                                          {bin.bin_code}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  {line.batches.length > 1 && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeBatchRow(lineIndex, batchIndex)}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addBatchRow(lineIndex)}
                          className="gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          Add Batch
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Label>Receiving Quantity:</Label>
                        <Input
                          type="number"
                          min="0"
                          max={line.ordered - line.previouslyReceived}
                          className="w-24 text-right"
                          value={line.receiving}
                          onChange={(e) => handleQuantityChange(lineIndex, parseInt(e.target.value) || 0)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {hasVariance && (
              <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-sm text-warning">
                  Some items have quantity variance. The order will remain partially received.
                </span>
              </div>
            )}

            <div className="flex justify-end">
              <div className="bg-muted/50 rounded-lg px-4 py-2">
                <span className="text-sm text-muted-foreground mr-3">Total Receiving:</span>
                <span className="font-bold">{totalReceiving} items</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || totalReceiving === 0}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
