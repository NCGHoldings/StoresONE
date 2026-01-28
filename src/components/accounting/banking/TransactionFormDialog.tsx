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
import { useCreateBankTransaction } from "@/hooks/useBankTransactions";

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultAccountId?: string;
}

const TRANSACTION_TYPES = [
  { value: "deposit", label: "Deposit" },
  { value: "withdrawal", label: "Withdrawal" },
  { value: "transfer_in", label: "Transfer In" },
  { value: "transfer_out", label: "Transfer Out" },
  { value: "fee", label: "Bank Fee" },
  { value: "interest", label: "Interest" },
];

export function TransactionFormDialog({
  open,
  onOpenChange,
  defaultAccountId,
}: TransactionFormDialogProps) {
  const { data: accounts } = useActiveBankAccounts();
  const createTransaction = useCreateBankTransaction();

  const [formData, setFormData] = useState({
    bank_account_id: defaultAccountId || "",
    transaction_date: new Date().toISOString().split("T")[0],
    value_date: "",
    transaction_type: "deposit",
    amount: "",
    reference_number: "",
    description: "",
    payee_payer: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTransaction.mutateAsync({
        ...formData,
        amount: parseFloat(formData.amount),
        value_date: formData.value_date || undefined,
        reference_number: formData.reference_number || undefined,
        description: formData.description || undefined,
        payee_payer: formData.payee_payer || undefined,
      });
      onOpenChange(false);
      resetForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const resetForm = () => {
    setFormData({
      bank_account_id: defaultAccountId || "",
      transaction_date: new Date().toISOString().split("T")[0],
      value_date: "",
      transaction_type: "deposit",
      amount: "",
      reference_number: "",
      description: "",
      payee_payer: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Transaction</DialogTitle>
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
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts?.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.account_name} - {account.account_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transaction_type">Type *</Label>
              <Select
                value={formData.transaction_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, transaction_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transaction_date">Transaction Date *</Label>
              <Input
                id="transaction_date"
                type="date"
                value={formData.transaction_date}
                onChange={(e) =>
                  setFormData({ ...formData, transaction_date: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value_date">Value Date</Label>
              <Input
                id="value_date"
                type="date"
                value={formData.value_date}
                onChange={(e) =>
                  setFormData({ ...formData, value_date: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payee_payer">Payee/Payer</Label>
            <Input
              id="payee_payer"
              value={formData.payee_payer}
              onChange={(e) =>
                setFormData({ ...formData, payee_payer: e.target.value })
              }
              placeholder="Name of payee or payer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference_number">Reference Number</Label>
            <Input
              id="reference_number"
              value={formData.reference_number}
              onChange={(e) =>
                setFormData({ ...formData, reference_number: e.target.value })
              }
              placeholder="External reference"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Transaction description..."
              rows={2}
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
              disabled={
                createTransaction.isPending ||
                !formData.bank_account_id ||
                !formData.amount
              }
            >
              {createTransaction.isPending ? "Recording..." : "Record Transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
