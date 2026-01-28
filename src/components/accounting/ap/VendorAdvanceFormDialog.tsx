import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useCreateVendorAdvance, VendorAdvance } from '@/hooks/useVendorAdvances';

interface VendorAdvanceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advance?: VendorAdvance | null;
}

export default function VendorAdvanceFormDialog({ open, onOpenChange, advance }: VendorAdvanceFormDialogProps) {
  const { data: suppliers } = useSuppliers();
  const createAdvance = useCreateVendorAdvance();

  const [formData, setFormData] = useState({
    advance_number: '',
    supplier_id: '',
    advance_date: new Date().toISOString().split('T')[0],
    original_amount: '',
    notes: '',
  });

  useEffect(() => {
    if (advance) {
      setFormData({
        advance_number: advance.advance_number,
        supplier_id: advance.supplier_id,
        advance_date: advance.advance_date,
        original_amount: String(advance.original_amount),
        notes: advance.notes || '',
      });
    } else {
      setFormData({
        advance_number: `ADV-${Date.now().toString(36).toUpperCase()}`,
        supplier_id: '',
        advance_date: new Date().toISOString().split('T')[0],
        original_amount: '',
        notes: '',
      });
    }
  }, [advance, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      original_amount: parseFloat(formData.original_amount),
      remaining_amount: parseFloat(formData.original_amount),
    };

    await createAdvance.mutateAsync(data);
    onOpenChange(false);
  };

  const isLoading = createAdvance.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{advance ? 'View Advance' : 'Record Vendor Advance'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="advance_number">Advance Number</Label>
            <Input
              id="advance_number"
              value={formData.advance_number}
              onChange={(e) => setFormData({ ...formData, advance_number: e.target.value })}
              required
              disabled={!!advance}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier_id">Supplier</Label>
            <Select
              value={formData.supplier_id || "none"}
              onValueChange={(val) => setFormData({ ...formData, supplier_id: val === "none" ? "" : val })}
              disabled={!!advance}
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
              <Label htmlFor="advance_date">Advance Date</Label>
              <Input
                id="advance_date"
                type="date"
                value={formData.advance_date}
                onChange={(e) => setFormData({ ...formData, advance_date: e.target.value })}
                required
                disabled={!!advance}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="original_amount">Amount</Label>
              <Input
                id="original_amount"
                type="number"
                step="0.01"
                value={formData.original_amount}
                onChange={(e) => setFormData({ ...formData, original_amount: e.target.value })}
                required
                disabled={!!advance}
              />
            </div>
          </div>

          {advance && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
              <div>
                <span className="text-sm text-muted-foreground">Status</span>
                <p className="font-medium capitalize">{advance.status.replace('_', ' ')}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Remaining</span>
                <p className="font-medium">${Number(advance.remaining_amount).toFixed(2)}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes"
              rows={2}
              disabled={!!advance}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {advance ? 'Close' : 'Cancel'}
            </Button>
            {!advance && (
              <Button type="submit" disabled={isLoading || !formData.supplier_id}>
                {isLoading ? 'Saving...' : 'Record Advance'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
