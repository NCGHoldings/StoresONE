import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SalesOrder {
  id: string;
  so_number: string;
  customer_id: string;
  customer_po_id: string | null;
  order_date: string;
  required_date: string | null;
  ship_date: string | null;
  total_amount: number | null;
  tax_amount: number | null;
  shipping_cost: number | null;
  status: "draft" | "confirmed" | "picking" | "shipping" | "shipped" | "delivered" | "cancelled";
  shipping_address: string | null;
  billing_address: string | null;
  payment_terms: number | null;
  priority: "low" | "normal" | "high" | "urgent";
  assigned_to: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  customers?: {
    company_name: string;
    customer_code: string;
  };
  customer_pos?: {
    cpo_number: string;
    internal_ref: string;
  };
}

export interface SalesOrderLine {
  id: string;
  so_id: string;
  cpo_line_id: string | null;
  line_number: number;
  product_id: string;
  quantity_ordered: number;
  quantity_reserved: number | null;
  quantity_picked: number | null;
  quantity_shipped: number | null;
  unit_price: number | null;
  total_price: number | null;
  bin_id: string | null;
  status: "pending" | "reserved" | "picking" | "picked" | "shipped";
  created_at: string;
  updated_at: string;
  products?: {
    sku: string;
    name: string;
  };
  storage_bins?: {
    bin_code: string;
  };
}

export type SalesOrderInsert = {
  so_number: string;
  customer_id: string;
  customer_po_id?: string | null;
  order_date: string;
  required_date?: string | null;
  total_amount?: number | null;
  tax_amount?: number | null;
  shipping_cost?: number | null;
  status?: string;
  shipping_address?: string | null;
  billing_address?: string | null;
  payment_terms?: number | null;
  priority?: string;
  assigned_to?: string | null;
  notes?: string | null;
  created_by?: string | null;
};

export type SalesOrderLineInsert = {
  so_id: string;
  cpo_line_id?: string | null;
  line_number: number;
  product_id: string;
  quantity_ordered: number;
  unit_price?: number | null;
  total_price?: number | null;
  status?: string;
};

export function useSalesOrders() {
  return useQuery({
    queryKey: ["sales_orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_orders")
        .select(`
          *,
          customers (
            company_name,
            customer_code
          ),
          customer_pos (
            cpo_number,
            internal_ref
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SalesOrder[];
    },
  });
}

export function useSalesOrderDetails(id: string | null) {
  return useQuery({
    queryKey: ["sales_orders", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data: so, error: soError } = await supabase
        .from("sales_orders")
        .select(`
          *,
          customers (
            company_name,
            customer_code,
            shipping_address,
            billing_address
          ),
          customer_pos (
            cpo_number,
            internal_ref
          )
        `)
        .eq("id", id)
        .single();

      if (soError) throw soError;

      const { data: lines, error: linesError } = await supabase
        .from("sales_order_lines")
        .select(`
          *,
          products (
            sku,
            name
          ),
          storage_bins (
            bin_code
          )
        `)
        .eq("so_id", id)
        .order("line_number", { ascending: true });

      if (linesError) throw linesError;

      return { so: so as SalesOrder, lines: lines as SalesOrderLine[] };
    },
    enabled: !!id,
  });
}

export function useCreateSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ so, lines }: { so: SalesOrderInsert; lines: Omit<SalesOrderLineInsert, "so_id">[] }) => {
      const { data: soData, error: soError } = await supabase
        .from("sales_orders")
        .insert(so)
        .select()
        .single();

      if (soError) throw soError;

      if (lines.length > 0) {
        const linesWithSoId = lines.map((line) => ({
          ...line,
          so_id: soData.id,
        }));

        const { error: linesError } = await supabase
          .from("sales_order_lines")
          .insert(linesWithSoId);

        if (linesError) throw linesError;
      }

      return soData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales_orders"] });
      toast.success("Sales Order created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create Sales Order: " + error.message);
    },
  });
}

export function useUpdateSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SalesOrderInsert> }) => {
      const { data, error } = await supabase
        .from("sales_orders")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales_orders"] });
      toast.success("Sales Order updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update Sales Order: " + error.message);
    },
  });
}

export function useConfirmSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (soId: string) => {
      // Get SO lines
      const { data: lines, error: linesError } = await supabase
        .from("sales_order_lines")
        .select("*")
        .eq("so_id", soId);

      if (linesError) throw linesError;

      // For each line, try to reserve inventory
      for (const line of lines || []) {
        // Find available inventory for the product
        const { data: inventory } = await supabase
          .from("inventory")
          .select("*")
          .eq("product_id", line.product_id)
          .gt("available_quantity", 0)
          .order("available_quantity", { ascending: false })
          .limit(1);

        if (inventory && inventory.length > 0) {
          const reserveQty = Math.min(inventory[0].available_quantity || 0, line.quantity_ordered);
          
          // Update inventory reserved quantity
          await supabase
            .from("inventory")
            .update({
              reserved_quantity: (inventory[0].reserved_quantity || 0) + reserveQty,
              available_quantity: (inventory[0].available_quantity || 0) - reserveQty,
            })
            .eq("id", inventory[0].id);

          // Update SO line
          await supabase
            .from("sales_order_lines")
            .update({
              quantity_reserved: reserveQty,
              bin_id: inventory[0].bin_id,
              status: reserveQty >= line.quantity_ordered ? "reserved" : "pending",
            })
            .eq("id", line.id);

          // Log inventory transaction
          await supabase.from("inventory_transactions").insert({
            product_id: line.product_id,
            quantity: -reserveQty,
            transaction_type: "adjustment",
            reference_type: "sales_order",
            reference_id: soId,
            bin_id: inventory[0].bin_id,
            notes: `Reserved for SO`,
          });
        }
      }

      // Update SO status
      const { data, error } = await supabase
        .from("sales_orders")
        .update({ status: "confirmed" })
        .eq("id", soId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales_orders"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Sales Order confirmed and inventory reserved");
    },
    onError: (error) => {
      toast.error("Failed to confirm Sales Order: " + error.message);
    },
  });
}

export function useStartPicking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (soId: string) => {
      // Update all reserved lines to picking
      await supabase
        .from("sales_order_lines")
        .update({ status: "picking" })
        .eq("so_id", soId)
        .eq("status", "reserved");

      const { data, error } = await supabase
        .from("sales_orders")
        .update({ status: "picking" })
        .eq("id", soId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales_orders"] });
      toast.success("Picking started");
    },
    onError: (error) => {
      toast.error("Failed to start picking: " + error.message);
    },
  });
}

export function useCompletePicking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ soId, pickedLines }: { soId: string; pickedLines: { lineId: string; quantityPicked: number }[] }) => {
      for (const pl of pickedLines) {
        await supabase
          .from("sales_order_lines")
          .update({
            quantity_picked: pl.quantityPicked,
            status: "picked",
          })
          .eq("id", pl.lineId);
      }

      const { data, error } = await supabase
        .from("sales_orders")
        .update({ status: "shipping" })
        .eq("id", soId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales_orders"] });
      toast.success("Picking completed, ready for shipping");
    },
    onError: (error) => {
      toast.error("Failed to complete picking: " + error.message);
    },
  });
}

export function useCreateShipmentFromSO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (soId: string) => {
      // Get SO details
      const { data: so, error: soError } = await supabase
        .from("sales_orders")
        .select(`
          *,
          customers (
            company_name
          )
        `)
        .eq("id", soId)
        .single();

      if (soError) throw soError;

      // Get total items
      const { data: lines } = await supabase
        .from("sales_order_lines")
        .select("quantity_picked")
        .eq("so_id", soId);

      const totalItems = lines?.reduce((sum, l) => sum + (l.quantity_picked || 0), 0) || 0;

      // Generate shipment number
      const shipmentNumber = `SHP-${Date.now().toString().slice(-6)}`;

      // Create outbound shipment
      const { data: shipment, error: shipError } = await supabase
        .from("outbound_shipments")
        .insert({
          shipment_number: shipmentNumber,
          customer_name: (so.customers as any)?.company_name,
          customer_address: so.shipping_address,
          sales_order_id: soId,
          ship_date: new Date().toISOString().split("T")[0],
          status: "pending",
          total_items: totalItems,
          priority: so.priority,
        })
        .select()
        .single();

      if (shipError) throw shipError;

      // Update SO status
      await supabase
        .from("sales_orders")
        .update({ status: "shipping" })
        .eq("id", soId);

      return shipment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales_orders"] });
      queryClient.invalidateQueries({ queryKey: ["outbound_shipments"] });
      toast.success("Shipment created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create shipment: " + error.message);
    },
  });
}

export function useConfirmShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      soId,
      trackingNumber,
      carrier,
    }: {
      soId: string;
      trackingNumber?: string;
      carrier?: string;
    }) => {
      // 1. Get SO lines
      const { data: lines, error: linesError } = await supabase
        .from("sales_order_lines")
        .select("*")
        .eq("so_id", soId);

      if (linesError) throw linesError;

      // 2. Update each line to shipped and deduct inventory
      for (const line of lines || []) {
        // Update SO line
        await supabase
          .from("sales_order_lines")
          .update({
            quantity_shipped: line.quantity_picked,
            status: "shipped",
          })
          .eq("id", line.id);

        // Deduct from inventory - reduce quantity by picked amount, release reserved
        if (line.product_id) {
          let inv = null;

          // Try to find inventory by product + bin if bin_id is set
          if (line.bin_id) {
            const { data } = await supabase
              .from("inventory")
              .select("*")
              .eq("product_id", line.product_id)
              .eq("bin_id", line.bin_id)
              .maybeSingle();
            inv = data;
          }

          // Fallback: find any inventory record for this product with sufficient quantity
          if (!inv) {
            const { data } = await supabase
              .from("inventory")
              .select("*")
              .eq("product_id", line.product_id)
              .gt("quantity", 0)
              .order("quantity", { ascending: false })
              .limit(1)
              .maybeSingle();
            inv = data;
          }

          if (inv) {
            const deductQty = line.quantity_picked || 0;
            const releaseReserved = Math.min(line.quantity_reserved || 0, inv.reserved_quantity || 0);

            const newQty = Math.max(0, (inv.quantity || 0) - deductQty);
            const newReserved = Math.max(0, (inv.reserved_quantity || 0) - releaseReserved);

            await supabase
              .from("inventory")
              .update({
                quantity: newQty,
                reserved_quantity: newReserved,
                available_quantity: newQty - newReserved,
              })
              .eq("id", inv.id);

            // Log inventory transaction
            await supabase.from("inventory_transactions").insert({
              product_id: line.product_id,
              quantity: -deductQty,
              transaction_type: "issue",
              reference_type: "sales_order",
              reference_id: soId,
              bin_id: inv.bin_id,
              notes: `Shipped for SO`,
            });
          }
        }
      }

      // 3. Update SO status
      const { data, error } = await supabase
        .from("sales_orders")
        .update({
          status: "shipped",
          ship_date: new Date().toISOString().split("T")[0],
        })
        .eq("id", soId)
        .select()
        .single();

      if (error) throw error;

      // 4. Update outbound shipment
      await supabase
        .from("outbound_shipments")
        .update({
          status: "shipped",
          tracking_number: trackingNumber,
          carrier: carrier,
          shipped_items: lines?.reduce((sum, l) => sum + (l.quantity_picked || 0), 0),
        })
        .eq("sales_order_id", soId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales_orders"] });
      queryClient.invalidateQueries({ queryKey: ["outbound_shipments"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Order shipped successfully");
    },
    onError: (error) => {
      toast.error("Failed to ship order: " + error.message);
    },
  });
}

export function useConfirmDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (soId: string) => {
      // 1. Get SO to find linked CPO
      const { data: so, error: soError } = await supabase
        .from("sales_orders")
        .select("customer_po_id")
        .eq("id", soId)
        .single();

      if (soError) throw soError;

      // 2. Update SO status
      const { data, error } = await supabase
        .from("sales_orders")
        .update({ status: "delivered" })
        .eq("id", soId)
        .select()
        .single();

      if (error) throw error;

      // 3. Update outbound shipment
      await supabase
        .from("outbound_shipments")
        .update({ status: "delivered" })
        .eq("sales_order_id", soId);

      // 4. Mark Customer PO as fulfilled
      if (so?.customer_po_id) {
        await supabase
          .from("customer_pos")
          .update({ status: "fulfilled" })
          .eq("id", so.customer_po_id);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales_orders"] });
      queryClient.invalidateQueries({ queryKey: ["outbound_shipments"] });
      queryClient.invalidateQueries({ queryKey: ["customer_pos"] });
      toast.success("Delivery confirmed - Customer PO fulfilled");
    },
    onError: (error) => {
      toast.error("Failed to confirm delivery: " + error.message);
    },
  });
}

export function useSalesOrderStats() {
  return useQuery({
    queryKey: ["sales_orders", "stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_orders")
        .select("status");

      if (error) throw error;

      const stats = {
        total: data.length,
        draft: data.filter((s) => s.status === "draft").length,
        confirmed: data.filter((s) => s.status === "confirmed").length,
        picking: data.filter((s) => s.status === "picking").length,
        shipping: data.filter((s) => s.status === "shipping").length,
        shipped: data.filter((s) => s.status === "shipped").length,
        delivered: data.filter((s) => s.status === "delivered").length,
      };

      return stats;
    },
  });
}

export async function generateSONumber(): Promise<string> {
  const year = new Date().getFullYear();
  const { data } = await supabase
    .from("sales_orders")
    .select("so_number")
    .ilike("so_number", `SO-${year}-%`)
    .order("created_at", { ascending: false })
    .limit(1);

  let nextNumber = 1;
  if (data && data.length > 0) {
    const match = data[0].so_number.match(/SO-\d+-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `SO-${year}-${nextNumber.toString().padStart(4, "0")}`;
}
