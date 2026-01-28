import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/shared/DataTable";
import { useActiveBankAccounts } from "@/hooks/useBankAccounts";
import {
  useBankReconciliations,
  useOutstandingItems,
  useCreateReconciliation,
  useCompleteReconciliation,
  BankReconciliation,
} from "@/hooks/useBankReconciliation";
import { useReconcileTransaction, BankTransaction } from "@/hooks/useBankTransactions";
import { useFormatCurrency, useFormatDate } from "@/lib/formatters";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";

export function BankReconciliationPanel() {
  const { data: accounts } = useActiveBankAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [statementDate, setStatementDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [statementBalance, setStatementBalance] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const { data: reconciliations } = useBankReconciliations(selectedAccountId);
  const { data: outstandingItems } = useOutstandingItems(selectedAccountId);
  const createReconciliation = useCreateReconciliation();
  const completeReconciliation = useCompleteReconciliation();
  const reconcileTransaction = useReconcileTransaction();
  
  const formatCurrency = useFormatCurrency();
  const formatDate = useFormatDate();

  const selectedAccount = accounts?.find((a) => a.id === selectedAccountId);
  const bookBalance = selectedAccount?.current_balance || 0;
  const parsedStatementBalance = parseFloat(statementBalance) || 0;

  // Calculate adjusted balance
  const selectedOutstanding =
    outstandingItems?.filter((item) => selectedItems.has(item.id)) || [];
  const outstandingDeposits = selectedOutstanding
    .filter((t) =>
      ["deposit", "transfer_in", "interest", "cheque_received"].includes(
        t.transaction_type || ""
      )
    )
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const outstandingPayments = selectedOutstanding
    .filter((t) =>
      ["withdrawal", "transfer_out", "fee", "cheque_issued"].includes(
        t.transaction_type || ""
      )
    )
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const adjustedBookBalance =
    bookBalance - outstandingDeposits + outstandingPayments;
  const difference = parsedStatementBalance - adjustedBookBalance;
  const isReconciled = Math.abs(difference) < 0.01;

  const handleStartReconciliation = async () => {
    await createReconciliation.mutateAsync({
      bank_account_id: selectedAccountId,
      statement_date: statementDate,
      statement_balance: parsedStatementBalance,
      book_balance: bookBalance,
    });
  };

  const handleReconcileSelected = async () => {
    for (const itemId of selectedItems) {
      await reconcileTransaction.mutateAsync(itemId);
    }
    setSelectedItems(new Set());
  };

  const toggleItem = (itemId: string) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(itemId)) {
      newSet.delete(itemId);
    } else {
      newSet.add(itemId);
    }
    setSelectedItems(newSet);
  };

  // Define transaction type for outstanding items (from bank_transactions table)
  type OutstandingItem = NonNullable<typeof outstandingItems>[number];

  const outstandingColumns = [
    {
      key: "select",
      label: "",
      render: (item: OutstandingItem) => (
        <Checkbox
          checked={selectedItems.has(item.id)}
          onCheckedChange={() => toggleItem(item.id)}
        />
      ),
    },
    { key: "transaction_number", label: "Txn #" },
    {
      key: "transaction_date",
      label: "Date",
      render: (item: OutstandingItem) =>
        formatDate(item.transaction_date),
    },
    {
      key: "transaction_type",
      label: "Type",
      render: (item: OutstandingItem) => (
        <Badge variant="outline">{item.transaction_type}</Badge>
      ),
    },
    { key: "description", label: "Description" },
    {
      key: "amount",
      label: "Amount",
      render: (item: OutstandingItem) => formatCurrency(item.amount),
    },
  ];

  const historyColumns = [
    {
      key: "statement_date",
      label: "Statement Date",
      render: (item: BankReconciliation) =>
        formatDate(item.statement_date),
    },
    {
      key: "statement_balance",
      label: "Statement Balance",
      render: (item: BankReconciliation) =>
        formatCurrency(item.statement_balance),
    },
    {
      key: "book_balance",
      label: "Book Balance",
      render: (item: BankReconciliation) =>
        formatCurrency(item.book_balance),
    },
    {
      key: "difference",
      label: "Difference",
      render: (item: BankReconciliation) =>
        item.difference !== null ? formatCurrency(item.difference) : "-",
    },
    {
      key: "status",
      label: "Status",
      render: (item: BankReconciliation) => (
        <Badge
          variant={
            item.status === "completed"
              ? "default"
              : item.status === "approved"
              ? "secondary"
              : "outline"
          }
        >
          {item.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Account Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Bank Reconciliation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Bank Account</Label>
              <Select
                value={selectedAccountId}
                onValueChange={setSelectedAccountId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Statement Date</Label>
              <Input
                type="date"
                value={statementDate}
                onChange={(e) => setStatementDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Statement Balance</Label>
              <Input
                type="number"
                step="0.01"
                value={statementBalance}
                onChange={(e) => setStatementBalance(e.target.value)}
                placeholder="Enter bank statement balance"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedAccountId && (
        <>
          {/* Reconciliation Summary */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Book Balance</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(bookBalance)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">
                  Statement Balance
                </div>
                <div className="text-2xl font-bold">
                  {formatCurrency(parsedStatementBalance)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">
                  Adjusted Book Balance
                </div>
                <div className="text-2xl font-bold">
                  {formatCurrency(adjustedBookBalance)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  Difference
                  {isReconciled ? (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                </div>
                <div
                  className={`text-2xl font-bold ${
                    isReconciled
                      ? "text-primary"
                      : "text-destructive"
                  }`}
                >
                  {formatCurrency(Math.abs(difference))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Outstanding Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Outstanding Items ({outstandingItems?.length || 0})
              </CardTitle>
              {selectedItems.size > 0 && (
                <Button
                  size="sm"
                  onClick={handleReconcileSelected}
                  disabled={reconcileTransaction.isPending}
                >
                  Reconcile Selected ({selectedItems.size})
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <DataTable
                columns={outstandingColumns}
                data={outstandingItems || []}
                searchKeys={["description" as keyof OutstandingItem]}
              />
            </CardContent>
          </Card>

          {/* Reconciliation History */}
          {reconciliations && reconciliations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Reconciliation History</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={historyColumns}
                  data={reconciliations}
                  searchKeys={["statement_date" as keyof BankReconciliation]}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
