import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FileText, Receipt, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { useTaxSummary, getDateRange, PeriodType, DateRange } from "@/hooks/useFinancialReports";
import { ReportHeader } from "./shared/ReportHeader";
import { ReportPeriodPicker } from "./shared/ReportPeriodPicker";
import { exportToCSV } from "./shared/ExportButton";
import { formatCurrencyStatic as formatCurrency } from "@/lib/formatters";
import { KPICard } from "../KPICard";

export function TaxReport() {
  const [periodType, setPeriodType] = useState<PeriodType>("quarter");
  const [customRange, setCustomRange] = useState<DateRange>(getDateRange("quarter"));

  const dateRange = periodType === "custom" ? customRange : getDateRange(periodType);
  const { data, isLoading } = useTaxSummary(dateRange);

  const handleExport = () => {
    if (!data) return;
    const exportData = [
      { Item: "Output VAT (Sales)", Amount: data.outputVAT.toFixed(2) },
      { Item: "Input VAT (Purchases)", Amount: (-data.inputVAT).toFixed(2) },
      { Item: "Net VAT Payable/Refundable", Amount: data.netVAT.toFixed(2) },
      { Item: "WHT Certificates Issued", Amount: String(data.whtCertificatesIssued) },
      { Item: "Total WHT Deducted", Amount: data.whtTotalDeducted.toFixed(2) },
    ];
    exportToCSV(exportData, `tax-report-${dateRange.start}-${dateRange.end}`);
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Tax Summary Report"
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Output VAT"
          value={formatCurrency(data?.outputVAT || 0)}
          icon={TrendingUp}
          variant="success"
        />
        <KPICard
          label="Input VAT"
          value={formatCurrency(data?.inputVAT || 0)}
          icon={TrendingDown}
          variant="warning"
        />
        <KPICard
          label="Net VAT"
          value={formatCurrency(Math.abs(data?.netVAT || 0))}
          icon={Receipt}
          variant={(data?.netVAT || 0) >= 0 ? "destructive" : "success"}
        />
        <KPICard
          label="WHT Certificates"
          value={String(data?.whtCertificatesIssued || 0)}
          icon={FileText}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              VAT Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b">
              <div>
                <p className="font-medium">Output VAT (Sales)</p>
                <p className="text-sm text-muted-foreground">VAT collected from customers</p>
              </div>
              <span className="text-xl font-semibold font-mono text-green-600">
                {formatCurrency(data?.outputVAT || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b">
              <div>
                <p className="font-medium">Input VAT (Purchases)</p>
                <p className="text-sm text-muted-foreground">VAT paid to suppliers</p>
              </div>
              <span className="text-xl font-semibold font-mono text-red-600">
                ({formatCurrency(data?.inputVAT || 0)})
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <div>
                <p className="font-semibold">Net VAT</p>
                <Badge variant={data?.isPayable ? "destructive" : "default"}>
                  {data?.isPayable ? "Payable" : "Refundable"}
                </Badge>
              </div>
              <span className={`text-2xl font-bold font-mono ${data?.isPayable ? "text-red-600" : "text-green-600"}`}>
                {formatCurrency(Math.abs(data?.netVAT || 0))}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Withholding Tax (WHT)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b">
              <div>
                <p className="font-medium">Certificates Issued</p>
                <p className="text-sm text-muted-foreground">WHT certificates generated</p>
              </div>
              <span className="text-xl font-semibold">
                {data?.whtCertificatesIssued || 0}
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <div>
                <p className="font-medium">Total WHT Deducted</p>
                <p className="text-sm text-muted-foreground">Amount withheld from payments</p>
              </div>
              <span className="text-xl font-semibold font-mono">
                {formatCurrency(data?.whtTotalDeducted || 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
