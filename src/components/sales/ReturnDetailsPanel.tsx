import { useState } from "react";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  useSalesReturnDetails,
  useReceiveReturn,
  useCompleteReturn,
  useRejectReturn,
} from "@/hooks/useSalesReturns";
import { useFormatCurrency, useFormatDate } from "@/lib/formatters";
import { RotateCcw, Package, CheckCircle2, XCircle, ClipboardCheck } from "lucide-react";
import { ReceiveReturnDialog } from "./ReceiveReturnDialog";
import { InspectReturnDialog } from "./InspectReturnDialog";

interface ReturnDetailsPanelProps {
  returnId: string;
  onClose: () => void;
}

const REASON_LABELS: Record<string, string> = {
  defective: "Defective Product",
  wrong_item: "Wrong Item Sent",
  damaged: "Damaged in Transit",
  customer_request: "Customer Request",
  other: "Other",
};

const DISPOSITION_LABELS: Record<string, string> = {
  restock: "Restock",
  scrap: "Scrap",
  rework: "Rework",
};

export function ReturnDetailsPanel({ returnId, onClose }: ReturnDetailsPanelProps) {
  const { data, isLoading } = useSalesReturnDetails(returnId);
  const receiveReturn = useReceiveReturn();
  const completeReturn = useCompleteReturn();
  const rejectReturn = useRejectReturn();
  const formatCurrency = useFormatCurrency();
  const formatDate = useFormatDate();

  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [showInspectDialog, setShowInspectDialog] = useState(false);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { return: ret, lines } = data;

  const handleReceive = async (receivedDate: string) => {
    await receiveReturn.mutateAsync({ returnId, receivedDate });
    setShowReceiveDialog(false);
  };

  const handleComplete = async () => {
    await completeReturn.mutateAsync(returnId);
  };

  const handleReject = async () => {
    if (confirm("Are you sure you want to reject this return?")) {
      await rejectReturn.mutateAsync({ returnId, reason: "Return rejected by user" });
    }
  };

  const totalReturned = lines.reduce((sum, l) => sum + l.quantity_returned, 0);
  const totalReceived = lines.reduce((sum, l) => sum + (l.quantity_received || 0), 0);

  return (
    <div className="space-y-6">
      <SheetHeader>
        <div className="flex items-center justify-between">
          <SheetTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            {ret.return_number}
          </SheetTitle>
          <StatusBadge status={ret.status} />
        </div>
      </SheetHeader>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Customer</p>
            <p className="font-medium">{ret.customers?.company_name || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Sales Order</p>
            <p className="font-medium">{ret.sales_orders?.so_number || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Return Date</p>
            <p className="font-medium">{formatDate(ret.return_date)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Received Date</p>
            <p className="font-medium">{ret.received_date ? formatDate(ret.received_date) : "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Reason</p>
            <Badge variant="secondary">{REASON_LABELS[ret.return_reason] || ret.return_reason}</Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Credit Value</p>
            <p className="font-medium text-lg">{formatCurrency(ret.total_amount)}</p>
          </div>
          {ret.completed_date && (
            <div>
              <p className="text-sm text-muted-foreground">Completed Date</p>
              <p className="font-medium">{formatDate(ret.completed_date)}</p>
            </div>
          )}
        </div>

        {ret.reason_notes && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Notes</p>
            <p className="text-sm">{ret.reason_notes}</p>
          </div>
        )}

        {/* Summary */}
        {ret.status !== "pending" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold">{totalReturned}</p>
              <p className="text-sm text-muted-foreground">Items Returned</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold">{totalReceived}</p>
              <p className="text-sm text-muted-foreground">Items Received</p>
            </div>
          </div>
        )}

        <Separator />

        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Return Items ({lines.length})
          </h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Product</th>
                  <th className="px-3 py-2 text-center">Returned</th>
                  <th className="px-3 py-2 text-center">Received</th>
                  <th className="px-3 py-2 text-left">Disposition</th>
                  <th className="px-3 py-2 text-right">Value</th>
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
                    </td>
                    <td className="px-3 py-2 text-center">{line.quantity_returned}</td>
                    <td className="px-3 py-2 text-center">{line.quantity_received ?? "-"}</td>
                    <td className="px-3 py-2">
                      {line.disposition ? (
                        <Badge
                          variant={
                            line.disposition === "restock"
                              ? "default"
                              : line.disposition === "scrap"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {DISPOSITION_LABELS[line.disposition]}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {formatCurrency(line.total_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/50">
                <tr>
                  <td colSpan={5} className="px-3 py-2 text-right font-medium">
                    Total:
                  </td>
                  <td className="px-3 py-2 text-right font-bold">
                    {formatCurrency(ret.total_amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <Separator />

        <div className="flex flex-wrap gap-3">
          {ret.status === "pending" && (
            <>
              <Button onClick={() => setShowReceiveDialog(true)}>
                <Package className="h-4 w-4 mr-2" />
                Mark as Received
              </Button>
              <Button variant="destructive" onClick={handleReject}>
                <XCircle className="h-4 w-4 mr-2" />
                Reject Return
              </Button>
            </>
          )}
          {ret.status === "received" && (
            <Button onClick={() => setShowInspectDialog(true)}>
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Inspect Items
            </Button>
          )}
          {ret.status === "inspected" && (
            <Button onClick={handleComplete} disabled={completeReturn.isPending}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete & Update Inventory
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      <ReceiveReturnDialog
        open={showReceiveDialog}
        onOpenChange={setShowReceiveDialog}
        returnNumber={ret.return_number}
        onConfirm={handleReceive}
        isPending={receiveReturn.isPending}
      />

      <InspectReturnDialog
        open={showInspectDialog}
        onOpenChange={setShowInspectDialog}
        returnId={returnId}
        lines={lines}
        onClose={() => setShowInspectDialog(false)}
      />
    </div>
  );
}
