import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Cheque {
  id: string;
  cheque_number: string;
  bank_account_id: string;
  cheque_type: string;
  cheque_date: string;
  amount: number;
  payee_payer: string;
  status: string;
  clearance_date: string | null;
  is_post_dated: boolean;
  post_date: string | null;
  memo: string | null;
  vendor_payment_id: string | null;
  customer_receipt_id: string | null;
  created_by: string | null;
  created_at: string;
  bank_accounts?: {
    account_name: string;
    account_number: string;
  };
}

export interface ChequeFormData {
  cheque_number: string;
  bank_account_id: string;
  cheque_type: string;
  cheque_date: string;
  amount: number;
  payee_payer: string;
  is_post_dated?: boolean;
  post_date?: string;
  memo?: string;
}

export function useCheques() {
  return useQuery({
    queryKey: ["cheques"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cheques")
        .select(`
          *,
          bank_accounts (account_name, account_number)
        `)
        .order("cheque_date", { ascending: false });

      if (error) throw error;
      return data as Cheque[];
    },
  });
}

export function useChequeStats() {
  return useQuery({
    queryKey: ["cheque-stats"],
    queryFn: async () => {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split("T")[0];

      const { count: pendingCount } = await supabase
        .from("cheques")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      const { count: clearedThisMonth } = await supabase
        .from("cheques")
        .select("*", { count: "exact", head: true })
        .eq("status", "cleared")
        .gte("clearance_date", startOfMonth);

      const { count: postDatedActive } = await supabase
        .from("cheques")
        .select("*", { count: "exact", head: true })
        .eq("is_post_dated", true)
        .eq("status", "pending");

      const { count: bouncedCount } = await supabase
        .from("cheques")
        .select("*", { count: "exact", head: true })
        .eq("status", "bounced");

      return {
        pendingCheques: pendingCount || 0,
        clearedThisMonth: clearedThisMonth || 0,
        postDatedActive: postDatedActive || 0,
        bounced: bouncedCount || 0,
      };
    },
  });
}

export function useCreateCheque() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ChequeFormData) => {
      const { data: user } = await supabase.auth.getUser();
      const { data: result, error } = await supabase
        .from("cheques")
        .insert({
          ...data,
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cheques"] });
      queryClient.invalidateQueries({ queryKey: ["cheque-stats"] });
      toast.success("Cheque recorded successfully");
    },
    onError: (error) => {
      toast.error("Failed to record cheque: " + error.message);
    },
  });
}

export function useUpdateChequeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, clearance_date }: { id: string; status: string; clearance_date?: string }) => {
      const updateData: Record<string, unknown> = { status };
      if (clearance_date) {
        updateData.clearance_date = clearance_date;
      }

      const { error } = await supabase.from("cheques").update(updateData).eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cheques"] });
      queryClient.invalidateQueries({ queryKey: ["cheque-stats"] });
      toast.success("Cheque status updated");
    },
    onError: (error) => {
      toast.error("Failed to update cheque status: " + error.message);
    },
  });
}
