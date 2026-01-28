import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Supplier, useCreateSupplier, useUpdateSupplier } from "@/hooks/useSuppliers";
import { useForm } from "react-hook-form";
import { useEffect } from "react";

interface SupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  onClose: () => void;
}

interface FormData {
  supplier_code: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  tax_id: string;
  payment_terms: number;
  category: string;
  industry: string;
  website: string;
  status: "active" | "inactive" | "pending" | "blacklisted";
  notes: string;
}

const categories = [
  "Raw Materials",
  "Packaging",
  "Equipment",
  "Services",
  "Logistics",
  "IT/Software",
  "Office Supplies",
  "Other",
];

const industries = [
  "Manufacturing",
  "Retail",
  "Technology",
  "Healthcare",
  "Food & Beverage",
  "Automotive",
  "Chemicals",
  "Logistics",
  "Other",
];

export function SupplierFormDialog({ open, onOpenChange, supplier, onClose }: SupplierFormDialogProps) {
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const isEditing = !!supplier;

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      supplier_code: "",
      company_name: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      country: "",
      tax_id: "",
      payment_terms: 30,
      category: "",
      industry: "",
      website: "",
      status: "pending",
      notes: "",
    },
  });

  useEffect(() => {
    if (supplier) {
      reset({
        supplier_code: supplier.supplier_code,
        company_name: supplier.company_name,
        contact_person: supplier.contact_person ?? "",
        email: supplier.email ?? "",
        phone: supplier.phone ?? "",
        address: supplier.address ?? "",
        city: supplier.city ?? "",
        country: supplier.country ?? "",
        tax_id: supplier.tax_id ?? "",
        payment_terms: supplier.payment_terms ?? 30,
        category: supplier.category ?? "",
        industry: supplier.industry ?? "",
        website: supplier.website ?? "",
        status: supplier.status,
        notes: supplier.notes ?? "",
      });
    } else {
      reset({
        supplier_code: `SUP-${Date.now().toString().slice(-6)}`,
        company_name: "",
        contact_person: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        country: "",
        tax_id: "",
        payment_terms: 30,
        category: "",
        industry: "",
        website: "",
        status: "pending",
        notes: "",
      });
    }
  }, [supplier, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing && supplier) {
        await updateSupplier.mutateAsync({ id: supplier.id, updates: data });
      } else {
        await createSupplier.mutateAsync({
          ...data,
          registration_date: new Date().toISOString().split("T")[0],
        });
      }
      onClose();
    } catch (error) {
      console.error("Error saving supplier:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier_code">Supplier Code</Label>
                <Input
                  id="supplier_code"
                  {...register("supplier_code", { required: "Required" })}
                  disabled={isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  {...register("company_name", { required: "Required" })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input id="contact_person" {...register("contact_person")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register("phone")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" {...register("website")} />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Address
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="address">Street Address</Label>
                <Input id="address" {...register("address")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" {...register("city")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" {...register("country")} />
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Business Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tax_id">Tax ID</Label>
                <Input id="tax_id" {...register("tax_id")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_terms">Payment Terms (days)</Label>
                <Input
                  id="payment_terms"
                  type="number"
                  {...register("payment_terms", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={watch("category")}
                  onValueChange={(value) => setValue("category", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Industry</Label>
                <Select
                  value={watch("industry")}
                  onValueChange={(value) => setValue("industry", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((ind) => (
                      <SelectItem key={ind} value={ind}>
                        {ind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="blacklisted">Blacklisted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} rows={3} />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createSupplier.isPending || updateSupplier.isPending}>
              {isEditing ? "Update Supplier" : "Create Supplier"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
