import { useState } from "react";
import {
  Dialog,
  DialogContent,
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
import { useCustomers } from "@/hooks/useCustomers";
import { useSalesOrders } from "@/hooks/useSalesOrders";
import { useCreateCustomerInvoice, InvoiceFormData } from "@/hooks/useCustomerInvoices";
import { Plus, Trash2 } from "lucide-react";
import { useProducts } from "@/hooks/useWarehouse";

interface CustomerInvoiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LineItem {
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  line_total: number;
}

export function CustomerInvoiceFormDialog({
  open,
  onOpenChange,
}: CustomerInvoiceFormDialogProps) {
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();
  const createInvoice = useCreateCustomerInvoice();

  const [customerId, setCustomerId] = useState("");
  const [salesOrderId, setSalesOrderId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentTerms, setPaymentTerms] = useState(30);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineItem[]>([
    { product_id: null, description: "", quantity: 1, unit_price: 0, tax_rate: 0, line_total: 0 }
  ]);

  const { data: salesOrders } = useSalesOrders();
  const customerSalesOrders = salesOrders?.filter(so => so.customer_id === customerId) || [];

  const calculateDueDate = () => {
    const date = new Date(invoiceDate);
    date.setDate(date.getDate() + paymentTerms);
    return date.toISOString().split("T")[0];
  };

  const updateLine = (index: number, field: keyof LineItem, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    
    if (field === "quantity" || field === "unit_price" || field === "tax_rate") {
      const qty = field === "quantity" ? value : newLines[index].quantity;
      const price = field === "unit_price" ? value : newLines[index].unit_price;
      const taxRate = field === "tax_rate" ? value : newLines[index].tax_rate;
      const subtotal = qty * price;
      newLines[index].line_total = subtotal * (1 + taxRate / 100);
    }
    
    setLines(newLines);
  };

  const addLine = () => {
    setLines([...lines, { product_id: null, description: "", quantity: 1, unit_price: 0, tax_rate: 0, line_total: 0 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const subtotal = lines.reduce((sum, line) => sum + (line.quantity * line.unit_price), 0);
    const taxAmount = lines.reduce((sum, line) => sum + (line.quantity * line.unit_price * line.tax_rate / 100), 0);
    const totalAmount = subtotal + taxAmount;
    return { subtotal, taxAmount, totalAmount };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { subtotal, taxAmount, totalAmount } = calculateTotals();

    const formData: InvoiceFormData = {
      customer_id: customerId,
      sales_order_id: salesOrderId || null,
      invoice_date: invoiceDate,
      due_date: calculateDueDate(),
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      payment_terms: paymentTerms,
      notes,
      lines: lines.map(line => ({
        product_id: line.product_id || null,
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unit_price,
        tax_rate: line.tax_rate,
        line_total: line.line_total,
      })),
    };

    await createInvoice.mutateAsync(formData);
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setCustomerId("");
    setSalesOrderId("");
    setInvoiceDate(new Date().toISOString().split("T")[0]);
    setPaymentTerms(30);
    setNotes("");
    setLines([{ product_id: null, description: "", quantity: 1, unit_price: 0, tax_rate: 0, line_total: 0 }]);
  };

  const { subtotal, taxAmount, totalAmount } = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Customer Invoice</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.company_name} ({customer.customer_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salesOrder">Sales Order (Optional)</Label>
              <Select value={salesOrderId || "none"} onValueChange={(val) => setSalesOrderId(val === "none" ? "" : val)} disabled={!customerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Link to Sales Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {customerSalesOrders?.map((so) => (
                    <SelectItem key={so.id} value={so.id}>
                      {so.so_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceDate">Invoice Date *</Label>
              <Input
                id="invoiceDate"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Payment Terms (Days)</Label>
              <Input
                id="paymentTerms"
                type="number"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(parseInt(e.target.value) || 30)}
                min={0}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Due Date: {calculateDueDate()}</Label>
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">Line Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Plus className="h-4 w-4 mr-1" /> Add Line
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-left">Description</th>
                    <th className="px-3 py-2 text-right w-20">Qty</th>
                    <th className="px-3 py-2 text-right w-28">Unit Price</th>
                    <th className="px-3 py-2 text-right w-20">Tax %</th>
                    <th className="px-3 py-2 text-right w-28">Total</th>
                    <th className="px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-2 py-2">
                        <Select
                          value={line.product_id || ""}
                          onValueChange={(val) => {
                            updateLine(index, "product_id", val || null);
                            const product = products?.find(p => p.id === val);
                            if (product) {
                              updateLine(index, "description", product.name);
                            }
                          }}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {products?.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.sku}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          value={line.description}
                          onChange={(e) => updateLine(index, "description", e.target.value)}
                          className="h-8"
                          placeholder="Description"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          type="number"
                          value={line.quantity}
                          onChange={(e) => updateLine(index, "quantity", parseInt(e.target.value) || 0)}
                          className="h-8 text-right"
                          min={1}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          type="number"
                          value={line.unit_price}
                          onChange={(e) => updateLine(index, "unit_price", parseFloat(e.target.value) || 0)}
                          className="h-8 text-right"
                          step="0.01"
                          min={0}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          type="number"
                          value={line.tax_rate}
                          onChange={(e) => updateLine(index, "tax_rate", parseFloat(e.target.value) || 0)}
                          className="h-8 text-right"
                          step="0.01"
                          min={0}
                        />
                      </td>
                      <td className="px-2 py-2 text-right font-medium">
                        ${line.line_total.toFixed(2)}
                      </td>
                      <td className="px-2 py-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLine(index)}
                          disabled={lines.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-2">
                  <span>Total:</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!customerId || createInvoice.isPending}>
              {createInvoice.isPending ? "Creating..." : "Create Invoice"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
