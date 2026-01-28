import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface POSSale {
  id: string;
  pos_terminal_id: string;
  pos_transaction_id: string;
  transaction_datetime: string;
  customer_id: string | null;
  invoice_id: string | null;
  receipt_id: string | null;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  change_given: number | null;
  payment_method: string | null;
  bank_account_id: string | null;
  status: string | null;
  error_message: string | null;
  raw_payload: Record<string, unknown> | null;
  created_at: string | null;
  customers?: { company_name: string; customer_code: string } | null;
  customer_invoices?: { invoice_number: string } | null;
  customer_receipts?: { receipt_number: string } | null;
  bank_accounts?: { account_name: string } | null;
}

export interface POSSaleItem {
  id: string;
  pos_sale_id: string;
  product_id: string | null;
  sku: string;
  quantity: number;
  unit_price: number;
  discount: number | null;
  tax_rate: number;
  line_total: number;
  cost_at_sale: number | null;
  batches_used: Record<string, unknown> | null;
  products?: { name: string } | null;
}

export interface POSSalesStats {
  salesToday: number;
  totalRevenue: number;
  failedTransactions: number;
  avgSaleValue: number;
}

export function usePOSSales() {
  return useQuery({
    queryKey: ["pos-sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pos_sales")
        .select(`
          *,
          customers (company_name, customer_code),
          customer_invoices (invoice_number),
          customer_receipts (receipt_number),
          bank_accounts (account_name)
        `)
        .order("transaction_datetime", { ascending: false });

      if (error) throw error;
      return data as POSSale[];
    },
  });
}

export function usePOSSale(id: string | null) {
  return useQuery({
    queryKey: ["pos-sale", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("pos_sales")
        .select(`
          *,
          customers (company_name, customer_code),
          customer_invoices (invoice_number),
          customer_receipts (receipt_number),
          bank_accounts (account_name)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as POSSale | null;
    },
    enabled: !!id,
  });
}

export function usePOSSaleItems(saleId: string | null) {
  return useQuery({
    queryKey: ["pos-sale-items", saleId],
    queryFn: async () => {
      if (!saleId) return [];
      const { data, error } = await supabase
        .from("pos_sale_items")
        .select(`
          *,
          products (name)
        `)
        .eq("pos_sale_id", saleId)
        .order("id");

      if (error) throw error;
      return data as POSSaleItem[];
    },
    enabled: !!saleId,
  });
}

export function usePOSSalesStats() {
  return useQuery({
    queryKey: ["pos-sales-stats"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];

      const { data: allSales, error } = await supabase
        .from("pos_sales")
        .select("id, total_amount, status, transaction_datetime");

      if (error) throw error;

      const salesToday = allSales?.filter(
        (s) => s.transaction_datetime?.startsWith(today)
      ).length ?? 0;

      const completedSales = allSales?.filter((s) => s.status === "completed") ?? [];
      const totalRevenue = completedSales.reduce(
        (sum, s) => sum + (s.total_amount || 0),
        0
      );

      const failedTransactions = allSales?.filter(
        (s) => s.status === "failed"
      ).length ?? 0;

      const avgSaleValue =
        completedSales.length > 0 ? totalRevenue / completedSales.length : 0;

      return {
        salesToday,
        totalRevenue,
        failedTransactions,
        avgSaleValue,
      } as POSSalesStats;
    },
  });
}
