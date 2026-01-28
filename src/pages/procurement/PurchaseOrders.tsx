import { useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Download,
  ShoppingCart,
  Clock,
  Truck,
  DollarSign,
  Loader2,
  FileText,
  Info,
  Lock,
} from "lucide-react";
import { usePurchaseOrders, usePurchaseOrderStats, PurchaseOrder } from "@/hooks/usePurchaseOrders";
import { POFormDialog } from "@/components/procurement/POFormDialog";
import { PODetailsPanel } from "@/components/procurement/PODetailsPanel";
import { useFormatCurrency, useFormatDate } from "@/lib/formatters";

export default function PurchaseOrders() {
  const { data: orders, isLoading } = usePurchaseOrders();
  const { data: stats } = usePurchaseOrderStats();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedPOId, setSelectedPOId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const formatCurrency = useFormatCurrency();
  const formatDate = useFormatDate();

  const filteredOrders = orders?.filter((order) => {
    const matchesSearch =
      order.po_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.suppliers?.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Type augmentation for PO with PR reference
  type POWithPR = PurchaseOrder & {
    purchase_requisitions?: { pr_number: string } | null;
  };

  const columns = [
    {
      key: "po_number" as const,
      label: "PO Number",
      sortable: true,
      render: (order: POWithPR) => (
        <span className="font-medium text-primary">{order.po_number}</span>
      ),
    },
    {
      key: "purchase_requisitions.pr_number",
      label: "Source PR",
      sortable: true,
      render: (order: POWithPR) => (
        <span className="text-muted-foreground">
          {order.purchase_requisitions?.pr_number || "—"}
        </span>
      ),
    },
    {
      key: "suppliers.company_name",
      label: "Vendor",
      sortable: true,
      render: (order: POWithPR) => (
        <span>{order.suppliers?.company_name || "—"}</span>
      ),
    },
    {
      key: "order_date" as const,
      label: "Order Date",
      sortable: true,
      render: (order: POWithPR) => formatDate(order.order_date),
    },
    {
      key: "expected_delivery" as const,
      label: "Delivery Date",
      sortable: true,
      render: (order: POWithPR) =>
        order.expected_delivery
          ? formatDate(order.expected_delivery)
          : "—",
    },
    {
      key: "total_amount" as const,
      label: "Total",
      sortable: true,
      render: (order: POWithPR) => (
        <span className="font-medium">{formatCurrency(order.total_amount)}</span>
      ),
    },
    {
      key: "status" as const,
      label: "Status",
      sortable: true,
      render: (order: POWithPR) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} />
          {order.is_locked && <Lock className="h-3 w-3 text-muted-foreground" />}
        </div>
      ),
    },
  ];

  const handleRowClick = (order: PurchaseOrder) => {
    setSelectedPOId(order.id);
    setDetailsOpen(true);
  };

  const handleEdit = () => {
    setDetailsOpen(false);
    setFormOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Purchase Orders"
          subtitle="Manage purchase orders generated from approved requisitions"
        />

        {/* Info Banner */}
        <Alert className="bg-primary/5 border-primary/20">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            Purchase Orders are created from approved Purchase Requisitions.{" "}
            <Link to="/procurement/requisitions" className="underline font-medium text-primary hover:text-primary/80">
              Go to Requisitions
            </Link>{" "}
            to create a new PO.
          </AlertDescription>
        </Alert>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Approval</p>
                  <p className="text-2xl font-bold">{stats?.pending || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Truck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">In Transit</p>
                  <p className="text-2xl font-bold">{stats?.inTransit || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.thisMonthValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by PO# or vendor..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" asChild>
              <Link to="/procurement/requisitions">
                <FileText className="h-4 w-4 mr-2" />
                Create from PR
              </Link>
            </Button>
          </div>
        </div>

        {/* Orders Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable
            data={filteredOrders || []}
            columns={columns}
            searchable={false}
            onRowClick={handleRowClick}
          />
        )}
      </div>

      <POFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editingPO={selectedPOId ? orders?.find((o) => o.id === selectedPOId) : null}
      />

      <PODetailsPanel
        poId={selectedPOId}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onEdit={handleEdit}
      />
    </MainLayout>
  );
}
