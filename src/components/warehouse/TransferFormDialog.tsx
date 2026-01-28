import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StockTransfer, useCreateStockTransfer } from "@/hooks/useStockTransfers";
import { useStorageBins, useProducts } from "@/hooks/useWarehouse";
import { useForm } from "react-hook-form";
import { useEffect } from "react";

interface TransferFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transfer: StockTransfer | null;
  onClose: () => void;
}

interface FormData {
  transfer_number: string;
  from_bin_id: string;
  to_bin_id: string;
  product_id: string;
  quantity: number;
  reason: string;
  priority: string;
  notes: string;
}

export function TransferFormDialog({ open, onOpenChange, transfer, onClose }: TransferFormDialogProps) {
  const { data: bins } = useStorageBins();
  const { data: products } = useProducts();
  const createTransfer = useCreateStockTransfer();
  const isViewing = !!transfer;

  const { register, handleSubmit, reset, setValue, watch } = useForm<FormData>({
    defaultValues: {
      transfer_number: "",
      from_bin_id: "",
      to_bin_id: "",
      product_id: "",
      quantity: 1,
      reason: "",
      priority: "normal",
      notes: "",
    },
  });

  useEffect(() => {
    if (transfer) {
      reset({
        transfer_number: transfer.transfer_number,
        from_bin_id: transfer.from_bin_id ?? "",
        to_bin_id: transfer.to_bin_id ?? "",
        product_id: transfer.product_id ?? "",
        quantity: transfer.quantity,
        reason: transfer.reason ?? "",
        priority: transfer.priority ?? "normal",
        notes: transfer.notes ?? "",
      });
    } else {
      reset({
        transfer_number: `TRF-${Date.now().toString().slice(-6)}`,
        from_bin_id: "",
        to_bin_id: "",
        product_id: "",
        quantity: 1,
        reason: "",
        priority: "normal",
        notes: "",
      });
    }
  }, [transfer, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      await createTransfer.mutateAsync({
        transfer_number: data.transfer_number,
        from_bin_id: data.from_bin_id || null,
        to_bin_id: data.to_bin_id || null,
        product_id: data.product_id || null,
        quantity: data.quantity,
        transfer_date: new Date().toISOString().split("T")[0],
        reason: data.reason || null,
        status: "pending",
        priority: data.priority,
        notes: data.notes || null,
        created_by: null,
        completed_by: null,
        completed_at: null,
      });
      onClose();
    } catch (error) {
      console.error("Error creating transfer:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isViewing ? "Transfer Details" : "New Stock Transfer"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transfer_number">Transfer Number</Label>
            <Input id="transfer_number" {...register("transfer_number")} disabled />
          </div>

          <div className="space-y-2">
            <Label>Product *</Label>
            <Select
              value={watch("product_id")}
              onValueChange={(value) => setValue("product_id", value)}
              disabled={isViewing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products?.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From Bin *</Label>
              <Select
                value={watch("from_bin_id")}
                onValueChange={(value) => setValue("from_bin_id", value)}
                disabled={isViewing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bin" />
                </SelectTrigger>
                <SelectContent>
                  {bins?.map((bin) => (
                    <SelectItem key={bin.id} value={bin.id}>
                      {bin.bin_code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>To Bin *</Label>
              <Select
                value={watch("to_bin_id")}
                onValueChange={(value) => setValue("to_bin_id", value)}
                disabled={isViewing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bin" />
                </SelectTrigger>
                <SelectContent>
                  {bins?.filter(b => b.id !== watch("from_bin_id")).map((bin) => (
                    <SelectItem key={bin.id} value={bin.id}>
                      {bin.bin_code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                {...register("quantity", { valueAsNumber: true, required: true, min: 1 })}
                disabled={isViewing}
              />
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
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              {...register("reason")}
              placeholder="e.g., Restock, Consolidation, Optimization"
              disabled={isViewing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} rows={2} disabled={isViewing} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              {isViewing ? "Close" : "Cancel"}
            </Button>
            {!isViewing && (
              <Button type="submit" disabled={createTransfer.isPending}>
                Create Transfer
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
