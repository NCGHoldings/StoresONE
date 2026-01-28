import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useARAgeing } from "@/hooks/useCustomerInvoices";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFormatCurrency } from "@/lib/formatters";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export function ARAgingChart() {
  const formatCurrency = useFormatCurrency();
  const { data: ageing, isLoading } = useARAgeing();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AR Aging Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    { name: "Current", value: ageing?.current || 0 },
    { name: "1-30 Days", value: ageing?.days30 || 0 },
    { name: "31-60 Days", value: ageing?.days60 || 0 },
    { name: "61-90 Days", value: ageing?.days90 || 0 },
    { name: "90+ Days", value: ageing?.over90 || 0 },
  ];

  const totalReceivables = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>AR Aging Analysis</span>
          <span className="text-lg font-bold">
            Total: {formatCurrency(totalReceivables)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
            <YAxis type="category" dataKey="name" width={80} />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)
              }
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Summary Table */}
        <div className="mt-4 border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left">Aging Bucket</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-right">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((item, index) => (
                <tr key={item.name} className="border-t">
                  <td className="px-3 py-2 flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: COLORS[index] }}
                    />
                    {item.name}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(item.value)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {totalReceivables > 0 ? ((item.value / totalReceivables) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted font-medium">
              <tr>
                <td className="px-3 py-2">Total</td>
                <td className="px-3 py-2 text-right">
                  {formatCurrency(totalReceivables)}
                </td>
                <td className="px-3 py-2 text-right">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
