import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OutboundShipment, useCreateOutboundShipment } from "@/hooks/useOutboundShipments";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { StatusBadge } from "@/components/shared/StatusBadge";

interface OutboundFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: OutboundShipment | null;
  onClose: () => void;
}

interface FormData {
  shipment_number: string;
  customer_name: string;
  customer_address: string;
  ship_date: string;
  carrier: string;
  total_items: number;
  priority: string;
  notes: string;
}

export function OutboundFormDialog({ open, onOpenChange, shipment, onClose }: OutboundFormDialogProps) {
  const createShipment = useCreateOutboundShipment();
  const isViewing = !!shipment;

  const { register, handleSubmit, reset, setValue, watch } = useForm<FormData>({
    defaultValues: {
      shipment_number: "",
      customer_name: "",
      customer_address: "",
      ship_date: "",
      carrier: "",
      total_items: 0,
      priority: "normal",
      notes: "",
    },
  });

  useEffect(() => {
    if (shipment) {
      reset({
        shipment_number: shipment.shipment_number,
        customer_name: shipment.customer_name ?? "",
        customer_address: shipment.customer_address ?? "",
        ship_date: shipment.ship_date ?? "",
        carrier: shipment.carrier ?? "",
        total_items: shipment.total_items ?? 0,
        priority: shipment.priority ?? "normal",
        notes: shipment.notes ?? "",
      });
    } else {
      reset({
        shipment_number: `SHP-${Date.now().toString().slice(-6)}`,
        customer_name: "",
        customer_address: "",
        ship_date: "",
        carrier: "",
        total_items: 0,
        priority: "normal",
        notes: "",
      });
    }
  }, [shipment, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      await createShipment.mutateAsync({
        shipment_number: data.shipment_number,
        customer_name: data.customer_name || null,
        customer_address: data.customer_address || null,
        sales_order_id: null,
        ship_date: data.ship_date || null,
        carrier: data.carrier || null,
        tracking_number: null,
        status: "pending",
        total_items: data.total_items,
        shipped_items: 0,
        weight: null,
        shipping_cost: null,
        priority: data.priority,
        picked_by: null,
        packed_by: null,
        shipped_by: null,
        notes: data.notes || null,
      });
      onClose();
    } catch (error) {
      console.error("Error creating shipment:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isViewing ? "Shipment Details" : "New Outbound Shipment"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {isViewing && shipment && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Status:</span>
              <StatusBadge status={shipment.status} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shipment_number">Shipment Number</Label>
              <Input id="shipment_number" {...register("shipment_number")} disabled />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={watch("priority")}
                onValueChange={(value) => setValue("priority", value)}
                disabled={isViewing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_name">Customer Name</Label>
            <Input
              id="customer_name"
              {...register("customer_name")}
              disabled={isViewing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_address">Customer Address</Label>
            <Textarea
              id="customer_address"
              {...register("customer_address")}
              rows={2}
              disabled={isViewing}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ship_date">Ship Date</Label>
              <Input
                id="ship_date"
                type="date"
                {...register("ship_date")}
                disabled={isViewing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_items">Total Items</Label>
              <Input
                id="total_items"
                type="number"
                {...register("total_items", { valueAsNumber: true })}
                disabled={isViewing}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="carrier">Carrier</Label>
            <Input
              id="carrier"
              {...register("carrier")}
              placeholder="e.g., DHL, FedEx, UPS"
              disabled={isViewing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} rows={2} disabled={isViewing} />
          </div>

          {isViewing && shipment && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
              <div>
                <span className="text-sm text-muted-foreground">Shipped Items:</span>
                <p className="font-medium">{shipment.shipped_items ?? 0} / {shipment.total_items ?? 0}</p>
              </div>
              {shipment.tracking_number && (
                <div>
                  <span className="text-sm text-muted-foreground">Tracking:</span>
                  <p className="font-medium">{shipment.tracking_number}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              {isViewing ? "Close" : "Cancel"}
            </Button>
            {!isViewing && (
              <Button type="submit" disabled={createShipment.isPending}>
                Create Shipment
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
