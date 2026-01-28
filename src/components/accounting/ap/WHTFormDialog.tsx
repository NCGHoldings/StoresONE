import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useCreateWHTCertificate, useUpdateWHTCertificate, WHTCertificate } from '@/hooks/useWHTCertificates';

interface WHTFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificate?: WHTCertificate | null;
}

export default function WHTFormDialog({ open, onOpenChange, certificate }: WHTFormDialogProps) {
  const { data: suppliers } = useSuppliers();
  const createCertificate = useCreateWHTCertificate();
  const updateCertificate = useUpdateWHTCertificate();

  const [formData, setFormData] = useState({
    certificate_number: '',
    supplier_id: '',
    certificate_date: new Date().toISOString().split('T')[0],
    gross_amount: '',
    wht_rate: '3',
    wht_amount: '',
    tax_type: 'services',
    notes: '',
  });

  useEffect(() => {
    if (certificate) {
      setFormData({
        certificate_number: certificate.certificate_number,
        supplier_id: certificate.supplier_id,
        certificate_date: certificate.certificate_date,
        gross_amount: String(certificate.gross_amount),
        wht_rate: String(certificate.wht_rate),
        wht_amount: String(certificate.wht_amount),
        tax_type: certificate.tax_type || 'services',
        notes: certificate.notes || '',
      });
    } else {
      setFormData({
        certificate_number: `WHT-${Date.now().toString(36).toUpperCase()}`,
        supplier_id: '',
        certificate_date: new Date().toISOString().split('T')[0],
        gross_amount: '',
        wht_rate: '3',
        wht_amount: '',
        tax_type: 'services',
        notes: '',
      });
    }
  }, [certificate, open]);

  // Auto-calculate WHT amount
  useEffect(() => {
    const gross = parseFloat(formData.gross_amount) || 0;
    const rate = parseFloat(formData.wht_rate) || 0;
    const whtAmount = (gross * rate / 100).toFixed(2);
    setFormData(prev => ({ ...prev, wht_amount: whtAmount }));
  }, [formData.gross_amount, formData.wht_rate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      gross_amount: parseFloat(formData.gross_amount),
      wht_rate: parseFloat(formData.wht_rate),
      wht_amount: parseFloat(formData.wht_amount),
    };

    if (certificate) {
      await updateCertificate.mutateAsync({ id: certificate.id, ...data });
    } else {
      await createCertificate.mutateAsync(data);
    }
    
    onOpenChange(false);
  };

  const isLoading = createCertificate.isPending || updateCertificate.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{certificate ? 'Edit WHT Certificate' : 'Record WHT Certificate'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="certificate_number">Certificate Number</Label>
            <Input
              id="certificate_number"
              value={formData.certificate_number}
              onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
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
              <Label htmlFor="certificate_date">Certificate Date</Label>
              <Input
                id="certificate_date"
                type="date"
                value={formData.certificate_date}
                onChange={(e) => setFormData({ ...formData, certificate_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_type">Tax Type</Label>
              <Select
                value={formData.tax_type}
                onValueChange={(val) => setFormData({ ...formData, tax_type: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="services">Services</SelectItem>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="royalties">Royalties</SelectItem>
                  <SelectItem value="dividends">Dividends</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gross_amount">Gross Amount</Label>
              <Input
                id="gross_amount"
                type="number"
                step="0.01"
                value={formData.gross_amount}
                onChange={(e) => setFormData({ ...formData, gross_amount: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wht_rate">WHT Rate (%)</Label>
              <Input
                id="wht_rate"
                type="number"
                step="0.01"
                value={formData.wht_rate}
                onChange={(e) => setFormData({ ...formData, wht_rate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wht_amount">WHT Amount</Label>
              <Input
                id="wht_amount"
                type="number"
                step="0.01"
                value={formData.wht_amount}
                readOnly
                className="bg-muted"
              />
            </div>
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
              {isLoading ? 'Saving...' : certificate ? 'Update' : 'Record'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
