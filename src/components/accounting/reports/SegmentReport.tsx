import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useSegmentAnalysis, getDateRange, PeriodType, DateRange } from "@/hooks/useFinancialReports";
import { ReportHeader } from "./shared/ReportHeader";
import { ReportPeriodPicker } from "./shared/ReportPeriodPicker";
import { exportToCSV } from "./shared/ExportButton";
import { formatCurrencyStatic as formatCurrency } from "@/lib/formatters";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(221, 83%, 53%)",
  "hsl(262, 83%, 58%)",
  "hsl(330, 81%, 60%)",
  "hsl(24, 94%, 50%)",
  "hsl(142, 71%, 45%)",
  "hsl(47, 96%, 53%)",
  "hsl(199, 89%, 48%)",
];

export function SegmentReport() {
  const [periodType, setPeriodType] = useState<PeriodType>("year");
  const [customRange, setCustomRange] = useState<DateRange>(getDateRange("year"));

  const dateRange = periodType === "custom" ? customRange : getDateRange(periodType);
  const { data, isLoading } = useSegmentAnalysis(dateRange);

  const handleExport = () => {
    if (!data?.segments) return;
    const exportData = data.segments.map((seg) => ({
      Segment: `${seg.code} - ${seg.name}`,
      Revenue: seg.revenue.toFixed(2),
      Expenses: seg.expenses.toFixed(2),
      "Profit/Loss": seg.profit.toFixed(2),
      "Revenue Contribution (%)": seg.revenueContribution.toFixed(1),
    }));
    exportData.push({
      Segment: "TOTALS",
      Revenue: data.totals.revenue.toFixed(2),
      Expenses: data.totals.expenses.toFixed(2),
      "Profit/Loss": data.totals.profit.toFixed(2),
      "Revenue Contribution (%)": "100.0",
    });
    exportToCSV(exportData, `segment-report-${dateRange.start}-${dateRange.end}`);
  };

  const handlePrint = () => window.print();

  const pieData = data?.segments
    .filter((seg) => seg.revenue > 0)
    .map((seg) => ({
      name: seg.code,
      value: seg.revenue,
    })) || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Segment Analysis"
        subtitle={`Financial Performance by Cost Center - ${format(new Date(dateRange.start), "MMM d, yyyy")} to ${format(new Date(dateRange.end), "MMM d, yyyy")}`}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {pieData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue Contribution by Segment</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-muted-foreground">Total Revenue</span>
              <span className="text-xl font-semibold font-mono text-green-600">
                {formatCurrency(data?.totals.revenue || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-muted-foreground">Total Expenses</span>
              <span className="text-xl font-semibold font-mono text-red-600">
                {formatCurrency(data?.totals.expenses || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="font-medium">Net Profit/Loss</span>
              <span className={`text-2xl font-bold font-mono ${(data?.totals.profit || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(data?.totals.profit || 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Segment Details</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Segment</TableHead>
                <TableHead className="text-right font-semibold">Revenue</TableHead>
                <TableHead className="text-right font-semibold">Expenses</TableHead>
                <TableHead className="text-right font-semibold">Profit/Loss</TableHead>
                <TableHead className="text-right font-semibold">Contribution %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.segments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No segment data found for this period
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {data?.segments.map((segment) => (
                    <TableRow key={segment.id}>
                      <TableCell>
                        <span className="font-mono text-sm mr-2">{segment.code}</span>
                        {segment.name}
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-600">
                        {formatCurrency(segment.revenue)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-600">
                        {formatCurrency(segment.expenses)}
                      </TableCell>
                      <TableCell className={`text-right font-mono ${segment.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(segment.profit)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {segment.revenueContribution.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell>TOTALS</TableCell>
                    <TableCell className="text-right font-mono text-green-600">
                      {formatCurrency(data?.totals.revenue || 0)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-red-600">
                      {formatCurrency(data?.totals.expenses || 0)}
                    </TableCell>
                    <TableCell className={`text-right font-mono ${(data?.totals.profit || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(data?.totals.profit || 0)}
                    </TableCell>
                    <TableCell className="text-right font-mono">100.0%</TableCell>
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
