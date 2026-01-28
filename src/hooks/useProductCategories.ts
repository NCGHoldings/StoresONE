import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProductCategory {
  id: string;
  code: string;
  name: string;
  parent_id: string | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  children?: ProductCategory[];
  parent?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

// Fetch all categories
export function useProductCategories() {
  return useQuery({
    queryKey: ["product-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_categories")
        .select(`
          *,
          parent:parent_id (id, name, code)
        `)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as ProductCategory[];
    },
  });
}

// Build category tree
export function useCategoryTree() {
  const { data: categories, ...rest } = useProductCategories();

  const buildTree = (items: ProductCategory[], parentId: string | null = null): ProductCategory[] => {
    return items
      .filter((item) => item.parent_id === parentId)
      .map((item) => ({
        ...item,
        children: buildTree(items, item.id),
      }));
  };

  return {
    data: categories ? buildTree(categories) : [],
    flatData: categories || [],
    ...rest,
  };
}

// Fetch single category
export function useProductCategory(id: string | undefined) {
  return useQuery({
    queryKey: ["product-categories", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("product_categories")
        .select(`
          *,
          parent:parent_id (id, name, code)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as ProductCategory;
    },
    enabled: !!id,
  });
}

// Fetch products by category
export function useProductsByCategory(categoryId: string | undefined) {
  return useQuery({
    queryKey: ["products-by-category", categoryId],
    queryFn: async () => {
      if (!categoryId) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("category_id", categoryId)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: !!categoryId,
  });
}

// Category stats
export function useCategoryStats() {
  return useQuery({
    queryKey: ["category-stats"],
    queryFn: async () => {
      const { data: categories } = await supabase
        .from("product_categories")
        .select("id, is_active, parent_id");

      const { data: products } = await supabase
        .from("products")
        .select("category_id");

      const categorizedCount = products?.filter((p) => p.category_id).length || 0;
      const uncategorizedCount = products?.filter((p) => !p.category_id).length || 0;

      return {
        totalCategories: categories?.length || 0,
        activeCategories: categories?.filter((c) => c.is_active).length || 0,
        rootCategories: categories?.filter((c) => !c.parent_id).length || 0,
        categorizedProducts: categorizedCount,
        uncategorizedProducts: uncategorizedCount,
      };
    },
  });
}

// Create category
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: Partial<ProductCategory>) => {
      const { children, parent, ...insertData } = category;
      const { data, error } = await supabase
        .from("product_categories")
        .insert(insertData as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      queryClient.invalidateQueries({ queryKey: ["category-stats"] });
      toast.success("Category created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create category: ${error.message}`);
    },
  });
}

// Update category
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ProductCategory> }) => {
      const { data, error } = await supabase
        .from("product_categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      queryClient.invalidateQueries({ queryKey: ["category-stats"] });
      toast.success("Category updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update category: ${error.message}`);
    },
  });
}

// Delete category
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Check for child categories
      const { data: children } = await supabase
        .from("product_categories")
        .select("id")
        .eq("parent_id", id);

      if (children && children.length > 0) {
        throw new Error("Cannot delete category with subcategories");
      }

      // Unassign products from this category
      await supabase
        .from("products")
        .update({ category_id: null })
        .eq("category_id", id);

      const { error } = await supabase.from("product_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      queryClient.invalidateQueries({ queryKey: ["category-stats"] });
      toast.success("Category deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete category: ${error.message}`);
    },
  });
}

// Assign product to category
export function useAssignProductToCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      categoryId,
    }: {
      productId: string;
      categoryId: string | null;
    }) => {
      const { data, error } = await supabase
        .from("products")
        .update({ category_id: categoryId })
        .eq("id", productId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-by-category"] });
      queryClient.invalidateQueries({ queryKey: ["category-stats"] });
      toast.success("Product category updated");
    },
    onError: (error) => {
      toast.error(`Failed to update product: ${error.message}`);
    },
  });
}

// Reorder categories (bulk update sort_order and parent_id)
export function useReorderCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      updates: { id: string; parent_id: string | null; sort_order: number }[]
    ) => {
      // Batch update all affected categories
      const promises = updates.map((update) =>
        supabase
          .from("product_categories")
          .update({
            parent_id: update.parent_id,
            sort_order: update.sort_order,
          })
          .eq("id", update.id)
      );

      const results = await Promise.all(promises);
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        throw new Error("Failed to reorder some categories");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      toast.success("Categories reordered");
    },
    onError: (error) => {
      toast.error(`Failed to reorder categories: ${error.message}`);
    },
  });
}

// Get product counts per category
export function useCategoryProductCounts() {
  return useQuery({
    queryKey: ["category-product-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("category_id")
        .not("category_id", "is", null);

      if (error) throw error;

      const counts: Record<string, number> = {};
      data.forEach((product) => {
        if (product.category_id) {
          counts[product.category_id] = (counts[product.category_id] || 0) + 1;
        }
      });

      return counts;
    },
  });
}
