import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InboundDelivery, useCreateInboundDelivery } from "@/hooks/useInboundDeliveries";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { StatusBadge } from "@/components/shared/StatusBadge";

interface InboundFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  delivery: InboundDelivery | null;
  onClose: () => void;
}

interface FormData {
  delivery_number: string;
  supplier_id: string;
  expected_date: string;
  carrier: string;
  tracking_number: string;
  dock_door: string;
  total_items: number;
  notes: string;
}

export function InboundFormDialog({ open, onOpenChange, delivery, onClose }: InboundFormDialogProps) {
  const { data: suppliers } = useSuppliers();
  const createDelivery = useCreateInboundDelivery();
  const isViewing = !!delivery;

  const { register, handleSubmit, reset, setValue, watch } = useForm<FormData>({
    defaultValues: {
      delivery_number: "",
      supplier_id: "",
      expected_date: "",
      carrier: "",
      tracking_number: "",
      dock_door: "",
      total_items: 0,
      notes: "",
    },
  });

  useEffect(() => {
    if (delivery) {
      reset({
        delivery_number: delivery.delivery_number,
        supplier_id: delivery.supplier_id ?? "",
        expected_date: delivery.expected_date ?? "",
        carrier: delivery.carrier ?? "",
        tracking_number: delivery.tracking_number ?? "",
        dock_door: delivery.dock_door ?? "",
        total_items: delivery.total_items ?? 0,
        notes: delivery.notes ?? "",
      });
    } else {
      reset({
        delivery_number: `DEL-${Date.now().toString().slice(-6)}`,
        supplier_id: "",
        expected_date: "",
        carrier: "",
        tracking_number: "",
        dock_door: "",
        total_items: 0,
        notes: "",
      });
    }
  }, [delivery, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      await createDelivery.mutateAsync({
        delivery_number: data.delivery_number,
        supplier_id: data.supplier_id || null,
        po_id: null,
        expected_date: data.expected_date || null,
        actual_date: null,
        status: "scheduled",
        carrier: data.carrier || null,
        tracking_number: data.tracking_number || null,
        dock_door: data.dock_door || null,
        total_items: data.total_items,
        received_items: 0,
        discrepancy_notes: null,
        quality_check_passed: null,
        received_by: null,
        notes: data.notes || null,
      });
      onClose();
    } catch (error) {
      console.error("Error creating delivery:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isViewing ? "Delivery Details" : "New Inbound Delivery"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {isViewing && delivery && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Status:</span>
              <StatusBadge status={delivery.status} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="delivery_number">Delivery Number</Label>
              <Input id="delivery_number" {...register("delivery_number")} disabled />
            </div>
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Select
                value={watch("supplier_id")}
                onValueChange={(value) => setValue("supplier_id", value)}
                disabled={isViewing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.filter(s => s.status === "active").map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expected_date">Expected Date</Label>
              <Input
                id="expected_date"
                type="date"
                {...register("expected_date")}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="carrier">Carrier</Label>
              <Input
                id="carrier"
                {...register("carrier")}
                placeholder="e.g., DHL, FedEx"
                disabled={isViewing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tracking_number">Tracking Number</Label>
              <Input
                id="tracking_number"
                {...register("tracking_number")}
                disabled={isViewing}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dock_door">Dock Door</Label>
            <Input
              id="dock_door"
              {...register("dock_door")}
              placeholder="e.g., Dock 1"
              disabled={isViewing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} rows={2} disabled={isViewing} />
          </div>

          {isViewing && delivery && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
              <div>
                <span className="text-sm text-muted-foreground">Received Items:</span>
                <p className="font-medium">{delivery.received_items ?? 0} / {delivery.total_items ?? 0}</p>
              </div>
              {delivery.actual_date && (
                <div>
                  <span className="text-sm text-muted-foreground">Actual Date:</span>
                  <p className="font-medium">{delivery.actual_date}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              {isViewing ? "Close" : "Cancel"}
            </Button>
            {!isViewing && (
              <Button type="submit" disabled={createDelivery.isPending}>
                Create Delivery
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
