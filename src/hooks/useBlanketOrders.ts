import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BlanketOrder {
  id: string;
  bo_number: string;
  supplier_id: string;
  contract_id: string | null;
  status: string;
  total_value: number;
  consumed_value: number;
  currency: string;
  valid_from: string;
  valid_to: string;
  payment_terms: string | null;
  delivery_terms: string | null;
  notes: string | null;
  created_by: string | null;
  approved_by: string | null;
  approved_date: string | null;
  created_at: string;
  updated_at: string;
  suppliers?: {
    id: string;
    company_name: string;
    supplier_code: string;
  } | null;
  contracts?: {
    id: string;
    title: string;
    contract_number: string;
  } | null;
}

export interface BlanketOrderLine {
  id: string;
  bo_id: string;
  product_id: string | null;
  product_name: string | null;
  agreed_price: number;
  max_quantity: number | null;
  released_quantity: number;
  unit_of_measure: string;
  notes: string | null;
  created_at: string;
  products?: {
    id: string;
    sku: string;
    name: string;
  } | null;
}

// Fetch all blanket orders
export function useBlanketOrders() {
  return useQuery({
    queryKey: ["blanket-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blanket_orders")
        .select(`
          *,
          suppliers (id, company_name, supplier_code),
          contracts (id, title, contract_number)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BlanketOrder[];
    },
  });
}

// Fetch single blanket order
export function useBlanketOrder(id: string | undefined) {
  return useQuery({
    queryKey: ["blanket-orders", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("blanket_orders")
        .select(`
          *,
          suppliers (id, company_name, supplier_code),
          contracts (id, title, contract_number)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as BlanketOrder;
    },
    enabled: !!id,
  });
}

// Fetch blanket order lines
export function useBlanketOrderLines(boId: string | undefined) {
  return useQuery({
    queryKey: ["blanket-order-lines", boId],
    queryFn: async () => {
      if (!boId) return [];
      const { data, error } = await supabase
        .from("blanket_order_lines")
        .select(`
          *,
          products (id, sku, name)
        `)
        .eq("bo_id", boId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as BlanketOrderLine[];
    },
    enabled: !!boId,
  });
}

// Stats for blanket orders
export function useBlanketOrderStats() {
  return useQuery({
    queryKey: ["blanket-order-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blanket_orders")
        .select("id, status, total_value, consumed_value, valid_to");

      if (error) throw error;

      const now = new Date();
      const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      return {
        total: data.length,
        active: data.filter((bo) => bo.status === "active").length,
        expired: data.filter((bo) => bo.status === "expired").length,
        expiringSoon: data.filter(
          (bo) =>
            bo.status === "active" &&
            new Date(bo.valid_to) <= soon &&
            new Date(bo.valid_to) > now
        ).length,
        totalValue: data.reduce((sum, bo) => sum + (bo.total_value || 0), 0),
        consumedValue: data.reduce((sum, bo) => sum + (bo.consumed_value || 0), 0),
      };
    },
  });
}

// Generate next BO number
export function useNextBONumber() {
  return useQuery({
    queryKey: ["next-bo-number"],
    queryFn: async () => {
      const year = new Date().getFullYear();
      const prefix = `BO-${year}-`;

      const { data, error } = await supabase
        .from("blanket_orders")
        .select("bo_number")
        .ilike("bo_number", `${prefix}%`)
        .order("bo_number", { ascending: false })
        .limit(1);

      if (error) throw error;

      let nextNumber = 1;
      if (data && data.length > 0) {
        const lastNumber = parseInt(data[0].bo_number.replace(prefix, ""), 10);
        nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
      }

      return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
    },
  });
}

// Create blanket order
export function useCreateBlanketOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bo: Partial<BlanketOrder>) => {
      const { suppliers, contracts, ...insertData } = bo;
      const { data, error } = await supabase
        .from("blanket_orders")
        .insert(insertData as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blanket-orders"] });
      queryClient.invalidateQueries({ queryKey: ["blanket-order-stats"] });
      queryClient.invalidateQueries({ queryKey: ["next-bo-number"] });
      toast.success("Blanket order created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create blanket order: ${error.message}`);
    },
  });
}

// Update blanket order
export function useUpdateBlanketOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BlanketOrder> }) => {
      const { suppliers, contracts, ...updateData } = updates;
      const { data, error } = await supabase
        .from("blanket_orders")
        .update(updateData as never)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["blanket-orders"] });
      queryClient.invalidateQueries({ queryKey: ["blanket-orders", id] });
      queryClient.invalidateQueries({ queryKey: ["blanket-order-stats"] });
      toast.success("Blanket order updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update blanket order: ${error.message}`);
    },
  });
}

// Activate blanket order
export function useActivateBlanketOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("blanket_orders")
        .update({
          status: "active",
          approved_date: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["blanket-orders"] });
      queryClient.invalidateQueries({ queryKey: ["blanket-orders", id] });
      queryClient.invalidateQueries({ queryKey: ["blanket-order-stats"] });
      toast.success("Blanket order activated");
    },
    onError: (error) => {
      toast.error(`Failed to activate blanket order: ${error.message}`);
    },
  });
}

// Add blanket order line
export function useAddBlanketOrderLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (line: Partial<BlanketOrderLine>) => {
      const { products, ...insertData } = line;
      const { data, error } = await supabase
        .from("blanket_order_lines")
        .insert(insertData as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, line) => {
      queryClient.invalidateQueries({ queryKey: ["blanket-order-lines", line.bo_id] });
    },
    onError: (error) => {
      toast.error(`Failed to add line: ${error.message}`);
    },
  });
}

// Update blanket order line
export function useUpdateBlanketOrderLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      boId,
      updates,
    }: {
      id: string;
      boId: string;
      updates: Partial<BlanketOrderLine>;
    }) => {
      const { data, error } = await supabase
        .from("blanket_order_lines")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { data, boId };
    },
    onSuccess: (_, { boId }) => {
      queryClient.invalidateQueries({ queryKey: ["blanket-order-lines", boId] });
    },
    onError: (error) => {
      toast.error(`Failed to update line: ${error.message}`);
    },
  });
}

// Remove blanket order line
export function useRemoveBlanketOrderLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, boId }: { id: string; boId: string }) => {
      const { error } = await supabase.from("blanket_order_lines").delete().eq("id", id);
      if (error) throw error;
      return { boId };
    },
    onSuccess: (_, { boId }) => {
      queryClient.invalidateQueries({ queryKey: ["blanket-order-lines", boId] });
    },
    onError: (error) => {
      toast.error(`Failed to remove line: ${error.message}`);
    },
  });
}

// Create release order (PO) from blanket order
export function useCreateReleaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boId,
      lines,
    }: {
      boId: string;
      lines: { lineId: string; quantity: number; unitPrice: number }[];
    }) => {
      // Get blanket order
      const { data: bo } = await supabase
        .from("blanket_orders")
        .select("*")
        .eq("id", boId)
        .single();

      if (!bo) throw new Error("Blanket order not found");

      // Generate PO number
      const year = new Date().getFullYear();
      const prefix = `PO-${year}-`;
      const { data: existingPOs } = await supabase
        .from("purchase_orders")
        .select("po_number")
        .ilike("po_number", `${prefix}%`)
        .order("po_number", { ascending: false })
        .limit(1);

      let nextNumber = 1;
      if (existingPOs && existingPOs.length > 0) {
        const lastNumber = parseInt(existingPOs[0].po_number.replace(prefix, ""), 10);
        nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
      }
      const poNumber = `${prefix}${nextNumber.toString().padStart(4, "0")}`;

      // Calculate total
      const total = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);

      // Create PO
      const { data: po, error: poError } = await supabase
        .from("purchase_orders")
        .insert({
          po_number: poNumber,
          supplier_id: bo.supplier_id,
          blanket_order_id: boId,
          order_date: new Date().toISOString().split("T")[0],
          status: "draft",
          total_amount: total,
          currency: bo.currency,
          notes: `Release order from ${bo.bo_number}`,
        })
        .select()
        .single();

      if (poError) throw poError;

      // Create PO lines and update blanket line quantities
      for (const line of lines) {
        const { data: boLine } = await supabase
          .from("blanket_order_lines")
          .select("*")
          .eq("id", line.lineId)
          .single();

        if (boLine) {
          await supabase.from("purchase_order_lines").insert({
            po_id: po.id,
            product_id: boLine.product_id,
            blanket_line_id: line.lineId,
            quantity: line.quantity,
            unit_price: line.unitPrice,
            total_price: line.quantity * line.unitPrice,
          });

          // Update released quantity
          await supabase
            .from("blanket_order_lines")
            .update({
              released_quantity: (boLine.released_quantity || 0) + line.quantity,
            })
            .eq("id", line.lineId);
        }
      }

      // Update consumed value
      await supabase
        .from("blanket_orders")
        .update({
          consumed_value: (bo.consumed_value || 0) + total,
        })
        .eq("id", boId);

      return po;
    },
    onSuccess: (_, { boId }) => {
      queryClient.invalidateQueries({ queryKey: ["blanket-orders"] });
      queryClient.invalidateQueries({ queryKey: ["blanket-orders", boId] });
      queryClient.invalidateQueries({ queryKey: ["blanket-order-lines", boId] });
      queryClient.invalidateQueries({ queryKey: ["blanket-order-stats"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order-stats"] });
      toast.success("Release order created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create release order: ${error.message}`);
    },
  });
}
