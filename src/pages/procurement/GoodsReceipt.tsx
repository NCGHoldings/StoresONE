import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Package, Truck, Clock, CheckCircle2, AlertTriangle, Eye, RefreshCw } from "lucide-react";
import { useInboundDeliveries } from "@/hooks/useInboundDeliveries";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { GoodsReceiptDialog } from "@/components/procurement/GoodsReceiptDialog";
import { GRNDetailsPanel } from "@/components/procurement/GRNDetailsPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { InboundDelivery } from "@/hooks/useInboundDeliveries";

const statusStyles: Record<string, string> = {
  scheduled: "bg-info/10 text-info border-info/20",
  in_transit: "bg-warning/10 text-warning border-warning/20",
  arrived: "bg-primary/10 text-primary border-primary/20",
  receiving: "bg-secondary/10 text-secondary border-secondary/20",
  completed: "bg-success/10 text-success border-success/20",
  cancelled: "bg-muted text-muted-foreground border-muted",
};

export default function GoodsReceipt() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [selectedPOId, setSelectedPOId] = useState<string | null>(null);
  const [selectedGRN, setSelectedGRN] = useState<InboundDelivery | null>(null);
  const [grnDetailsOpen, setGrnDetailsOpen] = useState(false);

  const { data: deliveries = [], isLoading: loadingDeliveries, refetch: refetchDeliveries } = useInboundDeliveries();
  const { data: purchaseOrders = [], isLoading: loadingPOs, refetch: refetchPOs } = usePurchaseOrders();

  const handleRefresh = () => {
    refetchDeliveries();
    refetchPOs();
  };

  // Get POs that are approved or in_transit (ready for receiving)
  const receivablePOs = purchaseOrders.filter(
    (po) => po.status === "approved" || po.status === "in_transit"
  );

  const filteredDeliveries = deliveries.filter((del) => {
    const matchesSearch =
      del.delivery_number.toLowerCase().includes(search.toLowerCase()) ||
      del.tracking_number?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || del.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats calculations
  const pendingCount = deliveries.filter((d) => d.status === "scheduled" || d.status === "in_transit").length;
  const arrivedCount = deliveries.filter((d) => d.status === "arrived").length;
  const receivingCount = deliveries.filter((d) => d.status === "receiving").length;
  const completedToday = deliveries.filter((d) => {
    if (d.status !== "completed" || !d.actual_date) return false;
    const today = new Date().toISOString().split("T")[0];
    return d.actual_date === today;
  }).length;

  const handleReceive = (poId: string) => {
    setSelectedPOId(poId);
    setReceiptDialogOpen(true);
  };

  const handleViewGRN = (grn: InboundDelivery) => {
    setSelectedGRN(grn);
    setGrnDetailsOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Goods Receipt</h1>
            <p className="text-muted-foreground">Receive goods against purchase orders</p>
          </div>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-info/10 p-2">
                  <Truck className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">In Transit</p>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-warning/10 p-2">
                  <Package className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Arrived</p>
                  <p className="text-2xl font-bold">{arrivedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Receiving</p>
                  <p className="text-2xl font-bold">{receivingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-success/10 p-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed Today</p>
                  <p className="text-2xl font-bold">{completedToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* POs Ready for Receipt */}
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-4 font-semibold flex items-center gap-2">
              <Package className="h-5 w-5" />
              Purchase Orders Ready for Receipt
            </h3>
            {loadingPOs ? (
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : receivablePOs.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No POs ready for receiving</p>
            ) : (
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {receivablePOs.map((po) => (
                  <div
                    key={po.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{po.po_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {po.suppliers?.company_name || "Unknown Supplier"}
                      </p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {po.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <Button size="sm" onClick={() => handleReceive(po.id)}>
                      Receive
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search deliveries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="arrived">Arrived</SelectItem>
              <SelectItem value="receiving">Receiving</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Deliveries Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Delivery #</TableHead>
                <TableHead>Tracking #</TableHead>
                <TableHead>Carrier</TableHead>
                <TableHead>Expected Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingDeliveries ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredDeliveries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No deliveries found
                  </TableCell>
                </TableRow>
              ) : (
                filteredDeliveries.map((delivery) => (
                  <TableRow 
                    key={delivery.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewGRN(delivery)}
                  >
                    <TableCell className="font-medium">{delivery.delivery_number}</TableCell>
                    <TableCell>{delivery.tracking_number || "-"}</TableCell>
                    <TableCell>{delivery.carrier || "-"}</TableCell>
                    <TableCell>
                      {delivery.expected_date
                        ? new Date(delivery.expected_date).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {delivery.received_items} / {delivery.total_items}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("capitalize", statusStyles[delivery.status || "scheduled"])}>
                        {delivery.status?.replace("_", " ") || "scheduled"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {delivery.quality_check_passed === true && (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      )}
                      {delivery.quality_check_passed === false && (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                      {delivery.quality_check_passed === null && (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewGRN(delivery);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <GoodsReceiptDialog
        open={receiptDialogOpen}
        onOpenChange={setReceiptDialogOpen}
        poId={selectedPOId}
      />

      <GRNDetailsPanel
        grn={selectedGRN}
        open={grnDetailsOpen}
        onOpenChange={setGrnDetailsOpen}
      />
    </MainLayout>
  );
}
