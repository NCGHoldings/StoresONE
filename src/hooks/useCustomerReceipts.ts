import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CustomerReceipt {
  id: string;
  receipt_number: string;
  customer_id: string;
  receipt_date: string;
  amount: number;
  payment_method: string | null;
  reference_number: string | null;
  bank_account: string | null;
  notes: string | null;
  status: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  customers?: {
    company_name: string;
    customer_code: string;
  };
}

export interface ReceiptAllocation {
  id: string;
  receipt_id: string;
  invoice_id: string;
  amount: number;
  allocated_at: string;
  customer_invoices?: {
    invoice_number: string;
    total_amount: number;
    amount_paid: number;
  };
}

export interface ReceiptFormData {
  customer_id: string;
  receipt_date: string;
  amount: number;
  payment_method?: string;
  reference_number?: string;
  bank_account?: string;
  notes?: string;
}

export function useCustomerReceipts(status?: string) {
  return useQuery({
    queryKey: ["customer-receipts", status],
    queryFn: async () => {
      let query = supabase
        .from("customer_receipts")
        .select(`
          *,
          customers(company_name, customer_code)
        `)
        .order("receipt_date", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CustomerReceipt[];
    },
  });
}

export function useCustomerReceipt(id: string | null) {
  return useQuery({
    queryKey: ["customer-receipts", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("customer_receipts")
        .select(`
          *,
          customers(company_name, customer_code)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as CustomerReceipt;
    },
    enabled: !!id,
  });
}

export function useReceiptAllocations(receiptId: string | null) {
  return useQuery({
    queryKey: ["receipt-allocations", receiptId],
    queryFn: async () => {
      if (!receiptId) return [];
      const { data, error } = await supabase
        .from("receipt_allocations")
        .select(`
          *,
          customer_invoices(invoice_number, total_amount, amount_paid)
        `)
        .eq("receipt_id", receiptId);

      if (error) throw error;
      return data as ReceiptAllocation[];
    },
    enabled: !!receiptId,
  });
}

export function useReceiptStats() {
  return useQuery({
    queryKey: ["customer-receipts", "stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_receipts")
        .select("id, amount, receipt_date, status");

      if (error) throw error;

      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      const stats = {
        receiptsToday: data
          .filter(r => r.receipt_date === todayStr)
          .reduce((sum, r) => sum + r.amount, 0),
        receiptsThisWeek: data
          .filter(r => new Date(r.receipt_date) >= weekAgo)
          .reduce((sum, r) => sum + r.amount, 0),
        unallocated: data
          .filter(r => r.status === "pending")
          .reduce((sum, r) => sum + r.amount, 0),
        totalThisMonth: data
          .filter(r => new Date(r.receipt_date) >= monthStart)
          .reduce((sum, r) => sum + r.amount, 0),
      };

      return stats;
    },
  });
}

async function generateReceiptNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const { data } = await supabase
    .from("customer_receipts")
    .select("receipt_number")
    .like("receipt_number", `RCP-${year}-%`)
    .order("created_at", { ascending: false })
    .limit(1);

  let nextNumber = 1;
  if (data?.[0]?.receipt_number) {
    const match = data[0].receipt_number.match(/RCP-\d+-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `RCP-${year}-${nextNumber.toString().padStart(4, "0")}`;
}

export function useCreateCustomerReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: ReceiptFormData) => {
      const receiptNumber = await generateReceiptNumber();
      const { data: user } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("customer_receipts")
        .insert({
          receipt_number: receiptNumber,
          customer_id: formData.customer_id,
          receipt_date: formData.receipt_date,
          amount: formData.amount,
          payment_method: formData.payment_method,
          reference_number: formData.reference_number,
          bank_account: formData.bank_account,
          notes: formData.notes,
          status: "pending",
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-receipts"] });
      toast.success("Receipt recorded successfully");
    },
    onError: (error) => {
      toast.error("Failed to record receipt: " + error.message);
    },
  });
}

export function useAllocateReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ receiptId, allocations }: { receiptId: string; allocations: { invoiceId: string; amount: number }[] }) => {
      // Insert allocations
      for (const alloc of allocations) {
        const { error: allocError } = await supabase
          .from("receipt_allocations")
          .insert({
            receipt_id: receiptId,
            invoice_id: alloc.invoiceId,
            amount: alloc.amount,
          });

        if (allocError) throw allocError;

        // Update invoice amount_paid
        const { data: invoice } = await supabase
          .from("customer_invoices")
          .select("amount_paid, total_amount")
          .eq("id", alloc.invoiceId)
          .single();

        if (invoice) {
          const newAmountPaid = (invoice.amount_paid || 0) + alloc.amount;
          const newStatus = newAmountPaid >= invoice.total_amount ? "paid" : "partial";

          await supabase
            .from("customer_invoices")
            .update({ amount_paid: newAmountPaid, status: newStatus })
            .eq("id", alloc.invoiceId);
        }
      }

      // Update receipt status
      await supabase
        .from("customer_receipts")
        .update({ status: "allocated" })
        .eq("id", receiptId);

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["customer-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["receipt-allocations"] });
      toast.success("Receipt allocated successfully");
    },
    onError: (error) => {
      toast.error("Failed to allocate receipt: " + error.message);
    },
  });
}
