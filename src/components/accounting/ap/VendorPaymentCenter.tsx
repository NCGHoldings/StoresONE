import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DollarSign,
  Calendar,
  AlertTriangle,
  CreditCard,
  FileText,
  Clock,
  ArrowRight,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import { useSuppliers } from "@/hooks/useSuppliers";
import { 
  useVendorBalance, 
  useVendorInvoicesWithBalance, 
  useVendorDebitNotes,
  useVendorAdvances,
  VendorInvoiceWithBalance 
} from "@/hooks/useVendorBalances";
import { useFormatCurrency } from "@/lib/formatters";
import { KPICard } from "../KPICard";
import AdvancedPaymentDialog from "./AdvancedPaymentDialog";
import DebitNoteApplicationDialog from "./DebitNoteApplicationDialog";
import SchedulePaymentDialog from "./SchedulePaymentDialog";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function VendorPaymentCenter() {
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [debitNoteDialogOpen, setDebitNoteDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  const { data: suppliers, isLoading: suppliersLoading } = useSuppliers();
  const { data: vendorBalance, isLoading: balanceLoading } = useVendorBalance(selectedVendorId || null);
  const { data: invoices, isLoading: invoicesLoading } = useVendorInvoicesWithBalance(selectedVendorId || null);
  const { data: debitNotes } = useVendorDebitNotes(selectedVendorId || null);
  const { data: advances } = useVendorAdvances(selectedVendorId || null);
  const formatCurrency = useFormatCurrency();

  const activeSuppliers = suppliers?.filter(s => s.status === 'active') || [];

  // Filter invoices by search
  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    if (!searchTerm) return invoices;
    return invoices.filter(
      (inv) =>
        inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.po_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [invoices, searchTerm]);

  // Calculate totals for selected invoices
  const selectedTotal = useMemo(() => {
    return filteredInvoices
      .filter((inv) => selectedInvoices.has(inv.id))
      .reduce((sum, inv) => sum + inv.balance_due, 0);
  }, [filteredInvoices, selectedInvoices]);

  // Get available debit notes total
  const availableDebitNotes = useMemo(() => {
    return (debitNotes || [])
      .filter((dn) => dn.status !== "applied")
      .reduce((sum, dn) => sum + (dn.available_amount || 0), 0);
  }, [debitNotes]);

  // Get available advances total
  const availableAdvances = useMemo(() => {
    return (advances || []).reduce((sum, adv) => sum + Number(adv.remaining_amount || 0), 0);
  }, [advances]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(new Set(filteredInvoices.map((inv) => inv.id)));
    } else {
      setSelectedInvoices(new Set());
    }
  };

  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    const newSelection = new Set(selectedInvoices);
    if (checked) {
      newSelection.add(invoiceId);
    } else {
      newSelection.delete(invoiceId);
    }
    setSelectedInvoices(newSelection);
  };

  const selectedInvoiceData = filteredInvoices.filter((inv) => selectedInvoices.has(inv.id));

  return (
    <div className="space-y-6">
      {/* Vendor Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Vendor Payment Center
          </CardTitle>
          <CardDescription>
            Select a vendor to view outstanding invoices and process payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Select Vendor</Label>
              {suppliersLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedVendorId} onValueChange={(val) => {
                  setSelectedVendorId(val);
                  setSelectedInvoices(new Set());
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a vendor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeSuppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.supplier_code} - {supplier.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {selectedVendorId && (
              <div className="relative">
                <Search className="absolute left-3 top-8 h-4 w-4 text-muted-foreground" />
                <Label>Search Invoices</Label>
                <Input
                  placeholder="Search by invoice# or PO#..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vendor Summary KPIs */}
      {selectedVendorId && (
        <>
          {balanceLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : vendorBalance && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <KPICard
                icon={DollarSign}
                label="Outstanding Balance"
                value={formatCurrency(vendorBalance.outstanding_balance)}
                variant="primary"
              />
              <KPICard
                icon={AlertTriangle}
                label="Overdue Amount"
                value={formatCurrency(vendorBalance.overdue_amount)}
                variant="destructive"
              />
              <KPICard
                icon={FileText}
                label="Available Debit Notes"
                value={formatCurrency(availableDebitNotes)}
                subtitle="Can be applied"
                variant="success"
              />
              <KPICard
                icon={Clock}
                label="Available Advances"
                value={formatCurrency(availableAdvances)}
                subtitle="Can be applied"
                variant="success"
              />
            </div>
          )}

          {/* Available Debit Notes & Advances Alert */}
          {(availableDebitNotes > 0 || availableAdvances > 0) && (
            <Alert>
              <CreditCard className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>
                  You have {formatCurrency(availableDebitNotes + availableAdvances)} in available credits (
                  {formatCurrency(availableDebitNotes)} debit notes, {formatCurrency(availableAdvances)} advances)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDebitNoteDialogOpen(true)}
                  disabled={selectedInvoices.size === 0}
                >
                  Apply Credits
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Invoice List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Outstanding Invoices</CardTitle>
                <CardDescription>
                  {filteredInvoices.length} invoice(s) • {selectedInvoices.size} selected
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScheduleDialogOpen(true)}
                  disabled={selectedInvoices.size === 0}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule
                </Button>
                <Button
                  size="sm"
                  onClick={() => setPaymentDialogOpen(true)}
                  disabled={selectedInvoices.size === 0}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Pay Selected ({formatCurrency(selectedTotal)})
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No outstanding invoices for this vendor
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedInvoices.size === filteredInvoices.length && filteredInvoices.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>PO #</TableHead>
                      <TableHead>Invoice Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Scheduled</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow
                        key={invoice.id}
                        className={invoice.is_overdue ? "bg-red-50/50 dark:bg-red-900/10" : ""}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedInvoices.has(invoice.id)}
                            onCheckedChange={(checked) =>
                              handleSelectInvoice(invoice.id, checked as boolean)
                            }
                            disabled={!!invoice.scheduled_payment_date}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm font-medium">
                          {invoice.invoice_number}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {invoice.po_number || "—"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(invoice.invoice_date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <span className={invoice.is_overdue ? "text-destructive font-medium" : ""}>
                            {format(new Date(invoice.due_date), "MMM dd, yyyy")}
                            {invoice.is_overdue && (
                              <span className="ml-1 text-xs">({invoice.days_overdue}d overdue)</span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(invoice.amount)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(invoice.amount_paid)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(invoice.balance_due)}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusStyles[invoice.is_overdue ? "overdue" : invoice.status]}>
                            {invoice.is_overdue ? "Overdue" : invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {invoice.scheduled_payment_date ? (
                            <div className="flex items-center gap-1 text-xs text-blue-600">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(invoice.scheduled_payment_date), "MMM dd")}
                            </div>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Payment Summary */}
          {selectedInvoices.size > 0 && (
            <Card className="border-primary">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Payment Summary</p>
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-2xl font-bold">{formatCurrency(selectedTotal)}</span>
                        <span className="ml-2 text-muted-foreground">for {selectedInvoices.size} invoice(s)</span>
                      </div>
                      {availableDebitNotes > 0 && (
                        <>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <div className="text-green-600">
                            <span className="font-medium">-{formatCurrency(Math.min(availableDebitNotes, selectedTotal))}</span>
                            <span className="ml-1 text-sm">credits available</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setScheduleDialogOpen(true)}>
                      Schedule for Later
                    </Button>
                    <Button onClick={() => setPaymentDialogOpen(true)}>
                      Pay Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Dialogs */}
      <AdvancedPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        supplierId={selectedVendorId}
        selectedInvoices={selectedInvoiceData}
        availableDebitNotes={availableDebitNotes}
        availableAdvances={availableAdvances}
        onSuccess={() => {
          setSelectedInvoices(new Set());
          setPaymentDialogOpen(false);
        }}
      />

      <DebitNoteApplicationDialog
        open={debitNoteDialogOpen}
        onOpenChange={setDebitNoteDialogOpen}
        supplierId={selectedVendorId}
        selectedInvoices={selectedInvoiceData}
        onSuccess={() => {
          setSelectedInvoices(new Set());
          setDebitNoteDialogOpen(false);
        }}
      />

      <SchedulePaymentDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        supplierId={selectedVendorId}
        selectedInvoices={selectedInvoiceData}
        onSuccess={() => {
          setSelectedInvoices(new Set());
          setScheduleDialogOpen(false);
        }}
      />
    </div>
  );
}
