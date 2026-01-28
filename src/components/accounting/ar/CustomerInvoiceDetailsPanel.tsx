import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCustomerInvoice, useCustomerInvoiceLines, useSendInvoice } from "@/hooks/useCustomerInvoices";
import { format } from "date-fns";
import { Send, Printer, FileText } from "lucide-react";

interface CustomerInvoiceDetailsPanelProps {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-800",
  partial: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
  written_off: "bg-gray-200 text-gray-600",
};

export function CustomerInvoiceDetailsPanel({
  invoiceId,
  open,
  onOpenChange,
}: CustomerInvoiceDetailsPanelProps) {
  const { data: invoice, isLoading } = useCustomerInvoice(invoiceId);
  const { data: lines } = useCustomerInvoiceLines(invoiceId);
  const sendInvoice = useSendInvoice();

  if (!open) return null;
  
  if (isLoading || !invoice) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const balanceDue = invoice.total_amount - (invoice.amount_paid || 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {invoice.invoice_number}
            </SheetTitle>
            <Badge className={statusColors[invoice.status || "draft"]}>
              {invoice.status?.toUpperCase()}
            </Badge>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Customer Info */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Customer</h4>
            <p className="font-medium">{invoice.customers?.company_name}</p>
            <p className="text-sm text-muted-foreground">{invoice.customers?.customer_code}</p>
          </div>

          <Separator />

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Invoice Date</h4>
              <p>{format(new Date(invoice.invoice_date), "MMM dd, yyyy")}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Due Date</h4>
              <p className={new Date(invoice.due_date) < new Date() && invoice.status !== "paid" ? "text-destructive font-medium" : ""}>
                {format(new Date(invoice.due_date), "MMM dd, yyyy")}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Payment Terms</h4>
              <p>{invoice.payment_terms} days</p>
            </div>
            {invoice.sales_orders && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Sales Order</h4>
                <p>{invoice.sales_orders.so_number}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Line Items */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Line Items</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">Description</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Price</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lines?.map((line) => (
                    <tr key={line.id} className="border-t">
                      <td className="px-3 py-2">
                        {line.description || line.products?.name || "—"}
                      </td>
                      <td className="px-3 py-2 text-right">{line.quantity}</td>
                      <td className="px-3 py-2 text-right">${line.unit_price.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right">${line.line_total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax</span>
              <span>${(invoice.tax_amount || 0).toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Total Amount</span>
              <span>${invoice.total_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Amount Paid</span>
              <span>${(invoice.amount_paid || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Balance Due</span>
              <span className={balanceDue > 0 ? "text-destructive" : "text-green-600"}>
                ${balanceDue.toFixed(2)}
              </span>
            </div>
          </div>

          {invoice.notes && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Notes</h4>
                <p className="text-sm">{invoice.notes}</p>
              </div>
            </>
          )}

          {/* Actions */}
          <Separator />
          <div className="flex gap-2">
            {invoice.status === "draft" && (
              <Button
                onClick={() => sendInvoice.mutate(invoice.id)}
                disabled={sendInvoice.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Invoice
              </Button>
            )}
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
