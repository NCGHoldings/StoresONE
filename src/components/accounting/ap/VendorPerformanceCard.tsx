import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useVendorPerformance, useVendorPerformanceStats } from '@/hooks/useVendorPerformance';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Clock, CheckCircle, DollarSign } from 'lucide-react';
import { KPICard } from '../KPICard';

export default function VendorPerformanceCard() {
  const { data: vendors, isLoading } = useVendorPerformance();
  const { data: stats } = useVendorPerformanceStats();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="Avg Delivery Time"
          value={`${stats?.avgDeliveryTime || 0} days`}
          icon={Clock}
        />
        <KPICard
          label="On-Time Delivery"
          value={`${stats?.avgOnTimeDelivery || 0}%`}
          icon={CheckCircle}
        />
        <KPICard
          label="Avg Quality Score"
          value={`${stats?.avgQualityScore || 0}/5`}
          icon={TrendingUp}
        />
        <KPICard
          label="Avg Price Score"
          value={`${stats?.avgPriceScore || 0}/5`}
          icon={DollarSign}
        />
      </div>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          {!vendors || vendors.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No vendor performance data available. Add supplier evaluations to see metrics.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-center">Avg Delivery (days)</TableHead>
                  <TableHead className="text-center">On-Time %</TableHead>
                  <TableHead className="text-center">Quality</TableHead>
                  <TableHead className="text-center">Price</TableHead>
                  <TableHead className="text-center">Overall</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor) => (
                  <TableRow key={vendor.supplierId}>
                    <TableCell className="font-medium">{vendor.supplierName}</TableCell>
                    <TableCell className="text-center">{vendor.avgDeliveryDays}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center gap-2">
                        <Progress value={vendor.onTimeDeliveryPct} className="h-2 w-16" />
                        <span className="text-sm">{vendor.onTimeDeliveryPct}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Progress value={vendor.qualityScore * 20} className="h-2 w-12" />
                        <span className="text-sm">{vendor.qualityScore}/5</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Progress value={vendor.priceCompetitiveness * 20} className="h-2 w-12" />
                        <span className="text-sm">{vendor.priceCompetitiveness}/5</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-bold ${vendor.overallScore >= 80 ? 'text-green-600' : vendor.overallScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {vendor.overallScore}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
