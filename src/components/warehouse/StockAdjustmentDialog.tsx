import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAdjustStock, InventoryItem } from "@/hooks/useInventory";

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventoryItem: InventoryItem | null;
}

const ADJUSTMENT_REASONS = [
  { value: "count", label: "Physical Count Adjustment" },
  { value: "damage", label: "Damaged Goods" },
  { value: "expired", label: "Expired Stock" },
  { value: "return", label: "Customer Return" },
  { value: "correction", label: "Data Correction" },
  { value: "other", label: "Other" },
];

export function StockAdjustmentDialog({ open, onOpenChange, inventoryItem }: StockAdjustmentDialogProps) {
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove">("add");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const adjustStock = useAdjustStock();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inventoryItem) return;

    const adjustmentQuantity = adjustmentType === "add" 
      ? parseInt(quantity) 
      : -parseInt(quantity);

    await adjustStock.mutateAsync({
      inventory_id: inventoryItem.id,
      product_id: inventoryItem.product_id,
      bin_id: inventoryItem.bin_id,
      adjustment_quantity: adjustmentQuantity,
      reason,
      notes,
    });

    // Reset form
    setAdjustmentType("add");
    setQuantity("");
    setReason("");
    setNotes("");
    onOpenChange(false);
  };

  if (!inventoryItem) return null;

  const currentQty = inventoryItem.quantity || 0;
  const newQty = adjustmentType === "add" 
    ? currentQty + (parseInt(quantity) || 0)
    : currentQty - (parseInt(quantity) || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
        </DialogHeader>
        
        <div className="bg-muted p-3 rounded-md mb-4">
          <p className="text-sm font-medium">{inventoryItem.products?.name}</p>
          <p className="text-xs text-muted-foreground">
            SKU: {inventoryItem.products?.sku} | Current Qty: {currentQty}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Adjustment Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={adjustmentType === "add" ? "default" : "outline"}
                onClick={() => setAdjustmentType("add")}
                className="flex-1"
              >
                Add Stock
              </Button>
              <Button
                type="button"
                variant={adjustmentType === "remove" ? "destructive" : "outline"}
                onClick={() => setAdjustmentType("remove")}
                className="flex-1"
              >
                Remove Stock
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              max={adjustmentType === "remove" ? currentQty : undefined}
              required
            />
            {quantity && (
              <p className="text-xs text-muted-foreground">
                New quantity will be: <span className={newQty < 0 ? "text-destructive" : "font-medium"}>{newQty}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Select value={reason} onValueChange={setReason} required>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {ADJUSTMENT_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details about this adjustment..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={adjustStock.isPending || newQty < 0}
              variant={adjustmentType === "remove" ? "destructive" : "default"}
            >
              {adjustStock.isPending ? "Adjusting..." : "Confirm Adjustment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
