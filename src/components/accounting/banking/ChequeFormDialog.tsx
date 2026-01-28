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
import { Switch } from "@/components/ui/switch";
import { useActiveBankAccounts } from "@/hooks/useBankAccounts";
import { useCreateCheque } from "@/hooks/useCheques";

interface ChequeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChequeFormDialog({ open, onOpenChange }: ChequeFormDialogProps) {
  const { data: accounts } = useActiveBankAccounts();
  const createCheque = useCreateCheque();

  const [formData, setFormData] = useState({
    cheque_number: "",
    bank_account_id: "",
    cheque_type: "issued",
    cheque_date: new Date().toISOString().split("T")[0],
    amount: "",
    payee_payer: "",
    is_post_dated: false,
    post_date: "",
    memo: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCheque.mutateAsync({
        ...formData,
        amount: parseFloat(formData.amount),
        post_date: formData.is_post_dated ? formData.post_date : undefined,
        memo: formData.memo || undefined,
      });
      onOpenChange(false);
      resetForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const resetForm = () => {
    setFormData({
      cheque_number: "",
      bank_account_id: "",
      cheque_type: "issued",
      cheque_date: new Date().toISOString().split("T")[0],
      amount: "",
      payee_payer: "",
      is_post_dated: false,
      post_date: "",
      memo: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Cheque</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cheque_type">Cheque Type *</Label>
              <Select
                value={formData.cheque_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, cheque_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="issued">Issued (Outgoing)</SelectItem>
                  <SelectItem value="received">Received (Incoming)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cheque_number">Cheque Number *</Label>
              <Input
                id="cheque_number"
                value={formData.cheque_number}
                onChange={(e) =>
                  setFormData({ ...formData, cheque_number: e.target.value })
                }
                placeholder="e.g., 000123"
                required
              />
            </div>
          </div>

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
              <Label htmlFor="cheque_date">Cheque Date *</Label>
              <Input
                id="cheque_date"
                type="date"
                value={formData.cheque_date}
                onChange={(e) =>
                  setFormData({ ...formData, cheque_date: e.target.value })
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

          <div className="space-y-2">
            <Label htmlFor="payee_payer">
              {formData.cheque_type === "issued" ? "Payee" : "Payer"} *
            </Label>
            <Input
              id="payee_payer"
              value={formData.payee_payer}
              onChange={(e) =>
                setFormData({ ...formData, payee_payer: e.target.value })
              }
              placeholder={
                formData.cheque_type === "issued"
                  ? "Name of payee"
                  : "Name of payer"
              }
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_post_dated"
              checked={formData.is_post_dated}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_post_dated: checked })
              }
            />
            <Label htmlFor="is_post_dated">Post-dated cheque</Label>
          </div>

          {formData.is_post_dated && (
            <div className="space-y-2">
              <Label htmlFor="post_date">Post Date *</Label>
              <Input
                id="post_date"
                type="date"
                value={formData.post_date}
                onChange={(e) =>
                  setFormData({ ...formData, post_date: e.target.value })
                }
                required={formData.is_post_dated}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="memo">Memo</Label>
            <Textarea
              id="memo"
              value={formData.memo}
              onChange={(e) =>
                setFormData({ ...formData, memo: e.target.value })
              }
              placeholder="Additional notes..."
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
                createCheque.isPending ||
                !formData.bank_account_id ||
                !formData.cheque_number ||
                !formData.amount ||
                !formData.payee_payer
              }
            >
              {createCheque.isPending ? "Recording..." : "Record Cheque"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
