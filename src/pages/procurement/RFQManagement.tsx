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
  FileQuestion,
  Clock,
  Send,
  Award,
  Loader2,
} from "lucide-react";
import { useRFQs, useRFQStats, RFQRequest } from "@/hooks/useRFQ";
import { RFQFormDialog } from "@/components/procurement/RFQFormDialog";
import { RFQDetailsPanel } from "@/components/procurement/RFQDetailsPanel";
import { useFormatDate } from "@/lib/formatters";
import { formatDistanceToNow } from "date-fns";

export default function RFQManagement() {
  const { data: rfqs, isLoading } = useRFQs();
  const { data: stats } = useRFQStats();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedRFQId, setSelectedRFQId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const formatDate = useFormatDate();

  const filteredRFQs = rfqs?.filter((rfq) => {
    const matchesSearch =
      rfq.rfq_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfq.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || rfq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: "rfq_number" as const,
      label: "RFQ Number",
      sortable: true,
      render: (rfq: RFQRequest) => (
        <span className="font-medium text-primary">{rfq.rfq_number}</span>
      ),
    },
    {
      key: "title" as const,
      label: "Title",
      sortable: true,
      render: (rfq: RFQRequest) => (
        <span className="truncate max-w-[200px] block">{rfq.title}</span>
      ),
    },
    {
      key: "rfq_type" as const,
      label: "Type",
      sortable: true,
      render: (rfq: RFQRequest) => (
        <span className="uppercase text-xs font-medium">{rfq.rfq_type || "RFQ"}</span>
      ),
    },
    {
      key: "response_deadline" as const,
      label: "Deadline",
      sortable: true,
      render: (rfq: RFQRequest) => {
        if (!rfq.response_deadline) return "—";
        const deadline = new Date(rfq.response_deadline);
        const isOverdue = deadline < new Date() && rfq.status !== "awarded" && rfq.status !== "closed";
        return (
          <span className={isOverdue ? "text-destructive" : ""}>
            {formatDistanceToNow(deadline, { addSuffix: true })}
          </span>
        );
      },
    },
    {
      key: "status" as const,
      label: "Status",
      sortable: true,
      render: (rfq: RFQRequest) => <StatusBadge status={rfq.status || "draft"} />,
    },
  ];

  const handleRowClick = (rfq: RFQRequest) => {
    setSelectedRFQId(rfq.id);
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
          title="RFQ/RFP Management"
          subtitle="Request for quotes and proposals from suppliers"
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileQuestion className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total RFQs</p>
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
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Send className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Published</p>
                  <p className="text-2xl font-bold">{stats?.published || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <Award className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Awarded</p>
                  <p className="text-2xl font-bold">{stats?.awarded || 0}</p>
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
                placeholder="Search by RFQ# or title..."
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
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="under_evaluation">Under Evaluation</SelectItem>
                <SelectItem value="awarded">Awarded</SelectItem>
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
              Create RFQ
            </Button>
          </div>
        </div>

        {/* RFQs Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable
            data={filteredRFQs || []}
            columns={columns}
            searchable={false}
            onRowClick={handleRowClick}
          />
        )}
      </div>

      <RFQFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editingRFQ={selectedRFQId ? rfqs?.find((r) => r.id === selectedRFQId) : null}
      />

      <RFQDetailsPanel
        rfqId={selectedRFQId}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onEdit={handleEdit}
      />
    </MainLayout>
  );
}
