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
  Receipt,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react";
import { usePriceLists, usePriceListStats, PriceList } from "@/hooks/usePriceLists";
import { PriceListFormDialog } from "@/components/procurement/PriceListFormDialog";
import { PriceListDetailsPanel } from "@/components/procurement/PriceListDetailsPanel";
import { useFormatDate } from "@/lib/formatters";

export default function PriceLists() {
  const { data: priceLists, isLoading } = usePriceLists();
  const { data: stats } = usePriceListStats();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const formatDate = useFormatDate();

  const filteredLists = priceLists?.filter((list) => {
    const matchesSearch =
      list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      list.suppliers?.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && list.is_active) ||
      (statusFilter === "inactive" && !list.is_active);
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: "name" as const,
      label: "Price List Name",
      sortable: true,
      render: (list: PriceList) => (
        <span className="font-medium text-primary">{list.name}</span>
      ),
    },
    {
      key: "suppliers.company_name",
      label: "Supplier",
      sortable: true,
      render: (list: PriceList) => list.suppliers?.company_name || "—",
    },
    {
      key: "currency" as const,
      label: "Currency",
      sortable: true,
      render: (list: PriceList) => (
        <span className="uppercase font-mono text-sm">{list.currency || "USD"}</span>
      ),
    },
    {
      key: "valid_from" as const,
      label: "Valid Period",
      sortable: true,
      render: (list: PriceList) => (
        <span className="text-sm">
          {formatDate(list.valid_from)} - {list.valid_to ? formatDate(list.valid_to) : "Ongoing"}
        </span>
      ),
    },
    {
      key: "is_active" as const,
      label: "Status",
      sortable: true,
      render: (list: PriceList) => (
        <StatusBadge status={list.is_active ? "active" : "inactive"} />
      ),
    },
  ];

  const handleRowClick = (list: PriceList) => {
    setSelectedListId(list.id);
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
          title="Price Lists"
          subtitle="Manage supplier pricing agreements and catalogs"
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Lists</p>
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
                <div className="p-2 bg-muted rounded-lg">
                  <XCircle className="h-5 w-5 text-muted-foreground" />
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
                placeholder="Search by name or supplier..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
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
              Create Price List
            </Button>
          </div>
        </div>

        {/* Price Lists Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable
            data={filteredLists || []}
            columns={columns}
            searchable={false}
            onRowClick={handleRowClick}
          />
        )}
      </div>

      <PriceListFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editingPriceList={selectedListId ? priceLists?.find((l) => l.id === selectedListId) : null}
      />

      <PriceListDetailsPanel
        priceListId={selectedListId}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onEdit={handleEdit}
      />
    </MainLayout>
  );
}
