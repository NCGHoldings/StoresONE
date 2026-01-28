import { useState } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { ModuleSubTabs } from "../ModuleSubTabs";
import { KPICard } from "../KPICard";
import { QuickActions } from "../QuickActions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/DataTable";
import { 
  Users, 
  FileText, 
  DollarSign, 
  Clock,
  Plus,
  CreditCard,
  Download,
  AlertTriangle,
  CheckCircle,
  ArrowRightLeft,
  Percent,
  TrendingUp,
} from "lucide-react";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useInvoices, useInvoiceStats } from "@/hooks/useInvoices";
import { useVendorPayments, useVendorPaymentStats } from "@/hooks/useVendorPayments";
import { useDebitNotes, useDebitNoteStats } from "@/hooks/useDebitNotes";
import { useVendorAdvances, useVendorAdvanceStats } from "@/hooks/useVendorAdvances";
import { useWHTCertificates, useWHTStats } from "@/hooks/useWHTCertificates";
import { useFormatCurrency } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

// Dialogs
import { InvoiceFormDialog } from "@/components/finance/InvoiceFormDialog";
import { PaymentDialog } from "@/components/finance/PaymentDialog";
import PaymentFormDialog from "./PaymentFormDialog";
import PaymentAllocationDialog from "./PaymentAllocationDialog";
import DebitNoteFormDialog from "./DebitNoteFormDialog";
import { DebitNoteDetailsPanel } from "./DebitNoteDetailsPanel";
import VendorAdvanceFormDialog from "./VendorAdvanceFormDialog";
import AdvanceAllocationDialog from "./AdvanceAllocationDialog";
import WHTFormDialog from "./WHTFormDialog";
import APAgingChart from "./APAgingChart";
import VendorPerformanceCard from "./VendorPerformanceCard";
import VendorPaymentCenter from "./VendorPaymentCenter";
import APReconciliationPanel from "./APReconciliationPanel";
import ScheduledPaymentsTab from "./ScheduledPaymentsTab";
import PaymentProposalDialog from "./PaymentProposalDialog";

const subTabs = [
  { id: "vendors", label: "Vendors" },
  { id: "invoices", label: "Invoices" },
  { id: "payment-center", label: "Payment Center" },
  { id: "payments", label: "Payment History" },
  { id: "scheduled", label: "Scheduled Payments" },
  { id: "debit-notes", label: "Debit Notes" },
  { id: "advances", label: "Advance Allocations" },
  { id: "ageing", label: "Ageing Report" },
  { id: "wht", label: "WHT Certificates" },
  { id: "reconciliation", label: "Reconciliation" },
  { id: "performance", label: "Vendor Performance" },
];

interface APModuleProps {
  activeSubTab: string;
  onSubTabChange: (tab: string) => void;
}

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  disputed: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  partially_applied: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  fully_applied: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  applied: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  accepted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function APModule({ activeSubTab, onSubTabChange }: APModuleProps) {
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [paymentAllocationOpen, setPaymentAllocationOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [debitNoteDialogOpen, setDebitNoteDialogOpen] = useState(false);
  const [debitNoteDetailsOpen, setDebitNoteDetailsOpen] = useState(false);
  const [selectedDebitNoteId, setSelectedDebitNoteId] = useState<string | null>(null);
  const [advanceDialogOpen, setAdvanceDialogOpen] = useState(false);
  const [advanceAllocationOpen, setAdvanceAllocationOpen] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<any>(null);
  const [whtDialogOpen, setWhtDialogOpen] = useState(false);
  const [proposalDialogOpen, setProposalDialogOpen] = useState(false);

  const { data: suppliers, isLoading: suppliersLoading } = useSuppliers();
  const { data: invoices, isLoading: invoicesLoading } = useInvoices();
  const { data: stats } = useInvoiceStats();
  const { data: payments, isLoading: paymentsLoading } = useVendorPayments();
  const { data: paymentStats } = useVendorPaymentStats();
  const { data: debitNotes, isLoading: debitNotesLoading } = useDebitNotes();
  const { data: debitNoteStats } = useDebitNoteStats();
  const { data: advances, isLoading: advancesLoading } = useVendorAdvances();
  const { data: advanceStats } = useVendorAdvanceStats();
  const { data: whtCerts, isLoading: whtLoading } = useWHTCertificates();
  const { data: whtStats } = useWHTStats();
  const formatCurrency = useFormatCurrency();

  const activeSuppliers = suppliers?.filter(s => s.status === 'active') || [];

  const quickActions = [
    { label: "New Invoice", icon: Plus, onClick: () => setInvoiceDialogOpen(true) },
    { label: "Record Payment", icon: CreditCard, onClick: () => setPaymentDialogOpen(true) },
    { label: "Payment Proposal", icon: TrendingUp, onClick: () => setProposalDialogOpen(true) },
    { label: "Export Report", icon: Download, onClick: () => {} },
  ];

  const handlePayInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setPaymentDialogOpen(true);
  };

  return (
    <>
      <ModuleSubTabs tabs={subTabs} activeTab={activeSubTab || "vendors"} onTabChange={onSubTabChange}>
        {/* VENDORS TAB */}
        <TabsContent value="vendors" className="mt-4 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard icon={Users} label="Active Vendors" value={activeSuppliers.length} subtitle="Approved suppliers" variant="primary" />
            <KPICard icon={DollarSign} label="Total Payables" value={formatCurrency(stats?.totalPayables || 0)} variant="warning" />
            <KPICard icon={Clock} label="Pending Approval" value={stats?.pendingCount || 0} variant="default" />
            <KPICard icon={AlertTriangle} label="Overdue" value={formatCurrency(stats?.overdue || 0)} variant="destructive" />
          </div>
          <QuickActions actions={quickActions} />
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vendor Master</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliersLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      </TableRow>
                    ))
                  ) : suppliers?.slice(0, 10).map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-mono text-sm">{supplier.supplier_code}</TableCell>
                      <TableCell className="font-medium">{supplier.company_name}</TableCell>
                      <TableCell>{supplier.category || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{supplier.email || "-"}</TableCell>
                      <TableCell>
                        <Badge className={statusStyles[supplier.status] || statusStyles.pending}>
                          {supplier.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INVOICES TAB */}
        <TabsContent value="invoices" className="mt-4 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard icon={FileText} label="Total Invoices" value={invoices?.length || 0} variant="primary" />
            <KPICard icon={Clock} label="Pending Approval" value={stats?.pendingCount || 0} variant="warning" />
            <KPICard icon={DollarSign} label="Pending Amount" value={formatCurrency(stats?.pendingApproval || 0)} variant="default" />
            <KPICard icon={AlertTriangle} label="Overdue" value={stats?.overdueCount || 0} variant="destructive" />
          </div>
          <QuickActions actions={[quickActions[0], quickActions[1]]} />
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vendor Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Invoice Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoicesLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      </TableRow>
                    ))
                  ) : invoices?.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-sm">{invoice.invoice_number}</TableCell>
                      <TableCell className="font-medium">{invoice.suppliers?.company_name || "-"}</TableCell>
                      <TableCell>{format(new Date(invoice.invoice_date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{format(new Date(invoice.due_date), "MMM dd, yyyy")}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(invoice.amount)}</TableCell>
                      <TableCell>
                        <Badge className={statusStyles[invoice.status || "pending"]}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAYMENTS TAB */}
        <TabsContent value="payments" className="mt-4 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard icon={DollarSign} label="Payments Today" value={formatCurrency(paymentStats?.paymentsToday || 0)} variant="primary" />
            <KPICard icon={DollarSign} label="This Week" value={formatCurrency(paymentStats?.paymentsThisWeek || 0)} variant="success" />
            <KPICard icon={Clock} label="Pending Approval" value={paymentStats?.pendingApproval || 0} variant="warning" />
            <KPICard icon={DollarSign} label="Paid This Month" value={formatCurrency(paymentStats?.paidThisMonth || 0)} variant="success" />
          </div>
          <QuickActions actions={[
            { label: "Record Payment", icon: Plus, onClick: () => setPaymentFormOpen(true) },
          ]} />
          {paymentsLoading ? (
            <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : (
            <DataTable
              columns={[
                { key: "payment_number", label: "Payment #" },
                { key: "suppliers", label: "Vendor", render: (row) => row.suppliers?.name || "—" },
                { key: "payment_date", label: "Date", render: (row) => format(new Date(row.payment_date), "MMM dd, yyyy") },
                { key: "amount", label: "Amount", render: (row) => formatCurrency(row.amount) },
                { key: "payment_method", label: "Method", render: (row) => row.payment_method?.replace("_", " ") || "—" },
                { key: "status", label: "Status", render: (row) => <Badge className={statusStyles[row.status || "pending"]}>{row.status}</Badge> },
                { key: "actions", label: "", render: (row) => row.status === "paid" && (
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedPayment(row); setPaymentAllocationOpen(true); }}>
                    Allocate
                  </Button>
                )},
              ]}
              data={payments || []}
              onRowClick={() => {}}
            />
          )}
        </TabsContent>

        {/* DEBIT NOTES TAB */}
        <TabsContent value="debit-notes" className="mt-4 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard icon={CreditCard} label="Pending Notes" value={debitNoteStats?.pending || 0} variant="warning" />
            <KPICard icon={CheckCircle} label="Applied (Month)" value={formatCurrency(debitNoteStats?.appliedThisMonth || 0)} variant="success" />
            <KPICard icon={DollarSign} label="Total Value" value={formatCurrency(debitNoteStats?.totalValue || 0)} variant="primary" />
            <KPICard icon={ArrowRightLeft} label="From Returns" value={debitNoteStats?.fromReturns || 0} variant="primary" />
          </div>
          <QuickActions actions={[
            { label: "Create Debit Note", icon: Plus, onClick: () => setDebitNoteDialogOpen(true) },
          ]} />
          {debitNotesLoading ? (
            <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : (
            <DataTable
              columns={[
                { key: "debit_note_number", label: "Debit Note #" },
                { key: "suppliers", label: "Vendor", render: (row) => row.suppliers?.name || "—" },
                { key: "debit_date", label: "Date", render: (row) => format(new Date(row.debit_date), "MMM dd, yyyy") },
                { key: "amount", label: "Total", render: (row) => formatCurrency(row.amount) },
                { key: "amount_applied", label: "Applied", render: (row) => formatCurrency(row.amount_applied || 0) },
                { key: "remaining", label: "Remaining", render: (row) => {
                  const remaining = row.amount - (row.amount_applied || 0);
                  return <span className={remaining > 0 ? "text-amber-600" : "text-green-600"}>{formatCurrency(remaining)}</span>;
                }},
                { key: "reason", label: "Reason", render: (row) => row.reason?.replace("_", " ") || "—" },
                { key: "status", label: "Status", render: (row) => <Badge className={statusStyles[row.status || "pending"]}>{row.status}</Badge> },
              ]}
              data={debitNotes || []}
              onRowClick={(row) => { setSelectedDebitNoteId(row.id); setDebitNoteDetailsOpen(true); }}
            />
          )}
        </TabsContent>

        {/* ADVANCES TAB */}
        <TabsContent value="advances" className="mt-4 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard icon={DollarSign} label="Total Advances" value={formatCurrency(advanceStats?.totalAdvances || 0)} variant="primary" />
            <KPICard icon={DollarSign} label="Active Balance" value={formatCurrency(advanceStats?.activeBalance || 0)} variant="success" />
            <KPICard icon={Clock} label="Partially Applied" value={advanceStats?.partiallyApplied || 0} variant="warning" />
            <KPICard icon={CheckCircle} label="Fully Applied" value={advanceStats?.fullyApplied || 0} variant="success" />
          </div>
          <QuickActions actions={[
            { label: "Record Advance", icon: Plus, onClick: () => setAdvanceDialogOpen(true) },
          ]} />
          {advancesLoading ? (
            <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : (
            <DataTable
              columns={[
                { key: "advance_number", label: "Advance #" },
                { key: "suppliers", label: "Vendor", render: (row) => row.suppliers?.name || "—" },
                { key: "advance_date", label: "Date", render: (row) => format(new Date(row.advance_date), "MMM dd, yyyy") },
                { key: "original_amount", label: "Original", render: (row) => formatCurrency(row.original_amount) },
                { key: "remaining_amount", label: "Remaining", render: (row) => formatCurrency(row.remaining_amount) },
                { key: "status", label: "Status", render: (row) => <Badge className={statusStyles[row.status || "active"]}>{row.status}</Badge> },
                { key: "actions", label: "", render: (row) => row.remaining_amount > 0 && (
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedAdvance(row); setAdvanceAllocationOpen(true); }}>
                    Allocate
                  </Button>
                )},
              ]}
              data={advances || []}
              onRowClick={() => {}}
            />
          )}
        </TabsContent>

        {/* AGEING TAB */}
        <TabsContent value="ageing" className="mt-4 space-y-6">
          <APAgingChart />
        </TabsContent>

        {/* WHT CERTIFICATES TAB */}
        <TabsContent value="wht" className="mt-4 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard icon={FileText} label="Certificates (Month)" value={whtStats?.certificatesThisMonth || 0} variant="primary" />
            <KPICard icon={DollarSign} label="Total WHT (YTD)" value={formatCurrency(whtStats?.totalWHTYTD || 0)} variant="warning" />
            <KPICard icon={Clock} label="Pending Submission" value={whtStats?.pendingSubmission || 0} variant="warning" />
            <KPICard icon={CheckCircle} label="Submitted" value={whtStats?.submitted || 0} variant="success" />
          </div>
          <QuickActions actions={[
            { label: "Record Certificate", icon: Plus, onClick: () => setWhtDialogOpen(true) },
          ]} />
          {whtLoading ? (
            <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : (
            <DataTable
              columns={[
                { key: "certificate_number", label: "Certificate #" },
                { key: "suppliers", label: "Vendor", render: (row) => row.suppliers?.name || "—" },
                { key: "certificate_date", label: "Date", render: (row) => format(new Date(row.certificate_date), "MMM dd, yyyy") },
                { key: "gross_amount", label: "Gross Amount", render: (row) => formatCurrency(row.gross_amount) },
                { key: "wht_rate", label: "WHT Rate", render: (row) => `${row.wht_rate}%` },
                { key: "wht_amount", label: "WHT Amount", render: (row) => formatCurrency(row.wht_amount) },
                { key: "filing_status", label: "Status", render: (row) => <Badge className={statusStyles[row.filing_status || "pending"]}>{row.filing_status}</Badge> },
              ]}
              data={whtCerts || []}
              onRowClick={() => {}}
            />
          )}
        </TabsContent>

        {/* PAYMENT CENTER TAB */}
        <TabsContent value="payment-center" className="mt-4 space-y-6">
          <VendorPaymentCenter />
        </TabsContent>

        {/* SCHEDULED PAYMENTS TAB */}
        <TabsContent value="scheduled" className="mt-4 space-y-6">
          <ScheduledPaymentsTab />
        </TabsContent>

        {/* RECONCILIATION TAB */}
        <TabsContent value="reconciliation" className="mt-4 space-y-6">
          <APReconciliationPanel />
        </TabsContent>

        {/* PERFORMANCE TAB */}
        <TabsContent value="performance" className="mt-4 space-y-6">
          <VendorPerformanceCard />
        </TabsContent>
      </ModuleSubTabs>

      {/* Dialogs */}
      <InvoiceFormDialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen} />
      <PaymentDialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen} invoice={selectedInvoice} />
      <PaymentFormDialog open={paymentFormOpen} onOpenChange={setPaymentFormOpen} />
      <PaymentAllocationDialog payment={selectedPayment} open={paymentAllocationOpen} onOpenChange={setPaymentAllocationOpen} />
      <DebitNoteFormDialog open={debitNoteDialogOpen} onOpenChange={setDebitNoteDialogOpen} />
      <DebitNoteDetailsPanel debitNoteId={selectedDebitNoteId} open={debitNoteDetailsOpen} onOpenChange={setDebitNoteDetailsOpen} />
      <VendorAdvanceFormDialog open={advanceDialogOpen} onOpenChange={setAdvanceDialogOpen} />
      <AdvanceAllocationDialog advance={selectedAdvance} open={advanceAllocationOpen} onOpenChange={setAdvanceAllocationOpen} />
      <WHTFormDialog open={whtDialogOpen} onOpenChange={setWhtDialogOpen} />
      <PaymentProposalDialog open={proposalDialogOpen} onOpenChange={setProposalDialogOpen} onSuccess={() => setProposalDialogOpen(false)} />
    </>
  );
}
