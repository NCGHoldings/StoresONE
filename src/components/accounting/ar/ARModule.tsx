import { useState } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { ModuleSubTabs } from "../ModuleSubTabs";
import { KPICard } from "../KPICard";
import { QuickActions } from "../QuickActions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/DataTable";
import { useFormatCurrency } from "@/lib/formatters";
import { 
  Users, 
  FileText, 
  DollarSign, 
  Clock,
  Plus,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  ArrowRightLeft,
} from "lucide-react";
import { format } from "date-fns";

// Hooks
import { useCustomers, useCustomerStats } from "@/hooks/useCustomers";
import { useCustomerInvoices, useCustomerInvoiceStats } from "@/hooks/useCustomerInvoices";
import { useCustomerReceipts, useReceiptStats } from "@/hooks/useCustomerReceipts";
import { useCreditNotes, useCreditNoteStats } from "@/hooks/useCreditNotes";
import { useCustomerAdvances, useAdvanceStats } from "@/hooks/useCustomerAdvances";
import { useBadDebtProvisions, useBadDebtStats } from "@/hooks/useBadDebtProvisions";

// Dialogs
import { CustomerFormDialog } from "@/components/sales/CustomerFormDialog";
import { CustomerInvoiceFormDialog } from "./CustomerInvoiceFormDialog";
import { CustomerInvoiceDetailsPanel } from "./CustomerInvoiceDetailsPanel";
import { ReceiptFormDialog } from "./ReceiptFormDialog";
import { ReceiptAllocationDialog } from "./ReceiptAllocationDialog";
import { CreditNoteFormDialog } from "./CreditNoteFormDialog";
import { CreditNoteDetailsPanel } from "./CreditNoteDetailsPanel";
import { AdvanceFormDialog } from "./AdvanceFormDialog";
import { AdvanceAllocationDialog } from "./AdvanceAllocationDialog";
import { BadDebtFormDialog } from "./BadDebtFormDialog";
import { ARAgingChart } from "./ARAgingChart";
import ReconciliationPanel from "./ReconciliationPanel";

const subTabs = [
  { id: "customers", label: "Customers" },
  { id: "invoices", label: "Invoices" },
  { id: "receipts", label: "Receipts" },
  { id: "credit-notes", label: "Credit Notes" },
  { id: "advances", label: "Advance Allocations" },
  { id: "ageing", label: "Ageing Report" },
  { id: "bad-debt", label: "Bad Debt Provisions" },
  { id: "reconciliation", label: "Reconciliation" },
];

interface ARModuleProps {
  activeSubTab: string;
  onSubTabChange: (tab: string) => void;
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  on_hold: "bg-yellow-100 text-yellow-800",
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-800",
  partial: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
  allocated: "bg-green-100 text-green-800",
  approved: "bg-blue-100 text-blue-800",
  applied: "bg-green-100 text-green-800",
};

export default function ARModule({ activeSubTab, onSubTabChange }: ARModuleProps) {
  // Dialog states
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoiceDetailsOpen, setInvoiceDetailsOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [receiptAllocationOpen, setReceiptAllocationOpen] = useState(false);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const [creditNoteDialogOpen, setCreditNoteDialogOpen] = useState(false);
  const [creditNoteDetailsOpen, setCreditNoteDetailsOpen] = useState(false);
  const [selectedCreditNoteId, setSelectedCreditNoteId] = useState<string | null>(null);
  const [advanceDialogOpen, setAdvanceDialogOpen] = useState(false);
  const [advanceAllocationOpen, setAdvanceAllocationOpen] = useState(false);
  const [selectedAdvanceId, setSelectedAdvanceId] = useState<string | null>(null);
  const [badDebtDialogOpen, setBadDebtDialogOpen] = useState(false);

  // Data hooks
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { data: customerStats } = useCustomerStats();
  const { data: invoices, isLoading: invoicesLoading } = useCustomerInvoices();
  const { data: invoiceStats } = useCustomerInvoiceStats();
  const { data: receipts, isLoading: receiptsLoading } = useCustomerReceipts();
  const { data: receiptStats } = useReceiptStats();
  const { data: creditNotes, isLoading: creditNotesLoading } = useCreditNotes();
  const { data: creditNoteStats } = useCreditNoteStats();
  const { data: advances, isLoading: advancesLoading } = useCustomerAdvances();
  const { data: advanceStats } = useAdvanceStats();
  const { data: badDebts, isLoading: badDebtsLoading } = useBadDebtProvisions();
  const { data: badDebtStats } = useBadDebtStats();

  const formatCurrency = useFormatCurrency();

  return (
    <>
      <ModuleSubTabs tabs={subTabs} activeTab={activeSubTab || "customers"} onTabChange={onSubTabChange}>
        {/* CUSTOMERS TAB */}
        <TabsContent value="customers" className="mt-4 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard icon={Users} label="Total Customers" value={customerStats?.total || 0} subtitle="All accounts" variant="primary" />
            <KPICard icon={CheckCircle} label="Active" value={customerStats?.active || 0} variant="success" />
            <KPICard icon={Clock} label="Inactive" value={customerStats?.inactive || 0} variant="warning" />
            <KPICard icon={AlertTriangle} label="On Hold" value={customerStats?.on_hold || 0} variant="destructive" />
          </div>
          <QuickActions actions={[
            { label: "New Customer", icon: Plus, onClick: () => setCustomerDialogOpen(true) },
          ]} />
          {customersLoading ? (
            <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : (
            <DataTable
              columns={[
                { key: "customer_code", label: "Code" },
                { key: "company_name", label: "Company" },
                { key: "contact_person", label: "Contact" },
                { key: "email", label: "Email" },
                { key: "status", label: "Status", render: (row) => <Badge className={statusColors[row.status]}>{row.status}</Badge> },
              ]}
              data={customers || []}
              onRowClick={() => {}}
            />
          )}
        </TabsContent>

        {/* INVOICES TAB */}
        <TabsContent value="invoices" className="mt-4 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard icon={FileText} label="Total Invoices" value={invoiceStats?.totalInvoices || 0} variant="primary" />
            <KPICard icon={Clock} label="Pending Payment" value={formatCurrency(invoiceStats?.pendingAmount || 0)} variant="warning" />
            <KPICard icon={AlertTriangle} label="Overdue" value={formatCurrency(invoiceStats?.overdueAmount || 0)} variant="destructive" />
            <KPICard icon={DollarSign} label="Collected (Month)" value={formatCurrency(invoiceStats?.collectedThisMonth || 0)} variant="success" />
          </div>
          <QuickActions actions={[
            { label: "Create Invoice", icon: Plus, onClick: () => setInvoiceDialogOpen(true) },
          ]} />
          {invoicesLoading ? (
            <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : (
            <DataTable
              columns={[
                { key: "invoice_number", label: "Invoice #" },
                { key: "customers", label: "Customer", render: (row) => row.customers?.company_name },
                { key: "invoice_date", label: "Date", render: (row) => format(new Date(row.invoice_date), "MMM dd, yyyy") },
                { key: "total_amount", label: "Amount", render: (row) => formatCurrency(row.total_amount) },
                { key: "status", label: "Status", render: (row) => <Badge className={statusColors[row.status || "draft"]}>{row.status}</Badge> },
              ]}
              data={invoices || []}
              onRowClick={(row) => { setSelectedInvoiceId(row.id); setInvoiceDetailsOpen(true); }}
            />
          )}
        </TabsContent>

        {/* RECEIPTS TAB */}
        <TabsContent value="receipts" className="mt-4 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard icon={DollarSign} label="Today" value={formatCurrency(receiptStats?.receiptsToday || 0)} variant="primary" />
            <KPICard icon={DollarSign} label="This Week" value={formatCurrency(receiptStats?.receiptsThisWeek || 0)} variant="success" />
            <KPICard icon={Clock} label="Unallocated" value={formatCurrency(receiptStats?.unallocated || 0)} variant="warning" />
            <KPICard icon={DollarSign} label="This Month" value={formatCurrency(receiptStats?.totalThisMonth || 0)} variant="success" />
          </div>
          <QuickActions actions={[
            { label: "Record Receipt", icon: Plus, onClick: () => setReceiptDialogOpen(true) },
          ]} />
          {receiptsLoading ? (
            <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : (
            <DataTable
              columns={[
                { key: "receipt_number", label: "Receipt #" },
                { key: "customers", label: "Customer", render: (row) => row.customers?.company_name },
                { key: "receipt_date", label: "Date", render: (row) => format(new Date(row.receipt_date), "MMM dd, yyyy") },
                { key: "amount", label: "Amount", render: (row) => formatCurrency(row.amount) },
                { key: "payment_method", label: "Method", render: (row) => row.payment_method || "—" },
                { key: "status", label: "Status", render: (row) => <Badge className={statusColors[row.status || "pending"]}>{row.status}</Badge> },
                { key: "actions", label: "", render: (row) => row.status === "pending" && (
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedReceiptId(row.id); setReceiptAllocationOpen(true); }}>
                    Allocate
                  </Button>
                )},
              ]}
              data={receipts || []}
              onRowClick={() => {}}
            />
          )}
        </TabsContent>

        {/* CREDIT NOTES TAB */}
        <TabsContent value="credit-notes" className="mt-4 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard icon={CreditCard} label="Pending Credits" value={formatCurrency(creditNoteStats?.pendingCredits || 0)} variant="warning" />
            <KPICard icon={CheckCircle} label="Applied (Month)" value={formatCurrency(creditNoteStats?.appliedThisMonth || 0)} variant="success" />
            <KPICard icon={DollarSign} label="Total Value" value={formatCurrency(creditNoteStats?.totalCreditValue || 0)} variant="primary" />
            <KPICard icon={ArrowRightLeft} label="From Returns" value={creditNoteStats?.fromReturns || 0} variant="primary" />
          </div>
          <QuickActions actions={[
            { label: "Issue Credit Note", icon: Plus, onClick: () => setCreditNoteDialogOpen(true) },
          ]} />
          {creditNotesLoading ? (
            <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : (
            <DataTable
              columns={[
                { key: "credit_note_number", label: "Credit Note #" },
                { key: "customers", label: "Customer", render: (row) => row.customers?.company_name },
                { key: "credit_date", label: "Date", render: (row) => format(new Date(row.credit_date), "MMM dd, yyyy") },
                { key: "amount", label: "Total", render: (row) => formatCurrency(row.amount) },
                { key: "amount_applied", label: "Applied", render: (row) => formatCurrency(row.amount_applied || 0) },
                { key: "remaining", label: "Remaining", render: (row) => {
                  const remaining = row.amount - (row.amount_applied || 0);
                  return <span className={remaining > 0 ? "text-amber-600" : "text-green-600"}>{formatCurrency(remaining)}</span>;
                }},
                { key: "reason", label: "Reason", render: (row) => row.reason || "—" },
                { key: "status", label: "Status", render: (row) => <Badge className={statusColors[row.status || "pending"]}>{row.status}</Badge> },
              ]}
              data={creditNotes || []}
              onRowClick={(row) => { setSelectedCreditNoteId(row.id); setCreditNoteDetailsOpen(true); }}
            />
          )}
        </TabsContent>

        {/* ADVANCES TAB */}
        <TabsContent value="advances" className="mt-4 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard icon={DollarSign} label="Total Advances" value={formatCurrency(advanceStats?.totalAdvances || 0)} variant="primary" />
            <KPICard icon={DollarSign} label="Active Balance" value={formatCurrency(advanceStats?.activeAdvances || 0)} variant="success" />
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
                { key: "customers", label: "Customer", render: (row) => row.customers?.company_name },
                { key: "advance_date", label: "Date", render: (row) => format(new Date(row.advance_date), "MMM dd, yyyy") },
                { key: "original_amount", label: "Original", render: (row) => formatCurrency(row.original_amount) },
                { key: "remaining_amount", label: "Remaining", render: (row) => formatCurrency(row.remaining_amount) },
                { key: "status", label: "Status", render: (row) => <Badge className={statusColors[row.status || "active"]}>{row.status}</Badge> },
                { key: "actions", label: "", render: (row) => row.remaining_amount > 0 && (
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedAdvanceId(row.id); setAdvanceAllocationOpen(true); }}>
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
          <ARAgingChart />
        </TabsContent>

        {/* BAD DEBT TAB */}
        <TabsContent value="bad-debt" className="mt-4 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard icon={AlertTriangle} label="Total Provisioned" value={formatCurrency(badDebtStats?.totalProvisioned || 0)} variant="warning" />
            <KPICard icon={AlertTriangle} label="Written Off (YTD)" value={formatCurrency(badDebtStats?.writtenOffYTD || 0)} variant="destructive" />
            <KPICard icon={Clock} label="Pending Approval" value={badDebtStats?.pendingApproval || 0} variant="warning" />
            <KPICard icon={CheckCircle} label="Recovered" value={formatCurrency(badDebtStats?.recovered || 0)} variant="success" />
          </div>
          <QuickActions actions={[
            { label: "Create Provision", icon: Plus, onClick: () => setBadDebtDialogOpen(true) },
          ]} />
          {badDebtsLoading ? (
            <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : (
            <DataTable
              columns={[
                { key: "provision_number", label: "Provision #" },
                { key: "customers", label: "Customer", render: (row) => row.customers?.company_name },
                { key: "provision_date", label: "Date", render: (row) => format(new Date(row.provision_date), "MMM dd, yyyy") },
                { key: "amount", label: "Amount", render: (row) => formatCurrency(row.amount) },
                { key: "provision_type", label: "Type", render: (row) => row.provision_type || "—" },
                { key: "status", label: "Status", render: (row) => <Badge className={statusColors[row.status || "pending"]}>{row.status}</Badge> },
              ]}
              data={badDebts || []}
              onRowClick={() => {}}
            />
          )}
        </TabsContent>

        {/* RECONCILIATION TAB */}
        <TabsContent value="reconciliation" className="mt-4 space-y-6">
          <ReconciliationPanel />
        </TabsContent>
      </ModuleSubTabs>

      {/* Dialogs */}
      <CustomerFormDialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen} customer={null} onClose={() => setCustomerDialogOpen(false)} />
      <CustomerInvoiceFormDialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen} />
      <CustomerInvoiceDetailsPanel invoiceId={selectedInvoiceId} open={invoiceDetailsOpen} onOpenChange={setInvoiceDetailsOpen} />
      <ReceiptFormDialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen} />
      <ReceiptAllocationDialog receiptId={selectedReceiptId} open={receiptAllocationOpen} onOpenChange={setReceiptAllocationOpen} />
      <CreditNoteFormDialog open={creditNoteDialogOpen} onOpenChange={setCreditNoteDialogOpen} />
      <CreditNoteDetailsPanel creditNoteId={selectedCreditNoteId} open={creditNoteDetailsOpen} onOpenChange={setCreditNoteDetailsOpen} />
      <AdvanceFormDialog open={advanceDialogOpen} onOpenChange={setAdvanceDialogOpen} />
      <AdvanceAllocationDialog advanceId={selectedAdvanceId} open={advanceAllocationOpen} onOpenChange={setAdvanceAllocationOpen} />
      <BadDebtFormDialog open={badDebtDialogOpen} onOpenChange={setBadDebtDialogOpen} />
    </>
  );
}
