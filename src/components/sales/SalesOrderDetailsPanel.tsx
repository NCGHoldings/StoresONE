import { useState } from "react";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  useSalesOrderDetails,
  useConfirmSalesOrder,
  useStartPicking,
  useCompletePicking,
  useCreateShipmentFromSO,
  useConfirmShipment,
  useConfirmDelivery,
} from "@/hooks/useSalesOrders";
import { useFormatCurrency, useFormatDate } from "@/lib/formatters";
import { FileText, Package, Truck, CheckCircle2, MapPin, Send } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { PickingDialog } from "./PickingDialog";
import { ShippingDialog } from "./ShippingDialog";

interface SalesOrderDetailsPanelProps {
  soId: string;
  onClose: () => void;
}

export function SalesOrderDetailsPanel({ soId, onClose }: SalesOrderDetailsPanelProps) {
  const { data, isLoading } = useSalesOrderDetails(soId);
  const confirmSO = useConfirmSalesOrder();
  const startPicking = useStartPicking();
  const completePicking = useCompletePicking();
  const createShipment = useCreateShipmentFromSO();
  const confirmShipment = useConfirmShipment();
  const confirmDelivery = useConfirmDelivery();
  const formatCurrency = useFormatCurrency();
  const formatDate = useFormatDate();

  const [showPickingDialog, setShowPickingDialog] = useState(false);
  const [showShippingDialog, setShowShippingDialog] = useState(false);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { so, lines } = data;

  const handleConfirm = async () => {
    await confirmSO.mutateAsync(soId);
  };

  const handleStartPicking = async () => {
    await startPicking.mutateAsync(soId);
  };

  const handleCompletePicking = async (
    pickedLines: { lineId: string; quantityPicked: number }[]
  ) => {
    await completePicking.mutateAsync({ soId, pickedLines });
    // Auto-create shipment after picking is complete
    await createShipment.mutateAsync(soId);
  };

  const handleConfirmShipment = async (data: { carrier: string; trackingNumber: string }) => {
    await confirmShipment.mutateAsync({
      soId,
      carrier: data.carrier,
      trackingNumber: data.trackingNumber,
    });
  };

  const handleConfirmDelivery = async () => {
    await confirmDelivery.mutateAsync(soId);
  };

  const totalOrdered = lines.reduce((sum, l) => sum + l.quantity_ordered, 0);
  const totalReserved = lines.reduce((sum, l) => sum + (l.quantity_reserved || 0), 0);
  const totalPicked = lines.reduce((sum, l) => sum + (l.quantity_picked || 0), 0);
  const totalShipped = lines.reduce((sum, l) => sum + (l.quantity_shipped || 0), 0);

  const reservedPercent = totalOrdered > 0 ? (totalReserved / totalOrdered) * 100 : 0;
  const pickedPercent = totalOrdered > 0 ? (totalPicked / totalOrdered) * 100 : 0;
  const shippedPercent = totalOrdered > 0 ? (totalShipped / totalOrdered) * 100 : 0;

  return (
    <div className="space-y-6">
      <SheetHeader>
        <div className="flex items-center justify-between">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {so.so_number}
          </SheetTitle>
          <StatusBadge status={so.status} />
        </div>
      </SheetHeader>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Customer</p>
            <p className="font-medium">{(so.customers as any)?.company_name || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Customer PO</p>
            <p className="font-medium">{(so.customer_pos as any)?.cpo_number || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Order Date</p>
            <p className="font-medium">{formatDate(so.order_date)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Required Date</p>
            <p className="font-medium">{so.required_date ? formatDate(so.required_date) : "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="font-medium text-lg">{formatCurrency(so.total_amount)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Priority</p>
            <Badge variant={so.priority === "urgent" ? "destructive" : so.priority === "high" ? "default" : "secondary"}>
              {so.priority}
            </Badge>
          </div>
          {so.ship_date && (
            <div>
              <p className="text-sm text-muted-foreground">Ship Date</p>
              <p className="font-medium">{formatDate(so.ship_date)}</p>
            </div>
          )}
        </div>

        {/* Progress Indicators */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Reserved</span>
              <span className="text-sm text-muted-foreground">{totalReserved}/{totalOrdered}</span>
            </div>
            <Progress value={reservedPercent} className="h-2" />
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Picked</span>
              <span className="text-sm text-muted-foreground">{totalPicked}/{totalOrdered}</span>
            </div>
            <Progress value={pickedPercent} className="h-2" />
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Shipped</span>
              <span className="text-sm text-muted-foreground">{totalShipped}/{totalOrdered}</span>
            </div>
            <Progress value={shippedPercent} className="h-2" />
          </div>
        </div>

        {(so.shipping_address || so.billing_address) && (
          <div className="grid grid-cols-2 gap-4">
            {so.shipping_address && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Shipping Address</p>
                <p className="text-sm">{so.shipping_address}</p>
              </div>
            )}
            {so.billing_address && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Billing Address</p>
                <p className="text-sm">{so.billing_address}</p>
              </div>
            )}
          </div>
        )}

        <Separator />

        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Line Items ({lines.length})
          </h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Product</th>
                  <th className="px-3 py-2 text-center">Ordered</th>
                  <th className="px-3 py-2 text-center">Reserved</th>
                  <th className="px-3 py-2 text-center">Picked</th>
                  <th className="px-3 py-2 text-center">Shipped</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.id} className="border-t">
                    <td className="px-3 py-2">{line.line_number}</td>
                    <td className="px-3 py-2">
                      <p className="font-medium">{line.products?.name || "-"}</p>
                      {line.products?.sku && (
                        <p className="text-xs text-muted-foreground">{line.products.sku}</p>
                      )}
                      {line.storage_bins?.bin_code && (
                        <Badge variant="outline" className="text-xs mt-1 gap-1">
                          <MapPin className="h-3 w-3" />
                          {line.storage_bins.bin_code}
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">{line.quantity_ordered}</td>
                    <td className="px-3 py-2 text-center">{line.quantity_reserved || 0}</td>
                    <td className="px-3 py-2 text-center">{line.quantity_picked || 0}</td>
                    <td className="px-3 py-2 text-center">{line.quantity_shipped || 0}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(line.total_price)}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={line.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/50">
                <tr>
                  <td colSpan={6} className="px-3 py-2 text-right font-medium">Total:</td>
                  <td className="px-3 py-2 text-right font-bold">{formatCurrency(so.total_amount)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {so.notes && (
          <>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground mb-1">Notes</p>
              <p className="text-sm">{so.notes}</p>
            </div>
          </>
        )}

        <Separator />

        <div className="flex flex-wrap gap-3">
          {so.status === "draft" && (
            <Button onClick={handleConfirm} disabled={confirmSO.isPending}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirm & Reserve Inventory
            </Button>
          )}
          {so.status === "confirmed" && (
            <Button onClick={handleStartPicking} disabled={startPicking.isPending}>
              <Package className="h-4 w-4 mr-2" />
              Start Picking
            </Button>
          )}
          {so.status === "picking" && (
            <Button onClick={() => setShowPickingDialog(true)}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete Picking
            </Button>
          )}
          {so.status === "shipping" && (
            <Button onClick={() => setShowShippingDialog(true)}>
              <Truck className="h-4 w-4 mr-2" />
              Mark as Shipped
            </Button>
          )}
          {so.status === "shipped" && (
            <Button onClick={handleConfirmDelivery} disabled={confirmDelivery.isPending}>
              <Send className="h-4 w-4 mr-2" />
              Confirm Delivery
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Picking Dialog */}
      <PickingDialog
        open={showPickingDialog}
        onOpenChange={setShowPickingDialog}
        lines={lines.filter((l) => l.status === "picking" || l.status === "reserved")}
        soNumber={so.so_number}
        onConfirmPicking={handleCompletePicking}
        isPending={completePicking.isPending || createShipment.isPending}
      />

      {/* Shipping Dialog */}
      <ShippingDialog
        open={showShippingDialog}
        onOpenChange={setShowShippingDialog}
        soNumber={so.so_number}
        onConfirmShipment={handleConfirmShipment}
        isPending={confirmShipment.isPending}
      />
    </div>
  );
}
