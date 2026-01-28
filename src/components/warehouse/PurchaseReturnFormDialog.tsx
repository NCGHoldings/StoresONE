import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useInboundDeliveries } from "@/hooks/useInboundDeliveries";
import { useGRNLines } from "@/hooks/useGRNLines";
import { useCreatePurchaseReturn, type ReturnReason } from "@/hooks/usePurchaseReturns";
import { useFormatCurrency } from "@/lib/formatters";

interface ReturnLine {
  product_id: string;
  product_name: string;
  grn_line_id: string | null;
  batch_id: string | null;
  bin_id: string | null;
  quantity_returned: number;
  max_quantity: number;
  unit_cost: number;
  reason_notes: string;
}

interface PurchaseReturnFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const reasonOptions: { value: ReturnReason; label: string }[] = [
  { value: "defective", label: "Defective" },
  { value: "wrong_item", label: "Wrong Item" },
  { value: "damaged", label: "Damaged" },
  { value: "excess", label: "Excess Quantity" },
  { value: "quality_issue", label: "Quality Issue" },
  { value: "other", label: "Other" },
];

export function PurchaseReturnFormDialog({
  open,
  onOpenChange,
}: PurchaseReturnFormDialogProps) {
  const [supplierId, setSupplierId] = useState("");
  const [grnId, setGrnId] = useState("");
  const [returnReason, setReturnReason] = useState<ReturnReason>("defective");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<ReturnLine[]>([]);

  const formatCurrency = useFormatCurrency();

  const { data: suppliers = [] } = useSuppliers();
  const { data: deliveries = [] } = useInboundDeliveries();
  const { data: grnLines = [] } = useGRNLines(grnId || undefined);
  const createReturn = useCreatePurchaseReturn();

  // Filter GRNs by selected supplier - completed status
  const supplierGRNs = deliveries.filter(
    (d) => d.supplier_id === supplierId && d.status === "completed"
  );

  // Reset form on close
  useEffect(() => {
    if (!open) {
      setSupplierId("");
      setGrnId("");
      setReturnReason("defective");
      setNotes("");
      setLines([]);
    }
  }, [open]);

  // When GRN is selected, populate available lines
  useEffect(() => {
    if (grnId && grnLines.length > 0) {
      const newLines: ReturnLine[] = grnLines.map((line) => ({
        product_id: line.product_id,
        product_name: line.products?.name || "Unknown",
        grn_line_id: line.id,
        batch_id: line.batch_id,
        bin_id: line.bin_id,
        quantity_returned: 0,
        max_quantity: line.quantity_received,
        unit_cost: 0,
        reason_notes: "",
      }));
      setLines(newLines);
    }
  }, [grnId, grnLines]);

  const handleQuantityChange = (index: number, value: number) => {
    const newLines = [...lines];
    newLines[index].quantity_returned = Math.min(value, newLines[index].max_quantity);
    setLines(newLines);
  };

  const handleCostChange = (index: number, value: number) => {
    const newLines = [...lines];
    newLines[index].unit_cost = value;
    setLines(newLines);
  };

  const handleLineNotesChange = (index: number, value: string) => {
    const newLines = [...lines];
    newLines[index].reason_notes = value;
    setLines(newLines);
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const validLines = lines.filter((l) => l.quantity_returned > 0);
  const totalAmount = validLines.reduce(
    (sum, l) => sum + l.quantity_returned * l.unit_cost,
    0
  );

  // Filter approved suppliers
  const approvedSuppliers = suppliers.filter((s) => s.status === "active");

  const handleSubmit = async () => {
    if (!supplierId || validLines.length === 0) return;

    const selectedGRN = deliveries.find((d) => d.id === grnId);

    await createReturn.mutateAsync({
      returnData: {
        supplier_id: supplierId,
        purchase_order_id: selectedGRN?.po_id || null,
        grn_id: grnId || null,
        return_reason: returnReason,
        return_date: new Date().toISOString().split("T")[0],
        notes,
      },
      lines: validLines.map((line) => ({
        product_id: line.product_id,
        grn_line_id: line.grn_line_id,
        batch_id: line.batch_id,
        bin_id: line.bin_id,
        quantity_returned: line.quantity_returned,
        unit_cost: line.unit_cost,
        reason_notes: line.reason_notes || null,
      })),
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Purchase Return</DialogTitle>
          <DialogDescription>
            Create a return to send defective or excess items back to supplier
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Supplier *</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {approvedSuppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>GRN (Optional)</Label>
              <Select
                value={grnId}
                onValueChange={setGrnId}
                disabled={!supplierId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select GRN to return from" />
                </SelectTrigger>
                <SelectContent>
                  {supplierGRNs.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.delivery_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Return Reason *</Label>
              <Select
                value={returnReason}
                onValueChange={(v) => setReturnReason(v as ReturnReason)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reasonOptions.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
                className="h-[38px]"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-2">
            <Label>Line Items</Label>
            {lines.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                {grnId
                  ? "No items found in this GRN"
                  : "Select a GRN to load items, or add items manually"}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Available Qty</TableHead>
                    <TableHead>Return Qty</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Line Total</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line, index) => (
                    <TableRow key={index}>
                      <TableCell>{line.product_name}</TableCell>
                      <TableCell>{line.max_quantity}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          max={line.max_quantity}
                          value={line.quantity_returned || ""}
                          onChange={(e) =>
                            handleQuantityChange(index, Number(e.target.value))
                          }
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={line.unit_cost || ""}
                          onChange={(e) =>
                            handleCostChange(index, Number(e.target.value))
                          }
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        {formatCurrency(line.quantity_returned * line.unit_cost)}
                      </TableCell>
                      <TableCell>
                        <Input
                          value={line.reason_notes}
                          onChange={(e) =>
                            handleLineNotesChange(index, e.target.value)
                          }
                          placeholder="Line notes..."
                          className="w-32"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLine(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Total */}
          {validLines.length > 0 && (
            <div className="flex justify-end">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Return Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!supplierId || validLines.length === 0 || createReturn.isPending}
          >
            {createReturn.isPending ? "Creating..." : "Create Return"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
