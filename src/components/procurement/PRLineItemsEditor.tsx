import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFormatCurrency } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, StickyNote } from "lucide-react";

export interface PRLineItem {
  id?: string;
  product_id: string | null;
  product_code: string;
  product_name: string;
  description: string;
  quantity: number;
  unit_of_measure: string;
  estimated_price: number;
  total_price: number;
  notes: string;
}

interface PRLineItemsEditorProps {
  lineItems: PRLineItem[];
  onLineItemsChange: (items: PRLineItem[]) => void;
  currency?: string;
}

const UOM_OPTIONS = [
  { value: "pcs", label: "pcs" },
  { value: "kg", label: "kg" },
  { value: "m", label: "m" },
  { value: "l", label: "l" },
  { value: "box", label: "box" },
  { value: "set", label: "set" },
  { value: "unit", label: "unit" },
];

export function PRLineItemsEditor({
  lineItems,
  onLineItemsChange,
  currency = "USD",
}: PRLineItemsEditorProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const formatCurrencyHook = useFormatCurrency();

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, unit_cost, unit_of_measure")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const formatCurrency = (amount: number) => formatCurrencyHook(amount, currency);

  const handleAddItem = () => {
    const newItem: PRLineItem = {
      product_id: null,
      product_code: "",
      product_name: "",
      description: "",
      quantity: 1,
      unit_of_measure: "pcs",
      estimated_price: 0,
      total_price: 0,
      notes: "",
    };

    if (selectedProductId && selectedProductId !== "none") {
      const product = products.find((p) => p.id === selectedProductId);
      if (product) {
        newItem.product_id = product.id;
        newItem.product_code = product.sku || "";
        newItem.product_name = product.name;
        newItem.unit_of_measure = product.unit_of_measure || "pcs";
        newItem.estimated_price = product.unit_cost || 0;
        newItem.total_price = newItem.quantity * newItem.estimated_price;
      }
    }

    onLineItemsChange([...lineItems, newItem]);
    setSelectedProductId("");
  };

  const handleRemoveItem = (index: number) => {
    const updated = lineItems.filter((_, i) => i !== index);
    onLineItemsChange(updated);
  };

  const handleUpdateItem = (
    index: number,
    field: keyof PRLineItem,
    value: string | number | null
  ) => {
    const updated = lineItems.map((item, i) => {
      if (i !== index) return item;

      const updatedItem = { ...item, [field]: value };

      // Recalculate total if quantity or price changed
      if (field === "quantity" || field === "estimated_price") {
        updatedItem.total_price =
          updatedItem.quantity * updatedItem.estimated_price;
      }

      return updatedItem;
    });
    onLineItemsChange(updated);
  };

  const handleProductSelect = (index: number, productId: string) => {
    if (productId === "none") {
      handleUpdateItem(index, "product_id", null);
      return;
    }

    const product = products.find((p) => p.id === productId);
    if (product) {
      const updated = lineItems.map((item, i) => {
        if (i !== index) return item;
        const estimatedPrice = product.unit_cost || 0;
        return {
          ...item,
          product_id: product.id,
          product_code: product.sku || "",
          product_name: product.name,
          unit_of_measure: product.unit_of_measure || "pcs",
          estimated_price: estimatedPrice,
          total_price: item.quantity * estimatedPrice,
        };
      });
      onLineItemsChange(updated);
    }
  };

  const orderTotal = lineItems.reduce((sum, item) => sum + item.total_price, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Items</h3>
        <div className="flex items-center gap-2">
          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select item to add" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">-- Custom Item --</SelectItem>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" size="sm" onClick={handleAddItem}>
            <Plus className="mr-1 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead className="w-[150px]">Item</TableHead>
              <TableHead className="w-[80px]">Code</TableHead>
              <TableHead className="min-w-[120px]">Name*</TableHead>
              <TableHead className="min-w-[120px]">Description</TableHead>
              <TableHead className="w-[70px]">Qty*</TableHead>
              <TableHead className="w-[80px]">UoM*</TableHead>
              <TableHead className="w-[100px]">Unit Price</TableHead>
              <TableHead className="w-[100px]">Total</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                  No items added. Use the button above to add items.
                </TableCell>
              </TableRow>
            ) : (
              lineItems.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    <Select
                      value={item.product_id || "none"}
                      onValueChange={(value) => handleProductSelect(index, value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Custom</SelectItem>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.product_code}
                      onChange={(e) =>
                        handleUpdateItem(index, "product_code", e.target.value)
                      }
                      className="h-8 text-xs"
                      placeholder="Code"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.product_name}
                      onChange={(e) =>
                        handleUpdateItem(index, "product_name", e.target.value)
                      }
                      className="h-8 text-xs"
                      placeholder="Item name"
                      required
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.description}
                      onChange={(e) =>
                        handleUpdateItem(index, "description", e.target.value)
                      }
                      className="h-8 text-xs"
                      placeholder="Description"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleUpdateItem(index, "quantity", Number(e.target.value))
                      }
                      className="h-8 text-xs w-16"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.unit_of_measure}
                      onValueChange={(value) =>
                        handleUpdateItem(index, "unit_of_measure", value)
                      }
                    >
                      <SelectTrigger className="h-8 text-xs w-[70px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UOM_OPTIONS.map((uom) => (
                          <SelectItem key={uom.value} value={uom.value}>
                            {uom.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.estimated_price}
                      onChange={(e) =>
                        handleUpdateItem(
                          index,
                          "estimated_price",
                          Number(e.target.value)
                        )
                      }
                      className="h-8 text-xs w-20"
                    />
                  </TableCell>
                  <TableCell className="font-medium text-xs">
                    {formatCurrency(item.total_price)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                          >
                            <StickyNote
                              className={`h-4 w-4 ${
                                item.notes ? "text-primary" : "text-muted-foreground"
                              }`}
                            />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="end">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Item Notes</h4>
                            <Textarea
                              value={item.notes}
                              onChange={(e) =>
                                handleUpdateItem(index, "notes", e.target.value)
                              }
                              placeholder="Add notes for this item..."
                              rows={3}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {lineItems.length > 0 && (
        <div className="flex justify-end">
          <div className="text-right">
            <span className="text-sm text-muted-foreground mr-4">
              Total Estimated Amount:
            </span>
            <span className="text-lg font-semibold">
              {formatCurrency(orderTotal)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
