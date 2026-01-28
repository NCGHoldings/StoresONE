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
import { useCreateFundTransfer } from "@/hooks/useFundTransfers";

interface FundTransferFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FundTransferFormDialog({
  open,
  onOpenChange,
}: FundTransferFormDialogProps) {
  const { data: accounts } = useActiveBankAccounts();
  const createTransfer = useCreateFundTransfer();

  const [formData, setFormData] = useState({
    from_account_id: "",
    to_account_id: "",
    transfer_date: new Date().toISOString().split("T")[0],
    amount: "",
    exchange_rate: "1",
    purpose: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amount = parseFloat(formData.amount);
      const exchangeRate = parseFloat(formData.exchange_rate);
      await createTransfer.mutateAsync({
        ...formData,
        amount,
        exchange_rate: exchangeRate,
        converted_amount: amount * exchangeRate,
        purpose: formData.purpose || undefined,
      });
      onOpenChange(false);
      resetForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const resetForm = () => {
    setFormData({
      from_account_id: "",
      to_account_id: "",
      transfer_date: new Date().toISOString().split("T")[0],
      amount: "",
      exchange_rate: "1",
      purpose: "",
    });
  };

  const fromAccount = accounts?.find((a) => a.id === formData.from_account_id);
  const toAccount = accounts?.find((a) => a.id === formData.to_account_id);
  const showExchangeRate =
    fromAccount && toAccount && fromAccount.currency !== toAccount.currency;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Fund Transfer</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="from_account_id">From Account *</Label>
            <Select
              value={formData.from_account_id}
              onValueChange={(value) =>
                setFormData({ ...formData, from_account_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select source account" />
              </SelectTrigger>
              <SelectContent>
                {accounts
                  ?.filter((a) => a.id !== formData.to_account_id)
                  .map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_name} ({account.currency}) - Balance: $
                      {account.current_balance.toLocaleString()}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="to_account_id">To Account *</Label>
            <Select
              value={formData.to_account_id}
              onValueChange={(value) =>
                setFormData({ ...formData, to_account_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select destination account" />
              </SelectTrigger>
              <SelectContent>
                {accounts
                  ?.filter((a) => a.id !== formData.from_account_id)
                  .map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_name} ({account.currency})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transfer_date">Transfer Date *</Label>
              <Input
                id="transfer_date"
                type="date"
                value={formData.transfer_date}
                onChange={(e) =>
                  setFormData({ ...formData, transfer_date: e.target.value })
                }
                required
              />
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

          {showExchangeRate && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exchange_rate">Exchange Rate</Label>
                <Input
                  id="exchange_rate"
                  type="number"
                  step="0.000001"
                  min="0.000001"
                  value={formData.exchange_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, exchange_rate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Converted Amount</Label>
                <Input
                  value={(
                    parseFloat(formData.amount || "0") *
                    parseFloat(formData.exchange_rate || "1")
                  ).toFixed(2)}
                  disabled
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Textarea
              id="purpose"
              value={formData.purpose}
              onChange={(e) =>
                setFormData({ ...formData, purpose: e.target.value })
              }
              placeholder="Reason for transfer..."
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
                createTransfer.isPending ||
                !formData.from_account_id ||
                !formData.to_account_id ||
                !formData.amount
              }
            >
              {createTransfer.isPending ? "Creating..." : "Create Transfer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
