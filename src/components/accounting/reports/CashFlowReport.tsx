import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { useCashFlowReport, getDateRange, PeriodType, DateRange } from "@/hooks/useFinancialReports";
import { ReportHeader } from "./shared/ReportHeader";
import { ReportPeriodPicker } from "./shared/ReportPeriodPicker";
import { exportToCSV } from "./shared/ExportButton";
import { formatCurrencyStatic as formatCurrency } from "@/lib/formatters";

function CashFlowSection({
  title,
  inflows,
  outflows,
  net,
  icon,
}: {
  title: string;
  inflows: number;
  outflows: number;
  net: number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-500" /> Cash Inflows
          </span>
          <span className="font-mono text-green-600">{formatCurrency(inflows)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1">
            <TrendingDown className="h-3 w-3 text-red-500" /> Cash Outflows
          </span>
          <span className="font-mono text-red-600">({formatCurrency(outflows)})</span>
        </div>
        <div className="flex justify-between font-semibold pt-2 border-t">
          <span>Net Cash Flow</span>
          <span className={`font-mono ${net >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatCurrency(net)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function CashFlowReport() {
  const [periodType, setPeriodType] = useState<PeriodType>("month");
  const [customRange, setCustomRange] = useState<DateRange>(getDateRange("month"));

  const dateRange = periodType === "custom" ? customRange : getDateRange(periodType);
  const { data, isLoading } = useCashFlowReport(dateRange);

  const handleExport = () => {
    if (!data) return;
    const exportData = [
      { Category: "Operating Activities", Type: "Inflows", Amount: data.operating.inflows.toFixed(2) },
      { Category: "Operating Activities", Type: "Outflows", Amount: (-data.operating.outflows).toFixed(2) },
      { Category: "Operating Activities", Type: "Net", Amount: data.operating.net.toFixed(2) },
      { Category: "Investing Activities", Type: "Inflows", Amount: data.investing.inflows.toFixed(2) },
      { Category: "Investing Activities", Type: "Outflows", Amount: (-data.investing.outflows).toFixed(2) },
      { Category: "Investing Activities", Type: "Net", Amount: data.investing.net.toFixed(2) },
      { Category: "Financing Activities", Type: "Inflows", Amount: data.financing.inflows.toFixed(2) },
      { Category: "Financing Activities", Type: "Outflows", Amount: (-data.financing.outflows).toFixed(2) },
      { Category: "Financing Activities", Type: "Net", Amount: data.financing.net.toFixed(2) },
      { Category: "", Type: "Beginning Cash", Amount: data.beginningCash.toFixed(2) },
      { Category: "", Type: "Net Change in Cash", Amount: data.netChange.toFixed(2) },
      { Category: "", Type: "Ending Cash", Amount: data.endingCash.toFixed(2) },
    ];
    exportToCSV(exportData, `cash-flow-${dateRange.start}-${dateRange.end}`);
  };

  const handlePrint = () => window.print();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Cash Flow Statement"
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CashFlowSection
          title="Operating Activities"
          inflows={data?.operating.inflows || 0}
          outflows={data?.operating.outflows || 0}
          net={data?.operating.net || 0}
          icon={<div className="w-2 h-2 rounded-full bg-blue-500" />}
        />
        <CashFlowSection
          title="Investing Activities"
          inflows={data?.investing.inflows || 0}
          outflows={data?.investing.outflows || 0}
          net={data?.investing.net || 0}
          icon={<div className="w-2 h-2 rounded-full bg-purple-500" />}
        />
        <CashFlowSection
          title="Financing Activities"
          inflows={data?.financing.inflows || 0}
          outflows={data?.financing.outflows || 0}
          net={data?.financing.net || 0}
          icon={<div className="w-2 h-2 rounded-full bg-orange-500" />}
        />
      </div>

      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Beginning Cash</p>
              <p className="text-xl font-semibold font-mono">{formatCurrency(data?.beginningCash || 0)}</p>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-muted-foreground hidden md:block" />
              <div className="text-center px-4 py-2 rounded-lg bg-background border">
                <p className="text-xs text-muted-foreground">Net Change</p>
                <p className={`text-lg font-bold font-mono ${(data?.netChange || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {(data?.netChange || 0) >= 0 ? "+" : ""}{formatCurrency(data?.netChange || 0)}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground hidden md:block" />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Ending Cash</p>
              <p className="text-xl font-semibold font-mono text-primary">{formatCurrency(data?.endingCash || 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
