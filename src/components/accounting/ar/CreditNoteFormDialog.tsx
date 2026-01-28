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
import { useCustomerInvoices } from "@/hooks/useCustomerInvoices";
import { useCreateCreditNote, CreditNoteFormData } from "@/hooks/useCreditNotes";

interface CreditNoteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const creditReasons = [
  { value: "return", label: "Customer Return" },
  { value: "adjustment", label: "Price Adjustment" },
  { value: "pricing_error", label: "Pricing Error" },
  { value: "goodwill", label: "Goodwill" },
  { value: "other", label: "Other" },
];

export function CreditNoteFormDialog({
  open,
  onOpenChange,
}: CreditNoteFormDialogProps) {
  const { data: customers } = useCustomers();
  const { data: invoices } = useCustomerInvoices();
  const createCreditNote = useCreateCreditNote();

  const [customerId, setCustomerId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [creditDate, setCreditDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const customerInvoices = invoices?.filter(inv => inv.customer_id === customerId) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData: CreditNoteFormData = {
      customer_id: customerId,
      invoice_id: invoiceId || null,
      credit_date: creditDate,
      amount: parseFloat(amount),
      reason: reason || undefined,
      notes: notes || undefined,
    };

    await createCreditNote.mutateAsync(formData);
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setCustomerId("");
    setInvoiceId("");
    setCreditDate(new Date().toISOString().split("T")[0]);
    setAmount("");
    setReason("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Credit Note</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer">Customer *</Label>
            <Select value={customerId} onValueChange={(val) => {
              setCustomerId(val);
              setInvoiceId("");
            }}>
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
            <Label htmlFor="invoice">Original Invoice (Optional)</Label>
            <Select value={invoiceId || "none"} onValueChange={(val) => setInvoiceId(val === "none" ? "" : val)} disabled={!customerId}>
              <SelectTrigger>
                <SelectValue placeholder="Link to invoice" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {customerInvoices?.map((invoice) => (
                  <SelectItem key={invoice.id} value={invoice.id}>
                    {invoice.invoice_number} - ${invoice.total_amount.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="creditDate">Credit Date *</Label>
              <Input
                id="creditDate"
                type="date"
                value={creditDate}
                onChange={(e) => setCreditDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {creditReasons.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!customerId || !amount || createCreditNote.isPending}>
              {createCreditNote.isPending ? "Creating..." : "Create Credit Note"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
