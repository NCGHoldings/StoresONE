import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Truck } from "lucide-react";

interface ShippingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  soNumber: string;
  onConfirmShipment: (data: { carrier: string; trackingNumber: string }) => Promise<void>;
  isPending: boolean;
}

const CARRIERS = [
  { value: "dhl", label: "DHL" },
  { value: "fedex", label: "FedEx" },
  { value: "ups", label: "UPS" },
  { value: "usps", label: "USPS" },
  { value: "aramex", label: "Aramex" },
  { value: "tnt", label: "TNT" },
  { value: "other", label: "Other" },
];

export function ShippingDialog({
  open,
  onOpenChange,
  soNumber,
  onConfirmShipment,
  isPending,
}: ShippingDialogProps) {
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  const handleConfirm = async () => {
    await onConfirmShipment({ carrier, trackingNumber });
    setCarrier("");
    setTrackingNumber("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Ship Order {soNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="carrier">Carrier</Label>
            <Select value={carrier} onValueChange={setCarrier}>
              <SelectTrigger id="carrier">
                <SelectValue placeholder="Select carrier" />
              </SelectTrigger>
              <SelectContent>
                {CARRIERS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tracking">Tracking Number</Label>
            <Input
              id="tracking"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter tracking number"
            />
          </div>

          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            <p className="text-muted-foreground">
              Confirming shipment will:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Deduct picked quantities from inventory</li>
              <li>Update order status to "Shipped"</li>
              <li>Update shipment record with tracking info</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!carrier || isPending}>
            {isPending ? "Shipping..." : "Confirm Shipment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
