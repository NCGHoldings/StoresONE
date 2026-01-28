import { useState } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { ModuleSubTabs } from "../ModuleSubTabs";
import { KPICard } from "../KPICard";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building2, 
  CreditCard, 
  ArrowLeftRight, 
  FileText,
  Plus,
  Calendar,
  ArrowUpDown,
  CheckCircle,
  Clock,
  Layers,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ShoppingCart,
  Receipt,
  DollarSign,
} from "lucide-react";
import { useFormatCurrency, useFormatDate } from "@/lib/formatters";
import { useBankAccounts, useBankAccountStats, BankAccount } from "@/hooks/useBankAccounts";
import { useBankTransactions, useBankTransactionStats, BankTransaction } from "@/hooks/useBankTransactions";
import { useCheques, useChequeStats, Cheque } from "@/hooks/useCheques";
import { useFundTransfers, useFundTransferStats, FundTransfer } from "@/hooks/useFundTransfers";
import { usePaymentBatches, usePaymentBatchStats, PaymentBatch } from "@/hooks/usePaymentBatches";
import { usePOSSales, usePOSSalesStats, POSSale } from "@/hooks/usePOSSales";
import { BankAccountFormDialog } from "./BankAccountFormDialog";
import { TransactionFormDialog } from "./TransactionFormDialog";
import { ChequeFormDialog } from "./ChequeFormDialog";
import { FundTransferFormDialog } from "./FundTransferFormDialog";
import { PaymentBatchFormDialog } from "./PaymentBatchFormDialog";
import { BankReconciliationPanel } from "./BankReconciliationPanel";
import { POSSaleDetailsPanel } from "@/components/admin/POSSaleDetailsPanel";

const subTabs = [
  { id: "accounts", label: "Bank Accounts" },
  { id: "transactions", label: "Transactions" },
  { id: "cashbook", label: "Cashbook" },
  { id: "cheques", label: "Cheque Register" },
  { id: "reconciliation", label: "Bank Reconciliation" },
  { id: "transfers", label: "Fund Transfers" },
  { id: "batches", label: "Payment Batches" },
  { id: "pos", label: "POS Sales" },
];

interface BankingModuleProps {
  activeSubTab: string;
  onSubTabChange: (tab: string) => void;
}

export default function BankingModule({ activeSubTab, onSubTabChange }: BankingModuleProps) {
  const formatCurrency = useFormatCurrency();
  const formatDate = useFormatDate();

  // Dialog states
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [chequeDialogOpen, setChequeDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [selectedPosSaleId, setSelectedPosSaleId] = useState<string | null>(null);
  const [posSaleDetailsOpen, setPosSaleDetailsOpen] = useState(false);

  // Data hooks
  const { data: accounts } = useBankAccounts();
  const { data: accountStats } = useBankAccountStats();
  const { data: transactions } = useBankTransactions();
  const { data: transactionStats } = useBankTransactionStats();
  const { data: cheques } = useCheques();
  const { data: chequeStats } = useChequeStats();
  const { data: transfers } = useFundTransfers();
  const { data: transferStats } = useFundTransferStats();
  const { data: batches } = usePaymentBatches();
  const { data: batchStats } = usePaymentBatchStats();
  const { data: posSales } = usePOSSales();
  const { data: posStats } = usePOSSalesStats();

  // Table columns
  const accountColumns = [
    { key: "account_number", label: "Account #" },
    { key: "account_name", label: "Account Name" },
    { key: "bank_name", label: "Bank" },
    { key: "account_type", label: "Type", render: (item: BankAccount) => item.account_type || "—" },
    { key: "current_balance", label: "Balance", render: (item: BankAccount) => formatCurrency(item.current_balance) },
    { key: "currency", label: "Currency" },
    { key: "is_active", label: "Status", render: (item: BankAccount) => (
      <StatusBadge status={item.is_active ? "active" : "inactive"} />
    )},
  ];

  const transactionColumns = [
    { key: "transaction_date", label: "Date", render: (item: BankTransaction) => formatDate(item.transaction_date) },
    { key: "transaction_number", label: "Transaction #" },
    { key: "bank_accounts", label: "Account", render: (item: BankTransaction) => 
      item.bank_accounts?.account_name || "—" 
    },
    { key: "transaction_type", label: "Type", render: (item: BankTransaction) => (
      <StatusBadge status={item.transaction_type || "unknown"} />
    )},
    { key: "description", label: "Description", render: (item: BankTransaction) => item.description || "—" },
    { key: "amount", label: "Amount", render: (item: BankTransaction) => {
      const isDebit = ["withdrawal", "transfer_out", "fee", "cheque_issued"].includes(item.transaction_type || "");
      return (
        <span className={isDebit ? "text-destructive" : "text-primary"}>
          {isDebit ? "-" : "+"}{formatCurrency(item.amount)}
        </span>
      );
    }},
    { key: "is_reconciled", label: "Reconciled", render: (item: BankTransaction) => (
      item.is_reconciled ? <CheckCircle className="h-4 w-4 text-primary" /> : <Clock className="h-4 w-4 text-muted-foreground" />
    )},
  ];

  const chequeColumns = [
    { key: "cheque_number", label: "Cheque #" },
    { key: "bank_accounts", label: "Account", render: (item: Cheque) => item.bank_accounts?.account_name || "—" },
    { key: "cheque_type", label: "Type", render: (item: Cheque) => (
      <StatusBadge status={item.cheque_type || "unknown"} />
    )},
    { key: "cheque_date", label: "Date", render: (item: Cheque) => formatDate(item.cheque_date) },
    { key: "payee_payer", label: "Payee/Payer" },
    { key: "amount", label: "Amount", render: (item: Cheque) => formatCurrency(item.amount) },
    { key: "status", label: "Status", render: (item: Cheque) => <StatusBadge status={item.status || "pending"} /> },
    { key: "is_post_dated", label: "Post-Dated", render: (item: Cheque) => item.is_post_dated ? "Yes" : "No" },
  ];

  const transferColumns = [
    { key: "transfer_number", label: "Transfer #" },
    { key: "from_account", label: "From", render: (item: FundTransfer) => item.from_account?.account_name || "—" },
    { key: "to_account", label: "To", render: (item: FundTransfer) => item.to_account?.account_name || "—" },
    { key: "transfer_date", label: "Date", render: (item: FundTransfer) => formatDate(item.transfer_date) },
    { key: "amount", label: "Amount", render: (item: FundTransfer) => formatCurrency(item.amount) },
    { key: "status", label: "Status", render: (item: FundTransfer) => <StatusBadge status={item.status || "pending"} /> },
  ];

  const batchColumns = [
    { key: "batch_number", label: "Batch #" },
    { key: "bank_accounts", label: "Account", render: (item: PaymentBatch) => item.bank_accounts?.account_name || "—" },
    { key: "batch_date", label: "Date", render: (item: PaymentBatch) => formatDate(item.batch_date) },
    { key: "batch_type", label: "Type", render: (item: PaymentBatch) => <StatusBadge status={item.batch_type || "other"} /> },
    { key: "payment_count", label: "Count" },
    { key: "total_amount", label: "Total", render: (item: PaymentBatch) => formatCurrency(item.total_amount) },
    { key: "status", label: "Status", render: (item: PaymentBatch) => <StatusBadge status={item.status || "draft"} /> },
  ];

  const cashbookColumns = [
    { key: "transaction_date", label: "Date", render: (item: BankTransaction) => formatDate(item.transaction_date) },
    { key: "transaction_number", label: "Reference" },
    { key: "description", label: "Description", render: (item: BankTransaction) => item.description || "—" },
    { key: "payee_payer", label: "Payee/Payer", render: (item: BankTransaction) => item.payee_payer || "—" },
    { key: "debit", label: "Receipts", render: (item: BankTransaction) => {
      const isReceipt = ["deposit", "transfer_in", "interest", "cheque_received"].includes(item.transaction_type || "");
      return isReceipt ? formatCurrency(item.amount) : "—";
    }},
    { key: "credit", label: "Payments", render: (item: BankTransaction) => {
      const isPayment = ["withdrawal", "transfer_out", "fee", "cheque_issued"].includes(item.transaction_type || "");
      return isPayment ? formatCurrency(item.amount) : "—";
    }},
  ];

  // Filter transactions for cashbook (cash/petty cash accounts)
  const cashbookTransactions = transactions?.filter(t => {
    const account = accounts?.find(a => a.id === t.bank_account_id);
    return account?.account_type === "petty_cash";
  }) || [];

  // Calculate cashbook summaries
  const cashbookSummary = {
    openingBalance: 0,
    totalReceipts: cashbookTransactions
      .filter(t => ["deposit", "transfer_in", "interest", "cheque_received"].includes(t.transaction_type || ""))
      .reduce((sum, t) => sum + t.amount, 0),
    totalPayments: cashbookTransactions
      .filter(t => ["withdrawal", "transfer_out", "fee", "cheque_issued"].includes(t.transaction_type || ""))
      .reduce((sum, t) => sum + t.amount, 0),
    closingBalance: 0,
  };
  cashbookSummary.closingBalance = cashbookSummary.openingBalance + cashbookSummary.totalReceipts - cashbookSummary.totalPayments;

  return (
    <ModuleSubTabs tabs={subTabs} activeTab={activeSubTab || "accounts"} onTabChange={onSubTabChange}>
      {/* Bank Accounts Tab */}
      <TabsContent value="accounts" className="mt-4 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            icon={Building2}
            label="Bank Accounts"
            value={accountStats?.activeAccounts ?? 0}
            subtitle="Active accounts"
            variant="primary"
          />
          <KPICard
            icon={CreditCard}
            label="Total Balance"
            value={formatCurrency(accountStats?.totalBalance ?? 0)}
            variant="success"
          />
          <KPICard
            icon={ArrowLeftRight}
            label="Pending Transfers"
            value={accountStats?.pendingTransfers ?? 0}
            variant="warning"
          />
          <KPICard
            icon={FileText}
            label="Unreconciled"
            value={accountStats?.unreconciledItems ?? 0}
            variant="default"
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={() => { setEditingAccount(null); setAccountDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Bank Account
          </Button>
        </div>

        <DataTable
          data={accounts || []}
          columns={accountColumns}
          onRowClick={(account) => { setEditingAccount(account); setAccountDialogOpen(true); }}
        />
      </TabsContent>

      {/* Transactions Tab */}
      <TabsContent value="transactions" className="mt-4 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            icon={Calendar}
            label="Transactions Today"
            value={transactionStats?.transactionsToday ?? 0}
            variant="primary"
          />
          <KPICard
            icon={TrendingUp}
            label="Deposits This Month"
            value={formatCurrency(transactionStats?.depositsThisMonth ?? 0)}
            variant="success"
          />
          <KPICard
            icon={TrendingDown}
            label="Withdrawals This Month"
            value={formatCurrency(transactionStats?.withdrawalsThisMonth ?? 0)}
            variant="warning"
          />
          <KPICard
            icon={ArrowUpDown}
            label="Net Movement"
            value={formatCurrency(transactionStats?.netMovement ?? 0)}
            variant="default"
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={() => setTransactionDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Record Transaction
          </Button>
        </div>

        <DataTable
          data={transactions || []}
          columns={transactionColumns}
        />
      </TabsContent>

      {/* Cashbook Tab */}
      <TabsContent value="cashbook" className="mt-4 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            icon={CreditCard}
            label="Opening Balance"
            value={formatCurrency(cashbookSummary.openingBalance)}
            variant="default"
          />
          <KPICard
            icon={TrendingUp}
            label="Total Receipts"
            value={formatCurrency(cashbookSummary.totalReceipts)}
            variant="success"
          />
          <KPICard
            icon={TrendingDown}
            label="Total Payments"
            value={formatCurrency(cashbookSummary.totalPayments)}
            variant="warning"
          />
          <KPICard
            icon={CreditCard}
            label="Closing Balance"
            value={formatCurrency(cashbookSummary.closingBalance)}
            variant="primary"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cashbook Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={cashbookTransactions}
              columns={cashbookColumns}
            />
          </CardContent>
        </Card>
      </TabsContent>

      {/* Cheque Register Tab */}
      <TabsContent value="cheques" className="mt-4 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            icon={FileText}
            label="Pending Cheques"
            value={chequeStats?.pendingCheques ?? 0}
            variant="warning"
          />
          <KPICard
            icon={CheckCircle}
            label="Cleared This Month"
            value={chequeStats?.clearedThisMonth ?? 0}
            variant="success"
          />
          <KPICard
            icon={Clock}
            label="Post-Dated Active"
            value={chequeStats?.postDatedActive ?? 0}
            variant="primary"
          />
          <KPICard
            icon={AlertCircle}
            label="Bounced"
            value={chequeStats?.bounced ?? 0}
            variant="destructive"
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={() => setChequeDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Cheque
          </Button>
        </div>

        <DataTable
          data={cheques || []}
          columns={chequeColumns}
        />
      </TabsContent>

      {/* Bank Reconciliation Tab */}
      <TabsContent value="reconciliation" className="mt-4">
        <BankReconciliationPanel />
      </TabsContent>

      {/* Fund Transfers Tab */}
      <TabsContent value="transfers" className="mt-4 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            icon={Clock}
            label="Pending Transfers"
            value={transferStats?.pendingTransfers ?? 0}
            variant="warning"
          />
          <KPICard
            icon={CheckCircle}
            label="Completed This Month"
            value={transferStats?.completedThisMonth ?? 0}
            variant="success"
          />
          <KPICard
            icon={CreditCard}
            label="Total Transferred"
            value={formatCurrency(transferStats?.totalTransferred ?? 0)}
            variant="primary"
          />
          <KPICard
            icon={AlertCircle}
            label="Awaiting Approval"
            value={transferStats?.awaitingApproval ?? 0}
            variant="default"
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={() => setTransferDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Transfer
          </Button>
        </div>

        <DataTable
          data={transfers || []}
          columns={transferColumns}
        />
      </TabsContent>

      {/* Payment Batches Tab */}
      <TabsContent value="batches" className="mt-4 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            icon={FileText}
            label="Draft Batches"
            value={batchStats?.draftBatches ?? 0}
            variant="default"
          />
          <KPICard
            icon={Clock}
            label="Pending Approval"
            value={batchStats?.pendingApproval ?? 0}
            variant="warning"
          />
          <KPICard
            icon={Layers}
            label="Processed This Month"
            value={batchStats?.processedThisMonth ?? 0}
            variant="success"
          />
          <KPICard
            icon={CreditCard}
            label="Total Batch Value"
            value={formatCurrency(batchStats?.totalBatchValue ?? 0)}
            variant="primary"
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={() => setBatchDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Batch
          </Button>
        </div>

        <DataTable
          data={batches || []}
          columns={batchColumns}
        />
      </TabsContent>

      {/* POS Sales Tab */}
      <TabsContent value="pos" className="mt-4 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            icon={ShoppingCart}
            label="Sales Today"
            value={posStats?.salesToday ?? 0}
            variant="primary"
          />
          <KPICard
            icon={DollarSign}
            label="Total Revenue"
            value={formatCurrency(posStats?.totalRevenue ?? 0)}
            variant="success"
          />
          <KPICard
            icon={AlertCircle}
            label="Failed Transactions"
            value={posStats?.failedTransactions ?? 0}
            variant="destructive"
          />
          <KPICard
            icon={Receipt}
            label="Avg Sale Value"
            value={formatCurrency(posStats?.avgSaleValue ?? 0)}
            variant="default"
          />
        </div>

        <DataTable
          data={posSales || []}
          columns={[
            { key: "transaction_datetime", label: "Date/Time", render: (item: POSSale) => formatDate(item.transaction_datetime) },
            { key: "pos_terminal_id", label: "Terminal" },
            { key: "pos_transaction_id", label: "Transaction ID", render: (item: POSSale) => (
              <span className="font-mono text-xs">{item.pos_transaction_id.substring(0, 16)}...</span>
            )},
            { key: "customers", label: "Customer", render: (item: POSSale) => 
              item.customers?.company_name || "Walk-in" 
            },
            { key: "total_amount", label: "Total", render: (item: POSSale) => formatCurrency(item.total_amount) },
            { key: "amount_paid", label: "Paid", render: (item: POSSale) => formatCurrency(item.amount_paid) },
            { key: "status", label: "Status", render: (item: POSSale) => <StatusBadge status={item.status || "pending"} /> },
          ]}
          onRowClick={(sale) => {
            setSelectedPosSaleId(sale.id);
            setPosSaleDetailsOpen(true);
          }}
        />
      </TabsContent>

      {/* Dialogs */}
      <BankAccountFormDialog
        open={accountDialogOpen}
        onOpenChange={setAccountDialogOpen}
        account={editingAccount}
      />
      <TransactionFormDialog
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
      />
      <ChequeFormDialog
        open={chequeDialogOpen}
        onOpenChange={setChequeDialogOpen}
      />
      <FundTransferFormDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
      />
      <PaymentBatchFormDialog
        open={batchDialogOpen}
        onOpenChange={setBatchDialogOpen}
      />
      <POSSaleDetailsPanel
        saleId={selectedPosSaleId}
        open={posSaleDetailsOpen}
        onOpenChange={setPosSaleDetailsOpen}
      />
    </ModuleSubTabs>
  );
}
