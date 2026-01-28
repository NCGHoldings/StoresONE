import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { CreditCard, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { useVendorDebitNotes, VendorInvoiceWithBalance } from "@/hooks/useVendorBalances";
import { useFormatCurrency } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface DebitNoteApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  selectedInvoices: VendorInvoiceWithBalance[];
  onSuccess: () => void;
}

interface DebitNoteAllocation {
  debitNoteId: string;
  debitNoteNumber: string;
  availableAmount: number;
  allocations: { invoiceId: string; amount: number }[];
}

export default function DebitNoteApplicationDialog({
  open,
  onOpenChange,
  supplierId,
  selectedInvoices,
  onSuccess,
}: DebitNoteApplicationDialogProps) {
  const [allocations, setAllocations] = useState<DebitNoteAllocation[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: debitNotes } = useVendorDebitNotes(supplierId || null);
  const formatCurrency = useFormatCurrency();
  const queryClient = useQueryClient();

  const availableDebitNotes = useMemo(
    () => (debitNotes || []).filter((dn) => dn.status !== "applied" && dn.available_amount > 0),
    [debitNotes]
  );

  // Initialize allocations
  useEffect(() => {
    if (open && availableDebitNotes.length > 0) {
      setAllocations(
        availableDebitNotes.map((dn) => ({
          debitNoteId: dn.id,
          debitNoteNumber: dn.debit_note_number,
          availableAmount: dn.available_amount,
          allocations: selectedInvoices.map((inv) => ({ invoiceId: inv.id, amount: 0 })),
        }))
      );
    }
  }, [open, availableDebitNotes, selectedInvoices]);

  const handleAllocationChange = (dnIndex: number, invoiceId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    
    setAllocations((prev) => {
      const newAllocations = [...prev];
      const dn = newAllocations[dnIndex];
      const invoice = selectedInvoices.find((inv) => inv.id === invoiceId);
      
      if (!dn || !invoice) return prev;

      // Calculate how much is already allocated from this DN to other invoices
      const otherAllocated = dn.allocations
        .filter((a) => a.invoiceId !== invoiceId)
        .reduce((sum, a) => sum + a.amount, 0);

      // Calculate how much is already allocated to this invoice from other DNs
      const otherDnAllocated = prev
        .filter((_, i) => i !== dnIndex)
        .reduce((sum, d) => {
          const alloc = d.allocations.find((a) => a.invoiceId === invoiceId);
          return sum + (alloc?.amount || 0);
        }, 0);

      // Max we can allocate is the smaller of: 
      // 1. Remaining DN amount
      // 2. Remaining invoice balance
      const maxFromDn = dn.availableAmount - otherAllocated;
      const maxForInvoice = invoice.balance_due - otherDnAllocated;
      const maxAllocation = Math.min(maxFromDn, maxForInvoice);

      const allocationIdx = dn.allocations.findIndex((a) => a.invoiceId === invoiceId);
      if (allocationIdx >= 0) {
        dn.allocations[allocationIdx].amount = Math.min(Math.max(0, numValue), maxAllocation);
      }

      return newAllocations;
    });
  };

  // Calculate totals
  const totalToApply = useMemo(
    () =>
      allocations.reduce(
        (sum, dn) => sum + dn.allocations.reduce((s, a) => s + a.amount, 0),
        0
      ),
    [allocations]
  );

  const handleSubmit = async () => {
    if (totalToApply <= 0) return;

    setIsSubmitting(true);
    try {
      // Process each debit note
      for (const dn of allocations) {
        const dnTotal = dn.allocations.reduce((sum, a) => sum + a.amount, 0);
        if (dnTotal <= 0) continue;

        // Create debit note application records
        for (const alloc of dn.allocations) {
          if (alloc.amount <= 0) continue;

          await supabase.from("debit_note_applications").insert({
            debit_note_id: dn.debitNoteId,
            invoice_id: alloc.invoiceId,
            amount: alloc.amount,
          });

          // Update invoice amount_paid
          const { data: invoice } = await supabase
            .from("invoices")
            .select("amount, amount_paid")
            .eq("id", alloc.invoiceId)
            .single();

          if (invoice) {
            const newAmountPaid = Number(invoice.amount_paid || 0) + alloc.amount;
            const newStatus = newAmountPaid >= Number(invoice.amount) ? "paid" : "approved";

            await supabase
              .from("invoices")
              .update({
                amount_paid: newAmountPaid,
                status: newStatus,
              })
              .eq("id", alloc.invoiceId);
          }
        }

        // Update debit note
        const { data: currentDn } = await supabase
          .from("debit_notes")
          .select("amount, amount_applied")
          .eq("id", dn.debitNoteId)
          .single();

        if (currentDn) {
          const newAmountApplied = Number(currentDn.amount_applied || 0) + dnTotal;
          const newStatus = newAmountApplied >= Number(currentDn.amount) ? "applied" : "partially_applied";

          await supabase
            .from("debit_notes")
            .update({
              amount_applied: newAmountApplied,
              status: newStatus,
            })
            .eq("id", dn.debitNoteId);
        }
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-stats"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-invoices-balance"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-balance"] });
      queryClient.invalidateQueries({ queryKey: ["debit-notes"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-debit-notes"] });

      toast.success(`Applied ${formatCurrency(totalToApply)} in debit notes`);
      onSuccess();
    } catch (error: any) {
      toast.error(`Failed to apply debit notes: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Apply Debit Notes to Invoices
          </DialogTitle>
          <DialogDescription>
            Allocate available debit notes to reduce invoice balances
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {availableDebitNotes.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No available debit notes to apply
            </div>
          ) : (
            <>
              {/* Debit Notes */}
              {allocations.map((dn, dnIndex) => (
                <div key={dn.debitNoteId} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono">
                        {dn.debitNoteNumber}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Available: {formatCurrency(dn.availableAmount)}
                      </span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      Allocating: {formatCurrency(dn.allocations.reduce((s, a) => s + a.amount, 0))}
                    </Badge>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead className="text-right">Balance Due</TableHead>
                        <TableHead className="text-right">Apply Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoices.map((invoice) => {
                        const allocation = dn.allocations.find((a) => a.invoiceId === invoice.id);
                        return (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(invoice.balance_due)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                value={allocation?.amount || 0}
                                onChange={(e) =>
                                  handleAllocationChange(dnIndex, invoice.id, e.target.value)
                                }
                                className="w-32 text-right ml-auto"
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {dnIndex < allocations.length - 1 && <Separator />}
                </div>
              ))}

              {/* Summary */}
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span className="flex items-center gap-2">
                    Total Debit Notes to Apply
                    <ArrowRight className="h-4 w-4" />
                  </span>
                  <span className="text-green-600">{formatCurrency(totalToApply)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || totalToApply <= 0}
          >
            {isSubmitting ? "Applying..." : `Apply ${formatCurrency(totalToApply)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
