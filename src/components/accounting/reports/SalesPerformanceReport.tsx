import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useSalesPerformance, getDateRange, PeriodType, DateRange } from "@/hooks/useFinancialReports";
import { ReportHeader } from "./shared/ReportHeader";
import { ReportPeriodPicker } from "./shared/ReportPeriodPicker";
import { exportToCSV } from "./shared/ExportButton";
import { formatCurrencyStatic as formatCurrency } from "@/lib/formatters";
import { KPICard } from "../KPICard";

export function SalesPerformanceReport() {
  const [periodType, setPeriodType] = useState<PeriodType>("year");
  const [customRange, setCustomRange] = useState<DateRange>(getDateRange("year"));

  const dateRange = periodType === "custom" ? customRange : getDateRange(periodType);
  const { data, isLoading } = useSalesPerformance(dateRange);

  const handleExport = () => {
    if (!data?.customerBreakdown) return;
    const exportData = data.customerBreakdown.map((cust) => ({
      Customer: cust.name,
      "Total Sales": cust.total.toFixed(2),
      "Invoice Count": cust.count,
    }));
    exportToCSV(exportData, `sales-performance-${dateRange.start}-${dateRange.end}`);
  };

  const handlePrint = () => window.print();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Sales Performance"
        subtitle={`${format(new Date(dateRange.start), "MMM d, yyyy")} - ${format(new Date(dateRange.end), "MMM d, yyyy")}`}
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          label="Total Sales"
          value={formatCurrency(data?.totalSales || 0)}
          icon={DollarSign}
        />
        <KPICard
          label="Orders"
          value={String(data?.orderCount || 0)}
          icon={ShoppingCart}
        />
        <KPICard
          label="Avg Order Value"
          value={formatCurrency(data?.avgOrderValue || 0)}
          icon={TrendingUp}
        />
        <KPICard
          label="Top Customer"
          value={data?.topCustomer?.name || "N/A"}
          icon={Users}
        />
      </div>

      {data?.trendData && data.trendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sales by Customer</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">#</TableHead>
                <TableHead className="font-semibold">Customer</TableHead>
                <TableHead className="text-right font-semibold">Total Sales</TableHead>
                <TableHead className="text-right font-semibold">Invoices</TableHead>
                <TableHead className="text-right font-semibold">Avg per Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.customerBreakdown.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No sales data found for this period
                  </TableCell>
                </TableRow>
              ) : (
                data?.customerBreakdown.map((customer, index) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-mono text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(customer.total)}</TableCell>
                    <TableCell className="text-right">{customer.count}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(customer.count > 0 ? customer.total / customer.count : 0)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
