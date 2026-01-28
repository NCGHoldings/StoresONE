import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Contract {
  id: string;
  contract_number: string;
  supplier_id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  value: number | null;
  currency: string | null;
  terms_conditions: string | null;
  status: "draft" | "active" | "expired" | "terminated" | "renewed";
  document_url: string | null;
  auto_renewal: boolean | null;
  notice_period_days: number | null;
  signed_date: string | null;
  signed_by: string | null;
  created_at: string;
  updated_at: string;
  suppliers?: {
    company_name: string;
    supplier_code: string;
  };
}

export type ContractInsert = Omit<Contract, "id" | "created_at" | "updated_at" | "suppliers">;
export type ContractUpdate = Partial<ContractInsert>;

export function useContracts() {
  return useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select(`
          *,
          suppliers (
            company_name,
            supplier_code
          )
        `)
        .order("end_date", { ascending: true });

      if (error) throw error;
      return data as Contract[];
    },
  });
}

export function useContract(id: string | undefined) {
  return useQuery({
    queryKey: ["contracts", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("contracts")
        .select(`
          *,
          suppliers (
            company_name,
            supplier_code
          )
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as Contract | null;
    },
    enabled: !!id,
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contract: ContractInsert) => {
      const { data, error } = await supabase
        .from("contracts")
        .insert(contract)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast.success("Contract created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create contract: " + error.message);
    },
  });
}

export function useUpdateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ContractUpdate }) => {
      const { data, error } = await supabase
        .from("contracts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast.success("Contract updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update contract: " + error.message);
    },
  });
}

export function useDeleteContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contracts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast.success("Contract deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete contract: " + error.message);
    },
  });
}
