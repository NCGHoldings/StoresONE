import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Filter,
  Download,
  TrendingUp,
  AlertTriangle,
  Package,
  Calendar,
  Loader2,
} from "lucide-react";
import { useMaterialDemands, useMaterialDemandStats, MaterialDemand } from "@/hooks/useMaterialDemand";
import { DemandFormDialog } from "@/components/procurement/DemandFormDialog";
import { useFormatDate } from "@/lib/formatters";

export default function MaterialDemandPlanning() {
  const { data: demands, isLoading } = useMaterialDemands();
  const { data: stats } = useMaterialDemandStats();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingDemand, setEditingDemand] = useState<MaterialDemand | null>(null);

  const formatDate = useFormatDate();

  const filteredDemands = demands?.filter((demand) => {
    const matchesSearch =
      demand.products?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      demand.products?.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || demand.status === statusFilter;
    const matchesType = typeFilter === "all" || demand.demand_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const columns = [
    {
      key: "products.sku",
      label: "SKU",
      sortable: true,
      render: (demand: MaterialDemand) => (
        <span className="font-medium text-primary">{demand.products?.sku || "—"}</span>
      ),
    },
    {
      key: "products.name",
      label: "Product",
      sortable: true,
      render: (demand: MaterialDemand) => demand.products?.name || "—",
    },
    {
      key: "demand_type" as const,
      label: "Type",
      sortable: true,
      render: (demand: MaterialDemand) => (
        <span className="capitalize text-sm">{demand.demand_type.replace("_", " ")}</span>
      ),
    },
    {
      key: "quantity" as const,
      label: "Qty Required",
      sortable: true,
      render: (demand: MaterialDemand) => demand.quantity,
    },
    {
      key: "fulfilled_quantity" as const,
      label: "Fulfilled",
      sortable: true,
      render: (demand: MaterialDemand) => demand.fulfilled_quantity || 0,
    },
    {
      key: "required_date" as const,
      label: "Required By",
      sortable: true,
      render: (demand: MaterialDemand) => formatDate(demand.required_date),
    },
    {
      key: "priority" as const,
      label: "Priority",
      sortable: true,
      render: (demand: MaterialDemand) => (
        <StatusBadge status={demand.priority || "normal"} />
      ),
    },
    {
      key: "status" as const,
      label: "Status",
      sortable: true,
      render: (demand: MaterialDemand) => <StatusBadge status={demand.status || "open"} />,
    },
  ];

  const handleRowClick = (demand: MaterialDemand) => {
    setEditingDemand(demand);
    setFormOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Material Demand Planning"
          subtitle="Track and plan material requirements across the organization"
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Demands</p>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Open</p>
                  <p className="text-2xl font-bold">{stats?.open || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Planned</p>
                  <p className="text-2xl font-bold">{stats?.planned || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold">{stats?.overdue || 0}</p>
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
                placeholder="Search by product or SKU..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="forecast">Forecast</SelectItem>
                <SelectItem value="sales_order">Sales Order</SelectItem>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="safety_stock">Safety Stock</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
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
            <Button onClick={() => { setEditingDemand(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Demand
            </Button>
          </div>
        </div>

        {/* Demands Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable
            data={filteredDemands || []}
            columns={columns}
            searchable={false}
            onRowClick={handleRowClick}
          />
        )}
      </div>

      <DemandFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editingDemand={editingDemand}
      />
    </MainLayout>
  );
}
