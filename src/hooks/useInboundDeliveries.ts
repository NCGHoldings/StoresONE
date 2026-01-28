import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface InboundDelivery {
  id: string;
  delivery_number: string;
  supplier_id: string | null;
  po_id: string | null;
  expected_date: string | null;
  actual_date: string | null;
  status: "scheduled" | "in_transit" | "arrived" | "receiving" | "completed" | "cancelled";
  carrier: string | null;
  tracking_number: string | null;
  dock_door: string | null;
  total_items: number | null;
  received_items: number | null;
  discrepancy_notes: string | null;
  quality_check_passed: boolean | null;
  received_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  suppliers?: { company_name: string; supplier_code: string };
  purchase_orders?: { po_number: string };
}

export type DeliveryInsert = Omit<InboundDelivery, "id" | "created_at" | "updated_at" | "suppliers" | "purchase_orders">;
export type DeliveryUpdate = Partial<DeliveryInsert>;

export function useInboundDeliveries() {
  return useQuery({
    queryKey: ["inbound_deliveries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inbound_deliveries")
        .select(`
          *,
          suppliers(company_name, supplier_code),
          purchase_orders(po_number)
        `)
        .order("expected_date", { ascending: true });

      if (error) throw error;
      return data as InboundDelivery[];
    },
  });
}

export function useCreateInboundDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (delivery: DeliveryInsert) => {
      const { data, error } = await supabase
        .from("inbound_deliveries")
        .insert(delivery)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbound_deliveries"] });
      toast.success("Delivery created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create delivery: " + error.message);
    },
  });
}

export function useUpdateInboundDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: DeliveryUpdate }) => {
      const { data, error } = await supabase
        .from("inbound_deliveries")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbound_deliveries"] });
      toast.success("Delivery updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update delivery: " + error.message);
    },
  });
}

export function useInboundDeliveriesByPO(poId: string | null | undefined) {
  return useQuery({
    queryKey: ["inbound_deliveries", "po", poId],
    queryFn: async () => {
      if (!poId) return [];
      const { data, error } = await supabase
        .from("inbound_deliveries")
        .select(`
          *,
          suppliers(company_name, supplier_code),
          purchase_orders(po_number)
        `)
        .eq("po_id", poId)
        .order("actual_date", { ascending: false });

      if (error) throw error;
      return data as InboundDelivery[];
    },
    enabled: !!poId,
  });
}
