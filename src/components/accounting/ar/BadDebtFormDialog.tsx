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
import { useCreateBadDebtProvision, BadDebtFormData } from "@/hooks/useBadDebtProvisions";

interface BadDebtFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const provisionTypes = [
  { value: "provision", label: "Provision for Doubtful Debt" },
  { value: "write_off", label: "Write-Off" },
  { value: "recovery", label: "Recovery" },
];

export function BadDebtFormDialog({
  open,
  onOpenChange,
}: BadDebtFormDialogProps) {
  const { data: customers } = useCustomers();
  const { data: invoices } = useCustomerInvoices();
  const createProvision = useCreateBadDebtProvision();

  const [customerId, setCustomerId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [provisionDate, setProvisionDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [provisionType, setProvisionType] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const customerInvoices = invoices?.filter(inv => 
    inv.customer_id === customerId && 
    !["paid", "cancelled", "written_off"].includes(inv.status || "")
  ) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData: BadDebtFormData = {
      customer_id: customerId,
      invoice_id: invoiceId || null,
      provision_date: provisionDate,
      amount: parseFloat(amount),
      provision_type: provisionType,
      reason: reason || undefined,
      notes: notes || undefined,
    };

    await createProvision.mutateAsync(formData);
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setCustomerId("");
    setInvoiceId("");
    setProvisionDate(new Date().toISOString().split("T")[0]);
    setAmount("");
    setProvisionType("");
    setReason("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Bad Debt Provision</DialogTitle>
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
            <Label htmlFor="invoice">Related Invoice (Optional)</Label>
            <Select value={invoiceId || "none"} onValueChange={(val) => setInvoiceId(val === "none" ? "" : val)} disabled={!customerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select invoice" />
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

          <div className="space-y-2">
            <Label htmlFor="provisionType">Provision Type *</Label>
            <Select value={provisionType} onValueChange={setProvisionType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {provisionTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="provisionDate">Date *</Label>
              <Input
                id="provisionDate"
                type="date"
                value={provisionDate}
                onChange={(e) => setProvisionDate(e.target.value)}
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
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Customer bankruptcy, Dispute unresolved"
            />
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
            <Button
              type="submit"
              disabled={!customerId || !amount || !provisionType || createProvision.isPending}
            >
              {createProvision.isPending ? "Creating..." : "Create Provision"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
