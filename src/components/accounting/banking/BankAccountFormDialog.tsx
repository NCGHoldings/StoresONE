import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { useDefaultCurrency } from "@/lib/formatters";
import {
  BankAccount,
  useCreateBankAccount,
  useUpdateBankAccount,
} from "@/hooks/useBankAccounts";

interface BankAccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: BankAccount | null;
}

const ACCOUNT_TYPES = [
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
  { value: "money_market", label: "Money Market" },
  { value: "petty_cash", label: "Petty Cash" },
];

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "THB", "SGD"];

export function BankAccountFormDialog({
  open,
  onOpenChange,
  account,
}: BankAccountFormDialogProps) {
  const createAccount = useCreateBankAccount();
  const updateAccount = useUpdateBankAccount();
  const isEditing = !!account;
  const defaultCurrency = useDefaultCurrency();

  const [formData, setFormData] = useState({
    account_number: "",
    account_name: "",
    bank_name: "",
    branch_name: "",
    swift_code: "",
    iban: "",
    currency: defaultCurrency,
    account_type: "checking",
    current_balance: 0,
    is_active: true,
    notes: "",
  });

  useEffect(() => {
    if (account) {
      setFormData({
        account_number: account.account_number,
        account_name: account.account_name,
        bank_name: account.bank_name,
        branch_name: account.branch_name || "",
        swift_code: account.swift_code || "",
        iban: account.iban || "",
        currency: account.currency || defaultCurrency,
        account_type: account.account_type || "checking",
        current_balance: account.current_balance || 0,
        is_active: account.is_active,
        notes: account.notes || "",
      });
    } else {
      setFormData({
        account_number: "",
        account_name: "",
        bank_name: "",
        branch_name: "",
        swift_code: "",
        iban: "",
        currency: defaultCurrency,
        account_type: "checking",
        current_balance: 0,
        is_active: true,
        notes: "",
      });
    }
  }, [account, open, defaultCurrency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && account) {
        await updateAccount.mutateAsync({ id: account.id, ...formData });
      } else {
        await createAccount.mutateAsync(formData);
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isPending = createAccount.isPending || updateAccount.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Bank Account" : "Add Bank Account"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account_name">Account Name *</Label>
              <Input
                id="account_name"
                value={formData.account_name}
                onChange={(e) =>
                  setFormData({ ...formData, account_name: e.target.value })
                }
                placeholder="e.g., Main Operating Account"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_number">Account Number *</Label>
              <Input
                id="account_number"
                value={formData.account_number}
                onChange={(e) =>
                  setFormData({ ...formData, account_number: e.target.value })
                }
                placeholder="e.g., 1234567890"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bank_name">Bank Name *</Label>
              <Input
                id="bank_name"
                value={formData.bank_name}
                onChange={(e) =>
                  setFormData({ ...formData, bank_name: e.target.value })
                }
                placeholder="e.g., Chase Bank"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch_name">Branch Name</Label>
              <Input
                id="branch_name"
                value={formData.branch_name}
                onChange={(e) =>
                  setFormData({ ...formData, branch_name: e.target.value })
                }
                placeholder="e.g., Downtown Branch"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account_type">Account Type</Label>
              <Select
                value={formData.account_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, account_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) =>
                  setFormData({ ...formData, currency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_balance">Opening Balance</Label>
              <Input
                id="current_balance"
                type="number"
                step="0.01"
                value={formData.current_balance}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    current_balance: parseFloat(e.target.value) || 0,
                  })
                }
                disabled={isEditing}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="swift_code">SWIFT Code</Label>
              <Input
                id="swift_code"
                value={formData.swift_code}
                onChange={(e) =>
                  setFormData({ ...formData, swift_code: e.target.value })
                }
                placeholder="e.g., CHASUS33"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="iban">IBAN</Label>
              <Input
                id="iban"
                value={formData.iban}
                onChange={(e) =>
                  setFormData({ ...formData, iban: e.target.value })
                }
                placeholder="e.g., DE89370400440532013000"
              />
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
              placeholder="Additional notes about this account..."
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked })
              }
            />
            <Label htmlFor="is_active">Account is active</Label>
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
                isPending || !formData.account_name || !formData.account_number
              }
            >
              {isPending
                ? "Saving..."
                : isEditing
                ? "Update Account"
                : "Add Account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
