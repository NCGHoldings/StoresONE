import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Truck, CreditCard, XCircle, Send, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useFormatCurrency } from "@/lib/formatters";
import {
  usePurchaseReturnDetails,
  useSubmitForPickup,
  useShipReturn,
  useConfirmSupplierReceipt,
  useConfirmCredit,
  useCancelPurchaseReturn,
  type PurchaseReturnStatus,
} from "@/hooks/usePurchaseReturns";

const statusConfig: Record<PurchaseReturnStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  pending_pickup: { label: "Pending Pickup", variant: "outline" },
  shipped: { label: "Shipped", variant: "default" },
  received_by_supplier: { label: "Received by Supplier", variant: "default" },
  credit_received: { label: "Credit Received", variant: "default" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

interface PurchaseReturnDetailsPanelProps {
  returnId: string;
  onClose?: () => void;
}

export function PurchaseReturnDetailsPanel({
  returnId,
  onClose,
}: PurchaseReturnDetailsPanelProps) {
  const { data, isLoading } = usePurchaseReturnDetails(returnId);
  const formatCurrency = useFormatCurrency();
  const [shippedDate, setShippedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [receivedDate, setReceivedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [creditDate, setCreditDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [creditNoteNumber, setCreditNoteNumber] = useState("");

  const submitForPickup = useSubmitForPickup();
  const shipReturn = useShipReturn();
  const confirmReceipt = useConfirmSupplierReceipt();
  const confirmCredit = useConfirmCredit();
  const cancelReturn = useCancelPurchaseReturn();

  if (isLoading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  if (!data) {
    return <div className="p-6 text-center text-muted-foreground">Return not found</div>;
  }

  const { return: ret, lines } = data;
  const config = statusConfig[ret.status];

  const handleSubmitForPickup = async () => {
    await submitForPickup.mutateAsync(returnId);
  };

  const handleShip = async () => {
    await shipReturn.mutateAsync({ returnId, shippedDate });
  };

  const handleConfirmReceipt = async () => {
    await confirmReceipt.mutateAsync({ returnId, receivedDate });
  };

  const handleConfirmCredit = async () => {
    if (!creditNoteNumber) return;
    await confirmCredit.mutateAsync({ returnId, creditDate, creditNoteNumber });
  };

  const handleCancel = async () => {
    await cancelReturn.mutateAsync(returnId);
    onClose?.();
  };

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{ret.return_number}</h3>
          <p className="text-sm text-muted-foreground">
            {ret.suppliers?.company_name}
          </p>
        </div>
        <Badge variant={config.variant}>{config.label}</Badge>
      </div>

      <Separator />

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Return Date</p>
          <p className="font-medium">{format(new Date(ret.return_date), "MMM dd, yyyy")}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Reason</p>
          <p className="font-medium capitalize">{ret.return_reason.replace("_", " ")}</p>
        </div>
        {ret.purchase_orders?.po_number && (
          <div>
            <p className="text-muted-foreground">Purchase Order</p>
            <p className="font-medium">{ret.purchase_orders.po_number}</p>
          </div>
        )}
        {ret.inbound_deliveries?.delivery_number && (
          <div>
            <p className="text-muted-foreground">GRN</p>
            <p className="font-medium">{ret.inbound_deliveries.delivery_number}</p>
          </div>
        )}
        {ret.shipped_date && (
          <div>
            <p className="text-muted-foreground">Shipped Date</p>
            <p className="font-medium">{format(new Date(ret.shipped_date), "MMM dd, yyyy")}</p>
          </div>
        )}
        {ret.credit_note_number && (
          <div>
            <p className="text-muted-foreground">Credit Note #</p>
            <p className="font-medium">{ret.credit_note_number}</p>
          </div>
        )}
      </div>

      {ret.notes && (
        <div>
          <p className="text-sm text-muted-foreground">Notes</p>
          <p className="text-sm">{ret.notes}</p>
        </div>
      )}

      <Separator />

      {/* Line Items */}
      <div>
        <h4 className="font-medium mb-2">Line Items</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit Cost</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{line.products?.name}</p>
                    <p className="text-xs text-muted-foreground">{line.products?.sku}</p>
                    {line.inventory_batches?.batch_number && (
                      <p className="text-xs text-muted-foreground">
                        Batch: {line.inventory_batches.batch_number}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">{line.quantity_returned}</TableCell>
                <TableCell className="text-right">{formatCurrency(Number(line.unit_cost))}</TableCell>
                <TableCell className="text-right">{formatCurrency(Number(line.line_total))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex justify-end mt-2">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-xl font-bold">{formatCurrency(Number(ret.total_amount) || 0)}</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Actions based on status */}
      <div className="space-y-4">
        {ret.status === "draft" && (
          <div className="flex gap-2">
            <Button onClick={handleSubmitForPickup} disabled={submitForPickup.isPending}>
              <Send className="h-4 w-4 mr-2" />
              Submit for Pickup
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Return?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will cancel the purchase return. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Return</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancel}>Cancel Return</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {ret.status === "pending_pickup" && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Shipped Date</Label>
              <Input
                type="date"
                value={shippedDate}
                onChange={(e) => setShippedDate(e.target.value)}
                className="max-w-[200px]"
              />
            </div>
            <Button onClick={handleShip} disabled={shipReturn.isPending}>
              <Truck className="h-4 w-4 mr-2" />
              Mark as Shipped
            </Button>
            <p className="text-xs text-muted-foreground">
              Shipping will deduct items from inventory
            </p>
          </div>
        )}

        {ret.status === "shipped" && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Supplier Received Date</Label>
              <Input
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                className="max-w-[200px]"
              />
            </div>
            <Button onClick={handleConfirmReceipt} disabled={confirmReceipt.isPending}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Supplier Receipt
            </Button>
          </div>
        )}

        {ret.status === "received_by_supplier" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Credit Date</Label>
                <Input
                  type="date"
                  value={creditDate}
                  onChange={(e) => setCreditDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Credit Note Number *</Label>
                <Input
                  value={creditNoteNumber}
                  onChange={(e) => setCreditNoteNumber(e.target.value)}
                  placeholder="e.g., CN-2026-001"
                />
              </div>
            </div>
            <Button
              onClick={handleConfirmCredit}
              disabled={!creditNoteNumber || confirmCredit.isPending}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Record Credit Note
            </Button>
          </div>
        )}

        {ret.status === "credit_received" && (
          <div className="bg-primary/10 rounded-lg p-4 text-center">
            <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="font-medium">Return Complete</p>
            <p className="text-sm text-muted-foreground">
              Credit note {ret.credit_note_number} received on{" "}
              {ret.credit_date && format(new Date(ret.credit_date), "MMM dd, yyyy")}
            </p>
          </div>
        )}

        {ret.status === "cancelled" && (
          <div className="bg-destructive/10 rounded-lg p-4 text-center">
            <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="font-medium">Return Cancelled</p>
          </div>
        )}
      </div>
    </div>
  );
}
