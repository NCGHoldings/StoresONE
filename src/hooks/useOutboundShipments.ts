import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OutboundShipment {
  id: string;
  shipment_number: string;
  customer_name: string | null;
  customer_address: string | null;
  sales_order_id: string | null;
  ship_date: string | null;
  carrier: string | null;
  tracking_number: string | null;
  status: "pending" | "picking" | "packing" | "shipped" | "delivered" | "cancelled";
  total_items: number | null;
  shipped_items: number | null;
  weight: number | null;
  shipping_cost: number | null;
  priority: string | null;
  picked_by: string | null;
  packed_by: string | null;
  shipped_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ShipmentInsert = Omit<OutboundShipment, "id" | "created_at" | "updated_at">;
export type ShipmentUpdate = Partial<ShipmentInsert>;

export function useOutboundShipments() {
  return useQuery({
    queryKey: ["outbound_shipments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("outbound_shipments")
        .select("*")
        .order("ship_date", { ascending: true });

      if (error) throw error;

      // Fetch linked sales orders for shipments that have valid UUID sales_order_id
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validUuidIds = data
        .filter((s) => s.sales_order_id && uuidRegex.test(s.sales_order_id))
        .map((s) => s.sales_order_id as string);

      let soMap: Record<string, { so_number: string; status: string }> = {};
      
      if (validUuidIds.length > 0) {
        const { data: salesOrders } = await supabase
          .from("sales_orders")
          .select("id, so_number, status")
          .in("id", validUuidIds);

        if (salesOrders) {
          soMap = salesOrders.reduce((acc, so) => {
            acc[so.id] = { so_number: so.so_number, status: so.status || "" };
            return acc;
          }, {} as Record<string, { so_number: string; status: string }>);
        }
      }

      // Merge SO data with shipments
      return data.map((shipment) => ({
        ...shipment,
        sales_order: shipment.sales_order_id ? soMap[shipment.sales_order_id] : null,
      })) as (OutboundShipment & { sales_order?: { so_number: string; status: string } | null })[];
    },
  });
}

export function useMarkShipmentDelivered() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shipmentId: string) => {
      // Get shipment to find linked SO
      const { data: shipment, error: shipError } = await supabase
        .from("outbound_shipments")
        .select("sales_order_id")
        .eq("id", shipmentId)
        .single();

      if (shipError) throw shipError;

      // Update shipment status
      const { data, error } = await supabase
        .from("outbound_shipments")
        .update({ status: "delivered" })
        .eq("id", shipmentId)
        .select()
        .single();

      if (error) throw error;

      // If linked to SO, update SO and potentially CPO
      if (shipment?.sales_order_id) {
        const { data: so } = await supabase
          .from("sales_orders")
          .select("customer_po_id")
          .eq("id", shipment.sales_order_id)
          .single();

        await supabase
          .from("sales_orders")
          .update({ status: "delivered" })
          .eq("id", shipment.sales_order_id);

        if (so?.customer_po_id) {
          await supabase
            .from("customer_pos")
            .update({ status: "fulfilled" })
            .eq("id", so.customer_po_id);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outbound_shipments"] });
      queryClient.invalidateQueries({ queryKey: ["sales_orders"] });
      queryClient.invalidateQueries({ queryKey: ["customer_pos"] });
      toast.success("Shipment marked as delivered");
    },
    onError: (error) => {
      toast.error("Failed to update shipment: " + error.message);
    },
  });
}

export function useCreateOutboundShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shipment: ShipmentInsert) => {
      const { data, error } = await supabase
        .from("outbound_shipments")
        .insert(shipment)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outbound_shipments"] });
      toast.success("Shipment created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create shipment: " + error.message);
    },
  });
}

export function useUpdateOutboundShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ShipmentUpdate }) => {
      const { data, error } = await supabase
        .from("outbound_shipments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outbound_shipments"] });
      toast.success("Shipment updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update shipment: " + error.message);
    },
  });
}
