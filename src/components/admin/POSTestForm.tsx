import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Send, Loader2, CheckCircle, XCircle, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { useCustomers } from "@/hooks/useCustomers";
import { useQuery } from "@tanstack/react-query";
import { useFormatCurrency } from "@/lib/formatters";
import { toast } from "sonner";

interface POSItem {
  sku: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax_rate: number;
}

interface POSPayload {
  pos_terminal_id: string;
  transaction_id: string;
  transaction_datetime: string;
  customer_code: string;
  payment_method: string;
  amount_paid: number;
  bank_account_id: string;
  items: POSItem[];
  notes: string;
}

interface POSResponse {
  success: boolean;
  erp_invoice_number?: string;
  invoice_id?: string;
  receipt_number?: string;
  total_amount?: number;
  amount_paid?: number;
  change_due?: number;
  inventory_updated?: boolean;
  gl_posted?: boolean;
  timestamp?: string;
  error?: string;
  details?: Array<{ sku?: string; field?: string; error: string }>;
}

export function POSTestForm() {
  const formatCurrency = useFormatCurrency();
  const { data: bankAccounts } = useBankAccounts();
  const { data: customers } = useCustomers();
  
  // Fetch products for SKU autocomplete
  const { data: products } = useQuery({
    queryKey: ["products-sku"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, sku, name, unit_cost")
        .eq("is_active", true)
        .order("sku");
      if (error) throw error;
      return data;
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState<POSResponse | null>(null);
  
  const [payload, setPayload] = useState<POSPayload>({
    pos_terminal_id: "POS-001",
    transaction_id: `TXN-${Date.now()}`,
    transaction_datetime: new Date().toISOString(),
    customer_code: "",
    payment_method: "cash",
    amount_paid: 0,
    bank_account_id: "",
    items: [{ sku: "", quantity: 1, unit_price: 0, discount: 0, tax_rate: 7 }],
    notes: "Test POS Sale",
  });

  const addItem = () => {
    setPayload((prev) => ({
      ...prev,
      items: [...prev.items, { sku: "", quantity: 1, unit_price: 0, discount: 0, tax_rate: 7 }],
    }));
  };

  const removeItem = (index: number) => {
    setPayload((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index: number, field: keyof POSItem, value: string | number) => {
    setPayload((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        
        // Auto-fill price when SKU is selected
        if (field === "sku" && products) {
          const product = products.find((p) => p.sku === value);
          if (product) {
            updated.unit_price = product.unit_cost || 0;
          }
        }
        return updated;
      }),
    }));
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let tax = 0;
    payload.items.forEach((item) => {
      const lineTotal = item.quantity * item.unit_price - item.discount;
      subtotal += lineTotal;
      tax += lineTotal * (item.tax_rate / 100);
    });
    return { subtotal, tax, total: subtotal + tax };
  };

  const generateNewTransactionId = () => {
    setPayload((prev) => ({
      ...prev,
      transaction_id: `TXN-${Date.now()}`,
      transaction_datetime: new Date().toISOString(),
    }));
  };

  const handleSubmit = async () => {
    // Client-side validation
    const emptySkuItems = payload.items.filter(item => !item.sku);
    if (emptySkuItems.length > 0) {
      toast.error("Please select a product for all line items");
      return;
    }

    const zeroQtyItems = payload.items.filter(item => item.quantity <= 0);
    if (zeroQtyItems.length > 0) {
      toast.error("Quantity must be greater than 0 for all items");
      return;
    }

    setIsSubmitting(true);
    setResponse(null);

    try {
      const submitPayload = {
        ...payload,
        customer_code: payload.customer_code || undefined,
        bank_account_id: payload.bank_account_id || undefined,
      };

      const { data, error } = await supabase.functions.invoke("pos-sale", {
        body: submitPayload,
      });

      if (error) {
        setResponse({ success: false, error: error.message });
        toast.error("POS sale failed");
      } else {
        setResponse(data as POSResponse);
        if (data?.success) {
          toast.success("POS sale processed successfully");
          generateNewTransactionId();
        } else {
          toast.error("POS sale failed");
        }
      }
    } catch (err) {
      setResponse({ success: false, error: String(err) });
      toast.error("Request failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    toast.success("Payload copied to clipboard");
  };

  const totals = calculateTotals();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Form Section */}
      <div className="space-y-6">
        {/* Terminal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Terminal Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="terminal_id">Terminal ID</Label>
              <Input
                id="terminal_id"
                value={payload.pos_terminal_id}
                onChange={(e) => setPayload((prev) => ({ ...prev, pos_terminal_id: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transaction_id">Transaction ID</Label>
              <div className="flex gap-2">
                <Input
                  id="transaction_id"
                  value={payload.transaction_id}
                  onChange={(e) => setPayload((prev) => ({ ...prev, transaction_id: e.target.value }))}
                  className="font-mono text-xs"
                />
                <Button variant="outline" size="sm" onClick={generateNewTransactionId}>
                  New
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer & Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer & Payment</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Customer (Optional)</Label>
              <Select
                value={payload.customer_code || "none"}
                onValueChange={(v) => setPayload((prev) => ({ ...prev, customer_code: v === "none" ? "" : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Walk-in customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Walk-in Customer</SelectItem>
                  {customers?.map((c) => (
                    <SelectItem key={c.id} value={c.customer_code}>
                      {c.company_name} ({c.customer_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select
                value={payload.payment_method}
                onValueChange={(v) => setPayload((prev) => ({ ...prev, payment_method: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="split">Split</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount Paid</Label>
              <Input
                type="number"
                step="0.01"
                value={payload.amount_paid}
                onChange={(e) => setPayload((prev) => ({ ...prev, amount_paid: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Bank Account</Label>
              <Select
                value={payload.bank_account_id || "none"}
                onValueChange={(v) => setPayload((prev) => ({ ...prev, bank_account_id: v === "none" ? "" : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bank account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No bank account</SelectItem>
                  {bankAccounts?.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.account_name} ({b.account_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Line Items</CardTitle>
            <Button variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" /> Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {payload.items.map((item, index) => (
              <div key={index} className="grid gap-3 p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Item {index + 1}</span>
                  {payload.items.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-5">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">SKU</Label>
                    <Select
                      value={item.sku || "none"}
                      onValueChange={(v) => updateItem(index, "sku", v === "none" ? "" : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select product</SelectItem>
                        {products?.map((p) => (
                          <SelectItem key={p.id} value={p.sku}>
                            {p.sku} - {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tax %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.tax_rate}
                      onChange={(e) => updateItem(index, "tax_rate", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <Separator />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax:</span>
                <span>{formatCurrency(totals.tax)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={payload.notes}
              onChange={(e) => setPayload((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes..."
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Test Sale
              </>
            )}
          </Button>
          <Button variant="outline" onClick={copyPayload}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Payload
          </Button>
        </div>
      </div>

      {/* Response Section */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Request Payload</CardTitle>
            <CardDescription>JSON payload that will be sent to the edge function</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto max-h-64">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {response && (
          <Card className={response.success ? "border-primary" : "border-destructive"}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {response.success ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-primary" />
                    Success
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-destructive" />
                    Failed
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {response.success ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice Number:</span>
                    <Badge variant="secondary">{response.erp_invoice_number}</Badge>
                  </div>
                  {response.receipt_number && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Receipt Number:</span>
                      <Badge variant="secondary">{response.receipt_number}</Badge>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Amount:</span>
                    <span>{formatCurrency(response.total_amount || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount Paid:</span>
                    <span>{formatCurrency(response.amount_paid || 0)}</span>
                  </div>
                  {(response.change_due ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Change Due:</span>
                      <span>{formatCurrency(response.change_due || 0)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex gap-2">
                    {response.inventory_updated && <Badge variant="outline">Inventory Updated</Badge>}
                    {response.gl_posted && <Badge variant="outline">GL Posted</Badge>}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {response.error && (
                    <div className="text-sm text-destructive">{response.error}</div>
                  )}
                  {response.details && response.details.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Details:</span>
                      {response.details.map((detail, i) => (
                        <div key={i} className="text-sm bg-destructive/10 p-2 rounded">
                          {detail.sku && <Badge variant="outline" className="mr-2">{detail.sku}</Badge>}
                          {detail.field && <Badge variant="outline" className="mr-2">{detail.field}</Badge>}
                          {detail.error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Separator />
              <div>
                <span className="text-xs text-muted-foreground">Raw Response:</span>
                <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto mt-1 max-h-48">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
