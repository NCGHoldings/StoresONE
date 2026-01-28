import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useTrialBalance } from "@/hooks/useFinancialReports";
import { ReportHeader } from "./shared/ReportHeader";
import { ReportPeriodPicker } from "./shared/ReportPeriodPicker";
import { exportToCSV } from "./shared/ExportButton";
import { formatCurrencyStatic as formatCurrency } from "@/lib/formatters";

export function TrialBalanceReport() {
  const [asOfDate, setAsOfDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const { data, isLoading } = useTrialBalance(asOfDate);

  const handleExport = () => {
    if (!data?.accounts) return;
    const exportData = data.accounts.map((acc) => ({
      "Account Code": acc.code,
      "Account Name": acc.name,
      Debit: acc.debit.toFixed(2),
      Credit: acc.credit.toFixed(2),
    }));
    exportData.push({
      "Account Code": "",
      "Account Name": "TOTALS",
      Debit: data.totalDebit.toFixed(2),
      Credit: data.totalCredit.toFixed(2),
    });
    exportToCSV(exportData, `trial-balance-${asOfDate}`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ReportHeader
        title="Trial Balance"
        subtitle={`As of ${format(new Date(asOfDate), "MMMM d, yyyy")}`}
        onExport={handleExport}
        onPrint={handlePrint}
      >
        <ReportPeriodPicker
          periodType="custom"
          onPeriodTypeChange={() => {}}
          showAsOfDate
          asOfDate={asOfDate}
          onAsOfDateChange={setAsOfDate}
        />
      </ReportHeader>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Account Code</TableHead>
                <TableHead className="font-semibold">Account Name</TableHead>
                <TableHead className="text-right font-semibold">Debit</TableHead>
                <TableHead className="text-right font-semibold">Credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No ledger entries found for this period
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {data?.accounts.map((account) => (
                    <TableRow key={account.code}>
                      <TableCell className="font-mono text-sm">{account.code}</TableCell>
                      <TableCell>{account.name}</TableCell>
                      <TableCell className="text-right font-mono">
                        {account.debit > 0 ? formatCurrency(account.debit) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {account.credit > 0 ? formatCurrency(account.credit) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell></TableCell>
                    <TableCell>TOTALS</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(data?.totalDebit || 0)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(data?.totalCredit || 0)}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Badge variant={data?.isBalanced ? "default" : "destructive"}>
          {data?.isBalanced ? "✓ Trial Balance is Balanced" : "✗ Trial Balance Unbalanced"}
        </Badge>
      </div>
    </div>
  );
}
