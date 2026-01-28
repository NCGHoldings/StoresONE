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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInspectReturn, SalesReturnLine } from "@/hooks/useSalesReturns";
import { useStorageBins } from "@/hooks/useStorageZones";
import { ClipboardCheck } from "lucide-react";
import { toast } from "sonner";

interface InspectReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnId: string;
  lines: SalesReturnLine[];
  onClose: () => void;
}

interface LineInspection {
  lineId: string;
  quantityReceived: number;
  disposition: "restock" | "scrap" | "rework";
  binId: string;
  inspectionNotes: string;
}

export function InspectReturnDialog({
  open,
  onOpenChange,
  returnId,
  lines,
  onClose,
}: InspectReturnDialogProps) {
  const inspectReturn = useInspectReturn();
  const { data: allBins = [] } = useStorageBins();

  const [inspections, setInspections] = useState<LineInspection[]>([]);

  useEffect(() => {
    if (open && lines.length > 0) {
      setInspections(
        lines.map((l) => ({
          lineId: l.id,
          quantityReceived: l.quantity_returned,
          disposition: "restock",
          binId: l.bin_id || "",
          inspectionNotes: "",
        }))
      );
    }
  }, [open, lines]);

  // Filter to available/occupied bins only
  const availableBins = allBins.filter(
    (bin) => bin.is_active && (bin.status === "available" || bin.status === "occupied")
  );

  const handleInspectionChange = (
    index: number,
    field: keyof LineInspection,
    value: string | number
  ) => {
    const updated = [...inspections];
    (updated[index] as any)[field] = value;
    setInspections(updated);
  };

  const handleSubmit = async () => {
    // Validate that all restock items have a bin selected
    const missingBins = inspections.filter(
      (i) => i.disposition === "restock" && !i.binId
    );

    if (missingBins.length > 0) {
      toast.error("Please select a bin for all items marked for restock");
      return;
    }

    await inspectReturn.mutateAsync({
      returnId,
      lineUpdates: inspections.map((i) => ({
        lineId: i.lineId,
        quantityReceived: i.quantityReceived,
        disposition: i.disposition,
        binId: i.binId || null,
        inspectionNotes: i.inspectionNotes,
      })),
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Inspect Return Items
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Review each returned item and set the disposition (restock, scrap, or rework).
            Items marked for restock will be added back to inventory when the return is completed.
          </p>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left">Product</th>
                  <th className="px-3 py-2 text-center w-24">Expected</th>
                  <th className="px-3 py-2 text-center w-24">Received</th>
                  <th className="px-3 py-2 text-left w-32">Disposition</th>
                  <th className="px-3 py-2 text-left w-40">Bin (for restock)</th>
                  <th className="px-3 py-2 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={line.id} className="border-t">
                    <td className="px-3 py-2">
                      <p className="font-medium">{line.products?.name || "-"}</p>
                      <p className="text-xs text-muted-foreground">{line.products?.sku}</p>
                    </td>
                    <td className="px-3 py-2 text-center font-medium">
                      {line.quantity_returned}
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min="0"
                        max={line.quantity_returned}
                        value={inspections[idx]?.quantityReceived ?? line.quantity_returned}
                        onChange={(e) =>
                          handleInspectionChange(idx, "quantityReceived", parseInt(e.target.value) || 0)
                        }
                        className="h-8 text-center"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Select
                        value={inspections[idx]?.disposition ?? "restock"}
                        onValueChange={(v) =>
                          handleInspectionChange(idx, "disposition", v as "restock" | "scrap" | "rework")
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="restock">Restock</SelectItem>
                          <SelectItem value="scrap">Scrap</SelectItem>
                          <SelectItem value="rework">Rework</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2">
                      {inspections[idx]?.disposition === "restock" && (
                        <Select
                          value={inspections[idx]?.binId ?? ""}
                          onValueChange={(v) => handleInspectionChange(idx, "binId", v)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select bin" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableBins.map((bin) => (
                              <SelectItem key={bin.id} value={bin.id}>
                                {bin.storage_zones?.zone_code ? `${bin.storage_zones.zone_code} / ` : ""}
                                {bin.bin_code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={inspections[idx]?.inspectionNotes ?? ""}
                        onChange={(e) =>
                          handleInspectionChange(idx, "inspectionNotes", e.target.value)
                        }
                        placeholder="Notes..."
                        className="h-8"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={inspectReturn.isPending}>
            {inspectReturn.isPending ? "Saving..." : "Complete Inspection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
