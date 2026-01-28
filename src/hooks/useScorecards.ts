import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SupplierScorecard {
  id: string;
  supplier_id: string;
  period_start: string;
  period_end: string;
  on_time_delivery_rate: number | null;
  defect_rate: number | null;
  response_time_avg: number | null;
  compliance_score: number | null;
  total_orders: number | null;
  total_value: number | null;
  ranking: number | null;
  trend: "improving" | "stable" | "declining" | null;
  notes: string | null;
  created_at: string;
  suppliers?: {
    company_name: string;
    supplier_code: string;
  };
}

export type ScorecardInsert = Omit<SupplierScorecard, "id" | "created_at" | "suppliers">;
export type ScorecardUpdate = Partial<ScorecardInsert>;

export function useScorecards() {
  return useQuery({
    queryKey: ["scorecards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplier_scorecards")
        .select(`
          *,
          suppliers (
            company_name,
            supplier_code
          )
        `)
        .order("period_end", { ascending: false });

      if (error) throw error;
      return data as SupplierScorecard[];
    },
  });
}

export function useScorecardsBySupplier(supplierId: string | undefined) {
  return useQuery({
    queryKey: ["scorecards", "supplier", supplierId],
    queryFn: async () => {
      if (!supplierId) return [];
      
      const { data, error } = await supabase
        .from("supplier_scorecards")
        .select("*")
        .eq("supplier_id", supplierId)
        .order("period_end", { ascending: false });

      if (error) throw error;
      return data as SupplierScorecard[];
    },
    enabled: !!supplierId,
  });
}

export function useLatestScorecard(supplierId: string | undefined) {
  return useQuery({
    queryKey: ["scorecards", "latest", supplierId],
    queryFn: async () => {
      if (!supplierId) return null;
      
      const { data, error } = await supabase
        .from("supplier_scorecards")
        .select("*")
        .eq("supplier_id", supplierId)
        .order("period_end", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as SupplierScorecard | null;
    },
    enabled: !!supplierId,
  });
}

export function useCreateScorecard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scorecard: ScorecardInsert) => {
      const { data, error } = await supabase
        .from("supplier_scorecards")
        .insert(scorecard)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scorecards"] });
      toast.success("Scorecard created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create scorecard: " + error.message);
    },
  });
}

export function useUpdateScorecard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ScorecardUpdate }) => {
      const { data, error } = await supabase
        .from("supplier_scorecards")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scorecards"] });
      toast.success("Scorecard updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update scorecard: " + error.message);
    },
  });
}
