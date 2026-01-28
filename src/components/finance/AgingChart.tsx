import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useInvoiceAging } from "@/hooks/useInvoices";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFormatCurrency } from "@/lib/formatters";

const COLORS = {
  current: "hsl(var(--chart-1))",
  days30: "hsl(var(--chart-2))",
  days60: "hsl(var(--chart-3))",
  days90: "hsl(var(--chart-4))",
  over90: "hsl(var(--chart-5))",
};

export function AgingChart() {
  const { data: aging, isLoading } = useInvoiceAging();
  const formatCurrency = useFormatCurrency();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Accounts Payable Aging</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    { name: "Current", value: aging?.current || 0, color: COLORS.current },
    { name: "1-30 Days", value: aging?.days30 || 0, color: COLORS.days30 },
    { name: "31-60 Days", value: aging?.days60 || 0, color: COLORS.days60 },
    { name: "61-90 Days", value: aging?.days90 || 0, color: COLORS.days90 },
    { name: "90+ Days", value: aging?.over90 || 0, color: COLORS.over90 },
  ];

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Accounts Payable Aging</span>
          <span className="text-lg font-normal text-muted-foreground">
            Total: {formatCurrency(total)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis 
              type="number" 
              tickFormatter={(value) => formatCurrency(value)}
            />
            <YAxis type="category" dataKey="name" width={80} />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), "Amount"]}
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
