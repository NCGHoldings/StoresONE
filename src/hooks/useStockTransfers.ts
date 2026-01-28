import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StockTransfer {
  id: string;
  transfer_number: string;
  from_bin_id: string | null;
  to_bin_id: string | null;
  product_id: string | null;
  quantity: number;
  transfer_date: string;
  reason: string | null;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: string | null;
  created_by: string | null;
  completed_by: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  from_bin?: { bin_code: string };
  to_bin?: { bin_code: string };
  products?: { name: string; sku: string };
}

export type TransferInsert = Omit<StockTransfer, "id" | "created_at" | "from_bin" | "to_bin" | "products">;
export type TransferUpdate = Partial<TransferInsert>;

export function useStockTransfers() {
  return useQuery({
    queryKey: ["stock_transfers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_transfers")
        .select(`
          *,
          from_bin:storage_bins!stock_transfers_from_bin_id_fkey(bin_code),
          to_bin:storage_bins!stock_transfers_to_bin_id_fkey(bin_code),
          products(name, sku)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as StockTransfer[];
    },
  });
}

export function useCreateStockTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transfer: TransferInsert) => {
      const { data, error } = await supabase
        .from("stock_transfers")
        .insert(transfer)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock_transfers"] });
      toast.success("Transfer created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create transfer: " + error.message);
    },
  });
}

export function useUpdateStockTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TransferUpdate }) => {
      const { data, error } = await supabase
        .from("stock_transfers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock_transfers"] });
      toast.success("Transfer updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update transfer: " + error.message);
    },
  });
}

export function useCompleteTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("stock_transfers")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock_transfers"] });
      toast.success("Transfer completed");
    },
    onError: (error) => {
      toast.error("Failed to complete transfer: " + error.message);
    },
  });
}
