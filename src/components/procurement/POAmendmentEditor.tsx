import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit2, Trash2, Plus, Loader2, Save } from "lucide-react";
import { PurchaseOrderLine } from "@/hooks/usePurchaseOrders";
import { useProducts } from "@/hooks/useWarehouse";
import { useAmendPOLine, useRemovePOLineWithAmendment } from "@/hooks/usePOApprovalAmendments";
import { useFormatCurrency } from "@/lib/formatters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface POAmendmentEditorProps {
  poId: string;
  lines: PurchaseOrderLine[];
  currency?: string;
  approvalRequestId?: string;
  approvalStepId?: string;
  onAmendmentMade?: () => void;
}

interface EditingLine {
  lineId: string;
  quantity: number;
  unit_price: number;
}

export function POAmendmentEditor({
  poId,
  lines,
  currency,
  approvalRequestId,
  approvalStepId,
  onAmendmentMade,
}: POAmendmentEditorProps) {
  const [editingLine, setEditingLine] = useState<EditingLine | null>(null);
  const [amendReason, setAmendReason] = useState("");
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [deleteLineId, setDeleteLineId] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  
  const formatCurrencyHook = useFormatCurrency();
  const formatCurrency = (amount: number) => formatCurrencyHook(amount, currency);
  const { data: products } = useProducts();
  const amendLine = useAmendPOLine();
  const removeLine = useRemovePOLineWithAmendment();

  const handleEditClick = (line: PurchaseOrderLine) => {
    setEditingLine({
      lineId: line.id,
      quantity: line.quantity,
      unit_price: line.unit_price,
    });
  };

  const handleSaveClick = () => {
    if (!editingLine) return;
    setReasonDialogOpen(true);
  };

  const handleConfirmAmend = async () => {
    if (!editingLine || !amendReason.trim()) return;

    await amendLine.mutateAsync({
      poId,
      lineId: editingLine.lineId,
      updates: {
        quantity: editingLine.quantity,
        unit_price: editingLine.unit_price,
      },
      reason: amendReason,
      approvalRequestId,
      approvalStepId,
    });

    setEditingLine(null);
    setAmendReason("");
    setReasonDialogOpen(false);
    onAmendmentMade?.();
  };

  const handleDeleteClick = (lineId: string) => {
    setDeleteLineId(lineId);
  };

  const handleConfirmDelete = async () => {
    if (!deleteLineId || !deleteReason.trim()) return;

    await removeLine.mutateAsync({
      poId,
      lineId: deleteLineId,
      reason: deleteReason,
      approvalRequestId,
      approvalStepId,
    });

    setDeleteLineId(null);
    setDeleteReason("");
    onAmendmentMade?.();
  };

  const getProductName = (productId: string | null) => {
    if (!productId) return "—";
    const product = products?.find((p) => p.id === productId);
    return product ? `${product.name} (${product.sku})` : productId;
  };

  const hasChanges = (line: PurchaseOrderLine) => {
    if (!editingLine || editingLine.lineId !== line.id) return false;
    return (
      editingLine.quantity !== line.quantity ||
      editingLine.unit_price !== line.unit_price
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Edit2 className="h-4 w-4" />
          Amend Line Items
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Modify quantities or prices. All changes require a reason and are logged.
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="w-[120px]">Quantity</TableHead>
              <TableHead className="w-[140px]">Unit Price</TableHead>
              <TableHead className="text-right w-[120px]">Total</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line) => {
              const isEditing = editingLine?.lineId === line.id;
              const currentQty = isEditing ? editingLine.quantity : line.quantity;
              const currentPrice = isEditing ? editingLine.unit_price : line.unit_price;
              const lineTotal = currentQty * currentPrice;

              return (
                <TableRow 
                  key={line.id}
                  className={hasChanges(line) ? "bg-amber-50 dark:bg-amber-950/20" : ""}
                >
                  <TableCell className="font-medium">
                    {getProductName(line.product_id)}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        type="number"
                        min={1}
                        value={editingLine.quantity}
                        onChange={(e) =>
                          setEditingLine({
                            ...editingLine,
                            quantity: parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-20 h-8"
                      />
                    ) : (
                      line.quantity
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={editingLine.unit_price}
                        onChange={(e) =>
                          setEditingLine({
                            ...editingLine,
                            unit_price: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-28 h-8"
                      />
                    ) : (
                      formatCurrency(line.unit_price)
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(lineTotal)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {isEditing ? (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={handleSaveClick}
                            disabled={!hasChanges(line) || amendLine.isPending}
                          >
                            {amendLine.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4 text-primary" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => setEditingLine(null)}
                          >
                            ×
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleEditClick(line)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteClick(line.id)}
                            disabled={lines.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Amendment Reason Dialog */}
        <Dialog open={reasonDialogOpen} onOpenChange={setReasonDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Amendment Reason</DialogTitle>
              <DialogDescription>
                Please provide a reason for this amendment. This will be recorded
                in the audit trail.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Reason *</Label>
                <Textarea
                  value={amendReason}
                  onChange={(e) => setAmendReason(e.target.value)}
                  placeholder="e.g., Quantity adjusted per updated forecast..."
                  rows={3}
                />
              </div>
              {editingLine && (
                <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                  <p className="font-medium">Changes:</p>
                  {lines.find((l) => l.id === editingLine.lineId) && (
                    <>
                      {editingLine.quantity !==
                        lines.find((l) => l.id === editingLine.lineId)?.quantity && (
                        <p>
                          Quantity:{" "}
                          {lines.find((l) => l.id === editingLine.lineId)?.quantity} →{" "}
                          <span className="text-amber-600 font-medium">
                            {editingLine.quantity}
                          </span>
                        </p>
                      )}
                      {editingLine.unit_price !==
                        lines.find((l) => l.id === editingLine.lineId)?.unit_price && (
                        <p>
                          Unit Price:{" "}
                          {formatCurrency(
                            lines.find((l) => l.id === editingLine.lineId)?.unit_price || 0
                          )}{" "}
                          →{" "}
                          <span className="text-amber-600 font-medium">
                            {formatCurrency(editingLine.unit_price)}
                          </span>
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReasonDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmAmend}
                disabled={!amendReason.trim() || amendLine.isPending}
              >
                {amendLine.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirm Amendment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteLineId} onOpenChange={() => setDeleteLineId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Line Item</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the line item from the purchase order. Please
                provide a reason.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label>Reason *</Label>
              <Textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="e.g., Duplicate item, no longer required..."
                rows={3}
                className="mt-2"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteReason("")}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={!deleteReason.trim() || removeLine.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {removeLine.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
