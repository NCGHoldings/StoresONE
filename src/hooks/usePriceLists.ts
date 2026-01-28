import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PriceList {
  id: string;
  supplier_id: string;
  name: string;
  description: string | null;
  currency: string;
  valid_from: string;
  valid_to: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  suppliers?: {
    id: string;
    company_name: string;
    supplier_code: string;
  } | null;
  item_count?: number;
}

export interface PriceListItem {
  id: string;
  price_list_id: string;
  product_id: string | null;
  product_name: string | null;
  unit_price: number;
  min_quantity: number;
  max_quantity: number | null;
  lead_time_days: number | null;
  notes: string | null;
  created_at: string;
  products?: {
    id: string;
    sku: string;
    name: string;
    unit_of_measure: string | null;
  } | null;
}

// Fetch all price lists
export function usePriceLists() {
  return useQuery({
    queryKey: ["price-lists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_lists")
        .select(`
          *,
          suppliers (id, company_name, supplier_code)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get item counts
      const priceListsWithCounts = await Promise.all(
        (data || []).map(async (pl) => {
          const { count } = await supabase
            .from("price_list_items")
            .select("id", { count: "exact", head: true })
            .eq("price_list_id", pl.id);

          return { ...pl, item_count: count || 0 };
        })
      );

      return priceListsWithCounts as PriceList[];
    },
  });
}

// Fetch price lists by supplier
export function usePriceListsBySupplier(supplierId: string | undefined) {
  return useQuery({
    queryKey: ["price-lists", "supplier", supplierId],
    queryFn: async () => {
      if (!supplierId) return [];
      const { data, error } = await supabase
        .from("price_lists")
        .select(`
          *,
          suppliers (id, company_name, supplier_code)
        `)
        .eq("supplier_id", supplierId)
        .eq("is_active", true)
        .order("valid_from", { ascending: false });

      if (error) throw error;
      return data as PriceList[];
    },
    enabled: !!supplierId,
  });
}

// Fetch single price list
export function usePriceList(id: string | undefined) {
  return useQuery({
    queryKey: ["price-lists", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("price_lists")
        .select(`
          *,
          suppliers (id, company_name, supplier_code)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as PriceList;
    },
    enabled: !!id,
  });
}

// Fetch price list items
export function usePriceListItems(priceListId: string | undefined) {
  return useQuery({
    queryKey: ["price-list-items", priceListId],
    queryFn: async () => {
      if (!priceListId) return [];
      const { data, error } = await supabase
        .from("price_list_items")
        .select(`
          *,
          products (id, sku, name, unit_of_measure)
        `)
        .eq("price_list_id", priceListId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as PriceListItem[];
    },
    enabled: !!priceListId,
  });
}

// Get best price for a product
export function useBestPriceForProduct(productId: string | undefined) {
  return useQuery({
    queryKey: ["best-price", productId],
    queryFn: async () => {
      if (!productId) return null;

      const today = new Date().toISOString().split("T")[0];

      // Get all active price lists with this product
      const { data, error } = await supabase
        .from("price_list_items")
        .select(`
          *,
          price_lists!inner (
            id,
            supplier_id,
            is_active,
            valid_from,
            valid_to,
            currency,
            suppliers (id, company_name)
          )
        `)
        .eq("product_id", productId)
        .eq("price_lists.is_active", true)
        .lte("price_lists.valid_from", today)
        .or(`valid_to.is.null,valid_to.gte.${today}`, { foreignTable: "price_lists" })
        .order("unit_price", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });
}

// Price list stats
export function usePriceListStats() {
  return useQuery({
    queryKey: ["price-list-stats"],
    queryFn: async () => {
      const { data: priceLists } = await supabase
        .from("price_lists")
        .select("id, is_active, valid_to");

      const today = new Date();
      const soon = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

      return {
        total: priceLists?.length || 0,
        active: priceLists?.filter((pl) => pl.is_active).length || 0,
        expiringSoon: priceLists?.filter(
          (pl) =>
            pl.is_active &&
            pl.valid_to &&
            new Date(pl.valid_to) <= soon &&
            new Date(pl.valid_to) > today
        ).length || 0,
        expired: priceLists?.filter(
          (pl) => pl.valid_to && new Date(pl.valid_to) < today
        ).length || 0,
      };
    },
  });
}

// Create price list
export function useCreatePriceList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (priceList: Partial<PriceList>) => {
      const { suppliers, item_count, ...insertData } = priceList;
      const { data, error } = await supabase
        .from("price_lists")
        .insert(insertData as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-lists"] });
      queryClient.invalidateQueries({ queryKey: ["price-list-stats"] });
      toast.success("Price list created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create price list: ${error.message}`);
    },
  });
}

// Update price list
export function useUpdatePriceList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PriceList> }) => {
      const { data, error } = await supabase
        .from("price_lists")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-lists"] });
      queryClient.invalidateQueries({ queryKey: ["price-list-stats"] });
      toast.success("Price list updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update price list: ${error.message}`);
    },
  });
}

// Delete price list
export function useDeletePriceList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("price_lists").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-lists"] });
      queryClient.invalidateQueries({ queryKey: ["price-list-stats"] });
      toast.success("Price list deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete price list: ${error.message}`);
    },
  });
}

// Add price list item
export function useAddPriceListItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Partial<PriceListItem>) => {
      const { products, ...insertData } = item;
      const { data, error } = await supabase
        .from("price_list_items")
        .insert(insertData as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, item) => {
      queryClient.invalidateQueries({ queryKey: ["price-list-items", item.price_list_id] });
      queryClient.invalidateQueries({ queryKey: ["price-lists"] });
    },
    onError: (error) => {
      toast.error(`Failed to add item: ${error.message}`);
    },
  });
}

// Update price list item
export function useUpdatePriceListItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      priceListId,
      updates,
    }: {
      id: string;
      priceListId: string;
      updates: Partial<PriceListItem>;
    }) => {
      const { data, error } = await supabase
        .from("price_list_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { data, priceListId };
    },
    onSuccess: (_, { priceListId }) => {
      queryClient.invalidateQueries({ queryKey: ["price-list-items", priceListId] });
    },
    onError: (error) => {
      toast.error(`Failed to update item: ${error.message}`);
    },
  });
}

// Remove price list item
export function useRemovePriceListItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, priceListId }: { id: string; priceListId: string }) => {
      const { error } = await supabase.from("price_list_items").delete().eq("id", id);
      if (error) throw error;
      return { priceListId };
    },
    onSuccess: (_, { priceListId }) => {
      queryClient.invalidateQueries({ queryKey: ["price-list-items", priceListId] });
      queryClient.invalidateQueries({ queryKey: ["price-lists"] });
    },
    onError: (error) => {
      toast.error(`Failed to remove item: ${error.message}`);
    },
  });
}

// Compare prices across suppliers
export function usePriceComparison(productIds: string[]) {
  return useQuery({
    queryKey: ["price-comparison", productIds],
    queryFn: async () => {
      if (!productIds.length) return [];

      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("price_list_items")
        .select(`
          *,
          price_lists!inner (
            id,
            supplier_id,
            name,
            is_active,
            valid_from,
            valid_to,
            currency,
            suppliers (id, company_name, supplier_code)
          ),
          products (id, sku, name)
        `)
        .in("product_id", productIds)
        .eq("price_lists.is_active", true)
        .lte("price_lists.valid_from", today);

      if (error) throw error;

      // Filter out expired price lists in JS since the OR query is complex
      const validItems = data?.filter((item) => {
        const validTo = (item.price_lists as { valid_to: string | null })?.valid_to;
        return !validTo || new Date(validTo) >= new Date(today);
      });

      return validItems || [];
    },
    enabled: productIds.length > 0,
  });
}
