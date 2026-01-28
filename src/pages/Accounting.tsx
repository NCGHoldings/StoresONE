import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  BookOpen,
  Users,
  FileText,
  Package,
  ShoppingCart,
  Building2,
  Box,
  BarChart3,
  Settings,
} from "lucide-react";

// Tab content components
import GLModule from "@/components/accounting/gl/GLModule";
import ARModule from "@/components/accounting/ar/ARModule";
import APModule from "@/components/accounting/ap/APModule";
import InventoryModule from "@/components/accounting/inventory/InventoryModule";
import ProcurementModule from "@/components/accounting/procurement/ProcurementModule";
import BankingModule from "@/components/accounting/banking/BankingModule";
import FixedAssetsModule from "@/components/accounting/assets/FixedAssetsModule";
import ReportsModule from "@/components/accounting/reports/ReportsModule";
import SettingsModule from "@/components/accounting/settings/SettingsModule";

const primaryTabs = [
  { id: "gl", label: "General Ledger", icon: BookOpen },
  { id: "ar", label: "AR", icon: Users },
  { id: "ap", label: "AP", icon: FileText },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "procurement", label: "Procurement", icon: ShoppingCart },
  { id: "banking", label: "Banking", icon: Building2 },
  { id: "assets", label: "Fixed Assets", icon: Box },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Accounting() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "gl";
  const activeSubTab = searchParams.get("sub") || "";

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  const handleSubTabChange = (sub: string) => {
    setSearchParams({ tab: activeTab, sub });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Finance & Accounting
          </h1>
          <p className="text-muted-foreground">
            Enterprise Accounting Module
          </p>
        </div>

        {/* Primary Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="h-auto p-1 bg-muted/50 flex flex-wrap gap-1 justify-start w-full">
            {primaryTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Tab Contents */}
          <TabsContent value="gl" className="mt-6">
            <GLModule activeSubTab={activeSubTab} onSubTabChange={handleSubTabChange} />
          </TabsContent>

          <TabsContent value="ar" className="mt-6">
            <ARModule activeSubTab={activeSubTab} onSubTabChange={handleSubTabChange} />
          </TabsContent>

          <TabsContent value="ap" className="mt-6">
            <APModule activeSubTab={activeSubTab} onSubTabChange={handleSubTabChange} />
          </TabsContent>

          <TabsContent value="inventory" className="mt-6">
            <InventoryModule activeSubTab={activeSubTab} onSubTabChange={handleSubTabChange} />
          </TabsContent>

          <TabsContent value="procurement" className="mt-6">
            <ProcurementModule activeSubTab={activeSubTab} onSubTabChange={handleSubTabChange} />
          </TabsContent>

          <TabsContent value="banking" className="mt-6">
            <BankingModule activeSubTab={activeSubTab} onSubTabChange={handleSubTabChange} />
          </TabsContent>

          <TabsContent value="assets" className="mt-6">
            <FixedAssetsModule activeSubTab={activeSubTab} onSubTabChange={handleSubTabChange} />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <ReportsModule activeSubTab={activeSubTab} onSubTabChange={handleSubTabChange} />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <SettingsModule activeSubTab={activeSubTab} onSubTabChange={handleSubTabChange} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
