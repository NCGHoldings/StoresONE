import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { FileText, Download, AlertTriangle, CheckCircle, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useAPReconciliation } from "@/hooks/useAPReconciliation";
import { useFormatCurrency } from "@/lib/formatters";

const typeStyles: Record<string, string> = {
  invoice: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  payment: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  debit_note: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  advance: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

const typeLabels: Record<string, string> = {
  invoice: "Invoice",
  payment: "Payment",
  debit_note: "Debit Note",
  advance: "Advance",
};

export default function APReconciliationPanel() {
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [startDate, setStartDate] = useState(format(startOfMonth(subMonths(new Date(), 1)), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));

  const { data: suppliers, isLoading: suppliersLoading } = useSuppliers();
  const { data: reconciliation, isLoading: reconciliationLoading } = useAPReconciliation(
    selectedVendorId || null,
    startDate,
    endDate
  );
  const formatCurrency = useFormatCurrency();

  const activeSuppliers = suppliers?.filter((s) => s.status === "active") || [];

  const handleExportCSV = () => {
    if (!reconciliation) return;

    const headers = ["Date", "Type", "Reference", "Description", "Debit", "Credit", "Balance"];
    const rows = reconciliation.transactions.map((t) => [
      format(new Date(t.date), "yyyy-MM-dd"),
      typeLabels[t.type],
      t.reference,
      t.description,
      t.debit.toFixed(2),
      t.credit.toFixed(2),
      t.running_balance.toFixed(2),
    ]);

    // Add opening and closing balance rows
    const openingRow = [startDate, "Opening Balance", "", "", "", "", reconciliation.opening_balance.toFixed(2)];
    const closingRow = [endDate, "Closing Balance", "", "", "", "", reconciliation.closing_balance.toFixed(2)];

    const csvContent = [
      headers.join(","),
      openingRow.join(","),
      ...rows.map((r) => r.join(",")),
      closingRow.join(","),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AP-Reconciliation-${reconciliation.supplier.supplier_code}-${startDate}-to-${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const setQuickPeriod = (months: number) => {
    const end = new Date();
    const start = subMonths(end, months);
    setStartDate(format(startOfMonth(start), "yyyy-MM-dd"));
    setEndDate(format(endOfMonth(end), "yyyy-MM-dd"));
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            AP Reconciliation
          </CardTitle>
          <CardDescription>
            Reconcile vendor accounts and verify transaction history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Vendor</Label>
              {suppliersLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor..." />
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

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Quick Period</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setQuickPeriod(1)}>
                  1M
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQuickPeriod(3)}>
                  3M
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQuickPeriod(6)}>
                  6M
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQuickPeriod(12)}>
                  1Y
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reconciliation Results */}
      {selectedVendorId && (
        <>
          {reconciliationLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-40 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : reconciliation ? (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Opening Balance</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(reconciliation.opening_balance)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      As of {format(new Date(startDate), "MMM dd, yyyy")}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Total Invoices</div>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(reconciliation.total_debits)}
                    </div>
                    <div className="text-xs text-muted-foreground">Debits</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Total Payments</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(reconciliation.total_credits)}
                    </div>
                    <div className="text-xs text-muted-foreground">Credits</div>
                  </CardContent>
                </Card>

                <Card className="border-primary">
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Closing Balance</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(reconciliation.closing_balance)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      As of {format(new Date(endDate), "MMM dd, yyyy")}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Discrepancy Alert */}
              {reconciliation.discrepancy !== 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Discrepancy Detected</AlertTitle>
                  <AlertDescription>
                    There is a discrepancy of {formatCurrency(Math.abs(reconciliation.discrepancy))} in the
                    account reconciliation. Please review the transactions.
                  </AlertDescription>
                </Alert>
              )}

              {reconciliation.discrepancy === 0 && reconciliation.transactions.length > 0 && (
                <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800 dark:text-green-400">Balanced</AlertTitle>
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    Account reconciliation is balanced with no discrepancies.
                  </AlertDescription>
                </Alert>
              )}

              {/* Transaction History */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Transaction History</CardTitle>
                    <CardDescription>
                      {reconciliation.supplier.company_name} • {reconciliation.transactions.length} transactions
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Opening Balance Row */}
                      <TableRow className="bg-muted/50">
                        <TableCell>{format(new Date(startDate), "MMM dd, yyyy")}</TableCell>
                        <TableCell colSpan={3} className="font-medium">
                          Opening Balance
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(reconciliation.opening_balance)}
                        </TableCell>
                      </TableRow>

                      {reconciliation.transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No transactions found for this period
                          </TableCell>
                        </TableRow>
                      ) : (
                        reconciliation.transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              {format(new Date(transaction.date), "MMM dd, yyyy")}
                            </TableCell>
                            <TableCell>
                              <Badge className={typeStyles[transaction.type]}>
                                {typeLabels[transaction.type]}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {transaction.reference}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {transaction.description}
                            </TableCell>
                            <TableCell className="text-right text-red-600">
                              {transaction.debit > 0 ? formatCurrency(transaction.debit) : "—"}
                            </TableCell>
                            <TableCell className="text-right text-green-600">
                              {transaction.credit > 0 ? formatCurrency(transaction.credit) : "—"}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(transaction.running_balance)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}

                      {/* Closing Balance Row */}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell>{format(new Date(endDate), "MMM dd, yyyy")}</TableCell>
                        <TableCell colSpan={3}>Closing Balance</TableCell>
                        <TableCell className="text-right text-red-600">
                          {formatCurrency(reconciliation.total_debits)}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatCurrency(reconciliation.total_credits)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(reconciliation.closing_balance)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="py-8 text-center text-muted-foreground">
                  Select a vendor and date range to view reconciliation
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
