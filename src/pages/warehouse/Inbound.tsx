import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInboundDeliveries, InboundDelivery, useUpdateInboundDelivery } from "@/hooks/useInboundDeliveries";
import { Plus, Truck, Package, CheckCircle, Clock } from "lucide-react";
import { useState } from "react";
import { InboundFormDialog } from "@/components/warehouse/InboundFormDialog";
import { format } from "date-fns";

export default function Inbound() {
  const { data: deliveries, isLoading } = useInboundDeliveries();
  const updateDelivery = useUpdateInboundDelivery();
  const [showForm, setShowForm] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<InboundDelivery | null>(null);

  const stats = {
    total: deliveries?.length ?? 0,
    scheduled: deliveries?.filter((d) => d.status === "scheduled").length ?? 0,
    inTransit: deliveries?.filter((d) => d.status === "in_transit").length ?? 0,
    receiving: deliveries?.filter((d) => d.status === "receiving" || d.status === "arrived").length ?? 0,
    completed: deliveries?.filter((d) => d.status === "completed").length ?? 0,
  };

  const handleReceive = async (delivery: InboundDelivery) => {
    await updateDelivery.mutateAsync({
      id: delivery.id,
      updates: {
        status: "receiving",
        actual_date: new Date().toISOString().split("T")[0],
      },
    });
  };

  const columns = [
    { key: "delivery_number", label: "Delivery #", sortable: true },
    {
      key: "supplier",
      label: "Supplier",
      render: (delivery: InboundDelivery) => delivery.suppliers?.company_name ?? "-",
      sortable: true,
    },
    {
      key: "po",
      label: "PO #",
      render: (delivery: InboundDelivery) => delivery.purchase_orders?.po_number ?? "-",
    },
    {
      key: "expected_date",
      label: "Expected",
      render: (delivery: InboundDelivery) =>
        delivery.expected_date ? format(new Date(delivery.expected_date), "MMM dd, yyyy") : "-",
      sortable: true,
    },
    { key: "carrier", label: "Carrier" },
    {
      key: "items",
      label: "Items",
      render: (delivery: InboundDelivery) =>
        `${delivery.received_items ?? 0}/${delivery.total_items ?? 0}`,
    },
    {
      key: "status",
      label: "Status",
      render: (delivery: InboundDelivery) => <StatusBadge status={delivery.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (delivery: InboundDelivery) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedDelivery(delivery);
              setShowForm(true);
            }}
          >
            View
          </Button>
          {(delivery.status === "scheduled" || delivery.status === "in_transit" || delivery.status === "arrived") && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleReceive(delivery);
              }}
            >
              Receive
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <PageHeader
        title="Inbound Deliveries"
        subtitle="Manage incoming goods and receipts"
        actions={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Delivery
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Scheduled / In Transit</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.scheduled + stats.inTransit}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receiving</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.receiving}</div>
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
          data={deliveries ?? []}
          columns={columns}
          searchable
          searchKeys={["delivery_number", "carrier", "tracking_number"]}
        />
      )}

      <InboundFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        delivery={selectedDelivery}
        onClose={() => {
          setShowForm(false);
          setSelectedDelivery(null);
        }}
      />
    </MainLayout>
  );
}
