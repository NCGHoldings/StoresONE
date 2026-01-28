import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Customer {
  id: string;
  customer_code: string;
  company_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  billing_address: string | null;
  shipping_address: string | null;
  tax_id: string | null;
  payment_terms: number | null;
  credit_limit: number | null;
  status: "active" | "inactive" | "on_hold";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type CustomerInsert = Omit<Customer, "id" | "created_at" | "updated_at">;
export type CustomerUpdate = Partial<CustomerInsert>;

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("company_name", { ascending: true });

      if (error) throw error;
      return data as Customer[];
    },
  });
}

export function useCustomer(id: string | null) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Customer;
    },
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customer: CustomerInsert) => {
      const { data, error } = await supabase
        .from("customers")
        .insert(customer)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create customer: " + error.message);
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: CustomerUpdate }) => {
      const { data, error } = await supabase
        .from("customers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update customer: " + error.message);
    },
  });
}

export function useCustomerStats() {
  return useQuery({
    queryKey: ["customers", "stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("status");

      if (error) throw error;

      const stats = {
        total: data.length,
        active: data.filter((c) => c.status === "active").length,
        inactive: data.filter((c) => c.status === "inactive").length,
        on_hold: data.filter((c) => c.status === "on_hold").length,
      };

      return stats;
    },
  });
}

export async function generateCustomerCode(): Promise<string> {
  const { data } = await supabase
    .from("customers")
    .select("customer_code")
    .order("created_at", { ascending: false })
    .limit(1);

  const lastCode = data?.[0]?.customer_code;
  let nextNumber = 1;

  if (lastCode) {
    const match = lastCode.match(/CUST-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `CUST-${nextNumber.toString().padStart(4, "0")}`;
}
