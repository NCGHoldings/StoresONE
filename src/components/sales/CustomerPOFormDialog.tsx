import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCustomers } from "@/hooks/useCustomers";
import { useCreateCustomerPO, generateInternalRef } from "@/hooks/useCustomerPOs";
import { useProducts } from "@/hooks/useWarehouse";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useDefaultCurrency, useFormatCurrency } from "@/lib/formatters";

interface CustomerPOFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

interface LineItem {
  product_id: string | null;
  customer_sku: string;
  description: string;
  quantity: number;
  unit_price: number;
}

interface FormData {
  cpo_number: string;
  internal_ref: string;
  customer_id: string;
  order_date: string;
  required_date: string;
  shipping_address: string;
  notes: string;
}

export function CustomerPOFormDialog({ open, onOpenChange, onClose }: CustomerPOFormDialogProps) {
  const createCPO = useCreateCustomerPO();
  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();
  const defaultCurrency = useDefaultCurrency();
  const formatCurrency = useFormatCurrency();
  const [lines, setLines] = useState<LineItem[]>([
    { product_id: null, customer_sku: "", description: "", quantity: 1, unit_price: 0 },
  ]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      cpo_number: "",
      internal_ref: "",
      customer_id: "",
      order_date: new Date().toISOString().split("T")[0],
      required_date: "",
      shipping_address: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      generateInternalRef().then((ref) => {
        reset({
          cpo_number: "",
          internal_ref: ref,
          customer_id: "",
          order_date: new Date().toISOString().split("T")[0],
          required_date: "",
          shipping_address: "",
          notes: "",
        });
        setLines([{ product_id: null, customer_sku: "", description: "", quantity: 1, unit_price: 0 }]);
      });
    }
  }, [open, reset]);

  const addLine = () => {
    setLines([...lines, { product_id: null, customer_sku: "", description: "", quantity: 1, unit_price: 0 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: keyof LineItem, value: string | number | null) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    
    // If product is selected, update description
    if (field === "product_id" && value) {
      const product = products.find((p) => p.id === value);
      if (product) {
        newLines[index].description = product.name;
        if (product.unit_cost) {
          newLines[index].unit_price = product.unit_cost;
        }
      }
    }
    
    setLines(newLines);
  };

  const calculateTotal = () => {
    return lines.reduce((sum, line) => sum + line.quantity * line.unit_price, 0);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const cpoLines = lines.map((line, idx) => ({
        line_number: idx + 1,
        product_id: line.product_id,
        customer_sku: line.customer_sku || null,
        description: line.description || null,
        quantity: line.quantity,
        unit_price: line.unit_price,
        total_price: line.quantity * line.unit_price,
      }));

      await createCPO.mutateAsync({
        cpo: {
          cpo_number: data.cpo_number,
          internal_ref: data.internal_ref,
          customer_id: data.customer_id,
          order_date: data.order_date,
          required_date: data.required_date || null,
          total_amount: calculateTotal(),
          currency: defaultCurrency,
          status: "received",
          shipping_address: data.shipping_address || null,
          notes: data.notes || null,
        },
        lines: cpoLines,
      });
      onClose();
    } catch (error) {
      console.error("Error creating Customer PO:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Customer Purchase Order</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpo_number">Customer PO Number *</Label>
              <Input
                id="cpo_number"
                {...register("cpo_number", { required: "Customer PO number is required" })}
                placeholder="Customer's PO reference"
              />
              {errors.cpo_number && (
                <p className="text-sm text-destructive">{errors.cpo_number.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="internal_ref">Internal Reference</Label>
              <Input id="internal_ref" {...register("internal_ref")} disabled />
            </div>
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select
                value={watch("customer_id")}
                onValueChange={(value) => setValue("customer_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.filter((c) => c.status === "active").map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.company_name} ({c.customer_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="order_date">Order Date</Label>
              <Input id="order_date" type="date" {...register("order_date")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="required_date">Required Delivery Date</Label>
              <Input id="required_date" type="date" {...register("required_date")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipping_address">Shipping Address</Label>
            <Textarea id="shipping_address" {...register("shipping_address")} rows={2} />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Line Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Plus className="h-4 w-4 mr-1" />
                Add Line
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left text-sm font-medium">#</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">Product</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">Customer SKU</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">Description</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">Qty</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">Unit Price</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">Total</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-3 py-2 text-sm">{idx + 1}</td>
                      <td className="px-3 py-2">
                        <Select
                          value={line.product_id || ""}
                          onValueChange={(v) => updateLine(idx, "product_id", v || null)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.sku} - {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          className="h-8 text-sm"
                          value={line.customer_sku}
                          onChange={(e) => updateLine(idx, "customer_sku", e.target.value)}
                          placeholder="Cust SKU"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          className="h-8 text-sm"
                          value={line.description}
                          onChange={(e) => updateLine(idx, "description", e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2 w-20">
                        <Input
                          type="number"
                          className="h-8 text-sm"
                          value={line.quantity}
                          onChange={(e) => updateLine(idx, "quantity", parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td className="px-3 py-2 w-24">
                        <Input
                          type="number"
                          step="0.01"
                          className="h-8 text-sm"
                          value={line.unit_price}
                          onChange={(e) => updateLine(idx, "unit_price", parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="px-3 py-2 text-sm font-medium">
                        {formatCurrency(line.quantity * line.unit_price)}
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLine(idx)}
                          disabled={lines.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/50">
                  <tr>
                    <td colSpan={6} className="px-3 py-2 text-right font-medium">Total:</td>
                    <td className="px-3 py-2 font-bold">{formatCurrency(calculateTotal())}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} rows={2} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCPO.isPending}>
              Create Customer PO
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
