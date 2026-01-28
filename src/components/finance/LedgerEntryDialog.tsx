import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateLedgerEntry, LedgerEntryFormData } from "@/hooks/useGeneralLedger";
import { useCostCenters } from "@/hooks/useCostCenters";

interface LedgerEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACCOUNT_OPTIONS = [
  { code: "1100", name: "Cash" },
  { code: "1200", name: "Accounts Receivable" },
  { code: "1300", name: "Inventory" },
  { code: "2100", name: "Accounts Payable" },
  { code: "2200", name: "Accrued Expenses" },
  { code: "3100", name: "Retained Earnings" },
  { code: "4100", name: "Sales Revenue" },
  { code: "5100", name: "Cost of Goods Sold" },
  { code: "6100", name: "Shipping Expense" },
  { code: "6200", name: "Utilities Expense" },
  { code: "6300", name: "Rent Expense" },
];

export function LedgerEntryDialog({ open, onOpenChange }: LedgerEntryDialogProps) {
  const createEntry = useCreateLedgerEntry();
  const { data: costCenters = [] } = useCostCenters();

  const [formData, setFormData] = useState<LedgerEntryFormData>({
    entry_date: new Date().toISOString().split("T")[0],
    account_code: "",
    account_name: "",
    description: "",
    debit: 0,
    credit: 0,
    cost_center_id: "",
  });

  const handleAccountChange = (code: string) => {
    const account = ACCOUNT_OPTIONS.find((a) => a.code === code);
    if (account) {
      setFormData({
        ...formData,
        account_code: account.code,
        account_name: account.name,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      debit: formData.debit || 0,
      credit: formData.credit || 0,
      cost_center_id: formData.cost_center_id || undefined,
    };

    try {
      await createEntry.mutateAsync(submitData);
      onOpenChange(false);
      setFormData({
        entry_date: new Date().toISOString().split("T")[0],
        account_code: "",
        account_name: "",
        description: "",
        debit: 0,
        credit: 0,
        cost_center_id: "",
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Journal Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="entry_date">Entry Date</Label>
            <Input
              id="entry_date"
              type="date"
              value={formData.entry_date}
              onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Account</Label>
            <Select value={formData.account_code} onValueChange={handleAccountChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select account..." />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_OPTIONS.map((account) => (
                  <SelectItem key={account.code} value={account.code}>
                    {account.code} - {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="debit">Debit</Label>
              <Input
                id="debit"
                type="number"
                step="0.01"
                min="0"
                value={formData.debit || ""}
                onChange={(e) => setFormData({ ...formData, debit: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credit">Credit</Label>
              <Input
                id="credit"
                type="number"
                step="0.01"
                min="0"
                value={formData.credit || ""}
                onChange={(e) => setFormData({ ...formData, credit: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cost Center (Optional)</Label>
            <Select
              value={formData.cost_center_id || "none"}
              onValueChange={(value) => setFormData({ ...formData, cost_center_id: value === "none" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select cost center..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No cost center</SelectItem>
                {costCenters.map((cc) => (
                  <SelectItem key={cc.id} value={cc.id}>
                    {cc.code} - {cc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Entry description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createEntry.isPending || !formData.account_code || (formData.debit === 0 && formData.credit === 0)}
            >
              Create Entry
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
