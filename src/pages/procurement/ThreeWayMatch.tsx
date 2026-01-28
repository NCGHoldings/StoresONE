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
  Search,
  Filter,
  Download,
  FileCheck,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
} from "lucide-react";
import { useThreeWayMatchData, useMatchStats, MatchItem } from "@/hooks/useThreeWayMatch";
import { MatchReviewPanel } from "@/components/procurement/MatchReviewPanel";
import { useFormatCurrency, useFormatDate } from "@/lib/formatters";

export default function ThreeWayMatch() {
  const { data: matchItems, isLoading } = useThreeWayMatchData();
  const { data: stats } = useMatchStats();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const formatCurrency = useFormatCurrency();
  const formatDate = useFormatDate();

  const filteredItems = matchItems?.filter((item) => {
    const matchesSearch =
      item.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.poNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.matchStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: "invoiceNumber" as const,
      label: "Invoice #",
      sortable: true,
      render: (item: MatchItem) => (
        <span className="font-medium text-primary">{item.invoiceNumber}</span>
      ),
    },
    {
      key: "poNumber" as const,
      label: "PO #",
      sortable: true,
      render: (item: MatchItem) => item.poNumber || "—",
    },
    {
      key: "supplierName" as const,
      label: "Supplier",
      sortable: true,
      render: (item: MatchItem) => item.supplierName || "—",
    },
    {
      key: "invoiceAmount" as const,
      label: "Invoice Amt",
      sortable: true,
      render: (item: MatchItem) => (
        <span className="font-medium">{formatCurrency(item.invoiceAmount)}</span>
      ),
    },
    {
      key: "poAmount" as const,
      label: "PO Amt",
      sortable: true,
      render: (item: MatchItem) => formatCurrency(item.poAmount),
    },
    {
      key: "variancePercent" as const,
      label: "Variance",
      sortable: true,
      render: (item: MatchItem) => {
        const variance = item.variancePercent || 0;
        const color = Math.abs(variance) <= 2 ? "text-success" : Math.abs(variance) <= 5 ? "text-warning" : "text-destructive";
        return <span className={color}>{variance.toFixed(1)}%</span>;
      },
    },
    {
      key: "matchStatus" as const,
      label: "Match Status",
      sortable: true,
      render: (item: MatchItem) => <StatusBadge status={item.matchStatus} />,
    },
  ];

  const handleRowClick = (item: MatchItem) => {
    setSelectedItemId(item.invoiceId);
    setDetailsOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="3-Way Match Review"
          subtitle="Reconcile purchase orders, goods receipts, and invoices"
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Items</p>
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
                  <p className="text-sm text-muted-foreground">Full Match</p>
                  <p className="text-2xl font-bold">{stats?.fullMatch || 0}</p>
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
                  <p className="text-sm text-muted-foreground">Partial Match</p>
                  <p className="text-2xl font-bold">{stats?.partialMatch || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mismatch</p>
                  <p className="text-2xl font-bold">{stats?.mismatch || 0}</p>
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
                placeholder="Search by invoice# or PO#..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Match Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="full_match">Full Match</SelectItem>
                <SelectItem value="partial_match">Partial Match</SelectItem>
                <SelectItem value="mismatch">Mismatch</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
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
          </div>
        </div>

        {/* Match Items Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable
            data={(filteredItems || []).map(item => ({ ...item, id: item.invoiceId }))}
            columns={columns as any}
            searchable={false}
            onRowClick={(item: any) => handleRowClick(item)}
          />
        )}
      </div>

      <MatchReviewPanel
        invoiceId={selectedItemId}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </MainLayout>
  );
}
