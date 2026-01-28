import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateInventory } from "@/hooks/useInventory";
import { useProducts, useStorageBins } from "@/hooks/useWarehouse";

interface InventoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InventoryFormDialog({ open, onOpenChange }: InventoryFormDialogProps) {
  const [productId, setProductId] = useState("");
  const [binId, setBinId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const { data: products } = useProducts();
  const { data: bins } = useStorageBins();
  const createInventory = useCreateInventory();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createInventory.mutateAsync({
      product_id: productId,
      bin_id: binId || null,
      quantity: parseInt(quantity) || 0,
      lot_number: lotNumber || null,
      expiry_date: expiryDate || null,
    });

    // Reset form
    setProductId("");
    setBinId("");
    setQuantity("");
    setLotNumber("");
    setExpiryDate("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Inventory Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product">Product *</Label>
            <Select value={productId} onValueChange={setProductId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products?.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.sku} - {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bin">Storage Bin</Label>
            <Select value={binId} onValueChange={setBinId}>
              <SelectTrigger>
                <SelectValue placeholder="Select bin (optional)" />
              </SelectTrigger>
              <SelectContent>
                {bins?.map((bin) => (
                  <SelectItem key={bin.id} value={bin.id}>
                    {bin.bin_code} {bin.storage_zones ? `(${bin.storage_zones.zone_code})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="0"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lot">Lot Number</Label>
            <Input
              id="lot"
              value={lotNumber}
              onChange={(e) => setLotNumber(e.target.value)}
              placeholder="e.g., LOT-2026-001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry">Expiry Date</Label>
            <Input
              id="expiry"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createInventory.isPending}>
              {createInventory.isPending ? "Adding..." : "Add Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
