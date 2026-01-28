import { TabsContent } from "@/components/ui/tabs";
import { ModuleSubTabs } from "../ModuleSubTabs";
import { KPICard } from "../KPICard";
import { QuickActions } from "../QuickActions";
import { 
  BarChart3, 
  TrendingUp, 
  FileText, 
  DollarSign,
  Download,
  Printer,
  Calendar,
} from "lucide-react";
import { useCostCenters, useCostCenterStats } from "@/hooks/useCostCenters";
import { useFormatCurrency } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// Import all report components
import { TrialBalanceReport } from "./TrialBalanceReport";
import { FinancialStatementsReport } from "./FinancialStatementsReport";
import { CashFlowReport } from "./CashFlowReport";
import { VarianceReport } from "./VarianceReport";
import { SalesPerformanceReport } from "./SalesPerformanceReport";
import { SegmentReport } from "./SegmentReport";
import { TaxReport } from "./TaxReport";
import { TaxReturnsReport } from "./TaxReturnsReport";
import { AuditLogsReport } from "./AuditLogsReport";

const subTabs = [
  { id: "analytics", label: "Distribution Analytics" },
  { id: "sales-performance", label: "Sales Force Performance" },
  { id: "variance", label: "Variance Reports" },
  { id: "trial-balance", label: "Trial Balance" },
  { id: "financial-statements", label: "Financial Statements" },
  { id: "cash-flow", label: "Cash Flow" },
  { id: "segment", label: "Segment Reports" },
  { id: "tax", label: "Tax Reports" },
  { id: "tax-returns", label: "Tax Returns" },
  { id: "audit", label: "Audit & Logs" },
];

interface ReportsModuleProps {
  activeSubTab: string;
  onSubTabChange: (tab: string) => void;
}

export default function ReportsModule({ activeSubTab, onSubTabChange }: ReportsModuleProps) {
  const { data: costCenters } = useCostCenters();
  const { data: stats } = useCostCenterStats();
  const formatCurrency = useFormatCurrency();

  const quickActions = [
    { label: "Generate Report", icon: FileText, onClick: () => {} },
    { label: "Export PDF", icon: Download, onClick: () => {} },
    { label: "Print", icon: Printer, onClick: () => {} },
    { label: "Schedule Report", icon: Calendar, onClick: () => {} },
  ];

  return (
    <ModuleSubTabs tabs={subTabs} activeTab={activeSubTab || "analytics"} onTabChange={onSubTabChange}>
      <TabsContent value="analytics" className="mt-4 space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            icon={BarChart3}
            label="Cost Centers"
            value={stats?.activeCount || 0}
            variant="primary"
          />
          <KPICard
            icon={DollarSign}
            label="Total Budget"
            value={formatCurrency(stats?.totalBudget || 0)}
            variant="success"
          />
          <KPICard
            icon={TrendingUp}
            label="Total Spent"
            value={formatCurrency(stats?.totalSpent || 0)}
            variant="warning"
          />
          <KPICard
            icon={FileText}
            label="Remaining"
            value={formatCurrency(stats?.remaining || 0)}
            variant="default"
          />
        </div>

        <QuickActions actions={quickActions} />

        {/* Budget vs Actual */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Budget vs Actual by Cost Center</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {costCenters?.slice(0, 6).map((cc) => {
                const budget = cc.budget || 0;
                const spent = cc.spent || 0;
                const percentage = budget > 0 ? (spent / budget) * 100 : 0;
                return (
                  <div key={cc.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{cc.code} - {cc.name}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(spent)} / {formatCurrency(budget)}
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(percentage, 100)} 
                      className={percentage > 100 ? "bg-destructive/20" : ""} 
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="sales-performance" className="mt-4">
        <SalesPerformanceReport />
      </TabsContent>

      <TabsContent value="variance" className="mt-4">
        <VarianceReport />
      </TabsContent>

      <TabsContent value="trial-balance" className="mt-4">
        <TrialBalanceReport />
      </TabsContent>

      <TabsContent value="financial-statements" className="mt-4">
        <FinancialStatementsReport />
      </TabsContent>

      <TabsContent value="cash-flow" className="mt-4">
        <CashFlowReport />
      </TabsContent>

      <TabsContent value="segment" className="mt-4">
        <SegmentReport />
      </TabsContent>

      <TabsContent value="tax" className="mt-4">
        <TaxReport />
      </TabsContent>

      <TabsContent value="tax-returns" className="mt-4">
        <TaxReturnsReport />
      </TabsContent>

      <TabsContent value="audit" className="mt-4">
        <AuditLogsReport />
      </TabsContent>
    </ModuleSubTabs>
  );
}
