import { TabsContent } from "@/components/ui/tabs";
import { ModuleSubTabs } from "../ModuleSubTabs";
import { KPICard } from "../KPICard";
import { QuickActions } from "../QuickActions";
import { PlaceholderContent } from "../PlaceholderContent";
import { 
  ShoppingCart, 
  FileText, 
  Package, 
  CheckCircle,
  Plus,
  Download,
} from "lucide-react";
import { usePurchaseRequisitions } from "@/hooks/usePurchaseRequisitions";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { useInboundDeliveries } from "@/hooks/useInboundDeliveries";
import { useThreeWayMatchData, useMatchStats } from "@/hooks/useThreeWayMatch";
import { useFormatCurrency } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const subTabs = [
  { id: "requisitions", label: "Purchase Requisitions" },
  { id: "orders", label: "Purchase Orders" },
  { id: "grn", label: "Goods Receipt Notes" },
  { id: "matching", label: "Invoice Matching" },
];

interface ProcurementModuleProps {
  activeSubTab: string;
  onSubTabChange: (tab: string) => void;
}

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  in_transit: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  received: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  scheduled: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export default function ProcurementModule({ activeSubTab, onSubTabChange }: ProcurementModuleProps) {
  const { data: requisitions, isLoading: prsLoading } = usePurchaseRequisitions();
  const { data: orders, isLoading: posLoading } = usePurchaseOrders();
  const { data: deliveries, isLoading: grnsLoading } = useInboundDeliveries();
  const { data: matchStats } = useMatchStats();
  const formatCurrency = useFormatCurrency();

  const pendingPRs = requisitions?.filter(pr => pr.status === 'pending') || [];
  const pendingPOs = orders?.filter(po => po.status === 'pending') || [];

  const quickActions = [
    { label: "New Requisition", icon: Plus, onClick: () => {} },
    { label: "Create PO", icon: Plus, onClick: () => {} },
    { label: "Record GRN", icon: Package, onClick: () => {} },
    { label: "Export", icon: Download, onClick: () => {} },
  ];

  return (
    <ModuleSubTabs tabs={subTabs} activeTab={activeSubTab || "requisitions"} onTabChange={onSubTabChange}>
      <TabsContent value="requisitions" className="mt-4 space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            icon={FileText}
            label="Total PRs"
            value={requisitions?.length || 0}
            variant="primary"
          />
          <KPICard
            icon={ShoppingCart}
            label="Pending Approval"
            value={pendingPRs.length}
            variant="warning"
          />
          <KPICard
            icon={CheckCircle}
            label="Approved"
            value={requisitions?.filter(pr => pr.status === 'approved').length || 0}
            variant="success"
          />
          <KPICard
            icon={FileText}
            label="This Month"
            value={requisitions?.filter(pr => {
              const prDate = new Date(pr.created_at);
              const now = new Date();
              return prDate.getMonth() === now.getMonth() && prDate.getFullYear() === now.getFullYear();
            }).length || 0}
            variant="default"
          />
        </div>

        <QuickActions actions={[quickActions[0]]} />

        {/* PR Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Purchase Requisitions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PR Number</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Required Date</TableHead>
                  <TableHead className="text-right">Est. Value</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : requisitions?.slice(0, 10).map((pr) => (
                  <TableRow key={pr.id}>
                    <TableCell className="font-mono text-sm">{pr.pr_number}</TableCell>
                    <TableCell>{pr.department || "-"}</TableCell>
                    <TableCell>{pr.required_date ? format(new Date(pr.required_date), "MMM dd, yyyy") : "-"}</TableCell>
                    <TableCell className="text-right">{formatCurrency(pr.total_estimated_value || 0)}</TableCell>
                    <TableCell>
                      <Badge variant={pr.urgency === 'high' ? 'destructive' : pr.urgency === 'medium' ? 'default' : 'secondary'}>
                        {pr.urgency || "Normal"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[pr.status || "draft"]}>
                        {pr.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="orders" className="mt-4 space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            icon={ShoppingCart}
            label="Total POs"
            value={orders?.length || 0}
            variant="primary"
          />
          <KPICard
            icon={FileText}
            label="Pending Approval"
            value={pendingPOs.length}
            variant="warning"
          />
          <KPICard
            icon={Package}
            label="In Transit"
            value={orders?.filter(po => po.status === 'in_transit').length || 0}
            variant="default"
          />
          <KPICard
            icon={CheckCircle}
            label="Received"
            value={orders?.filter(po => po.status === 'received').length || 0}
            variant="success"
          />
        </div>

        <QuickActions actions={[quickActions[1]]} />

        {/* PO Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Purchase Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Expected Delivery</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : orders?.slice(0, 10).map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-mono text-sm">{po.po_number}</TableCell>
                    <TableCell className="font-medium">{po.suppliers?.company_name || "-"}</TableCell>
                    <TableCell>{po.order_date ? format(new Date(po.order_date), "MMM dd, yyyy") : "-"}</TableCell>
                    <TableCell>{po.expected_delivery ? format(new Date(po.expected_delivery), "MMM dd, yyyy") : "-"}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(po.total_amount || 0)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[po.status || "draft"]}>
                        {po.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="grn" className="mt-4 space-y-6">
        {/* GRN Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Goods Receipt Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>GRN Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Receipt Date</TableHead>
                  <TableHead>Total Items</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grnsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : deliveries?.slice(0, 10).map((grn) => (
                  <TableRow key={grn.id}>
                    <TableCell className="font-mono text-sm">{grn.delivery_number}</TableCell>
                    <TableCell className="font-medium">{grn.suppliers?.company_name || "-"}</TableCell>
                    <TableCell>{grn.actual_date ? format(new Date(grn.actual_date), "MMM dd, yyyy") : "-"}</TableCell>
                    <TableCell>{grn.total_items || 0}</TableCell>
                    <TableCell>{grn.received_items || 0}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[grn.status || "scheduled"]}>
                        {grn.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="matching" className="mt-4 space-y-6">
        {/* Match Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            icon={FileText}
            label="Total Invoices"
            value={matchStats?.total || 0}
            variant="primary"
          />
          <KPICard
            icon={CheckCircle}
            label="Full Match"
            value={matchStats?.fullMatch || 0}
            variant="success"
          />
          <KPICard
            icon={ShoppingCart}
            label="Pending"
            value={matchStats?.pending || 0}
            variant="warning"
          />
          <KPICard
            icon={Package}
            label="Mismatch"
            value={matchStats?.mismatch || 0}
            variant="destructive"
          />
        </div>

        <PlaceholderContent
          title="3-Way Invoice Matching"
          description="Reconcile invoices with purchase orders and goods receipt notes. Navigate to Procurement → 3-Way Match for the full matching interface."
        />
      </TabsContent>
    </ModuleSubTabs>
  );
}
