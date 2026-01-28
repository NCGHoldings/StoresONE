import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
  FileStack,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useBlanketOrders, useBlanketOrderStats, BlanketOrder } from "@/hooks/useBlanketOrders";
import { BlanketOrderFormDialog } from "@/components/procurement/BlanketOrderFormDialog";
import { BlanketOrderDetailsPanel } from "@/components/procurement/BlanketOrderDetailsPanel";
import { useFormatCurrency, useFormatDate } from "@/lib/formatters";

export default function BlanketOrders() {
  const { data: orders, isLoading } = useBlanketOrders();
  const { data: stats } = useBlanketOrderStats();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedBOId, setSelectedBOId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const formatCurrency = useFormatCurrency();
  const formatDate = useFormatDate();

  const filteredOrders = orders?.filter((bo) => {
    const matchesSearch =
      bo.bo_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bo.suppliers?.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || bo.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: "bo_number" as const,
      label: "BO Number",
      sortable: true,
      render: (bo: BlanketOrder) => (
        <span className="font-medium text-primary">{bo.bo_number}</span>
      ),
    },
    {
      key: "suppliers.company_name",
      label: "Supplier",
      sortable: true,
      render: (bo: BlanketOrder) => bo.suppliers?.company_name || "—",
    },
    {
      key: "valid_from" as const,
      label: "Valid Period",
      sortable: true,
      render: (bo: BlanketOrder) => (
        <span className="text-sm">
          {formatDate(bo.valid_from)} - {formatDate(bo.valid_to)}
        </span>
      ),
    },
    {
      key: "consumption",
      label: "Consumption",
      render: (bo: BlanketOrder) => {
        const consumed = bo.consumed_value || 0;
        const total = bo.total_value || 1;
        const percentage = Math.min((consumed / total) * 100, 100);
        return (
          <div className="w-32">
            <Progress value={percentage} className="h-2" />
            <span className="text-xs text-muted-foreground">
              {percentage.toFixed(0)}% used
            </span>
          </div>
        );
      },
    },
    {
      key: "total_value" as const,
      label: "Total Value",
      sortable: true,
      render: (bo: BlanketOrder) => (
        <span className="font-medium">{formatCurrency(bo.total_value)}</span>
      ),
    },
    {
      key: "status" as const,
      label: "Status",
      sortable: true,
      render: (bo: BlanketOrder) => <StatusBadge status={bo.status || "draft"} />,
    },
  ];

  const handleRowClick = (bo: BlanketOrder) => {
    setSelectedBOId(bo.id);
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
          title="Blanket Orders"
          subtitle="Long-term purchase agreements with suppliers"
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileStack className="h-5 w-5 text-primary" />
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
                <div className="p-2 bg-success/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{stats?.active || 0}</p>
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
                  <p className="text-sm text-muted-foreground">Expiring Soon</p>
                  <p className="text-2xl font-bold">{stats?.expiringSoon || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expired</p>
                  <p className="text-2xl font-bold">{stats?.expired || 0}</p>
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
                placeholder="Search by BO# or supplier..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
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
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Blanket Order
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

      <BlanketOrderFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editingBO={selectedBOId ? orders?.find((o) => o.id === selectedBOId) : null}
      />

      <BlanketOrderDetailsPanel
        boId={selectedBOId}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onEdit={handleEdit}
      />
    </MainLayout>
  );
}
