import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

export type PurchaseReturnStatus = 
  | "draft"
  | "pending_pickup"
  | "shipped"
  | "received_by_supplier"
  | "credit_received"
  | "cancelled";

export type ReturnReason = 
  | "defective"
  | "wrong_item"
  | "damaged"
  | "excess"
  | "quality_issue"
  | "other";

export interface PurchaseReturn {
  id: string;
  return_number: string;
  supplier_id: string;
  purchase_order_id: string | null;
  grn_id: string | null;
  status: PurchaseReturnStatus;
  return_reason: ReturnReason;
  return_date: string;
  shipped_date: string | null;
  received_date: string | null;
  credit_date: string | null;
  credit_note_number: string | null;
  total_amount: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  suppliers?: {
    company_name: string;
    supplier_code: string;
  };
  purchase_orders?: {
    po_number: string;
  };
  inbound_deliveries?: {
    delivery_number: string;
  };
}

export interface PurchaseReturnLine {
  id: string;
  return_id: string;
  product_id: string;
  po_line_id: string | null;
  grn_line_id: string | null;
  batch_id: string | null;
  bin_id: string | null;
  quantity_returned: number;
  unit_cost: number;
  line_total: number;
  reason_notes: string | null;
  created_at: string;
  products?: {
    sku: string;
    name: string;
  };
  storage_bins?: {
    bin_code: string;
  };
  inventory_batches?: {
    batch_number: string;
  };
}

export type PurchaseReturnInsert = {
  return_number: string;
  supplier_id: string;
  purchase_order_id?: string | null;
  grn_id?: string | null;
  status?: PurchaseReturnStatus;
  return_reason: ReturnReason;
  return_date: string;
  notes?: string | null;
  total_amount?: number | null;
  created_by?: string | null;
};

export type PurchaseReturnLineInsert = {
  return_id: string;
  product_id: string;
  po_line_id?: string | null;
  grn_line_id?: string | null;
  batch_id?: string | null;
  bin_id?: string | null;
  quantity_returned: number;
  unit_cost: number;
  reason_notes?: string | null;
};

// Generate return number
async function generateReturnNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PRET-${year}-`;
  
  const { data } = await supabase
    .from("purchase_returns")
    .select("return_number")
    .ilike("return_number", `${prefix}%`)
    .order("return_number", { ascending: false })
    .limit(1);

  let nextNum = 1;
  if (data && data.length > 0) {
    const lastNum = parseInt(data[0].return_number.split("-").pop() || "0");
    nextNum = lastNum + 1;
  }

  return `${prefix}${String(nextNum).padStart(4, "0")}`;
}

export function usePurchaseReturns(filters?: { status?: string; supplierId?: string }) {
  return useQuery({
    queryKey: ["purchase_returns", filters],
    queryFn: async () => {
      let query = supabase
        .from("purchase_returns")
        .select(`
          *,
          suppliers (
            company_name,
            supplier_code
          ),
          purchase_orders (
            po_number
          ),
          inbound_deliveries:grn_id (
            delivery_number
          )
        `)
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status as Database['public']['Enums']['purchase_return_status']);
      }
      if (filters?.supplierId) {
        query = query.eq("supplier_id", filters.supplierId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PurchaseReturn[];
    },
  });
}

export function usePurchaseReturnDetails(id: string | null) {
  return useQuery({
    queryKey: ["purchase_returns", id],
    queryFn: async () => {
      if (!id) return null;

      const { data: ret, error: retError } = await supabase
        .from("purchase_returns")
        .select(`
          *,
          suppliers (
            company_name,
            supplier_code
          ),
          purchase_orders (
            po_number
          ),
          inbound_deliveries:grn_id (
            delivery_number
          )
        `)
        .eq("id", id)
        .single();

      if (retError) throw retError;

      const { data: lines, error: linesError } = await supabase
        .from("purchase_return_lines")
        .select(`
          *,
          products (
            sku,
            name
          ),
          storage_bins (
            bin_code
          ),
          inventory_batches (
            batch_number
          )
        `)
        .eq("return_id", id)
        .order("created_at", { ascending: true });

      if (linesError) throw linesError;

      return { return: ret as PurchaseReturn, lines: lines as PurchaseReturnLine[] };
    },
    enabled: !!id,
  });
}

export function usePurchaseReturnStats() {
  return useQuery({
    queryKey: ["purchase_returns_stats"],
    queryFn: async () => {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
      
      const { data: all, error } = await supabase
        .from("purchase_returns")
        .select("id, status, total_amount, return_date");

      if (error) throw error;

      const draft = all?.filter(r => r.status === "draft").length || 0;
      const pendingPickup = all?.filter(r => r.status === "pending_pickup").length || 0;
      const shipped = all?.filter(r => r.status === "shipped").length || 0;
      const awaitingCredit = all?.filter(r => r.status === "received_by_supplier").length || 0;
      const creditReceivedThisMonth = all?.filter(
        r => r.status === "credit_received" && r.return_date >= startOfMonth
      ).length || 0;
      const totalCreditValue = all?.filter(r => r.status === "credit_received")
        .reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0) || 0;

      return {
        draft,
        pendingPickup,
        shipped,
        awaitingCredit,
        creditReceivedThisMonth,
        totalCreditValue,
      };
    },
  });
}

export function useCreatePurchaseReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      returnData,
      lines,
    }: {
      returnData: Omit<PurchaseReturnInsert, "return_number">;
      lines: Omit<PurchaseReturnLineInsert, "return_id">[];
    }) => {
      const returnNumber = await generateReturnNumber();

      // Calculate total
      const totalAmount = lines.reduce((sum, l) => sum + l.quantity_returned * l.unit_cost, 0);

      const { data: ret, error: retError } = await supabase
        .from("purchase_returns")
        .insert({
          ...returnData,
          return_number: returnNumber,
          total_amount: totalAmount,
        })
        .select()
        .single();

      if (retError) throw retError;

      if (lines.length > 0) {
        const linesWithReturnId = lines.map((line) => ({
          ...line,
          return_id: ret.id,
        }));

        const { error: linesError } = await supabase
          .from("purchase_return_lines")
          .insert(linesWithReturnId);

        if (linesError) throw linesError;
      }

      return ret;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase_returns"] });
      toast.success("Purchase Return created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create Purchase Return: " + error.message);
    },
  });
}

export function useSubmitForPickup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (returnId: string) => {
      const { data, error } = await supabase
        .from("purchase_returns")
        .update({ status: "pending_pickup" })
        .eq("id", returnId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase_returns"] });
      toast.success("Return submitted for pickup");
    },
    onError: (error) => {
      toast.error("Failed to submit return: " + error.message);
    },
  });
}

export function useShipReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ returnId, shippedDate }: { returnId: string; shippedDate: string }) => {
      // Get return lines to deduct inventory
      const { data: lines, error: linesError } = await supabase
        .from("purchase_return_lines")
        .select("*")
        .eq("return_id", returnId);

      if (linesError) throw linesError;

      // Deduct inventory for each line
      for (const line of lines || []) {
        if (line.bin_id) {
          // Find inventory record
          const { data: inventory } = await supabase
            .from("inventory")
            .select("*")
            .eq("product_id", line.product_id)
            .eq("bin_id", line.bin_id)
            .maybeSingle();

          if (inventory) {
            const newQty = Math.max(0, (inventory.quantity || 0) - line.quantity_returned);
            const newAvail = Math.max(0, (inventory.available_quantity || 0) - line.quantity_returned);
            
            await supabase
              .from("inventory")
              .update({
                quantity: newQty,
                available_quantity: newAvail,
              })
              .eq("id", inventory.id);
          }
        }

        // Log inventory transaction
        await supabase.from("inventory_transactions").insert({
          product_id: line.product_id,
          bin_id: line.bin_id,
          batch_id: line.batch_id,
          quantity: line.quantity_returned,
          transaction_type: "issue",
          reference_type: "purchase_return",
          reference_id: returnId,
          notes: `Purchase return shipment`,
        });
      }

      // Update return status
      const { data, error } = await supabase
        .from("purchase_returns")
        .update({
          status: "shipped",
          shipped_date: shippedDate,
        })
        .eq("id", returnId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase_returns"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory_transactions"] });
      toast.success("Return shipped and inventory updated");
    },
    onError: (error) => {
      toast.error("Failed to ship return: " + error.message);
    },
  });
}

export function useConfirmSupplierReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ returnId, receivedDate }: { returnId: string; receivedDate: string }) => {
      const { data, error } = await supabase
        .from("purchase_returns")
        .update({
          status: "received_by_supplier",
          received_date: receivedDate,
        })
        .eq("id", returnId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase_returns"] });
      toast.success("Supplier receipt confirmed");
    },
    onError: (error) => {
      toast.error("Failed to confirm receipt: " + error.message);
    },
  });
}

export function useConfirmCredit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      returnId,
      creditDate,
      creditNoteNumber,
    }: {
      returnId: string;
      creditDate: string;
      creditNoteNumber: string;
    }) => {
      const { data, error } = await supabase
        .from("purchase_returns")
        .update({
          status: "credit_received",
          credit_date: creditDate,
          credit_note_number: creditNoteNumber,
        })
        .eq("id", returnId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase_returns"] });
      toast.success("Credit note recorded");
    },
    onError: (error) => {
      toast.error("Failed to record credit: " + error.message);
    },
  });
}

export function useCancelPurchaseReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (returnId: string) => {
      const { data, error } = await supabase
        .from("purchase_returns")
        .update({ status: "cancelled" })
        .eq("id", returnId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase_returns"] });
      toast.success("Return cancelled");
    },
    onError: (error) => {
      toast.error("Failed to cancel return: " + error.message);
    },
  });
}
