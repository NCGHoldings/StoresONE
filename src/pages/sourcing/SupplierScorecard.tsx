import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { ScoreGauge } from "@/components/shared/ScoreGauge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useScorecards, SupplierScorecard as SupplierScorecardType } from "@/hooks/useScorecards";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useState } from "react";
import { TrendingUp, TrendingDown, Minus, BarChart3, Package, DollarSign, Clock } from "lucide-react";
import { useFormatCurrency, useFormatDate } from "@/lib/formatters";

export default function SupplierScorecardPage() {
  const { data: scorecards, isLoading } = useScorecards();
  const { data: suppliers } = useSuppliers();
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const formatCurrency = useFormatCurrency();
  const formatDate = useFormatDate();

  const selectedSupplier = suppliers?.find((s) => s.id === selectedSupplierId);
  const supplierScorecards = scorecards?.filter((s) => s.supplier_id === selectedSupplierId) ?? [];
  const latestScorecard = supplierScorecards[0];

  const getTrendIcon = (trend: string | null) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="h-5 w-5 text-success" />;
      case "declining":
        return <TrendingDown className="h-5 w-5 text-destructive" />;
      default:
        return <Minus className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <MainLayout>
      <PageHeader
        title="Supplier Scorecard"
        subtitle="View supplier performance metrics and trends"
      />

      {/* Supplier Selector */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a supplier to view scorecard" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.filter(s => s.status === "active").map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.company_name} ({supplier.supplier_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedSupplier && (
              <div className="flex items-center gap-4">
                <StatusBadge status={selectedSupplier.status} />
                <span className="text-sm text-muted-foreground">
                  Category: {selectedSupplier.category ?? "N/A"}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* No Selection State */}
      {!selectedSupplierId && (
        <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg border-2 border-dashed">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Select a supplier to view their scorecard</p>
          </div>
        </div>
      )}

      {/* Scorecard Content */}
      {selectedSupplierId && latestScorecard && (
        <div className="space-y-6">
          {/* Period Info */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                {formatDate(latestScorecard.period_start)} -{" "}
                {formatDate(latestScorecard.period_end)}
              </h3>
              <p className="text-sm text-muted-foreground">Latest scorecard period</p>
            </div>
            <div className="flex items-center gap-2">
              {getTrendIcon(latestScorecard.trend)}
              <span className="text-sm font-medium capitalize">{latestScorecard.trend ?? "stable"}</span>
            </div>
          </div>

          {/* KPI Gauges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6 flex flex-col items-center">
                <ScoreGauge
                  score={latestScorecard.on_time_delivery_rate ?? 0}
                  label="On-Time Delivery"
                  size="md"
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex flex-col items-center">
                <ScoreGauge
                  score={100 - (latestScorecard.defect_rate ?? 0)}
                  label="Quality Rate"
                  size="md"
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex flex-col items-center">
                <ScoreGauge
                  score={latestScorecard.compliance_score ?? 0}
                  label="Compliance"
                  size="md"
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex flex-col items-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {latestScorecard.response_time_avg?.toFixed(1) ?? "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">Avg Response (hrs)</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{latestScorecard.total_orders ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(latestScorecard.total_value ?? 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Ranking</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">#{latestScorecard.ranking ?? "N/A"}</div>
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {latestScorecard.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{latestScorecard.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* No Scorecard State */}
      {selectedSupplierId && !latestScorecard && !isLoading && (
        <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg border-2 border-dashed">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No scorecard data available for this supplier</p>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
