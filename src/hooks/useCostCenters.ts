import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  description: string | null;
  manager: string | null;
  budget: number | null;
  spent: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CostCenterFormData {
  code: string;
  name: string;
  description?: string;
  manager?: string;
  budget?: number;
  is_active?: boolean;
}

// Fetch all cost centers
export function useCostCenters() {
  return useQuery({
    queryKey: ["cost-centers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cost_centers")
        .select("*")
        .order("code");

      if (error) throw error;
      return data as CostCenter[];
    },
  });
}

// Cost center statistics
export function useCostCenterStats() {
  return useQuery({
    queryKey: ["cost-center-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cost_centers")
        .select("budget, spent, is_active");

      if (error) throw error;

      const stats = {
        totalBudget: 0,
        totalSpent: 0,
        remaining: 0,
        activeCount: 0,
      };

      data?.forEach((cc) => {
        if (cc.is_active) {
          stats.activeCount++;
          stats.totalBudget += Number(cc.budget) || 0;
          stats.totalSpent += Number(cc.spent) || 0;
        }
      });

      stats.remaining = stats.totalBudget - stats.totalSpent;

      return stats;
    },
  });
}

// Create cost center
export function useCreateCostCenter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (costCenter: CostCenterFormData) => {
      const { data, error } = await supabase
        .from("cost_centers")
        .insert(costCenter)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-centers"] });
      queryClient.invalidateQueries({ queryKey: ["cost-center-stats"] });
      toast.success("Cost center created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create cost center: ${error.message}`);
    },
  });
}

// Update cost center
export function useUpdateCostCenter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CostCenter> & { id: string }) => {
      const { data, error } = await supabase
        .from("cost_centers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-centers"] });
      queryClient.invalidateQueries({ queryKey: ["cost-center-stats"] });
      toast.success("Cost center updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update cost center: ${error.message}`);
    },
  });
}

// Delete cost center
export function useDeleteCostCenter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("cost_centers")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-centers"] });
      queryClient.invalidateQueries({ queryKey: ["cost-center-stats"] });
      toast.success("Cost center deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete cost center: ${error.message}`);
    },
  });
}
