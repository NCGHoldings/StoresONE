import { useState, useMemo } from "react";
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
import { Calendar, Clock } from "lucide-react";
import { format, addDays } from "date-fns";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { useCreateScheduledPayment } from "@/hooks/useScheduledPayments";
import { useFormatCurrency } from "@/lib/formatters";
import { VendorInvoiceWithBalance } from "@/hooks/useVendorBalances";

interface SchedulePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  selectedInvoices: VendorInvoiceWithBalance[];
  onSuccess: () => void;
}

const PAYMENT_METHODS = [
  { value: "wire_transfer", label: "Wire Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "ach", label: "ACH Transfer" },
];

export default function SchedulePaymentDialog({
  open,
  onOpenChange,
  supplierId,
  selectedInvoices,
  onSuccess,
}: SchedulePaymentDialogProps) {
  const [scheduledDate, setScheduledDate] = useState(format(addDays(new Date(), 7), "yyyy-MM-dd"));
  const [paymentMethod, setPaymentMethod] = useState("wire_transfer");
  const [bankAccountId, setBankAccountId] = useState("");
  const [notes, setNotes] = useState("");

  const { data: bankAccounts } = useBankAccounts();
  const createScheduledPayment = useCreateScheduledPayment();
  const formatCurrency = useFormatCurrency();

  const totalAmount = useMemo(
    () => selectedInvoices.reduce((sum, inv) => sum + inv.balance_due, 0),
    [selectedInvoices]
  );

  const handleSubmit = async () => {
    if (!supplierId || selectedInvoices.length === 0) return;

    await createScheduledPayment.mutateAsync({
      supplier_id: supplierId,
      scheduled_date: scheduledDate,
      payment_method: paymentMethod,
      bank_account_id: bankAccountId || undefined,
      notes: notes || undefined,
      items: selectedInvoices.map((inv) => ({
        invoice_id: inv.id,
        amount: inv.balance_due,
      })),
    });

    onSuccess();
    resetForm();
  };

  const resetForm = () => {
    setScheduledDate(format(addDays(new Date(), 7), "yyyy-MM-dd"));
    setPaymentMethod("wire_transfer");
    setBankAccountId("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Payment
          </DialogTitle>
          <DialogDescription>
            Schedule payment for {selectedInvoices.length} invoice(s) totaling{" "}
            {formatCurrency(totalAmount)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Schedule Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Scheduled Date</Label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>

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

            <div className="space-y-2 md:col-span-2">
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
          </div>

          {/* Invoice List */}
          <div className="space-y-2">
            <Label>Invoices to Schedule</Label>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
                      <TableCell>
                        {format(new Date(invoice.due_date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(invoice.balance_due)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Add notes for this scheduled payment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Summary */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Scheduled for {format(new Date(scheduledDate), "MMMM dd, yyyy")}</span>
              </div>
              <span className="text-lg font-bold">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createScheduledPayment.isPending || selectedInvoices.length === 0}
          >
            {createScheduledPayment.isPending ? "Scheduling..." : "Schedule Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
