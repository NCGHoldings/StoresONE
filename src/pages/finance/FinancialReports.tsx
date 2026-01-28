import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileSpreadsheet, PieChart, TrendingUp, Users } from "lucide-react";
import { AgingChart } from "@/components/finance/AgingChart";
import { SpendingChart } from "@/components/finance/SpendingChart";
import { useInvoiceStats, useInvoiceAging } from "@/hooks/useInvoices";
import { useCostCenterStats, useCostCenters } from "@/hooks/useCostCenters";
import { useSuppliers } from "@/hooks/useSuppliers";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useFormatCurrency } from "@/lib/formatters";

export default function FinancialReports() {
  const [reportType, setReportType] = useState("aging");

  const { data: invoiceStats } = useInvoiceStats();
  const { data: aging } = useInvoiceAging();
  const { data: costCenterStats } = useCostCenterStats();
  const { data: costCenters = [] } = useCostCenters();
  const { data: suppliers = [] } = useSuppliers();
  const formatCurrency = useFormatCurrency();

  // Vendor spend data (simulated from suppliers)
  const vendorSpendData = suppliers.slice(0, 5).map((s, i) => ({
    name: s.company_name.length > 15 ? s.company_name.substring(0, 15) + "..." : s.company_name,
    value: Math.floor(Math.random() * 50000) + 10000, // Simulated spend
  }));

  const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Financial Reports</h1>
            <p className="text-muted-foreground">View and export financial analytics</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select report" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aging">AP Aging Report</SelectItem>
                <SelectItem value="spending">Cost Center Spending</SelectItem>
                <SelectItem value="vendor">Vendor Spend Analysis</SelectItem>
                <SelectItem value="summary">Monthly Summary</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Report Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="cursor-pointer transition-colors hover:border-primary" onClick={() => setReportType("aging")}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">AP Aging</p>
                <p className="text-sm text-muted-foreground">Payables by age bucket</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer transition-colors hover:border-primary" onClick={() => setReportType("spending")}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-info/10 p-2">
                <PieChart className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="font-medium">Cost Centers</p>
                <p className="text-sm text-muted-foreground">Budget utilization</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer transition-colors hover:border-primary" onClick={() => setReportType("vendor")}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-warning/10 p-2">
                <Users className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="font-medium">Vendor Spend</p>
                <p className="text-sm text-muted-foreground">Top suppliers by value</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer transition-colors hover:border-primary" onClick={() => setReportType("summary")}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-success/10 p-2">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="font-medium">Summary</p>
                <p className="text-sm text-muted-foreground">Monthly overview</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Content */}
        {reportType === "aging" && <AgingChart />}

        {reportType === "spending" && <SpendingChart />}

        {reportType === "vendor" && (
          <Card>
            <CardHeader>
              <CardTitle>Top Vendors by Spend</CardTitle>
            </CardHeader>
            <CardContent>
              {vendorSpendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={vendorSpendData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                    <YAxis type="category" dataKey="name" width={120} />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), "Spend"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {vendorSpendData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  No vendor data available
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {reportType === "summary" && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Accounts Payable Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-muted-foreground">Total Payables</span>
                  <span className="font-semibold">{formatCurrency(invoiceStats?.totalPayables)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-muted-foreground">Pending Approval</span>
                  <span className="font-semibold">{formatCurrency(invoiceStats?.pendingApproval)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-muted-foreground">Overdue</span>
                  <span className="font-semibold text-destructive">{formatCurrency(invoiceStats?.overdue)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-muted-foreground">Paid This Month</span>
                  <span className="font-semibold text-success">{formatCurrency(invoiceStats?.paidThisMonth)}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Cost Center Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-muted-foreground">Active Cost Centers</span>
                  <span className="font-semibold">{costCenterStats?.activeCount || 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-muted-foreground">Total Budget</span>
                  <span className="font-semibold">{formatCurrency(costCenterStats?.totalBudget)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-muted-foreground">Total Spent</span>
                  <span className="font-semibold">{formatCurrency(costCenterStats?.totalSpent)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-muted-foreground">Remaining Budget</span>
                  <span className="font-semibold text-success">{formatCurrency(costCenterStats?.remaining)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
