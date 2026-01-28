import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Customer, useCreateCustomer, useUpdateCustomer, generateCustomerCode } from "@/hooks/useCustomers";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onClose: () => void;
}

interface FormData {
  customer_code: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  billing_address: string;
  shipping_address: string;
  tax_id: string;
  payment_terms: number;
  credit_limit: number;
  status: string;
  notes: string;
}

export function CustomerFormDialog({ open, onOpenChange, customer, onClose }: CustomerFormDialogProps) {
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const isEditing = !!customer;
  const [generatedCode, setGeneratedCode] = useState("");

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      customer_code: "",
      company_name: "",
      contact_person: "",
      email: "",
      phone: "",
      billing_address: "",
      shipping_address: "",
      tax_id: "",
      payment_terms: 30,
      credit_limit: 0,
      status: "active",
      notes: "",
    },
  });

  useEffect(() => {
    if (customer) {
      reset({
        customer_code: customer.customer_code,
        company_name: customer.company_name,
        contact_person: customer.contact_person ?? "",
        email: customer.email ?? "",
        phone: customer.phone ?? "",
        billing_address: customer.billing_address ?? "",
        shipping_address: customer.shipping_address ?? "",
        tax_id: customer.tax_id ?? "",
        payment_terms: customer.payment_terms ?? 30,
        credit_limit: customer.credit_limit ?? 0,
        status: customer.status,
        notes: customer.notes ?? "",
      });
    } else {
      generateCustomerCode().then((code) => {
        setGeneratedCode(code);
        reset({
          customer_code: code,
          company_name: "",
          contact_person: "",
          email: "",
          phone: "",
          billing_address: "",
          shipping_address: "",
          tax_id: "",
          payment_terms: 30,
          credit_limit: 0,
          status: "active",
          notes: "",
        });
      });
    }
  }, [customer, reset, open]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing && customer) {
        await updateCustomer.mutateAsync({
          id: customer.id,
          updates: {
            company_name: data.company_name,
            contact_person: data.contact_person || null,
            email: data.email || null,
            phone: data.phone || null,
            billing_address: data.billing_address || null,
            shipping_address: data.shipping_address || null,
            tax_id: data.tax_id || null,
            payment_terms: data.payment_terms,
            credit_limit: data.credit_limit,
            status: data.status as Customer["status"],
            notes: data.notes || null,
          },
        });
      } else {
        await createCustomer.mutateAsync({
          customer_code: data.customer_code,
          company_name: data.company_name,
          contact_person: data.contact_person || null,
          email: data.email || null,
          phone: data.phone || null,
          billing_address: data.billing_address || null,
          shipping_address: data.shipping_address || null,
          tax_id: data.tax_id || null,
          payment_terms: data.payment_terms,
          credit_limit: data.credit_limit,
          status: data.status as Customer["status"],
          notes: data.notes || null,
        });
      }
      onClose();
    } catch (error) {
      console.error("Error saving customer:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Customer" : "New Customer"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_code">Customer Code</Label>
              <Input id="customer_code" {...register("customer_code")} disabled />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={watch("status")}
                onValueChange={(value) => setValue("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name *</Label>
            <Input
              id="company_name"
              {...register("company_name", { required: "Company name is required" })}
              placeholder="Enter company name"
            />
            {errors.company_name && (
              <p className="text-sm text-destructive">{errors.company_name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                {...register("contact_person")}
                placeholder="Primary contact name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="contact@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="+1 234 567 8900"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_id">Tax ID</Label>
              <Input
                id="tax_id"
                {...register("tax_id")}
                placeholder="Tax identification number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing_address">Billing Address</Label>
            <Textarea
              id="billing_address"
              {...register("billing_address")}
              rows={2}
              placeholder="Enter billing address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipping_address">Shipping Address</Label>
            <Textarea
              id="shipping_address"
              {...register("shipping_address")}
              rows={2}
              placeholder="Enter shipping address (if different from billing)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_terms">Payment Terms (days)</Label>
              <Input
                id="payment_terms"
                type="number"
                {...register("payment_terms", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credit_limit">Credit Limit</Label>
              <Input
                id="credit_limit"
                type="number"
                step="0.01"
                {...register("credit_limit", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} rows={2} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createCustomer.isPending || updateCustomer.isPending}
            >
              {isEditing ? "Save Changes" : "Create Customer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
