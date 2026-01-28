import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FundTransfer {
  id: string;
  transfer_number: string;
  from_account_id: string;
  to_account_id: string;
  transfer_date: string;
  amount: number;
  exchange_rate: number;
  converted_amount: number | null;
  status: string;
  purpose: string | null;
  approved_by: string | null;
  approved_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  from_account?: {
    account_name: string;
    account_number: string;
  };
  to_account?: {
    account_name: string;
    account_number: string;
  };
}

export interface FundTransferFormData {
  from_account_id: string;
  to_account_id: string;
  transfer_date: string;
  amount: number;
  exchange_rate?: number;
  converted_amount?: number;
  purpose?: string;
}

export function useFundTransfers() {
  return useQuery({
    queryKey: ["fund-transfers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fund_transfers")
        .select(`
          *,
          from_account:bank_accounts!fund_transfers_from_account_id_fkey (account_name, account_number),
          to_account:bank_accounts!fund_transfers_to_account_id_fkey (account_name, account_number)
        `)
        .order("transfer_date", { ascending: false });

      if (error) throw error;
      return data as FundTransfer[];
    },
  });
}

export function useFundTransferStats() {
  return useQuery({
    queryKey: ["fund-transfer-stats"],
    queryFn: async () => {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split("T")[0];

      const { count: pendingCount } = await supabase
        .from("fund_transfers")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      const { data: completedThisMonth } = await supabase
        .from("fund_transfers")
        .select("amount")
        .eq("status", "completed")
        .gte("transfer_date", startOfMonth);

      const { count: awaitingApproval } = await supabase
        .from("fund_transfers")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      const totalTransferred = completedThisMonth?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      return {
        pendingTransfers: pendingCount || 0,
        completedThisMonth: completedThisMonth?.length || 0,
        totalTransferred,
        awaitingApproval: awaitingApproval || 0,
      };
    },
  });
}

export function useCreateFundTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FundTransferFormData) => {
      const { data: user } = await supabase.auth.getUser();
      
      // Generate transfer number
      const transferNumber = `TRF-${Date.now().toString(36).toUpperCase()}`;

      const { data: result, error } = await supabase
        .from("fund_transfers")
        .insert({
          ...data,
          transfer_number: transferNumber,
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fund-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["fund-transfer-stats"] });
      queryClient.invalidateQueries({ queryKey: ["bank-account-stats"] });
      toast.success("Fund transfer created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create fund transfer: " + error.message);
    },
  });
}

export function useUpdateTransferStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const updateData: Record<string, unknown> = { status };

      if (status === "approved") {
        updateData.approved_by = user.user?.id;
        updateData.approved_at = new Date().toISOString();
      } else if (status === "completed") {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase.from("fund_transfers").update(updateData).eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fund-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["fund-transfer-stats"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Transfer status updated");
    },
    onError: (error) => {
      toast.error("Failed to update transfer status: " + error.message);
    },
  });
}
