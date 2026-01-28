import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface LedgerEntry {
  id: string;
  entry_date: string;
  account_code: string;
  account_name: string;
  description: string | null;
  debit: number;
  credit: number;
  reference_type: string | null;
  reference_id: string | null;
  cost_center_id: string | null;
  created_by: string | null;
  created_at: string;
  cost_centers?: {
    code: string;
    name: string;
  };
}

export interface LedgerEntryFormData {
  entry_date: string;
  account_code: string;
  account_name: string;
  description?: string;
  debit?: number;
  credit?: number;
  reference_type?: string;
  reference_id?: string;
  cost_center_id?: string;
}

// Fetch all ledger entries
export function useGeneralLedger(filters?: { startDate?: string; endDate?: string; accountCode?: string }) {
  return useQuery({
    queryKey: ["general-ledger", filters],
    queryFn: async () => {
      let query = supabase
        .from("general_ledger")
        .select(`
          *,
          cost_centers (code, name)
        `)
        .order("entry_date", { ascending: false });

      if (filters?.startDate) {
        query = query.gte("entry_date", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("entry_date", filters.endDate);
      }
      if (filters?.accountCode) {
        query = query.eq("account_code", filters.accountCode);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as LedgerEntry[];
    },
  });
}

// Ledger summary by account
export function useLedgerSummary() {
  return useQuery({
    queryKey: ["ledger-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("general_ledger")
        .select("account_code, account_name, debit, credit");

      if (error) throw error;

      const summary: Record<string, { code: string; name: string; totalDebit: number; totalCredit: number; balance: number }> = {};

      data?.forEach((entry) => {
        if (!summary[entry.account_code]) {
          summary[entry.account_code] = {
            code: entry.account_code,
            name: entry.account_name,
            totalDebit: 0,
            totalCredit: 0,
            balance: 0,
          };
        }
        summary[entry.account_code].totalDebit += Number(entry.debit) || 0;
        summary[entry.account_code].totalCredit += Number(entry.credit) || 0;
        summary[entry.account_code].balance = summary[entry.account_code].totalDebit - summary[entry.account_code].totalCredit;
      });

      return Object.values(summary).sort((a, b) => a.code.localeCompare(b.code));
    },
  });
}

// Ledger totals
export function useLedgerTotals() {
  return useQuery({
    queryKey: ["ledger-totals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("general_ledger")
        .select("debit, credit");

      if (error) throw error;

      const totals = {
        totalDebit: 0,
        totalCredit: 0,
        balance: 0,
        entryCount: data?.length || 0,
      };

      data?.forEach((entry) => {
        totals.totalDebit += Number(entry.debit) || 0;
        totals.totalCredit += Number(entry.credit) || 0;
      });

      totals.balance = totals.totalDebit - totals.totalCredit;

      return totals;
    },
  });
}

// Create ledger entry
export function useCreateLedgerEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: LedgerEntryFormData) => {
      const { data, error } = await supabase
        .from("general_ledger")
        .insert(entry)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["general-ledger"] });
      queryClient.invalidateQueries({ queryKey: ["ledger-summary"] });
      queryClient.invalidateQueries({ queryKey: ["ledger-totals"] });
      toast.success("Journal entry created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create journal entry: ${error.message}`);
    },
  });
}
