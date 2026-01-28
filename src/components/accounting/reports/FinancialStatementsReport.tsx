import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useBalanceSheet, useIncomeStatement, getDateRange, PeriodType, DateRange } from "@/hooks/useFinancialReports";
import { ReportHeader } from "./shared/ReportHeader";
import { ReportPeriodPicker } from "./shared/ReportPeriodPicker";
import { exportToCSV } from "./shared/ExportButton";
import { formatCurrencyStatic as formatCurrency } from "@/lib/formatters";

function BalanceSheetSection({ title, items, total }: { title: string; items: { code: string; name: string; balance: number }[]; total: number }) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-foreground mb-3 border-b pb-2">{title}</h3>
      <div className="space-y-2 pl-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No entries</p>
        ) : (
          items.map((item) => (
            <div key={item.code} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                <span className="font-mono mr-2">{item.code}</span>
                {item.name}
              </span>
              <span className="font-mono">{formatCurrency(item.balance)}</span>
            </div>
          ))
        )}
      </div>
      <div className="flex justify-between font-semibold mt-3 pt-2 border-t pl-4">
        <span>Total {title}</span>
        <span className="font-mono">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}

function IncomeStatementSection({ title, items, total }: { title: string; items: { code: string; name: string; amount: number }[]; total: number }) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-foreground mb-3 border-b pb-2">{title}</h3>
      <div className="space-y-2 pl-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No entries</p>
        ) : (
          items.map((item) => (
            <div key={item.code} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                <span className="font-mono mr-2">{item.code}</span>
                {item.name}
              </span>
              <span className="font-mono">{formatCurrency(item.amount)}</span>
            </div>
          ))
        )}
      </div>
      <div className="flex justify-between font-semibold mt-3 pt-2 border-t pl-4">
        <span>Total {title}</span>
        <span className="font-mono">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}

export function FinancialStatementsReport() {
  const [periodType, setPeriodType] = useState<PeriodType>("year");
  const [customRange, setCustomRange] = useState<DateRange>(getDateRange("year"));
  const [asOfDate, setAsOfDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const dateRange = periodType === "custom" ? customRange : getDateRange(periodType);

  const { data: balanceSheet, isLoading: bsLoading } = useBalanceSheet(asOfDate);
  const { data: incomeStatement, isLoading: isLoading } = useIncomeStatement(dateRange);

  const handleExportBS = () => {
    if (!balanceSheet) return;
    const exportData = [
      ...balanceSheet.assets.items.map((i) => ({ Section: "Assets", Code: i.code, Name: i.name, Amount: i.balance.toFixed(2) })),
      { Section: "Assets", Code: "", Name: "TOTAL ASSETS", Amount: balanceSheet.assets.total.toFixed(2) },
      ...balanceSheet.liabilities.items.map((i) => ({ Section: "Liabilities", Code: i.code, Name: i.name, Amount: i.balance.toFixed(2) })),
      { Section: "Liabilities", Code: "", Name: "TOTAL LIABILITIES", Amount: balanceSheet.liabilities.total.toFixed(2) },
      ...balanceSheet.equity.items.map((i) => ({ Section: "Equity", Code: i.code, Name: i.name, Amount: i.balance.toFixed(2) })),
      { Section: "Equity", Code: "", Name: "TOTAL EQUITY", Amount: balanceSheet.equity.total.toFixed(2) },
    ];
    exportToCSV(exportData, `balance-sheet-${asOfDate}`);
  };

  const handleExportIS = () => {
    if (!incomeStatement) return;
    const exportData = [
      ...incomeStatement.revenue.items.map((i) => ({ Section: "Revenue", Code: i.code, Name: i.name, Amount: i.amount.toFixed(2) })),
      { Section: "Revenue", Code: "", Name: "TOTAL REVENUE", Amount: incomeStatement.revenue.total.toFixed(2) },
      ...incomeStatement.expenses.items.map((i) => ({ Section: "Expenses", Code: i.code, Name: i.name, Amount: i.amount.toFixed(2) })),
      { Section: "Expenses", Code: "", Name: "TOTAL EXPENSES", Amount: incomeStatement.expenses.total.toFixed(2) },
      { Section: "", Code: "", Name: "NET INCOME", Amount: incomeStatement.netIncome.toFixed(2) },
    ];
    exportToCSV(exportData, `income-statement-${dateRange.start}-${dateRange.end}`);
  };

  if (bsLoading || isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ReportHeader title="Financial Statements" subtitle="Balance Sheet and Income Statement" />

      <Tabs defaultValue="balance-sheet" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="income-statement">Income Statement</TabsTrigger>
        </TabsList>

        <TabsContent value="balance-sheet" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <ReportPeriodPicker
              periodType="custom"
              onPeriodTypeChange={() => {}}
              showAsOfDate
              asOfDate={asOfDate}
              onAsOfDateChange={setAsOfDate}
            />
            <button
              onClick={handleExportBS}
              className="text-sm text-primary hover:underline"
            >
              Export CSV
            </button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Balance Sheet</CardTitle>
              <p className="text-sm text-muted-foreground">As of {format(new Date(asOfDate), "MMMM d, yyyy")}</p>
            </CardHeader>
            <CardContent>
              <BalanceSheetSection
                title="ASSETS"
                items={balanceSheet?.assets.items || []}
                total={balanceSheet?.assets.total || 0}
              />
              <BalanceSheetSection
                title="LIABILITIES"
                items={balanceSheet?.liabilities.items || []}
                total={balanceSheet?.liabilities.total || 0}
              />
              <BalanceSheetSection
                title="EQUITY"
                items={balanceSheet?.equity.items || []}
                total={balanceSheet?.equity.total || 0}
              />
              <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t-2">
                <span>Total Liabilities + Equity</span>
                <span className="font-mono">
                  {formatCurrency((balanceSheet?.liabilities.total || 0) + (balanceSheet?.equity.total || 0))}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income-statement" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <ReportPeriodPicker
              periodType={periodType}
              onPeriodTypeChange={setPeriodType}
              customRange={customRange}
              onCustomRangeChange={setCustomRange}
            />
            <button
              onClick={handleExportIS}
              className="text-sm text-primary hover:underline"
            >
              Export CSV
            </button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Income Statement</CardTitle>
              <p className="text-sm text-muted-foreground">
                {format(new Date(dateRange.start), "MMM d, yyyy")} - {format(new Date(dateRange.end), "MMM d, yyyy")}
              </p>
            </CardHeader>
            <CardContent>
              <IncomeStatementSection
                title="REVENUE"
                items={incomeStatement?.revenue.items || []}
                total={incomeStatement?.revenue.total || 0}
              />
              <IncomeStatementSection
                title="EXPENSES"
                items={incomeStatement?.expenses.items || []}
                total={incomeStatement?.expenses.total || 0}
              />
              <div className={`flex justify-between font-bold text-lg mt-4 pt-4 border-t-2 ${(incomeStatement?.netIncome || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <span>NET INCOME</span>
                <span className="font-mono">
                  {formatCurrency(incomeStatement?.netIncome || 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
