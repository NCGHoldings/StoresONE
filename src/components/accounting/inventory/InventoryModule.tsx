import { TabsContent } from "@/components/ui/tabs";
import { ModuleSubTabs } from "../ModuleSubTabs";
import { KPICard } from "../KPICard";
import { QuickActions } from "../QuickActions";
import { PlaceholderContent } from "../PlaceholderContent";
import { 
  Package, 
  AlertTriangle, 
  DollarSign, 
  Layers,
  Plus,
  Download,
  RefreshCw,
} from "lucide-react";
import { useProducts } from "@/hooks/useWarehouse";
import { useInventory, useInventoryStats } from "@/hooks/useInventory";
import { useFormatCurrency } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const subTabs = [
  { id: "items", label: "Items" },
  { id: "stock-levels", label: "Stock Levels" },
  { id: "batch-tracking", label: "Batch/Serial Tracking" },
  { id: "ageing", label: "Inventory Ageing" },
  { id: "reconciliation", label: "Stock Reconciliation" },
];

interface InventoryModuleProps {
  activeSubTab: string;
  onSubTabChange: (tab: string) => void;
}

export default function InventoryModule({ activeSubTab, onSubTabChange }: InventoryModuleProps) {
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: inventory, isLoading: inventoryLoading } = useInventory();
  const { data: stats } = useInventoryStats();
  const formatCurrency = useFormatCurrency();

  const quickActions = [
    { label: "New Item", icon: Plus, onClick: () => {} },
    { label: "Stock Adjustment", icon: RefreshCw, onClick: () => {} },
    { label: "Export Inventory", icon: Download, onClick: () => {} },
  ];

  const lowStockItems = products?.filter(p => {
    const inv = inventory?.find(i => i.product_id === p.id);
    return inv && p.reorder_point && (inv.quantity || 0) <= p.reorder_point;
  }) || [];

  return (
    <ModuleSubTabs tabs={subTabs} activeTab={activeSubTab || "items"} onTabChange={onSubTabChange}>
      <TabsContent value="items" className="mt-4 space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            icon={Package}
            label="Total Items"
            value={products?.length || 0}
            subtitle="Product master"
            variant="primary"
          />
          <KPICard
            icon={Layers}
            label="Total Items"
            value={stats?.totalItems?.toLocaleString() || 0}
            subtitle="Stock records"
            variant="success"
          />
          <KPICard
            icon={DollarSign}
            label="Inventory Value"
            value={formatCurrency(stats?.totalValue || 0)}
            variant="default"
          />
          <KPICard
            icon={AlertTriangle}
            label="Low Stock Items"
            value={lowStockItems.length}
            variant={lowStockItems.length > 0 ? "destructive" : "success"}
          />
        </div>

        {/* Quick Actions */}
        <QuickActions actions={quickActions} />

        {/* Items Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Product Catalog</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead>UoM</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : products?.slice(0, 10).map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category || "-"}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.unit_cost || 0)}</TableCell>
                    <TableCell>{product.unit_of_measure || "EA"}</TableCell>
                    <TableCell>
                      <Badge variant={product.is_active ? "default" : "secondary"}>
                        {product.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="stock-levels" className="mt-4 space-y-6">
        {/* Stock Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Stock Levels</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">On Hand</TableHead>
                  <TableHead className="text-right">Reserved</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : inventory?.slice(0, 15).map((inv) => {
                  const product = products?.find(p => p.id === inv.product_id);
                  const isLow = product?.reorder_point && (inv.quantity || 0) <= product.reorder_point;
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{product?.name || "Unknown"}</TableCell>
                      <TableCell className="text-muted-foreground">{inv.storage_bins?.bin_code || "-"}</TableCell>
                      <TableCell className="text-right">{inv.quantity?.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{inv.reserved_quantity?.toLocaleString() || 0}</TableCell>
                      <TableCell className="text-right font-medium">{inv.available_quantity?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={isLow ? "destructive" : "default"}>
                          {isLow ? "Low Stock" : "In Stock"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="batch-tracking" className="mt-4">
        <PlaceholderContent
          title="Batch & Serial Tracking"
          description="Track products by batch numbers, serial numbers, manufacturing dates, and expiry dates for full traceability."
        />
      </TabsContent>

      <TabsContent value="ageing" className="mt-4">
        <PlaceholderContent
          title="Inventory Ageing"
          description="Analyze inventory age to identify slow-moving and obsolete stock."
        />
      </TabsContent>

      <TabsContent value="reconciliation" className="mt-4">
        <PlaceholderContent
          title="Stock Reconciliation"
          description="Perform physical inventory counts and reconcile with system records."
        />
      </TabsContent>
    </ModuleSubTabs>
  );
}
