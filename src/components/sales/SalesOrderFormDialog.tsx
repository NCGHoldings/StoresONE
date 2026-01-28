import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCustomers } from "@/hooks/useCustomers";
import { useCreateSalesOrder, generateSONumber } from "@/hooks/useSalesOrders";
import { useProducts } from "@/hooks/useWarehouse";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

interface SalesOrderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

interface LineItem {
  product_id: string;
  quantity_ordered: number;
  unit_price: number;
}

interface FormData {
  so_number: string;
  customer_id: string;
  order_date: string;
  required_date: string;
  shipping_address: string;
  billing_address: string;
  payment_terms: number;
  priority: string;
  notes: string;
}

export function SalesOrderFormDialog({ open, onOpenChange, onClose }: SalesOrderFormDialogProps) {
  const createSO = useCreateSalesOrder();
  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();
  const [lines, setLines] = useState<LineItem[]>([
    { product_id: "", quantity_ordered: 1, unit_price: 0 },
  ]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      so_number: "",
      customer_id: "",
      order_date: new Date().toISOString().split("T")[0],
      required_date: "",
      shipping_address: "",
      billing_address: "",
      payment_terms: 30,
      priority: "normal",
      notes: "",
    },
  });

  const selectedCustomerId = watch("customer_id");

  useEffect(() => {
    if (open) {
      generateSONumber().then((num) => {
        reset({
          so_number: num,
          customer_id: "",
          order_date: new Date().toISOString().split("T")[0],
          required_date: "",
          shipping_address: "",
          billing_address: "",
          payment_terms: 30,
          priority: "normal",
          notes: "",
        });
        setLines([{ product_id: "", quantity_ordered: 1, unit_price: 0 }]);
      });
    }
  }, [open, reset]);

  // Auto-populate addresses when customer is selected
  useEffect(() => {
    if (selectedCustomerId) {
      const customer = customers.find((c) => c.id === selectedCustomerId);
      if (customer) {
        setValue("shipping_address", customer.shipping_address || "");
        setValue("billing_address", customer.billing_address || "");
        setValue("payment_terms", customer.payment_terms || 30);
      }
    }
  }, [selectedCustomerId, customers, setValue]);

  const addLine = () => {
    setLines([...lines, { product_id: "", quantity_ordered: 1, unit_price: 0 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: keyof LineItem, value: string | number) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    
    // Auto-fill price from product
    if (field === "product_id" && value) {
      const product = products.find((p) => p.id === value);
      if (product && product.unit_cost) {
        newLines[index].unit_price = product.unit_cost;
      }
    }
    
    setLines(newLines);
  };

  const calculateTotal = () => {
    return lines.reduce((sum, line) => sum + line.quantity_ordered * line.unit_price, 0);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const soLines = lines
        .filter((line) => line.product_id)
        .map((line, idx) => ({
          line_number: idx + 1,
          product_id: line.product_id,
          quantity_ordered: line.quantity_ordered,
          unit_price: line.unit_price,
          total_price: line.quantity_ordered * line.unit_price,
          status: "pending",
        }));

      await createSO.mutateAsync({
        so: {
          so_number: data.so_number,
          customer_id: data.customer_id,
          order_date: data.order_date,
          required_date: data.required_date || null,
          total_amount: calculateTotal(),
          shipping_address: data.shipping_address || null,
          billing_address: data.billing_address || null,
          payment_terms: data.payment_terms,
          priority: data.priority,
          status: "draft",
          notes: data.notes || null,
        },
        lines: soLines,
      });
      onClose();
    } catch (error) {
      console.error("Error creating Sales Order:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Sales Order</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="so_number">SO Number</Label>
              <Input id="so_number" {...register("so_number")} disabled />
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
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={watch("priority")}
                onValueChange={(value) => setValue("priority", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="order_date">Order Date</Label>
              <Input id="order_date" type="date" {...register("order_date")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="required_date">Required Ship Date</Label>
              <Input id="required_date" type="date" {...register("required_date")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_terms">Payment Terms (days)</Label>
              <Input
                id="payment_terms"
                type="number"
                {...register("payment_terms", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shipping_address">Shipping Address</Label>
              <Textarea id="shipping_address" {...register("shipping_address")} rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing_address">Billing Address</Label>
              <Textarea id="billing_address" {...register("billing_address")} rows={2} />
            </div>
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
                    <th className="px-3 py-2 text-left text-sm font-medium">Product *</th>
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
                          value={line.product_id}
                          onValueChange={(v) => updateLine(idx, "product_id", v)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select product..." />
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
                      <td className="px-3 py-2 w-24">
                        <Input
                          type="number"
                          className="h-8 text-sm"
                          value={line.quantity_ordered}
                          onChange={(e) => updateLine(idx, "quantity_ordered", parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td className="px-3 py-2 w-28">
                        <Input
                          type="number"
                          step="0.01"
                          className="h-8 text-sm"
                          value={line.unit_price}
                          onChange={(e) => updateLine(idx, "unit_price", parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="px-3 py-2 text-sm font-medium">
                        ${(line.quantity_ordered * line.unit_price).toFixed(2)}
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
                    <td colSpan={4} className="px-3 py-2 text-right font-medium">Total:</td>
                    <td className="px-3 py-2 font-bold">${calculateTotal().toFixed(2)}</td>
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
            <Button type="submit" disabled={createSO.isPending}>
              Create Sales Order
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
