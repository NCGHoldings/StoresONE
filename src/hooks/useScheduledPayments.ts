import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ScheduledPayment {
  id: string;
  schedule_number: string;
  supplier_id: string;
  scheduled_date: string;
  total_amount: number;
  status: string;
  payment_method: string | null;
  bank_account_id: string | null;
  notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  processed_at: string | null;
  created_by: string | null;
  created_at: string;
  suppliers?: { company_name: string } | null;
  bank_accounts?: { account_name: string } | null;
  items?: ScheduledPaymentItem[];
}

export interface ScheduledPaymentItem {
  id: string;
  scheduled_payment_id: string;
  invoice_id: string;
  amount: number;
  invoices?: { invoice_number: string; amount: number; due_date: string } | null;
}

export interface ScheduledPaymentFormData {
  supplier_id: string;
  scheduled_date: string;
  payment_method?: string;
  bank_account_id?: string;
  notes?: string;
  items: { invoice_id: string; amount: number }[];
}

const QUERY_KEY = "scheduled-payments";

export function useScheduledPayments() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_payments")
        .select(`
          *,
          suppliers (company_name),
          bank_accounts (account_name)
        `)
        .order("scheduled_date", { ascending: true });

      if (error) throw error;

      return (data || []).map((sp) => ({
        ...sp,
        suppliers: sp.suppliers ? { company_name: (sp.suppliers as any).company_name } : null,
        bank_accounts: sp.bank_accounts ? { account_name: (sp.bank_accounts as any).account_name } : null,
      })) as ScheduledPayment[];
    },
  });
}

export function useScheduledPaymentItems(paymentId: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY, "items", paymentId],
    queryFn: async () => {
      if (!paymentId) return [];
      
      const { data, error } = await supabase
        .from("scheduled_payment_items")
        .select(`
          *,
          invoices (invoice_number, amount, due_date)
        `)
        .eq("scheduled_payment_id", paymentId);

      if (error) throw error;

      return data as ScheduledPaymentItem[];
    },
    enabled: !!paymentId,
  });
}

export function useScheduledPaymentStats() {
  return useQuery({
    queryKey: [QUERY_KEY, "stats"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const weekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("scheduled_payments")
        .select("scheduled_date, total_amount, status");

      if (error) throw error;

      const pending = (data || []).filter((p) => p.status === "pending");
      const approved = (data || []).filter((p) => p.status === "approved");
      const dueThisWeek = (data || []).filter(
        (p) => p.scheduled_date >= today && p.scheduled_date <= weekEnd && p.status !== "processed"
      );

      return {
        pendingCount: pending.length,
        pendingAmount: pending.reduce((sum, p) => sum + Number(p.total_amount || 0), 0),
        approvedCount: approved.length,
        approvedAmount: approved.reduce((sum, p) => sum + Number(p.total_amount || 0), 0),
        dueThisWeekCount: dueThisWeek.length,
        dueThisWeekAmount: dueThisWeek.reduce((sum, p) => sum + Number(p.total_amount || 0), 0),
      };
    },
  });
}

function generateScheduleNumber(): string {
  const date = new Date();
  const prefix = "SCH";
  const timestamp = date.getFullYear().toString().slice(-2) +
    String(date.getMonth() + 1).padStart(2, "0") +
    String(date.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `${prefix}-${timestamp}-${random}`;
}

export function useCreateScheduledPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ScheduledPaymentFormData) => {
      const schedule_number = generateScheduleNumber();
      const total_amount = data.items.reduce((sum, item) => sum + item.amount, 0);

      // Create scheduled payment
      const { data: payment, error: payError } = await supabase
        .from("scheduled_payments")
        .insert({
          schedule_number,
          supplier_id: data.supplier_id,
          scheduled_date: data.scheduled_date,
          total_amount,
          payment_method: data.payment_method,
          bank_account_id: data.bank_account_id,
          notes: data.notes,
          status: "pending",
        })
        .select()
        .single();

      if (payError) throw payError;

      // Create payment items
      const items = data.items.map((item) => ({
        scheduled_payment_id: payment.id,
        invoice_id: item.invoice_id,
        amount: item.amount,
      }));

      const { error: itemsError } = await supabase
        .from("scheduled_payment_items")
        .insert(items);

      if (itemsError) throw itemsError;

      // Update invoices with scheduled payment info
      for (const item of data.items) {
        await supabase
          .from("invoices")
          .update({
            scheduled_payment_date: data.scheduled_date,
            scheduled_payment_amount: item.amount,
          })
          .eq("id", item.invoice_id);
      }

      return payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-invoices-balance"] });
      toast.success("Payment scheduled successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to schedule payment: ${error.message}`);
    },
  });
}

export function useApproveScheduledPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("scheduled_payments")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success("Scheduled payment approved");
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve: ${error.message}`);
    },
  });
}

export function useCancelScheduledPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get items first to clear invoice scheduled dates
      const { data: items } = await supabase
        .from("scheduled_payment_items")
        .select("invoice_id")
        .eq("scheduled_payment_id", id);

      // Clear scheduled payment info from invoices
      if (items) {
        for (const item of items) {
          await supabase
            .from("invoices")
            .update({
              scheduled_payment_date: null,
              scheduled_payment_amount: null,
            })
            .eq("id", item.invoice_id);
        }
      }

      const { data, error } = await supabase
        .from("scheduled_payments")
        .update({ status: "cancelled" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Scheduled payment cancelled");
    },
    onError: (error: Error) => {
      toast.error(`Failed to cancel: ${error.message}`);
    },
  });
}

export function useProcessScheduledPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get scheduled payment details
      const { data: schedule, error: schedError } = await supabase
        .from("scheduled_payments")
        .select("*, scheduled_payment_items(*)")
        .eq("id", id)
        .single();

      if (schedError) throw schedError;

      // Create actual vendor payment
      const paymentNumber = `PAY-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
      
      const { data: payment, error: payError } = await supabase
        .from("vendor_payments")
        .insert({
          payment_number: paymentNumber,
          supplier_id: schedule.supplier_id,
          payment_date: new Date().toISOString().split("T")[0],
          amount: schedule.total_amount,
          payment_method: schedule.payment_method,
          bank_account: schedule.bank_account_id,
          status: "paid",
          notes: `Processed from scheduled payment ${schedule.schedule_number}`,
        })
        .select()
        .single();

      if (payError) throw payError;

      // Create payment allocations and update invoices
      for (const item of (schedule as any).scheduled_payment_items || []) {
        // Create allocation
        await supabase.from("payment_allocations").insert({
          payment_id: payment.id,
          invoice_id: item.invoice_id,
          amount: item.amount,
        });

        // Update invoice amount_paid
        const { data: invoice } = await supabase
          .from("invoices")
          .select("amount, amount_paid")
          .eq("id", item.invoice_id)
          .single();

        if (invoice) {
          const newAmountPaid = Number(invoice.amount_paid || 0) + Number(item.amount);
          const newStatus = newAmountPaid >= Number(invoice.amount) ? "paid" : "approved";
          
          await supabase
            .from("invoices")
            .update({
              amount_paid: newAmountPaid,
              status: newStatus,
              scheduled_payment_date: null,
              scheduled_payment_amount: null,
            })
            .eq("id", item.invoice_id);
        }
      }

      // Mark scheduled payment as processed
      const { data, error } = await supabase
        .from("scheduled_payments")
        .update({
          status: "processed",
          processed_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["vendor-payments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-stats"] });
      toast.success("Payment processed successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to process payment: ${error.message}`);
    },
  });
}
