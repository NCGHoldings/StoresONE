import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KPICard } from "@/components/dashboard/KPICard";
import { SalesOrderFormDialog } from "@/components/sales/SalesOrderFormDialog";
import { SalesOrderDetailsPanel } from "@/components/sales/SalesOrderDetailsPanel";
import { useSalesOrders, useSalesOrderStats, useConfirmSalesOrder, useStartPicking, useCreateShipmentFromSO, SalesOrder } from "@/hooks/useSalesOrders";
import { Plus, Search, FileEdit, CheckCircle2, Package, Truck, PackageCheck } from "lucide-react";
import { useFormatCurrency, useFormatDate } from "@/lib/formatters";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function SalesOrders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedSO, setSelectedSO] = useState<SalesOrder | null>(null);

  const { data: orders = [], isLoading } = useSalesOrders();
  const { data: stats } = useSalesOrderStats();
  const confirmSO = useConfirmSalesOrder();
  const startPicking = useStartPicking();
  const createShipment = useCreateShipmentFromSO();
  const formatCurrency = useFormatCurrency();
  const formatDate = useFormatDate();

  const filteredOrders = orders.filter((o) => o.so_number.toLowerCase().includes(searchTerm.toLowerCase()) || o.customers?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleAction = async (e: React.MouseEvent, soId: string, action: string) => {
    e.stopPropagation();
    if (action === "confirm") await confirmSO.mutateAsync(soId);
    else if (action === "start_picking") await startPicking.mutateAsync(soId);
    else if (action === "create_shipment") await createShipment.mutateAsync(soId);
  };

  const handleRowClick = (so: SalesOrder) => { setSelectedSO(so); setDetailsOpen(true); };
  const handleNewSO = () => { setSelectedSO(null); setFormOpen(true); };

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Sales Orders" subtitle="Manage sales orders and fulfillment" />

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <KPICard title="Draft" value={stats?.draft || 0} icon={<FileEdit className="h-5 w-5" />} />
          <KPICard title="Confirmed" value={stats?.confirmed || 0} icon={<CheckCircle2 className="h-5 w-5" />} />
          <KPICard title="Picking" value={stats?.picking || 0} icon={<Package className="h-5 w-5" />} />
          <KPICard title="Shipping" value={stats?.shipping || 0} icon={<Truck className="h-5 w-5" />} />
          <KPICard title="Delivered" value={stats?.delivered || 0} icon={<PackageCheck className="h-5 w-5" />} trend="up" />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search sales orders..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          <Button onClick={handleNewSO}><Plus className="h-4 w-4 mr-2" />New Sales Order</Button>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SO Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Customer PO</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Required Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No sales orders found</TableCell></TableRow>
              ) : (
                filteredOrders.map((o) => (
                  <TableRow key={o.id} className="cursor-pointer" onClick={() => handleRowClick(o)}>
                    <TableCell className="font-medium">{o.so_number}</TableCell>
                    <TableCell>{o.customers?.company_name || "-"}</TableCell>
                    <TableCell>{o.customer_pos?.cpo_number || "-"}</TableCell>
                    <TableCell>{formatDate(o.order_date)}</TableCell>
                    <TableCell>{o.required_date ? formatDate(o.required_date) : "-"}</TableCell>
                    <TableCell>{formatCurrency(o.total_amount || 0)}</TableCell>
                    <TableCell><span className={`capitalize ${o.priority === "urgent" ? "text-destructive font-medium" : o.priority === "high" ? "text-orange-600" : ""}`}>{o.priority}</span></TableCell>
                    <TableCell><StatusBadge status={o.status} /></TableCell>
                    <TableCell>
                      {o.status === "draft" && <Button size="sm" variant="outline" onClick={(e) => handleAction(e, o.id, "confirm")} disabled={confirmSO.isPending}>Confirm</Button>}
                      {o.status === "confirmed" && <Button size="sm" variant="outline" onClick={(e) => handleAction(e, o.id, "start_picking")} disabled={startPicking.isPending}>Pick</Button>}
                      {o.status === "picking" && <Button size="sm" variant="outline" onClick={(e) => handleAction(e, o.id, "create_shipment")} disabled={createShipment.isPending}>Ship</Button>}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <SalesOrderFormDialog open={formOpen} onOpenChange={setFormOpen} onClose={() => setFormOpen(false)} />
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedSO && <SalesOrderDetailsPanel soId={selectedSO.id} onClose={() => setDetailsOpen(false)} />}
        </SheetContent>
      </Sheet>
    </MainLayout>
  );
}
