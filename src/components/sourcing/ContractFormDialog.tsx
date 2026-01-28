import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Contract, useCreateContract, useUpdateContract } from "@/hooks/useContracts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { useDefaultCurrency } from "@/lib/formatters";

interface ContractFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: Contract | null;
  onClose: () => void;
}

interface FormData {
  contract_number: string;
  supplier_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  value: number;
  currency: string;
  terms_conditions: string;
  status: "draft" | "active" | "expired" | "terminated" | "renewed";
  auto_renewal: boolean;
  notice_period_days: number;
  signed_date: string;
  signed_by: string;
}

export function ContractFormDialog({ open, onOpenChange, contract, onClose }: ContractFormDialogProps) {
  const { data: suppliers } = useSuppliers();
  const createContract = useCreateContract();
  const updateContract = useUpdateContract();
  const isEditing = !!contract;
  const defaultCurrency = useDefaultCurrency();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      contract_number: "",
      supplier_id: "",
      title: "",
      description: "",
      start_date: "",
      end_date: "",
      value: 0,
      currency: defaultCurrency,
      terms_conditions: "",
      status: "draft",
      auto_renewal: false,
      notice_period_days: 30,
      signed_date: "",
      signed_by: "",
    },
  });

  useEffect(() => {
    if (contract) {
      reset({
        contract_number: contract.contract_number,
        supplier_id: contract.supplier_id,
        title: contract.title,
        description: contract.description ?? "",
        start_date: contract.start_date,
        end_date: contract.end_date,
        value: contract.value ?? 0,
        currency: contract.currency ?? defaultCurrency,
        terms_conditions: contract.terms_conditions ?? "",
        status: contract.status,
        auto_renewal: contract.auto_renewal ?? false,
        notice_period_days: contract.notice_period_days ?? 30,
        signed_date: contract.signed_date ?? "",
        signed_by: contract.signed_by ?? "",
      });
    } else {
      reset({
        contract_number: `CON-${Date.now().toString().slice(-6)}`,
        supplier_id: "",
        title: "",
        description: "",
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
        value: 0,
        currency: defaultCurrency,
        terms_conditions: "",
        status: "draft",
        auto_renewal: false,
        notice_period_days: 30,
        signed_date: "",
        signed_by: "",
      });
    }
  }, [contract, reset, defaultCurrency]);

  const onSubmit = async (data: FormData) => {
    try {
      const contractData = {
        ...data,
        value: data.value || null,
        signed_date: data.signed_date || null,
        signed_by: data.signed_by || null,
        document_url: null,
      };

      if (isEditing && contract) {
        await updateContract.mutateAsync({ id: contract.id, updates: contractData });
      } else {
        await createContract.mutateAsync(contractData);
      }
      onClose();
    } catch (error) {
      console.error("Error saving contract:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Contract" : "Create New Contract"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Contract Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contract_number">Contract Number</Label>
                <Input
                  id="contract_number"
                  {...register("contract_number", { required: "Required" })}
                  disabled={isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label>Supplier *</Label>
                <Select
                  value={watch("supplier_id")}
                  onValueChange={(value) => setValue("supplier_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.filter(s => s.status === "active").map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.company_name} ({supplier.supplier_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  {...register("title", { required: "Required" })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...register("description")} rows={2} />
              </div>
            </div>
          </div>

          {/* Dates and Value */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Duration & Value
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input id="start_date" type="date" {...register("start_date", { required: "Required" })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date *</Label>
                <Input id="end_date" type="date" {...register("end_date", { required: "Required" })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Contract Value</Label>
                <Input id="value" type="number" {...register("value", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={watch("currency")}
                  onValueChange={(value) => setValue("currency", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="SGD">SGD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Renewal Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Renewal Settings
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Switch
                  id="auto_renewal"
                  checked={watch("auto_renewal")}
                  onCheckedChange={(checked) => setValue("auto_renewal", checked)}
                />
                <Label htmlFor="auto_renewal">Auto Renewal</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notice_period_days">Notice Period (days)</Label>
                <Input
                  id="notice_period_days"
                  type="number"
                  {...register("notice_period_days", { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          {/* Status and Signature */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Status & Signature
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(value) => setValue("status", value as FormData["status"])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                    <SelectItem value="renewed">Renewed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signed_date">Signed Date</Label>
                <Input id="signed_date" type="date" {...register("signed_date")} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="signed_by">Signed By</Label>
                <Input id="signed_by" {...register("signed_by")} placeholder="Name and title" />
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="space-y-2">
            <Label htmlFor="terms_conditions">Terms & Conditions</Label>
            <Textarea id="terms_conditions" {...register("terms_conditions")} rows={4} />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createContract.isPending || updateContract.isPending}>
              {isEditing ? "Update Contract" : "Create Contract"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
