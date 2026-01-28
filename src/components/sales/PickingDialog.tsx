import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Package, MapPin, CheckCircle } from "lucide-react";
import { SalesOrderLine } from "@/hooks/useSalesOrders";

interface PickingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lines: SalesOrderLine[];
  soNumber: string;
  onConfirmPicking: (pickedLines: { lineId: string; quantityPicked: number }[]) => Promise<void>;
  isPending: boolean;
}

export function PickingDialog({
  open,
  onOpenChange,
  lines,
  soNumber,
  onConfirmPicking,
  isPending,
}: PickingDialogProps) {
  const [pickedQuantities, setPickedQuantities] = useState<Record<string, number>>({});

  // Initialize quantities based on reserved amounts
  useEffect(() => {
    if (open && lines.length > 0) {
      const initialQty: Record<string, number> = {};
      lines.forEach((line) => {
        initialQty[line.id] = line.quantity_reserved || 0;
      });
      setPickedQuantities(initialQty);
    }
  }, [open, lines]);

  const handleQuantityChange = (lineId: string, value: string) => {
    const qty = parseInt(value, 10);
    if (!isNaN(qty) && qty >= 0) {
      setPickedQuantities((prev) => ({ ...prev, [lineId]: qty }));
    }
  };

  const handleConfirm = async () => {
    const pickedLines = lines.map((line) => ({
      lineId: line.id,
      quantityPicked: pickedQuantities[line.id] || 0,
    }));
    await onConfirmPicking(pickedLines);
    onOpenChange(false);
  };

  const totalToPick = lines.reduce((sum, l) => sum + (l.quantity_reserved || 0), 0);
  const totalPicked = Object.values(pickedQuantities).reduce((sum, qty) => sum + qty, 0);
  const allValid = lines.every(
    (line) => (pickedQuantities[line.id] || 0) <= (line.quantity_reserved || 0)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Pick Items for {soNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Total to Pick</p>
              <p className="text-xl font-bold">{totalToPick}</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Currently Picked</p>
              <p className="text-xl font-bold">{totalPicked}</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="text-xl font-bold">{totalToPick - totalPicked}</p>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Product</th>
                  <th className="px-3 py-2 text-center">Bin Location</th>
                  <th className="px-3 py-2 text-center">Reserved</th>
                  <th className="px-3 py-2 text-center">Pick Qty</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => {
                  const pickedQty = pickedQuantities[line.id] || 0;
                  const maxQty = line.quantity_reserved || 0;
                  const isComplete = pickedQty === maxQty;
                  const isOver = pickedQty > maxQty;

                  return (
                    <tr key={line.id} className="border-t">
                      <td className="px-3 py-2">{line.line_number}</td>
                      <td className="px-3 py-2">
                        <p className="font-medium">{line.products?.name || "-"}</p>
                        {line.products?.sku && (
                          <p className="text-xs text-muted-foreground">{line.products.sku}</p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {line.storage_bins?.bin_code ? (
                          <Badge variant="outline" className="gap-1">
                            <MapPin className="h-3 w-3" />
                            {line.storage_bins.bin_code}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center font-medium">{maxQty}</td>
                      <td className="px-3 py-2">
                        <div className="flex justify-center">
                          <Input
                            type="number"
                            min={0}
                            max={maxQty}
                            value={pickedQty}
                            onChange={(e) => handleQuantityChange(line.id, e.target.value)}
                            className={`w-20 text-center ${isOver ? "border-destructive" : isComplete ? "border-green-500" : ""}`}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {isComplete ? (
                          <Badge variant="default" className="bg-green-600 gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Complete
                          </Badge>
                        ) : isOver ? (
                          <Badge variant="destructive">Over</Badge>
                        ) : (
                          <StatusBadge status="picking" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!allValid || totalPicked === 0 || isPending}
          >
            {isPending ? "Confirming..." : "Confirm Picking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
