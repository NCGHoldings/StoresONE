import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useVarianceReport, getDateRange, PeriodType, DateRange } from "@/hooks/useFinancialReports";
import { ReportHeader } from "./shared/ReportHeader";
import { ReportPeriodPicker } from "./shared/ReportPeriodPicker";
import { exportToCSV } from "./shared/ExportButton";
import { formatCurrencyStatic as formatCurrency } from "@/lib/formatters";

export function VarianceReport() {
  const [periodType, setPeriodType] = useState<PeriodType>("year");
  const [customRange, setCustomRange] = useState<DateRange>(getDateRange("year"));

  const dateRange = periodType === "custom" ? customRange : getDateRange(periodType);
  const { data, isLoading } = useVarianceReport(dateRange);

  const handleExport = () => {
    if (!data?.items) return;
    const exportData = data.items.map((item) => ({
      "Cost Center Code": item.code,
      "Cost Center Name": item.name,
      Budget: item.budget.toFixed(2),
      Actual: item.actual.toFixed(2),
      "Variance ($)": item.variance.toFixed(2),
      "Variance (%)": item.variancePercent.toFixed(1) + "%",
      Status: item.isFavorable ? "Favorable" : "Unfavorable",
    }));
    exportData.push({
      "Cost Center Code": "",
      "Cost Center Name": "TOTALS",
      Budget: data.totals.budget.toFixed(2),
      Actual: data.totals.actual.toFixed(2),
      "Variance ($)": data.totals.variance.toFixed(2),
      "Variance (%)": "",
      Status: "",
    });
    exportToCSV(exportData, `variance-report-${dateRange.start}-${dateRange.end}`);
  };

  const handlePrint = () => window.print();

  const chartData = data?.items.map((item) => ({
    name: item.code,
    Budget: item.budget,
    Actual: item.actual,
  })) || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Variance Report"
        subtitle={`Budget vs Actual - ${format(new Date(dateRange.start), "MMM d, yyyy")} to ${format(new Date(dateRange.end), "MMM d, yyyy")}`}
        onExport={handleExport}
        onPrint={handlePrint}
      >
        <ReportPeriodPicker
          periodType={periodType}
          onPeriodTypeChange={setPeriodType}
          customRange={customRange}
          onCustomRangeChange={setCustomRange}
        />
      </ReportHeader>

      {chartData.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                />
                <Legend />
                <Bar dataKey="Budget" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Actual" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Cost Center</TableHead>
                <TableHead className="text-right font-semibold">Budget</TableHead>
                <TableHead className="text-right font-semibold">Actual</TableHead>
                <TableHead className="text-right font-semibold">Variance</TableHead>
                <TableHead className="text-right font-semibold">%</TableHead>
                <TableHead className="text-center font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No cost centers with budget data found
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {data?.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <span className="font-mono text-sm mr-2">{item.code}</span>
                        {item.name}
                      </TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(item.budget)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(item.actual)}</TableCell>
                      <TableCell className={`text-right font-mono ${item.isFavorable ? "text-green-600" : "text-red-600"}`}>
                        {item.isFavorable ? "" : "-"}{formatCurrency(Math.abs(item.variance))}
                      </TableCell>
                      <TableCell className={`text-right font-mono ${item.isFavorable ? "text-green-600" : "text-red-600"}`}>
                        {item.variancePercent.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={item.isFavorable ? "default" : "destructive"}>
                          {item.isFavorable ? "Favorable" : "Unfavorable"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell>TOTALS</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(data?.totals.budget || 0)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(data?.totals.actual || 0)}</TableCell>
                    <TableCell className={`text-right font-mono ${(data?.totals.variance || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {(data?.totals.variance || 0) >= 0 ? "" : "-"}{formatCurrency(Math.abs(data?.totals.variance || 0))}
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
