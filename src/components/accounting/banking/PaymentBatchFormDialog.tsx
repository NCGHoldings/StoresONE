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
import { useActiveBankAccounts } from "@/hooks/useBankAccounts";
import { useCreatePaymentBatch } from "@/hooks/usePaymentBatches";

interface PaymentBatchFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BATCH_TYPES = [
  { value: "vendor_payments", label: "Vendor Payments" },
  { value: "employee_reimbursements", label: "Employee Reimbursements" },
  { value: "payroll", label: "Payroll" },
  { value: "other", label: "Other" },
];

export function PaymentBatchFormDialog({
  open,
  onOpenChange,
}: PaymentBatchFormDialogProps) {
  const { data: accounts } = useActiveBankAccounts();
  const createBatch = useCreatePaymentBatch();

  const [formData, setFormData] = useState({
    bank_account_id: "",
    batch_date: new Date().toISOString().split("T")[0],
    batch_type: "vendor_payments",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBatch.mutateAsync({
        ...formData,
        notes: formData.notes || undefined,
      });
      onOpenChange(false);
      resetForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const resetForm = () => {
    setFormData({
      bank_account_id: "",
      batch_date: new Date().toISOString().split("T")[0],
      batch_type: "vendor_payments",
      notes: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Payment Batch</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bank_account_id">Bank Account *</Label>
            <Select
              value={formData.bank_account_id}
              onValueChange={(value) =>
                setFormData({ ...formData, bank_account_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account for payments" />
              </SelectTrigger>
              <SelectContent>
                {accounts?.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.account_name} - Balance: $
                    {account.current_balance.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="batch_date">Batch Date *</Label>
              <Input
                id="batch_date"
                type="date"
                value={formData.batch_date}
                onChange={(e) =>
                  setFormData({ ...formData, batch_date: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch_type">Batch Type *</Label>
              <Select
                value={formData.batch_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, batch_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BATCH_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Description of this payment batch..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createBatch.isPending || !formData.bank_account_id}
            >
              {createBatch.isPending ? "Creating..." : "Create Batch"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
