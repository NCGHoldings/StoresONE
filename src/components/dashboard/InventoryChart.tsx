import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useInventoryChartData } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

export function InventoryChart() {
  const { data: chartData, isLoading } = useInventoryChartData();

  // Use real data or empty array
  const data = chartData || [];

  // Check if we have any actual data
  const hasData = data.some(d => d.inbound > 0 || d.outbound > 0);

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">
          Inventory Movement
        </h2>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Inbound</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent" />
            <span className="text-muted-foreground">Outbound</span>
          </div>
        </div>
      </div>
      <div className="h-[300px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Skeleton className="w-full h-full rounded-lg" />
          </div>
        ) : !hasData ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <p className="text-lg font-medium">No transaction data yet</p>
              <p className="text-sm">Inventory movements will appear here</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(217, 91%, 35%)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(217, 91%, 35%)"
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(199, 89%, 48%)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(199, 89%, 48%)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
              <XAxis
                dataKey="month"
                stroke="hsl(220, 15%, 45%)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(220, 15%, 45%)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => {
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                  return String(value);
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(214, 32%, 91%)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(value: number, name: string) => [
                  value.toLocaleString(),
                  name === 'inbound' ? 'Inbound' : 'Outbound'
                ]}
              />
              <Area
                type="monotone"
                dataKey="inbound"
                stroke="hsl(217, 91%, 35%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorInbound)"
              />
              <Area
                type="monotone"
                dataKey="outbound"
                stroke="hsl(199, 89%, 48%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorOutbound)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
