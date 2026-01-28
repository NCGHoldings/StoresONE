import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RiskFlag, useCreateRiskFlag, useUpdateRiskFlag } from "@/hooks/useRiskFlags";
import { useSuppliers, useUpdateSupplier } from "@/hooks/useSuppliers";
import { useForm } from "react-hook-form";
import { useEffect } from "react";

interface RiskFlagFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flag: RiskFlag | null;
  onClose: () => void;
}

interface FormData {
  supplier_id: string;
  flag_type: "warning" | "critical" | "blacklisted";
  reason: string;
}

export function RiskFlagFormDialog({ open, onOpenChange, flag, onClose }: RiskFlagFormDialogProps) {
  const { data: suppliers } = useSuppliers();
  const createRiskFlag = useCreateRiskFlag();
  const updateRiskFlag = useUpdateRiskFlag();
  const updateSupplier = useUpdateSupplier();
  const isEditing = !!flag;

  const { register, handleSubmit, reset, setValue, watch } = useForm<FormData>({
    defaultValues: {
      supplier_id: "",
      flag_type: "warning",
      reason: "",
    },
  });

  useEffect(() => {
    if (flag) {
      reset({
        supplier_id: flag.supplier_id,
        flag_type: flag.flag_type,
        reason: flag.reason,
      });
    } else {
      reset({
        supplier_id: "",
        flag_type: "warning",
        reason: "",
      });
    }
  }, [flag, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing && flag) {
        await updateRiskFlag.mutateAsync({ id: flag.id, updates: data });
      } else {
        await createRiskFlag.mutateAsync({
          ...data,
          flagged_by: null,
          flagged_date: new Date().toISOString(),
          is_active: true,
          resolution_date: null,
          resolution_notes: null,
          evidence_urls: null,
        });

        // If blacklisted, update supplier status
        if (data.flag_type === "blacklisted") {
          await updateSupplier.mutateAsync({
            id: data.supplier_id,
            updates: { status: "blacklisted" },
          });
        }
      }
      onClose();
    } catch (error) {
      console.error("Error saving risk flag:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "View Risk Flag" : "Add Risk Flag"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Supplier *</Label>
            <Select
              value={watch("supplier_id")}
              onValueChange={(value) => setValue("supplier_id", value)}
              disabled={isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers?.filter(s => s.status !== "blacklisted").map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.company_name} ({supplier.supplier_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Severity Level *</Label>
            <Select
              value={watch("flag_type")}
              onValueChange={(value) => setValue("flag_type", value as FormData["flag_type"])}
              disabled={isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="blacklisted">Blacklisted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              {...register("reason", { required: "Required" })}
              rows={4}
              placeholder="Describe the reason for this risk flag..."
              disabled={isEditing}
            />
          </div>

          {/* Resolution info for existing flags */}
          {isEditing && flag && !flag.is_active && (
            <div className="space-y-2 p-4 bg-success/10 rounded-lg">
              <p className="text-sm font-medium text-success">Resolved</p>
              <p className="text-sm text-muted-foreground">{flag.resolution_notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              {isEditing ? "Close" : "Cancel"}
            </Button>
            {!isEditing && (
              <Button type="submit" disabled={createRiskFlag.isPending}>
                Add Risk Flag
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
