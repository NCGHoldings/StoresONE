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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCustomerAdvance, useAllocateAdvance } from "@/hooks/useCustomerAdvances";
import { useOpenCustomerInvoices } from "@/hooks/useCustomerInvoices";

interface AdvanceAllocationDialogProps {
  advanceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdvanceAllocationDialog({
  advanceId,
  open,
  onOpenChange,
}: AdvanceAllocationDialogProps) {
  const { data: advance } = useCustomerAdvance(advanceId);
  const { data: openInvoices } = useOpenCustomerInvoices(advance?.customer_id || null);
  const allocateAdvance = useAllocateAdvance();

  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");

  const selectedInvoice = openInvoices?.find(inv => inv.id === invoiceId);
  const maxAllocation = Math.min(
    advance?.remaining_amount || 0,
    selectedInvoice ? selectedInvoice.total_amount - (selectedInvoice.amount_paid || 0) : 0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!advanceId || !invoiceId) return;

    await allocateAdvance.mutateAsync({
      advanceId,
      invoiceId,
      amount: parseFloat(amount),
    });

    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setInvoiceId("");
    setAmount("");
  };

  if (!open || !advance) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Allocate Advance {advance.advance_number}</DialogTitle>
        </DialogHeader>

        <div className="p-3 bg-muted rounded-lg mb-4">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Original Amount</span>
            <span className="font-medium">${advance.original_amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Remaining Balance</span>
            <span className="font-bold text-lg">${advance.remaining_amount.toFixed(2)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invoice">Apply to Invoice *</Label>
            <Select value={invoiceId} onValueChange={setInvoiceId}>
              <SelectTrigger>
                <SelectValue placeholder="Select invoice" />
              </SelectTrigger>
              <SelectContent>
                {openInvoices?.map((invoice) => (
                  <SelectItem key={invoice.id} value={invoice.id}>
                    {invoice.invoice_number} - Balance: ${(invoice.total_amount - (invoice.amount_paid || 0)).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount to Allocate *</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              max={maxAllocation}
              required
            />
            {invoiceId && (
              <p className="text-sm text-muted-foreground">
                Maximum: ${maxAllocation.toFixed(2)}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!invoiceId || !amount || parseFloat(amount) > maxAllocation || allocateAdvance.isPending}
            >
              {allocateAdvance.isPending ? "Allocating..." : "Allocate Advance"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
