import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBatches, useBatchStats, InventoryBatch } from "@/hooks/useBatches";
import { useProducts } from "@/hooks/useWarehouse";
import { BatchDetailsPanel } from "@/components/warehouse/BatchDetailsPanel";
import {
  Search,
  Package,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Ban,
  Layers,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
> = {
  active: {
    label: "Active",
    variant: "default",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  quarantine: {
    label: "Quarantine",
    variant: "secondary",
    icon: <Clock className="h-3 w-3" />,
  },
  expired: {
    label: "Expired",
    variant: "destructive",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  consumed: {
    label: "Consumed",
    variant: "outline",
    icon: <Ban className="h-3 w-3" />,
  },
};

const qualityConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-warning/20 text-warning-foreground" },
  approved: { label: "Approved", className: "bg-success/20 text-success" },
  rejected: { label: "Rejected", className: "bg-destructive/20 text-destructive" },
};

export default function BatchInquiry() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [selectedBatch, setSelectedBatch] = useState<InventoryBatch | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: batches = [], isLoading } = useBatches({
    search,
    status: statusFilter !== "all" ? statusFilter : undefined,
    productId: productFilter !== "all" ? productFilter : undefined,
  });

  const { data: stats, isLoading: statsLoading } = useBatchStats();
  const { data: products = [] } = useProducts();

  // Only show batch-tracked products in filter
  const batchTrackedProducts = products.filter((p) => (p as any).batch_tracked);

  const handleRowClick = (batch: InventoryBatch) => {
    setSelectedBatch(batch);
    setDetailsOpen(true);
  };

  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(today.getDate() + 30);
    return expiry >= today && expiry <= thirtyDays;
  };

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  return (
    <MainLayout>
      <PageHeader
        title="Batch Inquiry"
        subtitle="View and manage inventory batches and lot numbers"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalBatches || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.activeBatches || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quarantine</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.quarantineBatches || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-warning">
                {stats?.expiringWithin30Days || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <Ban className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-destructive">
                {stats?.expiredBatches || 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by batch number, product, or PO..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="quarantine">Quarantine</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="consumed">Consumed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {batchTrackedProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Batches Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch #</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>PO Reference</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Quality</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : batches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No batches found</p>
                  </TableCell>
                </TableRow>
              ) : (
                batches.map((batch) => {
                  const status = statusConfig[batch.status] || statusConfig.active;
                  const quality = batch.quality_status
                    ? qualityConfig[batch.quality_status]
                    : null;

                  return (
                    <TableRow
                      key={batch.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(batch)}
                    >
                      <TableCell className="font-mono font-medium">
                        {batch.batch_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{batch.products?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {batch.products?.sku}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {batch.purchase_orders?.po_number || "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {batch.current_quantity}
                        <span className="text-xs text-muted-foreground ml-1">
                          / {batch.initial_quantity}
                        </span>
                      </TableCell>
                      <TableCell>
                        {batch.storage_bins?.bin_code || "-"}
                      </TableCell>
                      <TableCell>
                        {format(new Date(batch.received_date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {batch.expiry_date ? (
                          <span
                            className={cn(
                              "font-medium",
                              isExpired(batch.expiry_date) && "text-destructive",
                              isExpiringSoon(batch.expiry_date) &&
                                !isExpired(batch.expiry_date) &&
                                "text-warning"
                            )}
                          >
                            {format(new Date(batch.expiry_date), "MMM d, yyyy")}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="gap-1">
                          {status.icon}
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {quality ? (
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-xs font-medium",
                              quality.className
                            )}
                          >
                            {quality.label}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Batch Details Panel */}
      <BatchDetailsPanel
        batch={selectedBatch}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </MainLayout>
  );
}
