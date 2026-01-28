import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BankTransaction {
  id: string;
  transaction_number: string;
  bank_account_id: string;
  transaction_date: string;
  value_date: string | null;
  transaction_type: string;
  amount: number;
  running_balance: number | null;
  reference_number: string | null;
  description: string | null;
  payee_payer: string | null;
  is_reconciled: boolean;
  reconciled_at: string | null;
  reconciled_by: string | null;
  source_type: string | null;
  source_id: string | null;
  created_by: string | null;
  created_at: string;
  bank_accounts?: {
    account_name: string;
    account_number: string;
  };
}

export interface TransactionFormData {
  bank_account_id: string;
  transaction_date: string;
  value_date?: string;
  transaction_type: string;
  amount: number;
  reference_number?: string;
  description?: string;
  payee_payer?: string;
}

export function useBankTransactions(accountId?: string) {
  return useQuery({
    queryKey: ["bank-transactions", accountId],
    queryFn: async () => {
      let query = supabase
        .from("bank_transactions")
        .select(`
          *,
          bank_accounts (account_name, account_number)
        `)
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (accountId) {
        query = query.eq("bank_account_id", accountId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BankTransaction[];
    },
  });
}

export function useBankTransactionStats() {
  return useQuery({
    queryKey: ["bank-transaction-stats"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split("T")[0];

      // Transactions today
      const { count: todayCount } = await supabase
        .from("bank_transactions")
        .select("*", { count: "exact", head: true })
        .eq("transaction_date", today);

      // Get deposits this month
      const { data: deposits } = await supabase
        .from("bank_transactions")
        .select("amount")
        .gte("transaction_date", startOfMonth)
        .in("transaction_type", ["deposit", "transfer_in", "interest", "cheque_received"]);

      // Get withdrawals this month
      const { data: withdrawals } = await supabase
        .from("bank_transactions")
        .select("amount")
        .gte("transaction_date", startOfMonth)
        .in("transaction_type", ["withdrawal", "transfer_out", "fee", "cheque_issued"]);

      const totalDeposits = deposits?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const totalWithdrawals = withdrawals?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      return {
        transactionsToday: todayCount || 0,
        depositsThisMonth: totalDeposits,
        withdrawalsThisMonth: totalWithdrawals,
        netMovement: totalDeposits - totalWithdrawals,
      };
    },
  });
}

export function useCreateBankTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TransactionFormData) => {
      const { data: user } = await supabase.auth.getUser();
      
      // Generate transaction number
      const transactionNumber = `TXN-${Date.now().toString(36).toUpperCase()}`;

      const { data: result, error } = await supabase
        .from("bank_transactions")
        .insert({
          ...data,
          transaction_number: transactionNumber,
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update bank account balance
      const isDebit = ["withdrawal", "transfer_out", "fee", "cheque_issued"].includes(data.transaction_type);
      const balanceChange = isDebit ? -data.amount : data.amount;

      // Get current balance and update
      const { data: account } = await supabase
        .from("bank_accounts")
        .select("current_balance")
        .eq("id", data.bank_account_id)
        .single();

      if (account) {
        const newBalance = Number(account.current_balance) + balanceChange;
        await supabase
          .from("bank_accounts")
          .update({ current_balance: newBalance })
          .eq("id", data.bank_account_id);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["bank-transaction-stats"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Transaction recorded successfully");
    },
    onError: (error) => {
      toast.error("Failed to record transaction: " + error.message);
    },
  });
}

export function useReconcileTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionId: string) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("bank_transactions")
        .update({
          is_reconciled: true,
          reconciled_at: new Date().toISOString(),
          reconciled_by: user.user?.id,
        })
        .eq("id", transactionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["bank-account-stats"] });
      toast.success("Transaction reconciled");
    },
    onError: (error) => {
      toast.error("Failed to reconcile transaction: " + error.message);
    },
  });
}
