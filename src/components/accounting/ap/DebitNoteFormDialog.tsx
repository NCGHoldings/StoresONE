import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useInvoices } from '@/hooks/useInvoices';
import { useCreateDebitNote, useUpdateDebitNote, DebitNote } from '@/hooks/useDebitNotes';

interface DebitNoteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debitNote?: DebitNote | null;
}

export default function DebitNoteFormDialog({ open, onOpenChange, debitNote }: DebitNoteFormDialogProps) {
  const { data: suppliers } = useSuppliers();
  const { data: invoices } = useInvoices();
  const createDebitNote = useCreateDebitNote();
  const updateDebitNote = useUpdateDebitNote();

  const [formData, setFormData] = useState({
    debit_note_number: '',
    supplier_id: '',
    invoice_id: '',
    debit_date: new Date().toISOString().split('T')[0],
    amount: '',
    reason: 'return',
    notes: '',
  });

  useEffect(() => {
    if (debitNote) {
      setFormData({
        debit_note_number: debitNote.debit_note_number,
        supplier_id: debitNote.supplier_id,
        invoice_id: debitNote.invoice_id || '',
        debit_date: debitNote.debit_date,
        amount: String(debitNote.amount),
        reason: debitNote.reason || 'return',
        notes: debitNote.notes || '',
      });
    } else {
      setFormData({
        debit_note_number: `DN-${Date.now().toString(36).toUpperCase()}`,
        supplier_id: '',
        invoice_id: '',
        debit_date: new Date().toISOString().split('T')[0],
        amount: '',
        reason: 'return',
        notes: '',
      });
    }
  }, [debitNote, open]);

  // Filter invoices by selected supplier
  const supplierInvoices = invoices?.filter(inv => inv.supplier_id === formData.supplier_id) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      amount: parseFloat(formData.amount),
      invoice_id: formData.invoice_id || undefined,
    };

    if (debitNote) {
      await updateDebitNote.mutateAsync({ id: debitNote.id, ...data });
    } else {
      await createDebitNote.mutateAsync(data);
    }
    
    onOpenChange(false);
  };

  const isLoading = createDebitNote.isPending || updateDebitNote.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{debitNote ? 'Edit Debit Note' : 'Create Debit Note'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="debit_note_number">Debit Note Number</Label>
            <Input
              id="debit_note_number"
              value={formData.debit_note_number}
              onChange={(e) => setFormData({ ...formData, debit_note_number: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier_id">Supplier</Label>
            <Select
              value={formData.supplier_id || "none"}
              onValueChange={(val) => setFormData({ ...formData, supplier_id: val === "none" ? "" : val, invoice_id: '' })}
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

          <div className="space-y-2">
            <Label htmlFor="invoice_id">Related Invoice (Optional)</Label>
            <Select
              value={formData.invoice_id || "none"}
              onValueChange={(val) => setFormData({ ...formData, invoice_id: val === "none" ? "" : val })}
              disabled={!formData.supplier_id}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select invoice" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {supplierInvoices.map((invoice) => (
                  <SelectItem key={invoice.id} value={invoice.id}>
                    {invoice.invoice_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="debit_date">Debit Date</Label>
              <Input
                id="debit_date"
                type="date"
                value={formData.debit_date}
                onChange={(e) => setFormData({ ...formData, debit_date: e.target.value })}
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
            <Label htmlFor="reason">Reason</Label>
            <Select
              value={formData.reason}
              onValueChange={(val) => setFormData({ ...formData, reason: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="return">Return</SelectItem>
                <SelectItem value="price_adjustment">Price Adjustment</SelectItem>
                <SelectItem value="quality_issue">Quality Issue</SelectItem>
                <SelectItem value="shortage">Shortage</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
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
              {isLoading ? 'Saving...' : debitNote ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
