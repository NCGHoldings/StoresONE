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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { DollarSign, CreditCard, AlertTriangle, Check } from "lucide-react";
import { format } from "date-fns";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { useCreateVendorPayment, useCreatePaymentAllocation } from "@/hooks/useVendorPayments";
import { useFormatCurrency } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VendorInvoiceWithBalance } from "@/hooks/useVendorBalances";
import { useQueryClient } from "@tanstack/react-query";

interface AdvancedPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  selectedInvoices: VendorInvoiceWithBalance[];
  availableDebitNotes: number;
  availableAdvances: number;
  onSuccess: () => void;
}

interface InvoiceAllocation {
  invoiceId: string;
  invoiceNumber: string;
  balanceDue: number;
  allocatedAmount: number;
}

const PAYMENT_METHODS = [
  { value: "wire_transfer", label: "Wire Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "ach", label: "ACH Transfer" },
  { value: "cash", label: "Cash" },
  { value: "card", label: "Credit/Debit Card" },
];

export default function AdvancedPaymentDialog({
  open,
  onOpenChange,
  supplierId,
  selectedInvoices,
  availableDebitNotes,
  availableAdvances,
  onSuccess,
}: AdvancedPaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState("wire_transfer");
  const [bankAccountId, setBankAccountId] = useState("");
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [applyDebitNotes, setApplyDebitNotes] = useState(false);
  const [applyAdvances, setApplyAdvances] = useState(false);
  const [allocations, setAllocations] = useState<InvoiceAllocation[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: bankAccounts } = useBankAccounts();
  const createPayment = useCreateVendorPayment();
  const createAllocation = useCreatePaymentAllocation();
  const formatCurrency = useFormatCurrency();
  const queryClient = useQueryClient();

  // Initialize allocations from selected invoices
  useEffect(() => {
    if (open && selectedInvoices.length > 0) {
      setAllocations(
        selectedInvoices.map((inv) => ({
          invoiceId: inv.id,
          invoiceNumber: inv.invoice_number,
          balanceDue: inv.balance_due,
          allocatedAmount: inv.balance_due,
        }))
      );
    }
  }, [open, selectedInvoices]);

  // Calculate totals
  const totalInvoiceBalance = useMemo(
    () => selectedInvoices.reduce((sum, inv) => sum + inv.balance_due, 0),
    [selectedInvoices]
  );

  const totalAllocated = useMemo(
    () => allocations.reduce((sum, a) => sum + a.allocatedAmount, 0),
    [allocations]
  );

  const debitNoteCredit = applyDebitNotes ? Math.min(availableDebitNotes, totalAllocated) : 0;
  const advanceCredit = applyAdvances ? Math.min(availableAdvances, totalAllocated - debitNoteCredit) : 0;
  const netPayable = Math.max(0, totalAllocated - debitNoteCredit - advanceCredit);

  const handleAllocationChange = (invoiceId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setAllocations((prev) =>
      prev.map((a) =>
        a.invoiceId === invoiceId
          ? { ...a, allocatedAmount: Math.min(Math.max(0, numValue), a.balanceDue) }
          : a
      )
    );
  };

  const handleSubmit = async () => {
    if (!supplierId || totalAllocated <= 0) return;

    setIsSubmitting(true);
    try {
      // Generate payment number
      const paymentNumber = `PAY-${format(new Date(), "yyyyMMdd")}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;

      // Create vendor payment
      const { data: payment, error: payError } = await supabase
        .from("vendor_payments")
        .insert({
          payment_number: paymentNumber,
          supplier_id: supplierId,
          payment_date: paymentDate,
          amount: netPayable,
          payment_method: paymentMethod,
          bank_account: bankAccountId || null,
          reference_number: referenceNumber || null,
          notes: notes || null,
          status: "paid",
        })
        .select()
        .single();

      if (payError) throw payError;

      // Create allocations and update invoices
      for (const allocation of allocations) {
        if (allocation.allocatedAmount <= 0) continue;

        // Create payment allocation
        await supabase.from("payment_allocations").insert({
          payment_id: payment.id,
          invoice_id: allocation.invoiceId,
          amount: allocation.allocatedAmount,
        });

        // Get current invoice amount_paid
        const { data: invoice } = await supabase
          .from("invoices")
          .select("amount, amount_paid")
          .eq("id", allocation.invoiceId)
          .single();

        if (invoice) {
          const newAmountPaid = Number(invoice.amount_paid || 0) + allocation.allocatedAmount;
          const newStatus = newAmountPaid >= Number(invoice.amount) ? "paid" : "approved";

          await supabase
            .from("invoices")
            .update({
              amount_paid: newAmountPaid,
              status: newStatus,
              payment_date: newStatus === "paid" ? paymentDate : null,
              payment_reference: newStatus === "paid" ? paymentNumber : null,
            })
            .eq("id", allocation.invoiceId);
        }
      }

      // Apply debit notes if selected
      if (applyDebitNotes && debitNoteCredit > 0) {
        // Get available debit notes for this supplier
        const { data: debitNotes } = await supabase
          .from("debit_notes")
          .select("*")
          .eq("supplier_id", supplierId)
          .not("status", "eq", "applied")
          .order("debit_date", { ascending: true });

        let remainingCredit = debitNoteCredit;
        for (const dn of debitNotes || []) {
          if (remainingCredit <= 0) break;
          const available = Number(dn.amount) - Number(dn.amount_applied || 0);
          const toApply = Math.min(available, remainingCredit);

          await supabase
            .from("debit_notes")
            .update({
              amount_applied: Number(dn.amount_applied || 0) + toApply,
              status: Number(dn.amount_applied || 0) + toApply >= Number(dn.amount) ? "applied" : "partially_applied",
            })
            .eq("id", dn.id);

          remainingCredit -= toApply;
        }
      }

      // Apply advances if selected
      if (applyAdvances && advanceCredit > 0) {
        const { data: advances } = await supabase
          .from("vendor_advances")
          .select("*")
          .eq("supplier_id", supplierId)
          .gt("remaining_amount", 0)
          .order("advance_date", { ascending: true });

        let remainingCredit = advanceCredit;
        for (const adv of advances || []) {
          if (remainingCredit <= 0) break;
          const toApply = Math.min(Number(adv.remaining_amount), remainingCredit);
          const newRemaining = Number(adv.remaining_amount) - toApply;

          await supabase
            .from("vendor_advances")
            .update({
              remaining_amount: newRemaining,
              status: newRemaining <= 0 ? "fully_applied" : "partially_applied",
            })
            .eq("id", adv.id);

          remainingCredit -= toApply;
        }
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["vendor-payments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-stats"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-invoices-balance"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-balance"] });
      queryClient.invalidateQueries({ queryKey: ["debit-notes"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-advances"] });

      toast.success(`Payment ${paymentNumber} recorded successfully`);
      onSuccess();
      resetForm();
    } catch (error: any) {
      toast.error(`Failed to process payment: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setPaymentMethod("wire_transfer");
    setBankAccountId("");
    setPaymentDate(format(new Date(), "yyyy-MM-dd"));
    setReferenceNumber("");
    setNotes("");
    setApplyDebitNotes(false);
    setApplyAdvances(false);
    setAllocations([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Process Payment
          </DialogTitle>
          <DialogDescription>
            Pay {selectedInvoices.length} invoice(s) totaling {formatCurrency(totalInvoiceBalance)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Bank Account</Label>
              <Select value={bankAccountId} onValueChange={setBankAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bank account..." />
                </SelectTrigger>
                <SelectContent>
                  {(bankAccounts || []).map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_name} ({account.account_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Payment Date</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Reference Number</Label>
              <Input
                placeholder="Transaction reference..."
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* Invoice Allocations */}
          <div className="space-y-2">
            <Label>Invoice Allocations</Label>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead className="text-right">Balance Due</TableHead>
                  <TableHead className="text-right">Amount to Pay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocations.map((allocation) => (
                  <TableRow key={allocation.invoiceId}>
                    <TableCell className="font-mono">{allocation.invoiceNumber}</TableCell>
                    <TableCell className="text-right">{formatCurrency(allocation.balanceDue)}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min={0}
                        max={allocation.balanceDue}
                        step={0.01}
                        value={allocation.allocatedAmount}
                        onChange={(e) => handleAllocationChange(allocation.invoiceId, e.target.value)}
                        className="w-32 text-right ml-auto"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Separator />

          {/* Apply Credits */}
          {(availableDebitNotes > 0 || availableAdvances > 0) && (
            <div className="space-y-3">
              <Label>Apply Available Credits</Label>
              
              {availableDebitNotes > 0 && (
                <div className="flex items-center space-x-3 p-3 rounded-lg border bg-green-50/50 dark:bg-green-900/10">
                  <Checkbox
                    id="applyDebitNotes"
                    checked={applyDebitNotes}
                    onCheckedChange={(checked) => setApplyDebitNotes(checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="applyDebitNotes" className="cursor-pointer">
                      Apply Debit Notes
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Available: {formatCurrency(availableDebitNotes)} → Will apply: {formatCurrency(applyDebitNotes ? debitNoteCredit : 0)}
                    </p>
                  </div>
                </div>
              )}

              {availableAdvances > 0 && (
                <div className="flex items-center space-x-3 p-3 rounded-lg border bg-blue-50/50 dark:bg-blue-900/10">
                  <Checkbox
                    id="applyAdvances"
                    checked={applyAdvances}
                    onCheckedChange={(checked) => setApplyAdvances(checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="applyAdvances" className="cursor-pointer">
                      Apply Vendor Advances
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Available: {formatCurrency(availableAdvances)} → Will apply: {formatCurrency(applyAdvances ? advanceCredit : 0)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Payment notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Payment Summary */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="flex justify-between">
              <span>Invoice Total:</span>
              <span className="font-medium">{formatCurrency(totalAllocated)}</span>
            </div>
            {debitNoteCredit > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Less: Debit Notes:</span>
                <span>-{formatCurrency(debitNoteCredit)}</span>
              </div>
            )}
            {advanceCredit > 0 && (
              <div className="flex justify-between text-blue-600">
                <span>Less: Advances:</span>
                <span>-{formatCurrency(advanceCredit)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Net Payable:</span>
              <span>{formatCurrency(netPayable)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || totalAllocated <= 0}>
            {isSubmitting ? "Processing..." : `Pay ${formatCurrency(netPayable)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
