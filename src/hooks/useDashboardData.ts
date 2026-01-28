import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Aggregated dashboard hook for inventory chart data by month
export function useInventoryChartData() {
  return useQuery({
    queryKey: ["inventory-chart-data"],
    queryFn: async () => {
      // Get transactions from the last 7 months
      const sevenMonthsAgo = new Date();
      sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 6);
      sevenMonthsAgo.setDate(1);
      sevenMonthsAgo.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("inventory_transactions")
        .select("transaction_type, quantity, transaction_date")
        .gte("transaction_date", sevenMonthsAgo.toISOString())
        .order("transaction_date", { ascending: true });

      if (error) throw error;

      // Group by month
      const monthData: Record<string, { inbound: number; outbound: number }> = {};
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      // Initialize last 7 months
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthKey = months[d.getMonth()];
        monthData[monthKey] = { inbound: 0, outbound: 0 };
      }

      // Aggregate transactions
      (data || []).forEach((tx) => {
        if (!tx.transaction_date) return;
        const date = new Date(tx.transaction_date);
        const monthKey = months[date.getMonth()];
        
        if (!monthData[monthKey]) return;
        
        const qty = Math.abs(tx.quantity || 0);
        if (tx.transaction_type === 'receipt' || tx.transaction_type === 'adjustment' && (tx.quantity || 0) > 0) {
          monthData[monthKey].inbound += qty;
        } else if (tx.transaction_type === 'issue' || tx.transaction_type === 'adjustment' && (tx.quantity || 0) < 0) {
          monthData[monthKey].outbound += qty;
        }
      });

      // Convert to array maintaining order
      const result: { month: string; inbound: number; outbound: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthKey = months[d.getMonth()];
        result.push({
          month: monthKey,
          ...monthData[monthKey]
        });
      }

      return result;
    },
  });
}

// Recent activity from audit logs (limit 5)
export function useRecentActivity(limit: number = 5) {
  return useQuery({
    queryKey: ["recent-activity", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, action, entity_type, entity_id, created_at, document_number")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
  });
}

// Bins count
export function useStorageBinsCount() {
  return useQuery({
    queryKey: ["storage-bins-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("storage_bins")
        .select("*", { count: "exact", head: true });

      if (error) throw error;
      return count || 0;
    },
  });
}
