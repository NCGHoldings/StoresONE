import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BankReconciliation {
  id: string;
  bank_account_id: string;
  statement_date: string;
  statement_balance: number;
  book_balance: number;
  adjusted_balance: number | null;
  difference: number | null;
  status: string;
  reconciled_by: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  bank_accounts?: {
    account_name: string;
    account_number: string;
  };
}

export interface ReconciliationItem {
  id: string;
  reconciliation_id: string;
  transaction_id: string | null;
  item_type: string;
  amount: number;
  description: string | null;
  is_cleared: boolean;
}

export interface ReconciliationFormData {
  bank_account_id: string;
  statement_date: string;
  statement_balance: number;
  book_balance: number;
  notes?: string;
}

export function useBankReconciliations(accountId?: string) {
  return useQuery({
    queryKey: ["bank-reconciliations", accountId],
    queryFn: async () => {
      let query = supabase
        .from("bank_reconciliations")
        .select(`
          *,
          bank_accounts (account_name, account_number)
        `)
        .order("statement_date", { ascending: false });

      if (accountId) {
        query = query.eq("bank_account_id", accountId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BankReconciliation[];
    },
  });
}

export function useReconciliationItems(reconciliationId: string) {
  return useQuery({
    queryKey: ["reconciliation-items", reconciliationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reconciliation_items")
        .select("*")
        .eq("reconciliation_id", reconciliationId);

      if (error) throw error;
      return data as ReconciliationItem[];
    },
    enabled: !!reconciliationId,
  });
}

export function useOutstandingItems(accountId: string) {
  return useQuery({
    queryKey: ["outstanding-items", accountId],
    queryFn: async () => {
      // Get unreconciled transactions for this account
      const { data, error } = await supabase
        .from("bank_transactions")
        .select("*")
        .eq("bank_account_id", accountId)
        .eq("is_reconciled", false)
        .order("transaction_date");

      if (error) throw error;
      return data;
    },
    enabled: !!accountId,
  });
}

export function useCreateReconciliation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ReconciliationFormData) => {
      const { data: user } = await supabase.auth.getUser();
      const difference = data.statement_balance - data.book_balance;

      const { data: result, error } = await supabase
        .from("bank_reconciliations")
        .insert({
          ...data,
          difference,
          reconciled_by: user.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-reconciliations"] });
      toast.success("Reconciliation started");
    },
    onError: (error) => {
      toast.error("Failed to start reconciliation: " + error.message);
    },
  });
}

export function useCompleteReconciliation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, adjusted_balance }: { id: string; adjusted_balance: number }) => {
      const { error } = await supabase
        .from("bank_reconciliations")
        .update({
          adjusted_balance,
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-reconciliations"] });
      toast.success("Reconciliation completed");
    },
    onError: (error) => {
      toast.error("Failed to complete reconciliation: " + error.message);
    },
  });
}

export function useAddReconciliationItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<ReconciliationItem, "id" | "is_cleared">) => {
      const { data: result, error } = await supabase
        .from("reconciliation_items")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reconciliation-items", variables.reconciliation_id] });
      toast.success("Item added");
    },
    onError: (error) => {
      toast.error("Failed to add item: " + error.message);
    },
  });
}

export function useClearReconciliationItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, transactionId }: { itemId: string; transactionId?: string }) => {
      // Mark item as cleared
      const { error: itemError } = await supabase
        .from("reconciliation_items")
        .update({ is_cleared: true })
        .eq("id", itemId);

      if (itemError) throw itemError;

      // If linked to transaction, mark as reconciled
      if (transactionId) {
        const { data: user } = await supabase.auth.getUser();
        await supabase
          .from("bank_transactions")
          .update({
            is_reconciled: true,
            reconciled_at: new Date().toISOString(),
            reconciled_by: user.user?.id,
          })
          .eq("id", transactionId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reconciliation-items"] });
      queryClient.invalidateQueries({ queryKey: ["bank-transactions"] });
      toast.success("Item cleared");
    },
    onError: (error) => {
      toast.error("Failed to clear item: " + error.message);
    },
  });
}
