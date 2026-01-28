import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Package, Undo2 } from "lucide-react";
import { CustomerReturnsTab } from "@/components/warehouse/CustomerReturnsTab";
import { PurchaseReturnsTab } from "@/components/warehouse/PurchaseReturnsTab";

export default function WarehouseReturns() {
  const [activeTab, setActiveTab] = useState("customer");

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Returns Management"
          subtitle="Manage customer returns (inbound) and supplier returns (outbound)"
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="customer" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Customer Returns
            </TabsTrigger>
            <TabsTrigger value="supplier" className="flex items-center gap-2">
              <Undo2 className="h-4 w-4" />
              Supplier Returns
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customer" className="mt-6">
            <CustomerReturnsTab />
          </TabsContent>

          <TabsContent value="supplier" className="mt-6">
            <PurchaseReturnsTab />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
