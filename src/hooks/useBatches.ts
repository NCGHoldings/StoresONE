import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface InventoryBatch {
  id: string;
  product_id: string;
  batch_number: string;
  supplier_batch_ref: string | null;
  po_id: string | null;
  po_line_id: string | null;
  manufacturing_date: string | null;
  expiry_date: string | null;
  received_date: string;
  received_by: string | null;
  initial_quantity: number;
  current_quantity: number;
  bin_id: string | null;
  status: "active" | "quarantine" | "expired" | "consumed";
  quality_status: "pending" | "approved" | "rejected" | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  products?: {
    id: string;
    sku: string;
    name: string;
    unit_of_measure: string | null;
  } | null;
  storage_bins?: {
    id: string;
    bin_code: string;
  } | null;
  purchase_orders?: {
    id: string;
    po_number: string;
  } | null;
  profiles?: {
    id: string;
    full_name: string | null;
  } | null;
}

export interface BatchInsert {
  product_id: string;
  batch_number: string;
  supplier_batch_ref?: string | null;
  po_id?: string | null;
  po_line_id?: string | null;
  manufacturing_date?: string | null;
  expiry_date?: string | null;
  received_date?: string;
  received_by?: string | null;
  initial_quantity: number;
  current_quantity: number;
  bin_id?: string | null;
  status?: "active" | "quarantine" | "expired" | "consumed";
  quality_status?: "pending" | "approved" | "rejected" | null;
  notes?: string | null;
}

export interface BatchFilters {
  search?: string;
  status?: string;
  productId?: string;
  expiringWithinDays?: number;
}

export function useBatches(filters?: BatchFilters) {
  return useQuery({
    queryKey: ["inventory-batches", filters],
    queryFn: async () => {
      let query = supabase
        .from("inventory_batches")
        .select(`
          *,
          products (
            id,
            sku,
            name,
            unit_of_measure
          ),
          storage_bins (
            id,
            bin_code
          ),
          purchase_orders (
            id,
            po_number
          ),
          profiles:received_by (
            id,
            full_name
          )
        `)
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters?.productId) {
        query = query.eq("product_id", filters.productId);
      }

      if (filters?.expiringWithinDays) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + filters.expiringWithinDays);
        query = query.lte("expiry_date", futureDate.toISOString().split("T")[0]);
        query = query.gte("expiry_date", new Date().toISOString().split("T")[0]);
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = data as InventoryBatch[];

      // Client-side search filter
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = filteredData.filter(
          (batch) =>
            batch.batch_number.toLowerCase().includes(searchLower) ||
            batch.products?.name.toLowerCase().includes(searchLower) ||
            batch.products?.sku.toLowerCase().includes(searchLower) ||
            batch.purchase_orders?.po_number.toLowerCase().includes(searchLower)
        );
      }

      return filteredData;
    },
  });
}

export function useBatch(batchId: string | undefined) {
  return useQuery({
    queryKey: ["inventory-batches", batchId],
    queryFn: async () => {
      if (!batchId) return null;

      const { data, error } = await supabase
        .from("inventory_batches")
        .select(`
          *,
          products (
            id,
            sku,
            name,
            unit_of_measure
          ),
          storage_bins (
            id,
            bin_code
          ),
          purchase_orders (
            id,
            po_number
          ),
          profiles:received_by (
            id,
            full_name
          )
        `)
        .eq("id", batchId)
        .single();

      if (error) throw error;
      return data as InventoryBatch;
    },
    enabled: !!batchId,
  });
}

export function useBatchStats() {
  return useQuery({
    queryKey: ["batch-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_batches")
        .select("id, status, current_quantity, expiry_date");

      if (error) throw error;

      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      const stats = {
        totalBatches: data.length,
        activeBatches: data.filter((b) => b.status === "active").length,
        quarantineBatches: data.filter((b) => b.status === "quarantine").length,
        expiredBatches: data.filter((b) => b.status === "expired").length,
        expiringWithin30Days: data.filter((b) => {
          if (!b.expiry_date || b.status !== "active") return false;
          const expiryDate = new Date(b.expiry_date);
          return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
        }).length,
        totalQuantity: data
          .filter((b) => b.status === "active")
          .reduce((sum, b) => sum + (b.current_quantity || 0), 0),
      };

      return stats;
    },
  });
}

export function useCreateBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (batch: BatchInsert) => {
      const { data, error } = await supabase
        .from("inventory_batches")
        .insert(batch)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-batches"] });
      queryClient.invalidateQueries({ queryKey: ["batch-stats"] });
    },
    onError: (error) => {
      toast.error(`Failed to create batch: ${error.message}`);
    },
  });
}

export function useUpdateBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<BatchInsert>;
    }) => {
      const { data, error } = await supabase
        .from("inventory_batches")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["inventory-batches"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-batches", id] });
      queryClient.invalidateQueries({ queryKey: ["batch-stats"] });
      toast.success("Batch updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update batch: ${error.message}`);
    },
  });
}

export function useBatchTransactions(batchId: string | undefined) {
  return useQuery({
    queryKey: ["batch-transactions", batchId],
    queryFn: async () => {
      if (!batchId) return [];

      const { data, error } = await supabase
        .from("inventory_transactions")
        .select(`
          *,
          products (
            id,
            sku,
            name
          ),
          storage_bins (
            id,
            bin_code
          )
        `)
        .eq("batch_id", batchId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!batchId,
  });
}
