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
  Banknote
} from "lucide-react";
import { useCreditNote, useApproveCreditNote, useApplyCreditNote } from "@/hooks/useCreditNotes";
import { useCreditNoteApplications } from "@/hooks/useCreditNoteApplications";
import { useCustomerInvoices } from "@/hooks/useCustomerInvoices";
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

interface CreditNoteDetailsPanelProps {
  creditNoteId: string | null;
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

export function CreditNoteDetailsPanel({ creditNoteId, open, onOpenChange }: CreditNoteDetailsPanelProps) {
  const { data: creditNote, isLoading } = useCreditNote(creditNoteId);
  const { data: applications } = useCreditNoteApplications(creditNoteId);
  const { data: invoices } = useCustomerInvoices();
  const approveCreditNote = useApproveCreditNote();
  const applyCreditNote = useApplyCreditNote();
  const formatCurrency = useFormatCurrency();

  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [applyAmount, setApplyAmount] = useState("");

  if (!creditNote || isLoading) return null;

  const amountApplied = creditNote.amount_applied || 0;
  const remainingBalance = creditNote.amount - amountApplied;
  const applicationProgress = creditNote.amount > 0 ? (amountApplied / creditNote.amount) * 100 : 0;

  // Determine display status based on application
  const getDisplayStatus = () => {
    if (creditNote.status === "cancelled") return "cancelled";
    if (applicationProgress >= 100) return "applied";
    if (applicationProgress > 0) return "partial";
    return creditNote.status || "pending";
  };

  const displayStatus = getDisplayStatus();

  // Filter invoices for apply dialog - only show invoices belonging to this customer with outstanding balance
  const eligibleInvoices = invoices?.filter(inv => 
    inv.customer_id === creditNote.customer_id && 
    inv.status !== "paid" && 
    inv.status !== "cancelled" &&
    (inv.total_amount - (inv.amount_paid || 0)) > 0
  ) || [];

  const handleApprove = async () => {
    if (!creditNoteId) return;
    await approveCreditNote.mutateAsync(creditNoteId);
  };

  const handleApplySubmit = async () => {
    if (!creditNoteId || !selectedInvoiceId || !applyAmount) return;
    await applyCreditNote.mutateAsync({ 
      creditNoteId, 
      invoiceId: selectedInvoiceId,
      amount: parseFloat(applyAmount)
    });
    setApplyDialogOpen(false);
    setSelectedInvoiceId("");
    setApplyAmount("");
  };

  const selectedInvoice = invoices?.find(inv => inv.id === selectedInvoiceId);
  const maxApplyAmount = Math.min(
    remainingBalance,
    selectedInvoice ? (selectedInvoice.total_amount - (selectedInvoice.amount_paid || 0)) : 0
  );

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-xl font-bold">{creditNote.credit_note_number}</SheetTitle>
                <p className="text-sm text-muted-foreground">
                  {creditNote.customers?.company_name} ({creditNote.customers?.customer_code})
                </p>
              </div>
              <Badge className={statusStyles[displayStatus]}>
                {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
              </Badge>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              {creditNote.status === "pending" && (
                <Button 
                  size="sm" 
                  onClick={handleApprove}
                  disabled={approveCreditNote.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              )}
              {remainingBalance > 0 && creditNote.status !== "pending" && creditNote.status !== "cancelled" && (
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
              {creditNote.status === "pending" && (
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
                    <p className="text-xl font-bold">{formatCurrency(creditNote.amount)}</p>
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
                {creditNote.customer_invoices && (
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Original Invoice:</span>
                    <Badge variant="outline">{creditNote.customer_invoices.invoice_number}</Badge>
                  </div>
                )}
                {creditNote.sales_returns && (
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Sales Return:</span>
                    <Badge variant="outline">{creditNote.sales_returns.return_number}</Badge>
                  </div>
                )}
                <Separator />
                {creditNote.credit_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Credit Date:</span>
                    <span className="text-sm font-medium">
                      {format(new Date(creditNote.credit_date), "MMMM dd, yyyy")}
                    </span>
                  </div>
                )}
                {creditNote.created_at && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Created:</span>
                    <span className="text-sm font-medium">
                      {format(new Date(creditNote.created_at), "MMM dd, yyyy HH:mm")}
                    </span>
                  </div>
                )}
                {creditNote.reason && (
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="text-sm">Reason:</span>
                      <p className="text-sm font-medium capitalize">{creditNote.reason.replace("_", " ")}</p>
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
                            {app.applied_at ? format(new Date(app.applied_at), "MMM dd, yyyy") : "—"}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {app.customer_invoices?.invoice_number || "—"}
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
            {creditNote.notes && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{creditNote.notes}</p>
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
            <DialogTitle>Apply Credit Note to Invoice</DialogTitle>
            <DialogDescription>
              Select an invoice to apply this credit note against. Available: {formatCurrency(remainingBalance)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Invoice</Label>
              <Select value={selectedInvoiceId} onValueChange={(val) => {
                setSelectedInvoiceId(val);
                const inv = invoices?.find(i => i.id === val);
                if (inv) {
                  const invBalance = inv.total_amount - (inv.amount_paid || 0);
                  setApplyAmount(Math.min(remainingBalance, invBalance).toFixed(2));
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an invoice" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleInvoices.map((inv) => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.invoice_number} - Balance: {formatCurrency(inv.total_amount - (inv.amount_paid || 0))}
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
              disabled={!selectedInvoiceId || !applyAmount || parseFloat(applyAmount) <= 0 || applyCreditNote.isPending}
            >
              {applyCreditNote.isPending ? "Applying..." : "Apply Credit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
