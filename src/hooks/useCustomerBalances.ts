import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CustomerBalance {
  customer_id: string;
  outstanding_balance: number;
}

export function useCustomerBalances() {
  return useQuery({
    queryKey: ["customer-balances"],
    queryFn: async () => {
      // Get all unpaid invoices grouped by customer
      const { data, error } = await supabase
        .from("customer_invoices")
        .select("customer_id, total_amount, amount_paid, status")
        .not("status", "in", '("paid","cancelled")');

      if (error) throw error;

      // Calculate outstanding balance per customer
      const balanceMap = new Map<string, number>();
      
      for (const inv of data || []) {
        const outstanding = (inv.total_amount || 0) - (inv.amount_paid || 0);
        const current = balanceMap.get(inv.customer_id) || 0;
        balanceMap.set(inv.customer_id, current + outstanding);
      }

      return balanceMap;
    },
  });
}

export function useTotalReceivables() {
  return useQuery({
    queryKey: ["total-receivables"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_invoices")
        .select("total_amount, amount_paid, status")
        .not("status", "in", '("paid","cancelled")');

      if (error) throw error;

      const total = (data || []).reduce(
        (sum, inv) => sum + ((inv.total_amount || 0) - (inv.amount_paid || 0)),
        0
      );

      return total;
    },
  });
}
