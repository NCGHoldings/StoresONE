import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StorageBin {
  id: string;
  bin_code: string;
  zone_id: string | null;
  row_number: string | null;
  column_number: string | null;
  level_number: string | null;
  capacity: number | null;
  current_quantity: number | null;
  status: "available" | "occupied" | "reserved" | "blocked";
  bin_type: string | null;
  is_active: boolean | null;
  created_at: string;
  storage_zones?: { zone_code: string; name: string };
}

export interface ProductCategory {
  id: string;
  code: string;
  name: string;
  parent_id: string | null;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string | null;
  category_id: string | null;
  unit_of_measure: string | null;
  weight: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  min_stock_level: number | null;
  max_stock_level: number | null;
  reorder_point: number | null;
  lead_time_days: number | null;
  unit_cost: number | null;
  is_active: boolean | null;
  batch_tracked: boolean | null;
  serial_tracked: boolean | null;
  created_at: string;
  updated_at: string;
  product_category?: ProductCategory | null;
}

export function useStorageBins() {
  return useQuery({
    queryKey: ["storage_bins"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("storage_bins")
        .select(`
          *,
          storage_zones(zone_code, name)
        `)
        .order("bin_code");

      if (error) throw error;
      return data as StorageBin[];
    },
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          product_category:category_id (
            id,
            code,
            name,
            parent_id
          )
        `)
        .order("name");

      if (error) throw error;
      return data as Product[];
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Omit<Product, "id" | "created_at" | "updated_at" | "product_category" | "category">) => {
      const { data, error } = await supabase
        .from("products")
        .insert(product)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create product: " + error.message);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...product }: Partial<Product> & { id: string }) => {
      // Remove the joined product_category from the update payload
      const { product_category, ...updateData } = product as Product;
      const { data, error } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update product: " + error.message);
    },
  });
}

export function useProductStats() {
  const { data: products = [] } = useProducts();
  
  return {
    total: products.length,
    active: products.filter(p => p.is_active).length,
    inactive: products.filter(p => !p.is_active).length,
    withStockRules: products.filter(p => p.reorder_point || p.min_stock_level).length,
    categorized: products.filter(p => p.category_id).length,
  };
}
