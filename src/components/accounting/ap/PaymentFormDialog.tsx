import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useCreateVendorPayment, useUpdateVendorPayment, VendorPayment } from '@/hooks/useVendorPayments';
import { useActiveBankAccounts } from '@/hooks/useBankAccounts';

interface PaymentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment?: VendorPayment | null;
}

export default function PaymentFormDialog({ open, onOpenChange, payment }: PaymentFormDialogProps) {
  const { data: suppliers } = useSuppliers();
  const { data: bankAccounts } = useActiveBankAccounts();
  const createPayment = useCreateVendorPayment();
  const updatePayment = useUpdateVendorPayment();

  const [formData, setFormData] = useState({
    payment_number: '',
    supplier_id: '',
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
    payment_method: 'wire_transfer',
    bank_account: '',
    reference_number: '',
    notes: '',
  });

  useEffect(() => {
    if (payment) {
      setFormData({
        payment_number: payment.payment_number,
        supplier_id: payment.supplier_id,
        payment_date: payment.payment_date,
        amount: String(payment.amount),
        payment_method: payment.payment_method || 'wire_transfer',
        bank_account: payment.bank_account || '',
        reference_number: payment.reference_number || '',
        notes: payment.notes || '',
      });
    } else {
      setFormData({
        payment_number: `PAY-${Date.now().toString(36).toUpperCase()}`,
        supplier_id: '',
        payment_date: new Date().toISOString().split('T')[0],
        amount: '',
        payment_method: 'wire_transfer',
        bank_account: '',
        reference_number: '',
        notes: '',
      });
    }
  }, [payment, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      amount: parseFloat(formData.amount),
    };

    if (payment) {
      await updatePayment.mutateAsync({ id: payment.id, ...data });
    } else {
      await createPayment.mutateAsync(data);
    }
    
    onOpenChange(false);
  };

  const isLoading = createPayment.isPending || updatePayment.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{payment ? 'Edit Payment' : 'Record New Payment'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment_number">Payment Number</Label>
            <Input
              id="payment_number"
              value={formData.payment_number}
              onChange={(e) => setFormData({ ...formData, payment_number: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier_id">Supplier</Label>
            <Select
              value={formData.supplier_id || "none"}
              onValueChange={(val) => setFormData({ ...formData, supplier_id: val === "none" ? "" : val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select supplier</SelectItem>
                {suppliers?.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_date">Payment Date</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Payment Method</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(val) => setFormData({ ...formData, payment_method: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wire_transfer">Wire Transfer</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="ach">ACH</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bank_account">Bank Account</Label>
            <Select
              value={formData.bank_account || "none"}
              onValueChange={(val) => setFormData({ ...formData, bank_account: val === "none" ? "" : val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select bank account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select bank account</SelectItem>
                {bankAccounts?.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.account_name} ({account.account_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference_number">Reference Number</Label>
            <Input
              id="reference_number"
              value={formData.reference_number}
              onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.supplier_id}>
              {isLoading ? 'Saving...' : payment ? 'Update' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
