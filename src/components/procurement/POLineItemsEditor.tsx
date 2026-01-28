import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFormatCurrency } from "@/lib/formatters";

interface LineItem {
  id?: string;
  product_id: string;
  product_name?: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface POLineItemsEditorProps {
  lineItems: LineItem[];
  onLineItemsChange: (items: LineItem[]) => void;
  currency: string;
}

export function POLineItemsEditor({ lineItems, onLineItemsChange, currency }: POLineItemsEditorProps) {
  const [newItem, setNewItem] = useState<Partial<LineItem>>({
    product_id: "",
    quantity: 1,
    unit_price: 0,
  });
  const formatCurrencyHook = useFormatCurrency();

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, sku, name, unit_cost, unit_of_measure")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const formatCurrency = (amount: number) => formatCurrencyHook(amount, currency);

  const handleProductSelect = (productId: string) => {
    const product = products?.find((p) => p.id === productId);
    if (product) {
      setNewItem({
        product_id: productId,
        product_name: product.name,
        sku: product.sku,
        quantity: 1,
        unit_price: product.unit_cost || 0,
      });
    }
  };

  const handleAddItem = () => {
    if (!newItem.product_id || !newItem.quantity || newItem.unit_price === undefined) return;

    const product = products?.find((p) => p.id === newItem.product_id);
    const item: LineItem = {
      product_id: newItem.product_id,
      product_name: product?.name,
      sku: product?.sku,
      quantity: newItem.quantity,
      unit_price: newItem.unit_price,
      total_price: newItem.quantity * newItem.unit_price,
    };

    onLineItemsChange([...lineItems, item]);
    setNewItem({ product_id: "", quantity: 1, unit_price: 0 });
  };

  const handleRemoveItem = (index: number) => {
    onLineItemsChange(lineItems.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof LineItem, value: number) => {
    const updated = [...lineItems];
    updated[index] = {
      ...updated[index],
      [field]: value,
      total_price: field === "quantity" 
        ? value * updated[index].unit_price 
        : field === "unit_price" 
          ? updated[index].quantity * value 
          : updated[index].total_price,
    };
    onLineItemsChange(updated);
  };

  const total = lineItems.reduce((sum, item) => sum + item.total_price, 0);

  return (
    <div className="space-y-4">
      {/* Add New Item */}
      <div className="flex gap-4 items-end p-4 bg-muted/50 rounded-lg">
        <div className="flex-1">
          <label className="text-sm font-medium mb-1 block">Product</label>
          <Select value={newItem.product_id} onValueChange={handleProductSelect}>
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
        <div className="w-24">
          <label className="text-sm font-medium mb-1 block">Qty</label>
          <Input
            type="number"
            min="1"
            value={newItem.quantity || ""}
            onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="w-32">
          <label className="text-sm font-medium mb-1 block">Unit Price</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={newItem.unit_price || ""}
            onChange={(e) => setNewItem({ ...newItem, unit_price: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <Button onClick={handleAddItem} disabled={!newItem.product_id}>
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Line Items Table */}
      {lineItems.length > 0 ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="w-24 text-right">Qty</TableHead>
                <TableHead className="w-32 text-right">Unit Price</TableHead>
                <TableHead className="w-32 text-right">Total</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                  <TableCell>{item.product_name}</TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      min="1"
                      className="w-20 text-right ml-auto"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(index, "quantity", parseInt(e.target.value) || 0)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-28 text-right ml-auto"
                      value={item.unit_price}
                      onChange={(e) => handleUpdateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.total_price)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
          No items added yet. Add products to this purchase order.
        </div>
      )}

      {/* Total */}
      {lineItems.length > 0 && (
        <div className="flex justify-end">
          <div className="bg-muted/50 rounded-lg px-6 py-3">
            <span className="text-sm text-muted-foreground mr-4">Order Total:</span>
            <span className="text-xl font-bold">{formatCurrency(total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
