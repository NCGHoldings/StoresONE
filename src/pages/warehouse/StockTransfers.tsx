import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStockTransfers, StockTransfer, useCompleteTransfer } from "@/hooks/useStockTransfers";
import { Plus, ArrowRightLeft, Clock, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { TransferFormDialog } from "@/components/warehouse/TransferFormDialog";
import { format } from "date-fns";

export default function StockTransfers() {
  const { data: transfers, isLoading } = useStockTransfers();
  const completeTransfer = useCompleteTransfer();
  const [showForm, setShowForm] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);

  const stats = {
    total: transfers?.length ?? 0,
    pending: transfers?.filter((t) => t.status === "pending").length ?? 0,
    inProgress: transfers?.filter((t) => t.status === "in_progress").length ?? 0,
    completed: transfers?.filter((t) => t.status === "completed").length ?? 0,
  };

  const handleComplete = async (transfer: StockTransfer) => {
    await completeTransfer.mutateAsync(transfer.id);
  };

  const columns = [
    { key: "transfer_number", label: "Transfer #", sortable: true },
    {
      key: "product",
      label: "Product",
      render: (transfer: StockTransfer) => transfer.products?.name ?? "-",
      sortable: true,
    },
    {
      key: "from_bin",
      label: "From Bin",
      render: (transfer: StockTransfer) => transfer.from_bin?.bin_code ?? "-",
    },
    {
      key: "to_bin",
      label: "To Bin",
      render: (transfer: StockTransfer) => transfer.to_bin?.bin_code ?? "-",
    },
    { key: "quantity", label: "Qty", sortable: true },
    {
      key: "transfer_date",
      label: "Date",
      render: (transfer: StockTransfer) =>
        format(new Date(transfer.transfer_date), "MMM dd, yyyy"),
      sortable: true,
    },
    {
      key: "status",
      label: "Status",
      render: (transfer: StockTransfer) => <StatusBadge status={transfer.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (transfer: StockTransfer) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTransfer(transfer);
              setShowForm(true);
            }}
          >
            View
          </Button>
          {transfer.status === "pending" && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleComplete(transfer);
              }}
            >
              Complete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <PageHeader
        title="Stock Transfers"
        subtitle="Manage bin-to-bin stock movements"
        actions={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Transfer
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Transfers</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <DataTable
          data={transfers ?? []}
          columns={columns}
          searchable
          searchKeys={["transfer_number", "reason"]}
        />
      )}

      <TransferFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        transfer={selectedTransfer}
        onClose={() => {
          setShowForm(false);
          setSelectedTransfer(null);
        }}
      />
    </MainLayout>
  );
}
