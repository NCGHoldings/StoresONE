import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCustomers } from "@/hooks/useCustomers";
import { useSalesOrders, useSalesOrderDetails } from "@/hooks/useSalesOrders";
import { useCreateSalesReturn } from "@/hooks/useSalesReturns";
import { useProducts } from "@/hooks/useWarehouse";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ReturnFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedSOId?: string;
}

interface LineItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  soLineId?: string;
}

const RETURN_REASONS = [
  { value: "defective", label: "Defective Product" },
  { value: "wrong_item", label: "Wrong Item Sent" },
  { value: "damaged", label: "Damaged in Transit" },
  { value: "customer_request", label: "Customer Request" },
  { value: "other", label: "Other" },
];

export function ReturnFormDialog({ open, onOpenChange, preSelectedSOId }: ReturnFormDialogProps) {
  const { data: customers } = useCustomers();
  const { data: salesOrders } = useSalesOrders();
  const { data: products } = useProducts();
  const createReturn = useCreateSalesReturn();

  const [customerId, setCustomerId] = useState("");
  const [salesOrderId, setSalesOrderId] = useState(preSelectedSOId || "");
  const [returnReason, setReturnReason] = useState<string>("defective");
  const [reasonNotes, setReasonNotes] = useState("");
  const [lines, setLines] = useState<LineItem[]>([]);

  // Get SO details when SO is selected
  const { data: soDetails } = useSalesOrderDetails(salesOrderId || null);

  // Reset when SO changes
  useEffect(() => {
    if (soDetails?.so) {
      setCustomerId(soDetails.so.customer_id);
      // Populate lines from SO
      const soLines = soDetails.lines.map((l, idx) => ({
        productId: l.product_id,
        productName: l.products?.name || "",
        sku: l.products?.sku || "",
        quantity: l.quantity_shipped || l.quantity_ordered,
        unitPrice: l.unit_price || 0,
        soLineId: l.id,
      }));
      setLines(soLines);
    }
  }, [soDetails]);

  // Reset form when opening/closing
  useEffect(() => {
    if (open) {
      if (preSelectedSOId) {
        setSalesOrderId(preSelectedSOId);
      } else {
        setCustomerId("");
        setSalesOrderId("");
        setReturnReason("defective");
        setReasonNotes("");
        setLines([]);
      }
    }
  }, [open, preSelectedSOId]);

  const handleAddLine = () => {
    setLines([
      ...lines,
      { productId: "", productName: "", sku: "", quantity: 1, unitPrice: 0 },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lines];
    if (field === "productId") {
      const product = products?.find((p) => p.id === value);
      if (product) {
        updated[index] = {
          ...updated[index],
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          unitPrice: product.unit_cost || 0,
        };
      }
    } else {
      (updated[index] as any)[field] = value;
    }
    setLines(updated);
  };

  const handleSubmit = async () => {
    if (!customerId) {
      toast.error("Please select a customer");
      return;
    }
    if (lines.length === 0) {
      toast.error("Please add at least one item");
      return;
    }
    if (lines.some((l) => !l.productId || l.quantity <= 0)) {
      toast.error("Please fill in all line items correctly");
      return;
    }

    await createReturn.mutateAsync({
      returnData: {
        customer_id: customerId,
        sales_order_id: salesOrderId || null,
        return_reason: returnReason,
        reason_notes: reasonNotes || null,
        return_date: new Date().toISOString().split("T")[0],
      },
      lines: lines.map((l, idx) => ({
        product_id: l.productId,
        quantity_returned: l.quantity,
        unit_price: l.unitPrice,
        so_line_id: l.soLineId || null,
        line_number: idx + 1,
      })),
    });

    onOpenChange(false);
  };

  const totalValue = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);

  // Filter delivered SOs for the selected customer
  const customerSOs = salesOrders?.filter(
    (so) => so.status === "delivered" && (!customerId || so.customer_id === customerId)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Sales Return</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId} disabled={!!salesOrderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.company_name} ({c.customer_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Link to Sales Order</Label>
              <Select value={salesOrderId} onValueChange={setSalesOrderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Optional - select SO" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No linked SO</SelectItem>
                  {customerSOs?.map((so) => (
                    <SelectItem key={so.id} value={so.id}>
                      {so.so_number} - {so.customers?.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Return Reason *</Label>
              <Select value={returnReason} onValueChange={setReturnReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RETURN_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={reasonNotes}
                onChange={(e) => setReasonNotes(e.target.value)}
                placeholder="Additional details about the return..."
                rows={2}
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Return Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddLine}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            {lines.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No items added. Select a Sales Order to auto-populate or add items manually.
              </p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left">Product</th>
                      <th className="px-3 py-2 text-center w-24">Qty</th>
                      <th className="px-3 py-2 text-right w-28">Unit Price</th>
                      <th className="px-3 py-2 text-right w-28">Total</th>
                      <th className="px-3 py-2 w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-3 py-2">
                          {line.soLineId ? (
                            <div>
                              <p className="font-medium">{line.productName}</p>
                              <p className="text-xs text-muted-foreground">{line.sku}</p>
                            </div>
                          ) : (
                            <Select
                              value={line.productId}
                              onValueChange={(v) => handleLineChange(idx, "productId", v)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent>
                                {products?.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.name} ({p.sku})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(e) => handleLineChange(idx, "quantity", parseInt(e.target.value) || 0)}
                            className="h-8 text-center"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.unitPrice}
                            onChange={(e) => handleLineChange(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                            className="h-8 text-right"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          ${(line.quantity * line.unitPrice).toFixed(2)}
                        </td>
                        <td className="px-3 py-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleRemoveLine(idx)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/50">
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-right font-medium">
                        Total Credit Value:
                      </td>
                      <td className="px-3 py-2 text-right font-bold">${totalValue.toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createReturn.isPending}>
              {createReturn.isPending ? "Creating..." : "Create Return"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
