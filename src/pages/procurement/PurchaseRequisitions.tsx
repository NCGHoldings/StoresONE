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
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { usePurchaseRequisitions, usePRStats, PurchaseRequisition } from "@/hooks/usePurchaseRequisitions";
import { PRFormDialog } from "@/components/procurement/PRFormDialog";
import { PRDetailsPanel } from "@/components/procurement/PRDetailsPanel";
import { useFormatCurrency, useFormatDate } from "@/lib/formatters";

export default function PurchaseRequisitions() {
  const { data: requisitions, isLoading } = usePurchaseRequisitions();
  const { data: stats } = usePRStats();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedPRId, setSelectedPRId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const formatCurrency = useFormatCurrency();
  const formatDate = useFormatDate();

  const filteredRequisitions = requisitions?.filter((pr) => {
    const matchesSearch =
      pr.pr_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pr.department?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || pr.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: "pr_number" as const,
      label: "PR Number",
      sortable: true,
      render: (pr: PurchaseRequisition) => (
        <span className="font-medium text-primary">{pr.pr_number}</span>
      ),
    },
    {
      key: "department" as const,
      label: "Department",
      sortable: true,
      render: (pr: PurchaseRequisition) => pr.department || "—",
    },
    {
      key: "required_date" as const,
      label: "Required Date",
      sortable: true,
      render: (pr: PurchaseRequisition) =>
        pr.required_date ? formatDate(pr.required_date) : "—",
    },
    {
      key: "urgency" as const,
      label: "Urgency",
      sortable: true,
      render: (pr: PurchaseRequisition) => (
        <StatusBadge status={pr.urgency || "normal"} />
      ),
    },
    {
      key: "total_estimated_value" as const,
      label: "Est. Value",
      sortable: true,
      render: (pr: PurchaseRequisition) => (
        <span className="font-medium">{formatCurrency(pr.total_estimated_value)}</span>
      ),
    },
    {
      key: "status" as const,
      label: "Status",
      sortable: true,
      render: (pr: PurchaseRequisition) => <StatusBadge status={pr.status || "draft"} />,
    },
  ];

  const handleRowClick = (pr: PurchaseRequisition) => {
    setSelectedPRId(pr.id);
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
          title="Purchase Requisitions"
          subtitle="Create and manage purchase requests before converting to orders"
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total PRs</p>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Draft</p>
                  <p className="text-2xl font-bold">{stats?.draft || 0}</p>
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
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold">{stats?.submitted || 0}</p>
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
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold">{stats?.approved || 0}</p>
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
                placeholder="Search by PR# or department..."
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
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
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
              Create PR
            </Button>
          </div>
        </div>

        {/* Requisitions Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable
            data={filteredRequisitions || []}
            columns={columns}
            searchable={false}
            onRowClick={handleRowClick}
          />
        )}
      </div>

      <PRFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editingPR={selectedPRId ? requisitions?.find((r) => r.id === selectedPRId) : null}
      />

      <PRDetailsPanel
        prId={selectedPRId}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onEdit={handleEdit}
      />
    </MainLayout>
  );
}
