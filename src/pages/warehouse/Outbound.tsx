import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useOutboundShipments,
  OutboundShipment,
  useUpdateOutboundShipment,
  useMarkShipmentDelivered,
} from "@/hooks/useOutboundShipments";
import { Plus, Package, Truck, CheckCircle, Clock, FileText } from "lucide-react";
import { useState } from "react";
import { OutboundFormDialog } from "@/components/warehouse/OutboundFormDialog";
import { format } from "date-fns";

type ShipmentWithSO = OutboundShipment & { sales_order?: { so_number: string; status: string } | null };

export default function Outbound() {
  const { data: shipments, isLoading } = useOutboundShipments();
  const updateShipment = useUpdateOutboundShipment();
  const markDelivered = useMarkShipmentDelivered();
  const [showForm, setShowForm] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<OutboundShipment | null>(null);

  const stats = {
    total: shipments?.length ?? 0,
    pending: shipments?.filter((s) => s.status === "pending").length ?? 0,
    picking: shipments?.filter((s) => s.status === "picking" || s.status === "packing").length ?? 0,
    shipped: shipments?.filter((s) => s.status === "shipped").length ?? 0,
    delivered: shipments?.filter((s) => s.status === "delivered").length ?? 0,
  };

  const handleShip = async (shipment: OutboundShipment) => {
    await updateShipment.mutateAsync({
      id: shipment.id,
      updates: { status: "shipped" },
    });
  };

  const handleDeliver = async (shipment: OutboundShipment) => {
    await markDelivered.mutateAsync(shipment.id);
  };

  const columns = [
    { key: "shipment_number", label: "Shipment #", sortable: true },
    {
      key: "so_number",
      label: "Sales Order",
      render: (shipment: ShipmentWithSO) =>
        shipment.sales_order?.so_number ? (
          <Badge variant="outline" className="gap-1">
            <FileText className="h-3 w-3" />
            {shipment.sales_order.so_number}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    { key: "customer_name", label: "Customer", sortable: true },
    {
      key: "ship_date",
      label: "Ship Date",
      render: (shipment: OutboundShipment) =>
        shipment.ship_date ? format(new Date(shipment.ship_date), "MMM dd, yyyy") : "-",
      sortable: true,
    },
    { key: "carrier", label: "Carrier" },
    {
      key: "tracking",
      label: "Tracking",
      render: (shipment: OutboundShipment) =>
        shipment.tracking_number || <span className="text-muted-foreground">-</span>,
    },
    {
      key: "items",
      label: "Items",
      render: (shipment: OutboundShipment) =>
        `${shipment.shipped_items ?? 0}/${shipment.total_items ?? 0}`,
    },
    {
      key: "priority",
      label: "Priority",
      render: (shipment: OutboundShipment) => (
        <span className={`capitalize ${shipment.priority === "urgent" ? "text-destructive font-medium" : shipment.priority === "high" ? "text-warning" : ""}`}>
          {shipment.priority ?? "normal"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (shipment: OutboundShipment) => <StatusBadge status={shipment.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (shipment: OutboundShipment) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedShipment(shipment);
              setShowForm(true);
            }}
          >
            View
          </Button>
          {shipment.status === "packing" && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleShip(shipment);
              }}
            >
              Ship
            </Button>
          )}
          {shipment.status === "shipped" && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDeliver(shipment);
              }}
              disabled={markDelivered.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Deliver
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <PageHeader
        title="Outbound Shipments"
        subtitle="Manage outgoing shipments and deliveries"
        actions={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Shipment
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Picking / Packing</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.picking}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Shipped / Delivered</CardTitle>
            <Truck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.shipped + stats.delivered}</div>
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
          data={shipments ?? []}
          columns={columns}
          searchable
          searchKeys={["shipment_number", "customer_name", "carrier", "tracking_number"]}
        />
      )}

      <OutboundFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        shipment={selectedShipment}
        onClose={() => {
          setShowForm(false);
          setSelectedShipment(null);
        }}
      />
    </MainLayout>
  );
}
