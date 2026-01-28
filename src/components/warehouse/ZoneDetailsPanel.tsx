import { Warehouse, Thermometer, Edit, ArrowRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { useZoneAnalytics } from "@/hooks/useZoneAnalytics";
import { StorageZone } from "@/hooks/useStorageZones";
import { cn } from "@/lib/utils";

interface ZoneDetailsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zone: StorageZone | null;
  onEditZone: () => void;
  onViewAllBins: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  available: "hsl(142, 76%, 36%)",
  occupied: "hsl(217, 91%, 60%)",
  reserved: "hsl(48, 96%, 53%)",
  blocked: "hsl(0, 84%, 60%)",
};

const STATUS_BG_CLASSES: Record<string, string> = {
  available: "bg-green-500",
  occupied: "bg-blue-500",
  reserved: "bg-yellow-500",
  blocked: "bg-red-500",
};

export function ZoneDetailsPanel({
  open,
  onOpenChange,
  zone,
  onEditZone,
  onViewAllBins,
}: ZoneDetailsPanelProps) {
  const { binStatusData, inventoryByCategory, binsPreview, isLoading } = useZoneAnalytics(
    zone?.id || null
  );

  const utilization = zone?.max_capacity
    ? Math.min(100, Math.round(((zone.current_utilization || 0) / zone.max_capacity) * 100))
    : 0;

  const totalBins = binStatusData.reduce((sum, item) => sum + item.count, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Zone Details
          </SheetTitle>
          <SheetDescription>Analytics and information for this zone</SheetDescription>
        </SheetHeader>

        {zone && (
          <div className="mt-6 space-y-6">
            {/* Zone Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">{zone.name}</h3>
                <p className="text-sm text-muted-foreground font-mono">{zone.zone_code}</p>
              </div>
              <div className="flex items-center gap-2">
                {zone.temperature_controlled && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Thermometer className="h-3 w-3" />
                    {zone.min_temperature}°C - {zone.max_temperature}°C
                  </Badge>
                )}
                {zone.zone_type && <Badge variant="secondary">{zone.zone_type}</Badge>}
                <Button variant="outline" size="sm" onClick={onEditZone}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Utilization */}
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-muted-foreground">UTILIZATION</span>
                <span className="text-2xl font-bold">{utilization}%</span>
              </div>
              <Progress value={utilization} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {zone.current_utilization || 0} used of {zone.max_capacity || 0} capacity
              </p>
            </div>

            {/* Bin Status Distribution */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">BIN STATUS DISTRIBUTION</h4>
              {isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : totalBins === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No bins in this zone</p>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-32 h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={binStatusData}
                          dataKey="count"
                          nameKey="status"
                          cx="50%"
                          cy="50%"
                          innerRadius={25}
                          outerRadius={50}
                          paddingAngle={2}
                        >
                          {binStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-1">
                    {binStatusData.map((item) => (
                      <div key={item.status} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.fill }}
                          />
                          <span className="capitalize">{item.status}</span>
                        </div>
                        <span className="font-medium">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Inventory by Category */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">INVENTORY BY CATEGORY</h4>
              {isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : inventoryByCategory.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No inventory in this zone
                </p>
              ) : (
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={inventoryByCategory}
                      layout="vertical"
                      margin={{ left: 0, right: 40 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="category"
                        width={100}
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        formatter={(value: number) => [value, "Quantity"]}
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px",
                        }}
                      />
                      <Bar
                        dataKey="quantity"
                        fill="hsl(var(--primary))"
                        radius={[0, 4, 4, 0]}
                        label={{ position: "right", fontSize: 12 }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Bin Grid Preview */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">BIN PREVIEW</h4>
              {isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : binsPreview.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No bins to preview</p>
              ) : (
                <>
                  <div className="grid grid-cols-8 gap-1">
                    {binsPreview.map((bin) => (
                      <div
                        key={bin.id}
                        className={cn(
                          "aspect-square rounded-sm",
                          STATUS_BG_CLASSES[bin.status] || "bg-muted"
                        )}
                        title={bin.bin_code}
                      />
                    ))}
                  </div>
                  <Button variant="ghost" className="w-full" onClick={onViewAllBins}>
                    View All Bins
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
