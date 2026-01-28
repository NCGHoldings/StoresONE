import { MainLayout } from "@/components/layout/MainLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { ModuleCard } from "@/components/dashboard/ModuleCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { InventoryChart } from "@/components/dashboard/InventoryChart";
import { Skeleton } from "@/components/ui/skeleton";
import { useFormatCurrency } from "@/lib/formatters";
import { useInventoryStats } from "@/hooks/useInventory";
import { useStorageZones } from "@/hooks/useStorageZones";
import { useStorageBinsCount } from "@/hooks/useDashboardData";
import { usePurchaseOrderStats } from "@/hooks/usePurchaseOrders";
import { useInvoiceStats } from "@/hooks/useInvoices";
import { useTotalReceivables } from "@/hooks/useCustomerBalances";
import { useRFQStats } from "@/hooks/useRFQ";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useUsers } from "@/hooks/useUsers";
import {
  Package,
  Warehouse,
  ShoppingCart,
  Search,
  DollarSign,
  Settings,
  Truck,
  AlertTriangle,
} from "lucide-react";

// Format large currency values with abbreviation
function formatLargeCurrency(value: number, formatCurrency: (val: number) => string): string {
  if (value >= 1000000) {
    const formatted = formatCurrency(value / 1000000);
    return formatted.replace(/\.00$/, '') + 'M';
  }
  if (value >= 1000) {
    const formatted = formatCurrency(value / 1000);
    return formatted.replace(/\.00$/, '') + 'K';
  }
  return formatCurrency(value);
}

// Format number with comma separators
function formatNumber(value: number): string {
  return value.toLocaleString();
}

export default function Dashboard() {
  const formatCurrency = useFormatCurrency();
  
  // Data hooks
  const { data: inventoryStats, isLoading: inventoryLoading } = useInventoryStats();
  const { data: zones, isLoading: zonesLoading } = useStorageZones();
  const { data: binsCount, isLoading: binsLoading } = useStorageBinsCount();
  const { data: poStats, isLoading: poLoading } = usePurchaseOrderStats();
  const { data: invoiceStats, isLoading: invoiceLoading } = useInvoiceStats();
  const { data: totalReceivables, isLoading: receivablesLoading } = useTotalReceivables();
  const { data: rfqStats, isLoading: rfqLoading } = useRFQStats();
  const { data: suppliers, isLoading: suppliersLoading } = useSuppliers();
  const { data: users, isLoading: usersLoading } = useUsers();

  // Calculate warehouse utilization
  const totalCapacity = (zones || []).reduce((sum, z) => sum + (z.max_capacity || 0), 0);
  const totalUsed = (zones || []).reduce((sum, z) => sum + (z.current_utilization || 0), 0);
  const utilizationPct = totalCapacity > 0 ? Math.round((totalUsed / totalCapacity) * 100) : 0;

  // Calculate pending orders (pending + approved not yet received)
  const pendingOrders = (poStats?.pending || 0) + (poStats?.approved || 0) + (poStats?.inTransit || 0);

  // Calculate low stock alert count
  const alertCount = (inventoryStats?.lowStockItems || 0) + (inventoryStats?.criticalItems || 0);

  // Calculate active RFQs (published + under evaluation)
  const activeRFQs = (rfqStats?.published || 0) + (rfqStats?.underEvaluation || 0);

  // KPIs with real data
  const kpis = [
    {
      title: "Total Inventory Value",
      value: inventoryLoading ? undefined : formatLargeCurrency(inventoryStats?.totalValue || 0, formatCurrency),
      change: 0,
      changeLabel: "calculated from stock",
      icon: <Package size={24} />,
      trend: "up" as const,
    },
    {
      title: "Pending Orders",
      value: poLoading ? undefined : String(pendingOrders),
      change: 0,
      changeLabel: "awaiting receipt",
      icon: <ShoppingCart size={24} />,
      trend: pendingOrders > 10 ? "down" as const : "up" as const,
    },
    {
      title: "Warehouse Utilization",
      value: zonesLoading ? undefined : `${utilizationPct}%`,
      change: 0,
      changeLabel: "of capacity",
      icon: <Warehouse size={24} />,
      trend: utilizationPct > 80 ? "down" as const : "up" as const,
    },
    {
      title: "Total Receivables",
      value: receivablesLoading ? undefined : formatLargeCurrency(totalReceivables || 0, formatCurrency),
      change: 0,
      changeLabel: "outstanding",
      icon: <Truck size={24} />,
      trend: "up" as const,
    },
  ];

  // Module cards with real stats
  const modules = [
    {
      title: "Warehouse Management",
      description: "Manage inventory, storage bins, and warehouse operations",
      icon: <Warehouse size={28} />,
      path: "/warehouse/inventory",
      stats: [
        { label: "Items", value: inventoryLoading ? "..." : formatNumber(inventoryStats?.totalItems || 0) },
        { label: "Locations", value: binsLoading ? "..." : formatNumber(binsCount || 0) },
      ],
      color: "#1e5aa8",
    },
    {
      title: "Procurement",
      description: "Purchase orders, goods receipt, and vendor management",
      icon: <ShoppingCart size={28} />,
      path: "/procurement/orders",
      stats: [
        { label: "Open POs", value: poLoading ? "..." : String(pendingOrders) },
        { label: "Pending", value: poLoading ? "..." : String(poStats?.pending || 0) },
      ],
      color: "#0ea5e9",
    },
    {
      title: "Sourcing",
      description: "RFQ management, supplier analysis, and contracts",
      icon: <Search size={28} />,
      path: "/sourcing/rfq",
      stats: [
        { label: "Active RFQs", value: rfqLoading ? "..." : String(activeRFQs) },
        { label: "Suppliers", value: suppliersLoading ? "..." : String(suppliers?.length || 0) },
      ],
      color: "#8b5cf6",
    },
    {
      title: "Finance",
      description: "Accounts payable, receivable, and financial reporting",
      icon: <DollarSign size={28} />,
      path: "/finance/payable",
      stats: [
        { label: "Payables", value: invoiceLoading ? "..." : formatLargeCurrency(invoiceStats?.totalPayables || 0, formatCurrency) },
        { label: "Receivables", value: receivablesLoading ? "..." : formatLargeCurrency(totalReceivables || 0, formatCurrency) },
      ],
      color: "#22c55e",
    },
    {
      title: "Administration",
      description: "User management, roles, and system configuration",
      icon: <Settings size={28} />,
      path: "/admin/users",
      stats: [
        { label: "Users", value: usersLoading ? "..." : String(users?.length || 0) },
        { label: "Active", value: usersLoading ? "..." : String(users?.filter(u => u.is_active !== false).length || 0) },
      ],
      color: "#f59e0b",
    },
  ];

  const isKPILoading = inventoryLoading || poLoading || zonesLoading || receivablesLoading;

  return (
    <MainLayout
      title="Dashboard"
      subtitle="Welcome back! Here's your warehouse overview."
    >
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi) => (
          kpi.value === undefined ? (
            <div key={kpi.title} className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-20" />
            </div>
          ) : (
            <KPICard key={kpi.title} {...kpi} />
          )
        ))}
      </div>

      {/* Alert Banner - Dynamic based on low stock count */}
      {alertCount > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 mb-8 flex items-center gap-4">
          <AlertTriangle className="text-warning shrink-0" size={24} />
          <div className="flex-1">
            <p className="font-medium text-foreground">
              {alertCount} item{alertCount !== 1 ? 's' : ''} require{alertCount === 1 ? 's' : ''} attention
            </p>
            <p className="text-sm text-muted-foreground">
              {inventoryStats?.criticalItems || 0} critical, {inventoryStats?.lowStockItems || 0} low stock items need review
            </p>
          </div>
          <a href="/warehouse/inventory" className="text-sm font-medium text-primary hover:underline">
            View Details
          </a>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="xl:col-span-2">
          <InventoryChart />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>

      {/* Modules */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Quick Access Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <ModuleCard key={module.title} {...module} />
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
