import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface InventoryItem {
  id: string;
  product_id: string;
  bin_id: string | null;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  lot_number: string | null;
  expiry_date: string | null;
  last_counted_at: string | null;
  created_at: string;
  updated_at: string;
  products: {
    sku: string;
    name: string;
    category: string | null;
    unit_of_measure: string | null;
    min_stock_level: number | null;
    reorder_point: number | null;
    unit_cost: number | null;
  } | null;
  storage_bins: {
    bin_code: string;
    storage_zones: {
      zone_code: string;
      name: string;
    } | null;
  } | null;
}

export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  criticalItems: number;
}

export interface InventoryInsert {
  product_id: string;
  bin_id?: string | null;
  quantity: number;
  reserved_quantity?: number;
  lot_number?: string | null;
  expiry_date?: string | null;
}

export interface StockAdjustment {
  inventory_id: string;
  product_id: string;
  bin_id: string | null;
  adjustment_quantity: number;
  reason: string;
  notes?: string;
}

export function useInventory() {
  return useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select(`
          *,
          products(sku, name, category, unit_of_measure, min_stock_level, reorder_point, unit_cost),
          storage_bins(bin_code, storage_zones(zone_code, name))
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as InventoryItem[];
    },
  });
}

export function useInventoryStats() {
  return useQuery({
    queryKey: ["inventory-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select(`
          quantity,
          products(min_stock_level, reorder_point, unit_cost)
        `);

      if (error) throw error;

      const stats: InventoryStats = {
        totalItems: data.length,
        totalValue: 0,
        lowStockItems: 0,
        criticalItems: 0,
      };

      data.forEach((item: any) => {
        const quantity = item.quantity || 0;
        const unitCost = item.products?.unit_cost || 0;
        const minStock = item.products?.min_stock_level || 0;
        const reorderPoint = item.products?.reorder_point || 0;

        stats.totalValue += quantity * unitCost;

        if (quantity <= reorderPoint && reorderPoint > 0) {
          stats.criticalItems++;
        } else if (quantity <= minStock && minStock > 0) {
          stats.lowStockItems++;
        }
      });

      return stats;
    },
  });
}

export function useCreateInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inventory: InventoryInsert) => {
      const { data, error } = await supabase
        .from("inventory")
        .insert(inventory)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
      toast.success("Inventory item added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add inventory: " + error.message);
    },
  });
}

export function useUpdateInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InventoryItem> & { id: string }) => {
      const { data, error } = await supabase
        .from("inventory")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
      toast.success("Inventory updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update inventory: " + error.message);
    },
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (adjustment: StockAdjustment) => {
      // Get current inventory
      const { data: currentInventory, error: fetchError } = await supabase
        .from("inventory")
        .select("quantity")
        .eq("id", adjustment.inventory_id)
        .single();

      if (fetchError) throw fetchError;

      const newQuantity = (currentInventory.quantity || 0) + adjustment.adjustment_quantity;

      if (newQuantity < 0) {
        throw new Error("Cannot adjust stock below zero");
      }

      // Update inventory
      const { error: updateError } = await supabase
        .from("inventory")
        .update({ quantity: newQuantity })
        .eq("id", adjustment.inventory_id);

      if (updateError) throw updateError;

      // Log transaction
      const { error: transactionError } = await supabase
        .from("inventory_transactions")
        .insert({
          product_id: adjustment.product_id,
          bin_id: adjustment.bin_id,
          quantity: adjustment.adjustment_quantity,
          transaction_type: "adjustment",
          reference_type: adjustment.reason,
          notes: adjustment.notes,
        });

      if (transactionError) throw transactionError;

      return { newQuantity };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
      toast.success("Stock adjusted successfully");
    },
    onError: (error) => {
      toast.error("Failed to adjust stock: " + error.message);
    },
  });
}

export function useInventoryTransactions(productId?: string) {
  return useQuery({
    queryKey: ["inventory-transactions", productId],
    queryFn: async () => {
      let query = supabase
        .from("inventory_transactions")
        .select(`
          *,
          products(sku, name),
          storage_bins(bin_code)
        `)
        .order("transaction_date", { ascending: false })
        .limit(50);

      if (productId) {
        query = query.eq("product_id", productId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: productId !== undefined || true,
  });
}
