import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GRNLine {
  id: string;
  grn_id: string;
  po_line_id: string;
  product_id: string;
  quantity_received: number;
  batch_id: string | null;
  bin_id: string | null;
  notes: string | null;
  created_at: string;
  products?: {
    id: string;
    sku: string;
    name: string;
    unit_of_measure: string | null;
  } | null;
  inventory_batches?: {
    id: string;
    batch_number: string;
    expiry_date: string | null;
  } | null;
  storage_bins?: {
    id: string;
    bin_code: string;
    zone_id: string | null;
  } | null;
}

// Fetch GRN lines for a specific GRN
export function useGRNLines(grnId: string | undefined) {
  return useQuery({
    queryKey: ["grn_lines", grnId],
    queryFn: async () => {
      if (!grnId) return [];
      
      const { data, error } = await supabase
        .from("grn_lines")
        .select(`
          *,
          products (id, sku, name, unit_of_measure),
          inventory_batches (id, batch_number, expiry_date),
          storage_bins (id, bin_code, zone_id)
        `)
        .eq("grn_id", grnId)
        .order("created_at");

      if (error) throw error;
      return data as GRNLine[];
    },
    enabled: !!grnId,
  });
}

// Fetch all GRN lines for a specific PO (aggregate view across all GRNs)
export function useGRNLinesByPO(poId: string | undefined) {
  return useQuery({
    queryKey: ["grn_lines", "po", poId],
    queryFn: async () => {
      if (!poId) return [];
      
      // First get all GRNs for this PO
      const { data: grns, error: grnsError } = await supabase
        .from("inbound_deliveries")
        .select("id")
        .eq("po_id", poId);
      
      if (grnsError) throw grnsError;
      if (!grns || grns.length === 0) return [];

      const grnIds = grns.map(g => g.id);
      
      const { data, error } = await supabase
        .from("grn_lines")
        .select(`
          *,
          products (id, sku, name, unit_of_measure),
          inventory_batches (id, batch_number, expiry_date),
          storage_bins (id, bin_code, zone_id),
          inbound_deliveries:grn_id (id, delivery_number, actual_date)
        `)
        .in("grn_id", grnIds)
        .order("created_at");

      if (error) throw error;
      return data;
    },
    enabled: !!poId,
  });
}
