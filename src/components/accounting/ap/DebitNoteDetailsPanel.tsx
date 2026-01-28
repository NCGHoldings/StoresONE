import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useFormatCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { 
  CheckCircle, 
  Clock, 
  FileText, 
  Printer, 
  XCircle, 
  ArrowRightLeft,
  User,
  Calendar,
  Receipt,
  Banknote,
  Package
} from "lucide-react";
import { useDebitNote, useApproveDebitNote, useApplyDebitNote } from "@/hooks/useDebitNotes";
import { useDebitNoteApplications } from "@/hooks/useDebitNoteApplications";
import { useInvoices } from "@/hooks/useInvoices";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DebitNoteDetailsPanelProps {
  debitNoteId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  applied: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  partial: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

export function DebitNoteDetailsPanel({ debitNoteId, open, onOpenChange }: DebitNoteDetailsPanelProps) {
  const { data: debitNote, isLoading } = useDebitNote(debitNoteId);
  const { data: applications } = useDebitNoteApplications(debitNoteId);
  const { data: invoices } = useInvoices();
  const approveDebitNote = useApproveDebitNote();
  const applyDebitNote = useApplyDebitNote();
  const formatCurrency = useFormatCurrency();

  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [applyAmount, setApplyAmount] = useState("");

  if (!debitNote) return null;

  const amountApplied = debitNote.amount_applied || 0;
  const remainingBalance = debitNote.amount - amountApplied;
  const applicationProgress = debitNote.amount > 0 ? (amountApplied / debitNote.amount) * 100 : 0;

  // Determine display status based on application
  const getDisplayStatus = () => {
    if (debitNote.status === "cancelled") return "cancelled";
    if (applicationProgress >= 100) return "applied";
    if (applicationProgress > 0) return "partial";
    return debitNote.status || "pending";
  };

  const displayStatus = getDisplayStatus();

  // Filter invoices for apply dialog - only show invoices belonging to this supplier with outstanding balance
  // For vendor invoices, we track by payment_date being null or status not paid
  const eligibleInvoices = invoices?.filter(inv => 
    inv.supplier_id === debitNote.supplier_id && 
    inv.status !== "paid" && 
    inv.status !== "cancelled"
  ) || [];

  const handleApprove = async () => {
    if (!debitNoteId) return;
    await approveDebitNote.mutateAsync(debitNoteId);
  };

  const handleApplySubmit = async () => {
    if (!debitNoteId || !selectedInvoiceId || !applyAmount) return;
    await applyDebitNote.mutateAsync({ 
      id: debitNoteId, 
      invoiceId: selectedInvoiceId,
      amount: parseFloat(applyAmount)
    });
    setApplyDialogOpen(false);
    setSelectedInvoiceId("");
    setApplyAmount("");
  };

  const selectedInvoice = invoices?.find(inv => inv.id === selectedInvoiceId);
  // For AP invoices, use full amount as balance since amount_paid might not be tracked the same way
  const maxApplyAmount = Math.min(
    remainingBalance,
    selectedInvoice ? selectedInvoice.amount : 0
  );

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-xl font-bold">{debitNote.debit_note_number}</SheetTitle>
                <p className="text-sm text-muted-foreground">
                  {debitNote.suppliers?.name || "Unknown Vendor"}
                </p>
              </div>
              <Badge className={statusStyles[displayStatus]}>
                {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
              </Badge>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              {debitNote.status === "pending" && (
                <Button 
                  size="sm" 
                  onClick={handleApprove}
                  disabled={approveDebitNote.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              )}
              {remainingBalance > 0 && debitNote.status !== "pending" && debitNote.status !== "cancelled" && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setApplyDialogOpen(true)}
                >
                  <ArrowRightLeft className="h-4 w-4 mr-1" />
                  Apply to Invoice
                </Button>
              )}
              <Button size="sm" variant="outline">
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
              {debitNote.status === "pending" && (
                <Button size="sm" variant="destructive">
                  <XCircle className="h-4 w-4 mr-1" />
                  Void
                </Button>
              )}
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Financial Summary Card */}
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Banknote className="h-4 w-4" />
                  Financial Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Amount</p>
                    <p className="text-xl font-bold">{formatCurrency(debitNote.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Balance Remaining</p>
                    <p className={`text-xl font-bold ${remainingBalance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                      {formatCurrency(remainingBalance)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Amount Applied</span>
                    <span className="font-medium">{formatCurrency(amountApplied)}</span>
                  </div>
                  <Progress value={applicationProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right">
                    {applicationProgress.toFixed(0)}% applied
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Reference Information */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Reference Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {debitNote.invoices && (
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Original Invoice:</span>
                    <Badge variant="outline">{debitNote.invoices.invoice_number}</Badge>
                  </div>
                )}
                {debitNote.grn_id && (
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Goods Receipt:</span>
                    <Badge variant="outline">GRN Linked</Badge>
                  </div>
                )}
                <Separator />
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Debit Date:</span>
                  <span className="text-sm font-medium">
                    {format(new Date(debitNote.debit_date), "MMMM dd, yyyy")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Created:</span>
                  <span className="text-sm font-medium">
                    {format(new Date(debitNote.created_at), "MMM dd, yyyy HH:mm")}
                  </span>
                </div>
                {debitNote.reason && (
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="text-sm">Reason:</span>
                      <p className="text-sm font-medium capitalize">{debitNote.reason.replace("_", " ")}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Application History */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Application History</CardTitle>
              </CardHeader>
              <CardContent>
                {applications && applications.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Invoice</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell className="text-sm">
                            {format(new Date(app.applied_at), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {app.invoices?.invoice_number || "—"}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(app.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No applications yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            {debitNote.notes && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{debitNote.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Apply to Invoice Dialog */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Debit Note to Invoice</DialogTitle>
            <DialogDescription>
              Select a vendor invoice to apply this debit note against. Available: {formatCurrency(remainingBalance)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Invoice</Label>
              <Select value={selectedInvoiceId} onValueChange={(val) => {
                setSelectedInvoiceId(val);
                const inv = invoices?.find(i => i.id === val);
                if (inv) {
                  setApplyAmount(Math.min(remainingBalance, inv.amount).toFixed(2));
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an invoice" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleInvoices.map((inv) => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.invoice_number} - Amount: {formatCurrency(inv.amount)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Amount to Apply</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max={maxApplyAmount}
                value={applyAmount}
                onChange={(e) => setApplyAmount(e.target.value)}
                placeholder="0.00"
              />
              {selectedInvoice && (
                <p className="text-xs text-muted-foreground">
                  Max applicable: {formatCurrency(maxApplyAmount)}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleApplySubmit}
              disabled={!selectedInvoiceId || !applyAmount || parseFloat(applyAmount) <= 0 || applyDebitNote.isPending}
            >
              {applyDebitNote.isPending ? "Applying..." : "Apply Debit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
