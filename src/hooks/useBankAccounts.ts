import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BankAccount {
  id: string;
  account_number: string;
  account_name: string;
  bank_name: string;
  branch_name: string | null;
  swift_code: string | null;
  iban: string | null;
  currency: string;
  account_type: string | null;
  current_balance: number;
  is_active: boolean;
  gl_account_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BankAccountFormData {
  account_number: string;
  account_name: string;
  bank_name: string;
  branch_name?: string;
  swift_code?: string;
  iban?: string;
  currency?: string;
  account_type?: string;
  current_balance?: number;
  is_active?: boolean;
  gl_account_id?: string;
  notes?: string;
}

export function useBankAccounts() {
  return useQuery({
    queryKey: ["bank-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .order("account_name");

      if (error) throw error;
      return data as BankAccount[];
    },
  });
}

export function useActiveBankAccounts() {
  return useQuery({
    queryKey: ["bank-accounts", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("is_active", true)
        .order("account_name");

      if (error) throw error;
      return data as BankAccount[];
    },
  });
}

export function useBankAccountStats() {
  return useQuery({
    queryKey: ["bank-account-stats"],
    queryFn: async () => {
      const { data: accounts, error } = await supabase
        .from("bank_accounts")
        .select("current_balance, is_active");

      if (error) throw error;

      const activeAccounts = accounts?.filter((a) => a.is_active).length || 0;
      const totalBalance = accounts?.reduce((sum, a) => sum + (Number(a.current_balance) || 0), 0) || 0;

      // Get pending transfers count
      const { count: pendingTransfers } = await supabase
        .from("fund_transfers")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Get unreconciled transactions count
      const { count: unreconciledItems } = await supabase
        .from("bank_transactions")
        .select("*", { count: "exact", head: true })
        .eq("is_reconciled", false);

      return {
        activeAccounts,
        totalBalance,
        pendingTransfers: pendingTransfers || 0,
        unreconciledItems: unreconciledItems || 0,
      };
    },
  });
}

export function useCreateBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BankAccountFormData) => {
      const { data: user } = await supabase.auth.getUser();
      const { data: result, error } = await supabase
        .from("bank_accounts")
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
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["bank-account-stats"] });
      toast.success("Bank account created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create bank account: " + error.message);
    },
  });
}

export function useUpdateBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: BankAccountFormData & { id: string }) => {
      const { data: result, error } = await supabase
        .from("bank_accounts")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["bank-account-stats"] });
      toast.success("Bank account updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update bank account: " + error.message);
    },
  });
}

export function useDeleteBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bank_accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["bank-account-stats"] });
      toast.success("Bank account deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete bank account: " + error.message);
    },
  });
}
