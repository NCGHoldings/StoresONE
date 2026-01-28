import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAPAgeing } from '@/hooks/useAPAgeing';
import { useFormatCurrency } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function APAgingChart() {
  const { data: ageing, isLoading } = useAPAgeing();
  const formatCurrency = useFormatCurrency();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!ageing) return null;

  const chartData = ageing.buckets.map((bucket, index) => ({
    name: bucket.label,
    amount: bucket.amount,
    fill: COLORS[index % COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {ageing.buckets.map((bucket, index) => (
          <Card key={bucket.label}>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">{bucket.label}</div>
              <div className="text-xl font-bold mt-1">{formatCurrency(bucket.amount)}</div>
              <div className="text-xs text-muted-foreground">{bucket.percentage.toFixed(1)}% · {bucket.count} invoices</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>AP Aging Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" tickFormatter={(val) => formatCurrency(val)} />
                <YAxis type="category" dataKey="name" width={80} />
                <Tooltip formatter={(val: number) => formatCurrency(val)} />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* By Vendor Table */}
      <Card>
        <CardHeader>
          <CardTitle>Aging by Vendor</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Current</TableHead>
                <TableHead className="text-right">1-30</TableHead>
                <TableHead className="text-right">31-60</TableHead>
                <TableHead className="text-right">61-90</TableHead>
                <TableHead className="text-right">90+</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ageing.byVendor.slice(0, 10).map((vendor) => (
                <TableRow key={vendor.vendorName}>
                  <TableCell className="font-medium">{vendor.vendorName}</TableCell>
                  <TableCell className="text-right">{formatCurrency(vendor.current)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(vendor.days30)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(vendor.days60)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(vendor.days90)}</TableCell>
                  <TableCell className="text-right text-destructive">{formatCurrency(vendor.over90)}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(vendor.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Total */}
      <div className="text-right">
        <span className="text-muted-foreground">Total Outstanding: </span>
        <span className="text-2xl font-bold">{formatCurrency(ageing.total)}</span>
      </div>
    </div>
  );
}
