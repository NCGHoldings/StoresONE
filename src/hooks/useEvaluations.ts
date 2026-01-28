import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SupplierEvaluation {
  id: string;
  supplier_id: string;
  evaluation_date: string;
  evaluator_id: string | null;
  quality_score: number | null;
  delivery_score: number | null;
  price_score: number | null;
  service_score: number | null;
  overall_score: number | null;
  comments: string | null;
  evaluation_period: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  recommendations: string | null;
  created_at: string;
  suppliers?: {
    company_name: string;
    supplier_code: string;
  };
}

export type EvaluationInsert = Omit<SupplierEvaluation, "id" | "created_at" | "suppliers">;
export type EvaluationUpdate = Partial<EvaluationInsert>;

export function useEvaluations() {
  return useQuery({
    queryKey: ["evaluations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplier_evaluations")
        .select(`
          *,
          suppliers (
            company_name,
            supplier_code
          )
        `)
        .order("evaluation_date", { ascending: false });

      if (error) throw error;
      return data as SupplierEvaluation[];
    },
  });
}

export function useEvaluationsBySupplier(supplierId: string | undefined) {
  return useQuery({
    queryKey: ["evaluations", "supplier", supplierId],
    queryFn: async () => {
      if (!supplierId) return [];
      
      const { data, error } = await supabase
        .from("supplier_evaluations")
        .select("*")
        .eq("supplier_id", supplierId)
        .order("evaluation_date", { ascending: false });

      if (error) throw error;
      return data as SupplierEvaluation[];
    },
    enabled: !!supplierId,
  });
}

export function useCreateEvaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (evaluation: EvaluationInsert) => {
      const { data, error } = await supabase
        .from("supplier_evaluations")
        .insert(evaluation)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
      toast.success("Evaluation submitted successfully");
    },
    onError: (error) => {
      toast.error("Failed to submit evaluation: " + error.message);
    },
  });
}

export function useUpdateEvaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: EvaluationUpdate }) => {
      const { data, error } = await supabase
        .from("supplier_evaluations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
      toast.success("Evaluation updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update evaluation: " + error.message);
    },
  });
}
