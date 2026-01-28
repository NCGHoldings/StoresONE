import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CustomerAdvance {
  id: string;
  advance_number: string;
  customer_id: string;
  receipt_id: string | null;
  advance_date: string;
  original_amount: number;
  remaining_amount: number;
  notes: string | null;
  status: string | null;
  created_by: string | null;
  created_at: string;
  customers?: {
    company_name: string;
    customer_code: string;
  };
  customer_receipts?: {
    receipt_number: string;
  };
}

export interface AdvanceAllocation {
  id: string;
  advance_id: string;
  invoice_id: string;
  amount: number;
  allocated_at: string;
  customer_invoices?: {
    invoice_number: string;
    total_amount: number;
  };
}

export interface AdvanceFormData {
  customer_id: string;
  receipt_id?: string | null;
  advance_date: string;
  original_amount: number;
  notes?: string;
}

export function useCustomerAdvances(status?: string) {
  return useQuery({
    queryKey: ["customer-advances", status],
    queryFn: async () => {
      let query = supabase
        .from("customer_advances")
        .select(`
          *,
          customers(company_name, customer_code),
          customer_receipts(receipt_number)
        `)
        .order("created_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CustomerAdvance[];
    },
  });
}

export function useCustomerAdvance(id: string | null) {
  return useQuery({
    queryKey: ["customer-advances", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("customer_advances")
        .select(`
          *,
          customers(company_name, customer_code),
          customer_receipts(receipt_number)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as CustomerAdvance;
    },
    enabled: !!id,
  });
}

export function useAdvanceAllocations(advanceId: string | null) {
  return useQuery({
    queryKey: ["advance-allocations", advanceId],
    queryFn: async () => {
      if (!advanceId) return [];
      const { data, error } = await supabase
        .from("advance_allocations")
        .select(`
          *,
          customer_invoices(invoice_number, total_amount)
        `)
        .eq("advance_id", advanceId);

      if (error) throw error;
      return data as AdvanceAllocation[];
    },
    enabled: !!advanceId,
  });
}

export function useAdvanceStats() {
  return useQuery({
    queryKey: ["customer-advances", "stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_advances")
        .select("id, original_amount, remaining_amount, status");

      if (error) throw error;

      const stats = {
        totalAdvances: data.reduce((sum, adv) => sum + adv.original_amount, 0),
        activeAdvances: data
          .filter(adv => adv.status === "active")
          .reduce((sum, adv) => sum + adv.remaining_amount, 0),
        partiallyApplied: data.filter(adv => adv.status === "partially_applied").length,
        fullyApplied: data.filter(adv => adv.status === "fully_applied").length,
      };

      return stats;
    },
  });
}

async function generateAdvanceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const { data } = await supabase
    .from("customer_advances")
    .select("advance_number")
    .like("advance_number", `ADV-${year}-%`)
    .order("created_at", { ascending: false })
    .limit(1);

  let nextNumber = 1;
  if (data?.[0]?.advance_number) {
    const match = data[0].advance_number.match(/ADV-\d+-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `ADV-${year}-${nextNumber.toString().padStart(4, "0")}`;
}

export function useCreateCustomerAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: AdvanceFormData) => {
      const advanceNumber = await generateAdvanceNumber();
      const { data: user } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("customer_advances")
        .insert({
          advance_number: advanceNumber,
          customer_id: formData.customer_id,
          receipt_id: formData.receipt_id || null,
          advance_date: formData.advance_date,
          original_amount: formData.original_amount,
          remaining_amount: formData.original_amount,
          notes: formData.notes,
          status: "active",
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-advances"] });
      toast.success("Advance recorded successfully");
    },
    onError: (error) => {
      toast.error("Failed to record advance: " + error.message);
    },
  });
}

export function useAllocateAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ advanceId, invoiceId, amount }: { advanceId: string; invoiceId: string; amount: number }) => {
      // Get current advance
      const { data: advance } = await supabase
        .from("customer_advances")
        .select("remaining_amount")
        .eq("id", advanceId)
        .single();

      if (!advance) throw new Error("Advance not found");
      if (amount > advance.remaining_amount) throw new Error("Amount exceeds remaining advance balance");

      // Insert allocation
      const { error: allocError } = await supabase
        .from("advance_allocations")
        .insert({
          advance_id: advanceId,
          invoice_id: invoiceId,
          amount: amount,
        });

      if (allocError) throw allocError;

      // Update advance remaining amount
      const newRemaining = advance.remaining_amount - amount;
      const newStatus = newRemaining === 0 ? "fully_applied" : "partially_applied";

      await supabase
        .from("customer_advances")
        .update({ remaining_amount: newRemaining, status: newStatus })
        .eq("id", advanceId);

      // Update invoice amount_paid
      const { data: invoice } = await supabase
        .from("customer_invoices")
        .select("amount_paid, total_amount")
        .eq("id", invoiceId)
        .single();

      if (invoice) {
        const newAmountPaid = (invoice.amount_paid || 0) + amount;
        const invoiceStatus = newAmountPaid >= invoice.total_amount ? "paid" : "partial";

        await supabase
          .from("customer_invoices")
          .update({ amount_paid: newAmountPaid, status: invoiceStatus })
          .eq("id", invoiceId);
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-advances"] });
      queryClient.invalidateQueries({ queryKey: ["customer-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["advance-allocations"] });
      toast.success("Advance allocated to invoice");
    },
    onError: (error) => {
      toast.error("Failed to allocate advance: " + error.message);
    },
  });
}

export function useActiveAdvances(customerId: string | null) {
  return useQuery({
    queryKey: ["customer-advances", "active", customerId],
    queryFn: async () => {
      if (!customerId) return [];
      const { data, error } = await supabase
        .from("customer_advances")
        .select("id, advance_number, remaining_amount")
        .eq("customer_id", customerId)
        .in("status", ["active", "partially_applied"])
        .order("advance_date", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });
}
