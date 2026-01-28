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
import { useCustomerReceipts } from "@/hooks/useCustomerReceipts";
import { useCreateCustomerAdvance, AdvanceFormData } from "@/hooks/useCustomerAdvances";

interface AdvanceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdvanceFormDialog({
  open,
  onOpenChange,
}: AdvanceFormDialogProps) {
  const { data: customers } = useCustomers();
  const { data: receipts } = useCustomerReceipts();
  const createAdvance = useCreateCustomerAdvance();

  const [customerId, setCustomerId] = useState("");
  const [receiptId, setReceiptId] = useState("");
  const [advanceDate, setAdvanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const customerReceipts = receipts?.filter(r => r.customer_id === customerId && r.status === "pending") || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData: AdvanceFormData = {
      customer_id: customerId,
      receipt_id: receiptId || null,
      advance_date: advanceDate,
      original_amount: parseFloat(amount),
      notes: notes || undefined,
    };

    await createAdvance.mutateAsync(formData);
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setCustomerId("");
    setReceiptId("");
    setAdvanceDate(new Date().toISOString().split("T")[0]);
    setAmount("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Customer Advance</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer">Customer *</Label>
            <Select value={customerId} onValueChange={(val) => {
              setCustomerId(val);
              setReceiptId("");
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
            <Label htmlFor="receipt">Link to Receipt (Optional)</Label>
            <Select value={receiptId || "none"} onValueChange={(val) => setReceiptId(val === "none" ? "" : val)} disabled={!customerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select receipt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {customerReceipts?.map((receipt) => (
                  <SelectItem key={receipt.id} value={receipt.id}>
                    {receipt.receipt_number} - ${receipt.amount.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="advanceDate">Advance Date *</Label>
              <Input
                id="advanceDate"
                type="date"
                value={advanceDate}
                onChange={(e) => setAdvanceDate(e.target.value)}
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
            <Button type="submit" disabled={!customerId || !amount || createAdvance.isPending}>
              {createAdvance.isPending ? "Recording..." : "Record Advance"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
