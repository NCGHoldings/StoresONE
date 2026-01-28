import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CashbookEntry {
  date: string;
  openingBalance: number;
  receipts: number;
  payments: number;
  closingBalance: number;
  transactions: Array<{
    id: string;
    transaction_number: string;
    description: string | null;
    payee_payer: string | null;
    transaction_type: string;
    amount: number;
  }>;
}

export function useCashbook(accountId: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["cashbook", accountId, startDate, endDate],
    queryFn: async () => {
      // Get transactions for the date range
      const { data: transactions, error } = await supabase
        .from("bank_transactions")
        .select("*")
        .eq("bank_account_id", accountId)
        .gte("transaction_date", startDate)
        .lte("transaction_date", endDate)
        .order("transaction_date")
        .order("created_at");

      if (error) throw error;

      // Get account opening balance (we'll calculate from all transactions before start date)
      const { data: priorTransactions } = await supabase
        .from("bank_transactions")
        .select("amount, transaction_type")
        .eq("bank_account_id", accountId)
        .lt("transaction_date", startDate);

      // Calculate opening balance from prior transactions
      let openingBalance = 0;
      priorTransactions?.forEach((t) => {
        const isDebit = ["withdrawal", "transfer_out", "fee", "cheque_issued"].includes(t.transaction_type);
        openingBalance += isDebit ? -Number(t.amount) : Number(t.amount);
      });

      // Group transactions by date
      const entriesByDate: Record<string, CashbookEntry> = {};
      let runningBalance = openingBalance;

      transactions?.forEach((t) => {
        const date = t.transaction_date;
        if (!entriesByDate[date]) {
          entriesByDate[date] = {
            date,
            openingBalance: runningBalance,
            receipts: 0,
            payments: 0,
            closingBalance: runningBalance,
            transactions: [],
          };
        }

        const isDebit = ["withdrawal", "transfer_out", "fee", "cheque_issued"].includes(t.transaction_type);
        const amount = Number(t.amount);

        if (isDebit) {
          entriesByDate[date].payments += amount;
          runningBalance -= amount;
        } else {
          entriesByDate[date].receipts += amount;
          runningBalance += amount;
        }

        entriesByDate[date].closingBalance = runningBalance;
        entriesByDate[date].transactions.push({
          id: t.id,
          transaction_number: t.transaction_number,
          description: t.description,
          payee_payer: t.payee_payer,
          transaction_type: t.transaction_type,
          amount: t.amount,
        });
      });

      return {
        entries: Object.values(entriesByDate),
        summary: {
          openingBalance,
          totalReceipts: Object.values(entriesByDate).reduce((sum, e) => sum + e.receipts, 0),
          totalPayments: Object.values(entriesByDate).reduce((sum, e) => sum + e.payments, 0),
          closingBalance: runningBalance,
        },
      };
    },
    enabled: !!accountId && !!startDate && !!endDate,
  });
}

export function useCashbookSummary(accountId: string) {
  return useQuery({
    queryKey: ["cashbook-summary", accountId],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split("T")[0];

      // Get account current balance
      const { data: account } = await supabase
        .from("bank_accounts")
        .select("current_balance")
        .eq("id", accountId)
        .single();

      // Get today's receipts
      const { data: todayReceipts } = await supabase
        .from("bank_transactions")
        .select("amount")
        .eq("bank_account_id", accountId)
        .eq("transaction_date", today)
        .in("transaction_type", ["deposit", "transfer_in", "interest", "cheque_received"]);

      // Get today's payments
      const { data: todayPayments } = await supabase
        .from("bank_transactions")
        .select("amount")
        .eq("bank_account_id", accountId)
        .eq("transaction_date", today)
        .in("transaction_type", ["withdrawal", "transfer_out", "fee", "cheque_issued"]);

      return {
        currentBalance: Number(account?.current_balance) || 0,
        todayReceipts: todayReceipts?.reduce((sum, t) => sum + Number(t.amount), 0) || 0,
        todayPayments: todayPayments?.reduce((sum, t) => sum + Number(t.amount), 0) || 0,
      };
    },
    enabled: !!accountId,
  });
}
