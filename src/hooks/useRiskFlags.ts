import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RiskFlag {
  id: string;
  supplier_id: string;
  flag_type: "warning" | "critical" | "blacklisted";
  reason: string;
  flagged_by: string | null;
  flagged_date: string;
  resolution_date: string | null;
  resolution_notes: string | null;
  is_active: boolean;
  evidence_urls: string[] | null;
  created_at: string;
  suppliers?: {
    company_name: string;
    supplier_code: string;
  };
}

export type RiskFlagInsert = Omit<RiskFlag, "id" | "created_at" | "suppliers">;
export type RiskFlagUpdate = Partial<RiskFlagInsert>;

export function useRiskFlags() {
  return useQuery({
    queryKey: ["risk_flags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risk_flags")
        .select(`
          *,
          suppliers (
            company_name,
            supplier_code
          )
        `)
        .order("flagged_date", { ascending: false });

      if (error) throw error;
      return data as RiskFlag[];
    },
  });
}

export function useRiskFlagsBySupplier(supplierId: string | undefined) {
  return useQuery({
    queryKey: ["risk_flags", "supplier", supplierId],
    queryFn: async () => {
      if (!supplierId) return [];
      
      const { data, error } = await supabase
        .from("risk_flags")
        .select("*")
        .eq("supplier_id", supplierId)
        .order("flagged_date", { ascending: false });

      if (error) throw error;
      return data as RiskFlag[];
    },
    enabled: !!supplierId,
  });
}

export function useCreateRiskFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (flag: RiskFlagInsert) => {
      const { data, error } = await supabase
        .from("risk_flags")
        .insert(flag)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk_flags"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Risk flag created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create risk flag: " + error.message);
    },
  });
}

export function useUpdateRiskFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: RiskFlagUpdate }) => {
      const { data, error } = await supabase
        .from("risk_flags")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk_flags"] });
      toast.success("Risk flag updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update risk flag: " + error.message);
    },
  });
}

export function useResolveRiskFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, resolution_notes }: { id: string; resolution_notes: string }) => {
      const { data, error } = await supabase
        .from("risk_flags")
        .update({
          is_active: false,
          resolution_date: new Date().toISOString(),
          resolution_notes,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk_flags"] });
      toast.success("Risk flag resolved successfully");
    },
    onError: (error) => {
      toast.error("Failed to resolve risk flag: " + error.message);
    },
  });
}
