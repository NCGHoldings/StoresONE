import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MaterialDemand {
  id: string;
  product_id: string;
  demand_type: string;
  required_date: string;
  quantity: number;
  fulfilled_quantity: number;
  source_type: string | null;
  source_id: string | null;
  priority: string;
  status: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  products?: {
    id: string;
    sku: string;
    name: string;
    reorder_point: number | null;
    lead_time_days: number | null;
    min_stock_level: number | null;
  } | null;
}

export interface DemandSupplyItem {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  reservedQuantity: number;
  availableStock: number;
  reorderPoint: number;
  totalDemand: number;
  pendingSupply: number;
  netPosition: number;
  status: "ok" | "low" | "critical" | "out";
  leadTimeDays: number;
  suggestedOrderQty: number;
}

// Fetch all material demands
export function useMaterialDemands() {
  return useQuery({
    queryKey: ["material-demands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("material_demands")
        .select(`
          *,
          products (id, sku, name, reorder_point, lead_time_days, min_stock_level)
        `)
        .order("required_date", { ascending: true });

      if (error) throw error;
      return data as MaterialDemand[];
    },
  });
}

// Fetch demands for a specific product
export function useMaterialDemandsByProduct(productId: string | undefined) {
  return useQuery({
    queryKey: ["material-demands", "product", productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from("material_demands")
        .select(`
          *,
          products (id, sku, name)
        `)
        .eq("product_id", productId)
        .order("required_date", { ascending: true });

      if (error) throw error;
      return data as MaterialDemand[];
    },
    enabled: !!productId,
  });
}

// Demand/Supply overview with MRP logic
export function useDemandSupplyOverview() {
  return useQuery({
    queryKey: ["demand-supply-overview"],
    queryFn: async () => {
      // Get all products with inventory
      const { data: products } = await supabase
        .from("products")
        .select("id, sku, name, reorder_point, lead_time_days, min_stock_level")
        .eq("is_active", true);

      if (!products) return [];

      const overview: DemandSupplyItem[] = [];

      for (const product of products) {
        // Get current inventory
        const { data: inventory } = await supabase
          .from("inventory")
          .select("quantity, reserved_quantity, available_quantity")
          .eq("product_id", product.id);

        const currentStock = inventory?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 0;
        const reservedQuantity = inventory?.reduce((sum, i) => sum + (i.reserved_quantity || 0), 0) || 0;
        const availableStock = currentStock - reservedQuantity;

        // Get open demands
        const { data: demands } = await supabase
          .from("material_demands")
          .select("quantity, fulfilled_quantity")
          .eq("product_id", product.id)
          .in("status", ["open", "planned"]);

        const totalDemand = demands?.reduce(
          (sum, d) => sum + (d.quantity - (d.fulfilled_quantity || 0)),
          0
        ) || 0;

        // Get pending supply (approved POs not yet received)
        const { data: poLines } = await supabase
          .from("purchase_order_lines")
          .select(`
            quantity,
            received_quantity,
            purchase_orders!inner (status)
          `)
          .eq("product_id", product.id)
          .in("purchase_orders.status", ["approved", "in_transit"]);

        const pendingSupply = poLines?.reduce(
          (sum, pl) => sum + (pl.quantity - (pl.received_quantity || 0)),
          0
        ) || 0;

        const reorderPoint = product.reorder_point || product.min_stock_level || 0;
        const netPosition = availableStock + pendingSupply - totalDemand;

        let status: DemandSupplyItem["status"] = "ok";
        if (availableStock <= 0) {
          status = "out";
        } else if (netPosition <= 0) {
          status = "critical";
        } else if (netPosition <= reorderPoint) {
          status = "low";
        }

        // Calculate suggested order quantity
        const leadTimeDays = product.lead_time_days || 7;
        const dailyDemand = totalDemand / 30; // Rough estimate
        const suggestedOrderQty = Math.max(
          0,
          Math.ceil(reorderPoint + dailyDemand * leadTimeDays - netPosition)
        );

        overview.push({
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          currentStock,
          reservedQuantity,
          availableStock,
          reorderPoint,
          totalDemand,
          pendingSupply,
          netPosition,
          status,
          leadTimeDays,
          suggestedOrderQty,
        });
      }

      return overview;
    },
  });
}

// Reorder alerts
export function useReorderAlerts() {
  const { data: overview } = useDemandSupplyOverview();

  return useQuery({
    queryKey: ["reorder-alerts", overview],
    queryFn: async () => {
      if (!overview) return [];
      return overview.filter((item) => item.status !== "ok" || item.suggestedOrderQty > 0);
    },
    enabled: !!overview,
  });
}

// Demand stats
export function useMaterialDemandStats() {
  return useQuery({
    queryKey: ["material-demand-stats"],
    queryFn: async () => {
      const { data: demands } = await supabase
        .from("material_demands")
        .select("id, status, quantity, fulfilled_quantity, required_date");

      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      return {
        total: demands?.length || 0,
        open: demands?.filter((d) => d.status === "open").length || 0,
        planned: demands?.filter((d) => d.status === "planned").length || 0,
        fulfilled: demands?.filter((d) => d.status === "fulfilled").length || 0,
        overdue: demands?.filter(
          (d) => d.status === "open" && new Date(d.required_date) < today
        ).length || 0,
        dueThisWeek: demands?.filter(
          (d) =>
            d.status === "open" &&
            new Date(d.required_date) >= today &&
            new Date(d.required_date) <= nextWeek
        ).length || 0,
        totalQuantity: demands?.reduce((sum, d) => sum + d.quantity, 0) || 0,
        fulfilledQuantity: demands?.reduce((sum, d) => sum + (d.fulfilled_quantity || 0), 0) || 0,
      };
    },
  });
}

// Create demand
export function useCreateDemand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (demand: Partial<MaterialDemand>) => {
      const { products, ...insertData } = demand;
      const { data, error } = await supabase
        .from("material_demands")
        .insert(insertData as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material-demands"] });
      queryClient.invalidateQueries({ queryKey: ["material-demand-stats"] });
      queryClient.invalidateQueries({ queryKey: ["demand-supply-overview"] });
      queryClient.invalidateQueries({ queryKey: ["reorder-alerts"] });
      toast.success("Demand created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create demand: ${error.message}`);
    },
  });
}

// Update demand
export function useUpdateDemand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<MaterialDemand> }) => {
      const { products, ...updateData } = updates;
      const { data, error } = await supabase
        .from("material_demands")
        .update(updateData as never)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material-demands"] });
      queryClient.invalidateQueries({ queryKey: ["material-demand-stats"] });
      queryClient.invalidateQueries({ queryKey: ["demand-supply-overview"] });
      toast.success("Demand updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update demand: ${error.message}`);
    },
  });
}

// Delete demand
export function useDeleteDemand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("material_demands").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material-demands"] });
      queryClient.invalidateQueries({ queryKey: ["material-demand-stats"] });
      queryClient.invalidateQueries({ queryKey: ["demand-supply-overview"] });
      toast.success("Demand deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete demand: ${error.message}`);
    },
  });
}

// Generate PRs from reorder alerts
export function useGeneratePRsFromAlerts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: { productId: string; quantity: number }[]) => {
      // Generate PR number
      const year = new Date().getFullYear();
      const prefix = `PR-${year}-`;
      const { data: existingPRs } = await supabase
        .from("purchase_requisitions")
        .select("pr_number")
        .ilike("pr_number", `${prefix}%`)
        .order("pr_number", { ascending: false })
        .limit(1);

      let nextNumber = 1;
      if (existingPRs && existingPRs.length > 0) {
        const lastNumber = parseInt(existingPRs[0].pr_number.replace(prefix, ""), 10);
        nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
      }
      const prNumber = `${prefix}${nextNumber.toString().padStart(4, "0")}`;

      // Get product details
      const productIds = items.map((i) => i.productId);
      const { data: products } = await supabase
        .from("products")
        .select("id, name, sku, unit_cost, unit_of_measure")
        .in("id", productIds);

      // Calculate total
      let total = 0;
      for (const item of items) {
        const product = products?.find((p) => p.id === item.productId);
        if (product) {
          total += item.quantity * (product.unit_cost || 0);
        }
      }

      // Create PR
      const { data: pr, error: prError } = await supabase
        .from("purchase_requisitions")
        .insert({
          pr_number: prNumber,
          status: "draft",
          urgency: "normal",
          total_estimated_value: total,
          justification: "Auto-generated from MRP reorder alerts",
        })
        .select()
        .single();

      if (prError) throw prError;

      // Create PR lines
      for (const item of items) {
        const product = products?.find((p) => p.id === item.productId);
        if (product) {
          await supabase.from("purchase_requisition_lines").insert({
            pr_id: pr.id,
            product_id: item.productId,
            product_name: product.name,
            quantity: item.quantity,
            unit_of_measure: product.unit_of_measure || "EA",
            estimated_price: product.unit_cost || 0,
            total_price: item.quantity * (product.unit_cost || 0),
          });
        }
      }

      return pr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["pr-stats"] });
      toast.success("Purchase Requisition created from MRP alerts");
    },
    onError: (error) => {
      toast.error(`Failed to create PR: ${error.message}`);
    },
  });
}
