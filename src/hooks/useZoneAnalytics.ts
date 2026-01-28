import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const STATUS_COLORS: Record<string, string> = {
  available: "hsl(142, 76%, 36%)",
  occupied: "hsl(217, 91%, 60%)",
  reserved: "hsl(48, 96%, 53%)",
  blocked: "hsl(0, 84%, 60%)",
};

export function useZoneAnalytics(zoneId: string | null) {
  const binStatusQuery = useQuery({
    queryKey: ["zone-bin-status", zoneId],
    queryFn: async () => {
      if (!zoneId) return [];
      
      const { data, error } = await supabase
        .from("storage_bins")
        .select("status")
        .eq("zone_id", zoneId);

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((bin) => {
        counts[bin.status] = (counts[bin.status] || 0) + 1;
      });

      return Object.entries(counts).map(([status, count]) => ({
        status,
        count,
        fill: STATUS_COLORS[status] || "hsl(var(--muted))",
      }));
    },
    enabled: !!zoneId,
  });

  const inventoryByCategoryQuery = useQuery({
    queryKey: ["zone-inventory-by-category", zoneId],
    queryFn: async () => {
      if (!zoneId) return [];

      const { data, error } = await supabase
        .from("inventory")
        .select(`
          quantity,
          products!inner(category),
          storage_bins!inner(zone_id)
        `)
        .eq("storage_bins.zone_id", zoneId);

      if (error) throw error;

      const categoryMap: Record<string, number> = {};
      data?.forEach((item: any) => {
        const category = item.products?.category || "Uncategorized";
        categoryMap[category] = (categoryMap[category] || 0) + (item.quantity || 0);
      });

      return Object.entries(categoryMap)
        .map(([category, quantity]) => ({ category, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
    },
    enabled: !!zoneId,
  });

  const binsPreviewQuery = useQuery({
    queryKey: ["zone-bins-preview", zoneId],
    queryFn: async () => {
      if (!zoneId) return [];

      const { data, error } = await supabase
        .from("storage_bins")
        .select("id, bin_code, status")
        .eq("zone_id", zoneId)
        .order("bin_code")
        .limit(24);

      if (error) throw error;
      return data || [];
    },
    enabled: !!zoneId,
  });

  return {
    binStatusData: binStatusQuery.data || [],
    inventoryByCategory: inventoryByCategoryQuery.data || [],
    binsPreview: binsPreviewQuery.data || [],
    isLoading: binStatusQuery.isLoading || inventoryByCategoryQuery.isLoading,
  };
}
