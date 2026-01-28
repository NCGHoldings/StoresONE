import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PaymentBatch {
  id: string;
  batch_number: string;
  bank_account_id: string;
  batch_date: string;
  total_amount: number;
  payment_count: number;
  batch_type: string;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  processed_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  bank_accounts?: {
    account_name: string;
    account_number: string;
  };
}

export interface PaymentBatchItem {
  id: string;
  batch_id: string;
  vendor_payment_id: string | null;
  payee_name: string;
  amount: number;
  payment_method: string | null;
  reference: string | null;
  status: string;
}

export interface PaymentBatchFormData {
  bank_account_id: string;
  batch_date: string;
  batch_type: string;
  notes?: string;
}

export function usePaymentBatches() {
  return useQuery({
    queryKey: ["payment-batches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_batches")
        .select(`
          *,
          bank_accounts (account_name, account_number)
        `)
        .order("batch_date", { ascending: false });

      if (error) throw error;
      return data as PaymentBatch[];
    },
  });
}

export function usePaymentBatchStats() {
  return useQuery({
    queryKey: ["payment-batch-stats"],
    queryFn: async () => {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split("T")[0];

      const { count: draftCount } = await supabase
        .from("payment_batches")
        .select("*", { count: "exact", head: true })
        .eq("status", "draft");

      const { count: pendingApproval } = await supabase
        .from("payment_batches")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending_approval");

      const { data: processedThisMonth } = await supabase
        .from("payment_batches")
        .select("total_amount")
        .eq("status", "processed")
        .gte("batch_date", startOfMonth);

      const totalBatchValue = processedThisMonth?.reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;

      return {
        draftBatches: draftCount || 0,
        pendingApproval: pendingApproval || 0,
        processedThisMonth: processedThisMonth?.length || 0,
        totalBatchValue,
      };
    },
  });
}

export function usePaymentBatchItems(batchId: string) {
  return useQuery({
    queryKey: ["payment-batch-items", batchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_batch_items")
        .select("*")
        .eq("batch_id", batchId)
        .order("payee_name");

      if (error) throw error;
      return data as PaymentBatchItem[];
    },
    enabled: !!batchId,
  });
}

export function useCreatePaymentBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PaymentBatchFormData) => {
      const { data: user } = await supabase.auth.getUser();
      
      // Generate batch number
      const batchNumber = `BATCH-${Date.now().toString(36).toUpperCase()}`;

      const { data: result, error } = await supabase
        .from("payment_batches")
        .insert({
          ...data,
          batch_number: batchNumber,
          total_amount: 0,
          payment_count: 0,
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-batches"] });
      queryClient.invalidateQueries({ queryKey: ["payment-batch-stats"] });
      toast.success("Payment batch created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create payment batch: " + error.message);
    },
  });
}

export function useAddBatchItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<PaymentBatchItem, "id" | "status">) => {
      const { data: result, error } = await supabase
        .from("payment_batch_items")
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      // Update batch totals
      const { data: items } = await supabase
        .from("payment_batch_items")
        .select("amount")
        .eq("batch_id", data.batch_id);

      const totalAmount = items?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
      const paymentCount = items?.length || 0;

      await supabase
        .from("payment_batches")
        .update({ total_amount: totalAmount, payment_count: paymentCount })
        .eq("id", data.batch_id);

      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["payment-batch-items", variables.batch_id] });
      queryClient.invalidateQueries({ queryKey: ["payment-batches"] });
      toast.success("Item added to batch");
    },
    onError: (error) => {
      toast.error("Failed to add item: " + error.message);
    },
  });
}

export function useUpdateBatchStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const updateData: Record<string, unknown> = { status };

      if (status === "approved") {
        updateData.approved_by = user.user?.id;
        updateData.approved_at = new Date().toISOString();
      } else if (status === "processed") {
        updateData.processed_at = new Date().toISOString();
      }

      const { error } = await supabase.from("payment_batches").update(updateData).eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-batches"] });
      queryClient.invalidateQueries({ queryKey: ["payment-batch-stats"] });
      toast.success("Batch status updated");
    },
    onError: (error) => {
      toast.error("Failed to update batch status: " + error.message);
    },
  });
}
