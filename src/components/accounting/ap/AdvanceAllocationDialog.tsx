import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useInvoices } from '@/hooks/useInvoices';
import { useCreateAdvanceAllocation, useAdvanceAllocations, VendorAdvance } from '@/hooks/useVendorAdvances';
import { useFormatCurrency } from '@/lib/formatters';

interface AdvanceAllocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advance: VendorAdvance | null;
}

export default function AdvanceAllocationDialog({ open, onOpenChange, advance }: AdvanceAllocationDialogProps) {
  const { data: invoices } = useInvoices();
  const { data: existingAllocations } = useAdvanceAllocations(advance?.id || null);
  const createAllocation = useCreateAdvanceAllocation();
  const formatCurrency = useFormatCurrency();

  const [allocations, setAllocations] = useState<{ invoiceId: string; amount: number }[]>([]);

  if (!advance) return null;

  // Get open invoices for this supplier
  const openInvoices = invoices?.filter(inv => 
    inv.supplier_id === advance.supplier_id && 
    ['pending', 'approved', 'overdue'].includes(inv.status)
  ) || [];

  const remainingAmount = Number(advance.remaining_amount);

  const handleAllocationChange = (invoiceId: string, amount: number) => {
    setAllocations(prev => {
      const existing = prev.find(a => a.invoiceId === invoiceId);
      if (existing) {
        return prev.map(a => a.invoiceId === invoiceId ? { ...a, amount } : a);
      }
      return [...prev, { invoiceId, amount }];
    });
  };

  const toggleInvoice = (invoiceId: string, invoiceAmount: number) => {
    setAllocations(prev => {
      const existing = prev.find(a => a.invoiceId === invoiceId);
      if (existing) {
        return prev.filter(a => a.invoiceId !== invoiceId);
      }
      return [...prev, { invoiceId, amount: Math.min(invoiceAmount, remainingAmount) }];
    });
  };

  const handleSubmit = async () => {
    for (const allocation of allocations) {
      if (allocation.amount > 0) {
        await createAllocation.mutateAsync({
          advance_id: advance.id,
          invoice_id: allocation.invoiceId,
          amount: allocation.amount,
        });
      }
    }
    setAllocations([]);
    onOpenChange(false);
  };

  const totalNewAllocation = allocations.reduce((sum, a) => sum + a.amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Allocate Advance {advance.advance_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Original Amount:</span>
              <p className="font-medium">{formatCurrency(Number(advance.original_amount))}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Already Allocated:</span>
              <p className="font-medium">{formatCurrency(Number(advance.original_amount) - remainingAmount)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Remaining:</span>
              <p className="font-medium text-primary">{formatCurrency(remainingAmount)}</p>
            </div>
          </div>

          {openInvoices.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No open invoices for this supplier</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Allocate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {openInvoices.map(invoice => {
                  const allocation = allocations.find(a => a.invoiceId === invoice.id);
                  const isSelected = !!allocation;
                  
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleInvoice(invoice.id, Number(invoice.amount))}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.due_date}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(invoice.amount))}</TableCell>
                      <TableCell className="text-right">
                        {isSelected && (
                          <Input
                            type="number"
                            step="0.01"
                            value={allocation?.amount || 0}
                            onChange={(e) => handleAllocationChange(invoice.id, parseFloat(e.target.value) || 0)}
                            className="w-24 text-right"
                            max={Math.min(Number(invoice.amount), remainingAmount)}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {totalNewAllocation > 0 && (
            <div className="text-right">
              <span className="text-muted-foreground">New Allocation Total: </span>
              <span className="font-medium">{formatCurrency(totalNewAllocation)}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createAllocation.isPending || totalNewAllocation === 0 || totalNewAllocation > remainingAmount}
          >
            {createAllocation.isPending ? 'Allocating...' : 'Allocate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
