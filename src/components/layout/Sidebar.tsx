import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Warehouse,
  ShoppingCart,
  Search,
  DollarSign,
  Settings,
  ChevronDown,
  Building2,
  LogOut,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NAV_TO_MODULE, type ModuleKey } from "@/lib/permissions";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  module?: ModuleKey;
  children?: { label: string; path: string }[];
}

const navigation: NavItem[] = [
  { label: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/", module: "dashboard" },
  { label: "Accounting", icon: <DollarSign size={20} />, path: "/accounting", module: "finance" },
  {
    label: "Warehouse",
    icon: <Warehouse size={20} />,
    module: "warehouse",
    children: [
      { label: "Product Master", path: "/warehouse/products" },
      { label: "Inventory", path: "/warehouse/inventory" },
      { label: "Batch Inquiry", path: "/warehouse/batches" },
      { label: "Storage Bins", path: "/warehouse/storage" },
      { label: "Inbound", path: "/warehouse/inbound" },
      { label: "Putaway", path: "/warehouse/putaway" },
      { label: "Outbound", path: "/warehouse/outbound" },
      { label: "Issues Inquiry", path: "/warehouse/issues" },
      { label: "Stock Transfers", path: "/warehouse/transfers" },
      { label: "Returns", path: "/warehouse/returns" },
    ],
  },
  {
    label: "Procurement",
    icon: <ShoppingCart size={20} />,
    module: "procurement",
    children: [
      { label: "Requisitions", path: "/procurement/requisitions" },
      { label: "RFQ/RFP", path: "/procurement/rfq" },
      { label: "Purchase Orders", path: "/procurement/orders" },
      { label: "Blanket Orders", path: "/procurement/blanket" },
      { label: "Goods Receipt", path: "/procurement/receipt" },
      { label: "3-Way Match", path: "/procurement/match" },
      { label: "Demand Planning", path: "/procurement/demand" },
      { label: "Category Catalog", path: "/procurement/catalogs" },
      { label: "Price Lists", path: "/procurement/prices" },
    ],
  },
  {
    label: "Sales",
    icon: <Users size={20} />,
    module: "sales",
    children: [
      { label: "Customers", path: "/sales/customers" },
      { label: "Customer POs", path: "/sales/customer-pos" },
      { label: "Sales Orders", path: "/sales/orders" },
      { label: "Returns", path: "/sales/returns" },
    ],
  },
  {
    label: "Sourcing",
    icon: <Search size={20} />,
    module: "sourcing",
    children: [
      { label: "Supplier Master", path: "/sourcing/suppliers" },
      { label: "Registration", path: "/sourcing/registration" },
      { label: "Evaluation", path: "/sourcing/evaluation" },
      { label: "Scorecard", path: "/sourcing/scorecard" },
      { label: "Contracts", path: "/sourcing/contracts" },
      { label: "Risk Flags", path: "/sourcing/risk" },
    ],
  },
  {
    label: "Administration",
    icon: <Settings size={20} />,
    module: "admin",
    children: [
      { label: "Approval Console", path: "/admin/approvals" },
      { label: "Approval Workflows", path: "/admin/workflows" },
      { label: "User Management", path: "/admin/users" },
      { label: "Role Management", path: "/admin/roles" },
      { label: "System Config", path: "/admin/config" },
      { label: "Audit Logs", path: "/admin/logs" },
      { label: "POS Integration", path: "/admin/pos-integration" },
    ],
  },
];

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  warehouse_manager: 'Warehouse',
  procurement: 'Procurement',
  finance: 'Finance',
  viewer: 'Viewer',
};

export function Sidebar() {
  const location = useLocation();
  const { profile, roles, hasModuleAccess, signOut } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>(["Warehouse"]);

  // Filter navigation based on module access
  const filteredNavigation = useMemo(() => {
    return navigation.filter(item => {
      // Admin sees everything
      if (roles.includes('admin')) return true;
      
      // Check module access using the item's module property
      if (item.module) {
        return hasModuleAccess(item.module);
      }
      
      // Fallback: use NAV_TO_MODULE mapping
      const module = NAV_TO_MODULE[item.label];
      return module ? hasModuleAccess(module) : true;
    });
  }, [roles, hasModuleAccess]);

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const isActive = (path?: string) => path === location.pathname;
  const isChildActive = (children?: { path: string }[]) =>
    children?.some((child) => child.path === location.pathname);

  const displayName = profile?.full_name || profile?.email || 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const primaryRole = roles[0] || 'viewer';

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 gradient-sidebar flex flex-col z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-foreground/10">
        <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
          <Building2 className="text-primary-foreground" size={24} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-sidebar-foreground">WMS Pro</h1>
          <p className="text-xs text-sidebar-foreground/60">Enterprise Suite</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {filteredNavigation.map((item) => (
          <div key={item.label} className="mb-1">
            {item.path ? (
              <Link
                to={item.path}
                className={cn("sidebar-nav-item", isActive(item.path) && "active")}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ) : (
              <>
                <button
                  onClick={() => toggleExpand(item.label)}
                  className={cn(
                    "sidebar-nav-item w-full justify-between",
                    isChildActive(item.children) && "text-sidebar-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={cn(
                      "transition-transform duration-200",
                      expandedItems.includes(item.label) && "rotate-180"
                    )}
                  />
                </button>
                {expandedItems.includes(item.label) && item.children && (
                  <div className="ml-9 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.path}
                        to={child.path}
                        className={cn(
                          "block px-3 py-2 text-sm rounded-lg transition-colors",
                          "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-hover",
                          isActive(child.path) &&
                            "text-primary-foreground bg-primary"
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </nav>

      {/* Footer with User Info */}
      <div className="p-4 border-t border-sidebar-foreground/10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-2 h-auto py-2 hover:bg-sidebar-hover"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-primary-foreground">
                  {initials}
                </span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {displayName}
                </p>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 mt-0.5">
                  {roleLabels[primaryRole] || primaryRole}
                </Badge>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
