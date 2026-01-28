import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { InventoryBatch, useBatchTransactions, useUpdateBatch } from "@/hooks/useBatches";
import { format } from "date-fns";
import {
  Package,
  Calendar,
  MapPin,
  FileText,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Ban,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface BatchDetailsPanelProps {
  batch: InventoryBatch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  active: { label: "Active", variant: "default", icon: <CheckCircle2 className="h-4 w-4" /> },
  quarantine: { label: "Quarantine", variant: "secondary", icon: <Clock className="h-4 w-4" /> },
  expired: { label: "Expired", variant: "destructive", icon: <AlertTriangle className="h-4 w-4" /> },
  consumed: { label: "Consumed", variant: "outline", icon: <Ban className="h-4 w-4" /> },
};

const qualityOptions = [
  { value: "pending", label: "Pending", className: "bg-warning/20 text-warning-foreground" },
  { value: "approved", label: "Approved", className: "bg-success/20 text-success" },
  { value: "rejected", label: "Rejected", className: "bg-destructive/20 text-destructive" },
];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "quarantine", label: "Quarantine" },
  { value: "expired", label: "Expired" },
  { value: "consumed", label: "Consumed" },
];

export function BatchDetailsPanel({ batch, open, onOpenChange }: BatchDetailsPanelProps) {
  const { data: transactions = [], isLoading: transactionsLoading } = useBatchTransactions(batch?.id);
  const updateBatch = useUpdateBatch();
  const [updatingQuality, setUpdatingQuality] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  if (!batch) return null;

  const status = statusConfig[batch.status] || statusConfig.active;

  const handleQualityChange = async (value: string) => {
    setUpdatingQuality(true);
    try {
      await updateBatch.mutateAsync({
        id: batch.id,
        updates: { quality_status: value as "pending" | "approved" | "rejected" },
      });
    } finally {
      setUpdatingQuality(false);
    }
  };

  const handleStatusChange = async (value: string) => {
    setUpdatingStatus(true);
    try {
      await updateBatch.mutateAsync({
        id: batch.id,
        updates: { status: value as "active" | "quarantine" | "expired" | "consumed" },
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Batch Details
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Batch Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Batch Number</p>
                  <p className="text-2xl font-bold font-mono">{batch.batch_number}</p>
                  {batch.supplier_batch_ref && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Supplier Ref: {batch.supplier_batch_ref}
                    </p>
                  )}
                </div>
                <Badge variant={status.variant} className="gap-1">
                  {status.icon}
                  {status.label}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Product Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{batch.products?.name}</p>
                  <p className="text-sm text-muted-foreground">{batch.products?.sku}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Initial Qty</p>
                  <p className="font-medium">{batch.initial_quantity}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current Qty</p>
                  <p className="font-medium text-lg">{batch.current_quantity}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates & Location */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Dates & Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Received</p>
                    <p className="font-medium">
                      {format(new Date(batch.received_date), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                {batch.expiry_date && (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Expiry</p>
                      <p
                        className={cn(
                          "font-medium",
                          new Date(batch.expiry_date) < new Date() && "text-red-600"
                        )}
                      >
                        {format(new Date(batch.expiry_date), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                )}
                {batch.manufacturing_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Manufactured</p>
                      <p className="font-medium">
                        {format(new Date(batch.manufacturing_date), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Location</p>
                    <p className="font-medium">{batch.storage_bins?.bin_code || "Unassigned"}</p>
                  </div>
                </div>
              </div>

              {batch.purchase_orders && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-sm">Source PO</p>
                      <p className="font-medium">{batch.purchase_orders.po_number}</p>
                    </div>
                  </div>
                </>
              )}

              {batch.profiles && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-sm">Received By</p>
                      <p className="font-medium">{batch.profiles.full_name || "Unknown"}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Status & Quality Management */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Status Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Batch Status</p>
                  <Select
                    value={batch.status}
                    onValueChange={handleStatusChange}
                    disabled={updatingStatus}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Quality Status</p>
                  <Select
                    value={batch.quality_status || "pending"}
                    onValueChange={handleQualityChange}
                    disabled={updatingQuality}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {qualityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {batch.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{batch.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Transaction History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 4 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        No transactions recorded
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx: any) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-xs">
                          {format(new Date(tx.created_at), "MMM d, HH:mm")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {tx.transaction_type}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-medium",
                            tx.quantity > 0 ? "text-success" : "text-destructive"
                          )}
                        >
                          {tx.quantity > 0 ? "+" : ""}
                          {tx.quantity}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {tx.reference_type || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
