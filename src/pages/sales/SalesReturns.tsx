import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useSalesReturns, useReturnStats } from "@/hooks/useSalesReturns";
import { useFormatCurrency, useFormatDate } from "@/lib/formatters";
import { RotateCcw, Plus, Clock, ClipboardCheck, CheckCircle2, DollarSign } from "lucide-react";
import { ReturnFormDialog } from "@/components/sales/ReturnFormDialog";
import { ReturnDetailsPanel } from "@/components/sales/ReturnDetailsPanel";

const REASON_LABELS: Record<string, string> = {
  defective: "Defective",
  wrong_item: "Wrong Item",
  damaged: "Damaged",
  customer_request: "Customer Request",
  other: "Other",
};

export default function SalesReturns() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedReturnId, setSelectedReturnId] = useState<string | null>(null);

  const { data: returns, isLoading } = useSalesReturns({ status: statusFilter });
  const { data: stats } = useReturnStats();
  const formatCurrency = useFormatCurrency();
  const formatDate = useFormatDate();

  const filteredReturns = returns?.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.return_number.toLowerCase().includes(q) ||
      r.customers?.company_name?.toLowerCase().includes(q) ||
      r.sales_orders?.so_number?.toLowerCase().includes(q)
    );
  });

  const columns = [
    {
      key: "return_number",
      label: "Return #",
      render: (row: any) => (
        <Button
          variant="link"
          className="p-0 h-auto font-medium"
          onClick={() => setSelectedReturnId(row.id)}
        >
          {row.return_number}
        </Button>
      ),
    },
    {
      key: "customer",
      label: "Customer",
      render: (row: any) => row.customers?.company_name || "-",
    },
    {
      key: "so",
      label: "Sales Order",
      render: (row: any) => row.sales_orders?.so_number || "-",
    },
    {
      key: "return_date",
      label: "Return Date",
      render: (row: any) => formatDate(row.return_date),
    },
    {
      key: "return_reason",
      label: "Reason",
      render: (row: any) => REASON_LABELS[row.return_reason] || row.return_reason,
    },
    {
      key: "total_amount",
      label: "Value",
      render: (row: any) => formatCurrency(row.total_amount),
    },
    {
      key: "status",
      label: "Status",
      render: (row: any) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Sales Returns"
          subtitle="Manage customer returns and restocking"
          actions={
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Return
            </Button>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.pending || 0}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <ClipboardCheck className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.awaitingInspection || 0}</p>
                  <p className="text-sm text-muted-foreground">Awaiting Inspection</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent">
                  <CheckCircle2 className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.completedThisMonth || 0}</p>
                  <p className="text-sm text-muted-foreground">Completed (Month)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.totalCreditValue || 0)}</p>
                  <p className="text-sm text-muted-foreground">Total Credit Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <Input
            placeholder="Search returns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="inspected">Inspected</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Data Table */}
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredReturns || []}
            onRowClick={(row) => setSelectedReturnId(row.id)}
          />
        )}
      </div>

      {/* Create Return Dialog */}
      <ReturnFormDialog open={showForm} onOpenChange={setShowForm} />

      {/* Return Details Sheet */}
      <Sheet
        open={!!selectedReturnId}
        onOpenChange={(open) => !open && setSelectedReturnId(null)}
      >
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          {selectedReturnId && (
            <ReturnDetailsPanel
              returnId={selectedReturnId}
              onClose={() => setSelectedReturnId(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </MainLayout>
  );
}
