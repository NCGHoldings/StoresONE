import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePayInvoice, Invoice } from "@/hooks/useInvoices";
import { CreditCard } from "lucide-react";
import { useFormatCurrency, useFormatDate } from "@/lib/formatters";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
}

export function PaymentDialog({ open, onOpenChange, invoice }: PaymentDialogProps) {
  const payInvoice = usePayInvoice();
  const [paymentReference, setPaymentReference] = useState("");
  const formatCurrency = useFormatCurrency();
  const formatDate = useFormatDate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    try {
      await payInvoice.mutateAsync({
        id: invoice.id,
        payment_reference: paymentReference || undefined,
      });
      onOpenChange(false);
      setPaymentReference("");
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Record Payment
          </DialogTitle>
          <DialogDescription>
            Record payment for invoice {invoice.invoice_number}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Invoice Amount</span>
              <span className="text-xl font-semibold">
                {formatCurrency(Number(invoice.amount))}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Supplier</span>
              <span>{invoice.suppliers?.company_name || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Due Date</span>
              <span>{formatDate(invoice.due_date)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_reference">Payment Reference (Optional)</Label>
            <Input
              id="payment_reference"
              placeholder="e.g., CHK-12345, ACH-98765"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={payInvoice.isPending}>
              {payInvoice.isPending ? "Processing..." : "Confirm Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
