import { TabsContent } from "@/components/ui/tabs";
import { ModuleSubTabs } from "../ModuleSubTabs";
import { KPICard } from "../KPICard";
import { PlaceholderContent } from "../PlaceholderContent";
import { useFormatCurrency } from "@/lib/formatters";
import { 
  Box, 
  TrendingDown, 
  RefreshCw, 
  DollarSign,
} from "lucide-react";

const subTabs = [
  { id: "register", label: "Asset Register" },
  { id: "depreciation", label: "Depreciation" },
  { id: "revaluations", label: "Revaluations" },
  { id: "transfers", label: "Transfers" },
  { id: "disposals", label: "Disposals" },
];

interface FixedAssetsModuleProps {
  activeSubTab: string;
  onSubTabChange: (tab: string) => void;
}

export default function FixedAssetsModule({ activeSubTab, onSubTabChange }: FixedAssetsModuleProps) {
  const formatCurrency = useFormatCurrency();

  return (
    <ModuleSubTabs tabs={subTabs} activeTab={activeSubTab || "register"} onTabChange={onSubTabChange}>
      <TabsContent value="register" className="mt-4 space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            icon={Box}
            label="Total Assets"
            value={0}
            subtitle="Fixed assets"
            variant="primary"
          />
          <KPICard
            icon={DollarSign}
            label="Gross Value"
            value={formatCurrency(0)}
            variant="success"
          />
          <KPICard
            icon={TrendingDown}
            label="Acc. Depreciation"
            value={formatCurrency(0)}
            variant="warning"
          />
          <KPICard
            icon={RefreshCw}
            label="Net Book Value"
            value={formatCurrency(0)}
            variant="default"
          />
        </div>

        <PlaceholderContent
          title="Fixed Asset Register"
          description="Manage your organization's fixed assets including property, plant, equipment, vehicles, and intangible assets."
          actionLabel="Add Asset"
        />
      </TabsContent>

      <TabsContent value="depreciation" className="mt-4">
        <PlaceholderContent
          title="Depreciation Management"
          description="Configure depreciation methods, run depreciation calculations, and track accumulated depreciation."
        />
      </TabsContent>

      <TabsContent value="revaluations" className="mt-4">
        <PlaceholderContent
          title="Asset Revaluations"
          description="Record asset revaluations to adjust carrying amounts to fair value."
        />
      </TabsContent>

      <TabsContent value="transfers" className="mt-4">
        <PlaceholderContent
          title="Asset Transfers"
          description="Transfer assets between locations, departments, or cost centers."
        />
      </TabsContent>

      <TabsContent value="disposals" className="mt-4">
        <PlaceholderContent
          title="Asset Disposals"
          description="Record asset sales, write-offs, and retirements with gain/loss calculations."
        />
      </TabsContent>
    </ModuleSubTabs>
  );
}
