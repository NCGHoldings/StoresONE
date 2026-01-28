import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { hasActiveWorkflow } from "@/hooks/useDocumentStatusSync";

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string | null;
  pr_id: string | null;
  order_date: string;
  expected_delivery: string | null;
  status: string;
  total_amount: number;
  currency: string;
  notes: string | null;
  created_by: string | null;
  approved_by: string | null;
  approved_date: string | null;
  is_locked: boolean | null;
  locked_at: string | null;
  locked_by: string | null;
  created_at: string;
  updated_at: string;
  suppliers?: {
    id: string;
    company_name: string;
    supplier_code: string;
    email: string | null;
    phone: string | null;
    contact_person: string | null;
  } | null;
  purchase_requisitions?: {
    id: string;
    pr_number: string;
  } | null;
}

export interface PurchaseOrderLine {
  id: string;
  po_id: string;
  product_id: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  received_quantity: number;
  notes: string | null;
  created_at: string;
  products?: {
    id: string;
    sku: string;
    name: string;
    unit_of_measure: string | null;
    unit_cost: number | null;
  } | null;
}

export type POInsert = {
  po_number: string;
  supplier_id?: string | null;
  order_date?: string;
  expected_delivery?: string | null;
  status?: string;
  total_amount?: number;
  currency?: string;
  notes?: string | null;
};

export type POUpdate = Partial<POInsert> & {
  approved_by?: string | null;
  approved_date?: string | null;
};

export type POLineInsert = {
  po_id: string;
  product_id?: string | null;
  quantity: number;
  unit_price: number;
  total_price?: number;
  notes?: string | null;
};

export type POLineUpdate = Partial<Omit<POLineInsert, "po_id">> & {
  received_quantity?: number;
};

// Fetch all purchase orders with supplier info
export function usePurchaseOrders() {
  return useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select(`
          *,
          suppliers (
            id,
            company_name,
            supplier_code,
            email,
            phone,
            contact_person
          ),
          purchase_requisitions (
            id,
            pr_number
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PurchaseOrder[];
    },
  });
}

// Fetch single purchase order with details
export function usePurchaseOrder(id: string | undefined) {
  return useQuery({
    queryKey: ["purchase-orders", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("purchase_orders")
        .select(`
          *,
          suppliers (
            id,
            company_name,
            supplier_code,
            email,
            phone,
            contact_person
          ),
          purchase_requisitions (
            id,
            pr_number
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as PurchaseOrder;
    },
    enabled: !!id,
  });
}

// Fetch line items for a purchase order
export function usePurchaseOrderLines(poId: string | undefined) {
  return useQuery({
    queryKey: ["purchase-order-lines", poId],
    queryFn: async () => {
      if (!poId) return [];
      const { data, error } = await supabase
        .from("purchase_order_lines")
        .select(`
          *,
          products (
            id,
            sku,
            name,
            unit_of_measure,
            unit_cost
          )
        `)
        .eq("po_id", poId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as PurchaseOrderLine[];
    },
    enabled: !!poId,
  });
}

// Stats for PO dashboard
export function usePurchaseOrderStats() {
  return useQuery({
    queryKey: ["purchase-order-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("id, status, total_amount, order_date");

      if (error) throw error;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const stats = {
        total: data.length,
        pending: data.filter((po) => po.status === "pending_approval" || po.status === "pending").length,
        approved: data.filter((po) => po.status === "approved").length,
        inTransit: data.filter((po) => po.status === "in_transit").length,
        received: data.filter((po) => po.status === "received").length,
        thisMonthValue: data
          .filter((po) => new Date(po.order_date) >= startOfMonth)
          .reduce((sum, po) => sum + (po.total_amount || 0), 0),
        totalValue: data.reduce((sum, po) => sum + (po.total_amount || 0), 0),
      };

      return stats;
    },
  });
}

// Generate next PO number
export function useNextPONumber() {
  return useQuery({
    queryKey: ["next-po-number"],
    queryFn: async () => {
      const year = new Date().getFullYear();
      const prefix = `PO-${year}-`;

      const { data, error } = await supabase
        .from("purchase_orders")
        .select("po_number")
        .ilike("po_number", `${prefix}%`)
        .order("po_number", { ascending: false })
        .limit(1);

      if (error) throw error;

      let nextNumber = 1;
      if (data && data.length > 0) {
        const lastNumber = parseInt(data[0].po_number.replace(prefix, ""), 10);
        nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
      }

      return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
    },
  });
}

// Create purchase order
export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (order: POInsert) => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .insert(order)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order-stats"] });
      queryClient.invalidateQueries({ queryKey: ["next-po-number"] });
      toast.success("Purchase order created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create purchase order: ${error.message}`);
    },
  });
}

// Update purchase order
export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: POUpdate }) => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders", id] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order-stats"] });
      toast.success("Purchase order updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update purchase order: ${error.message}`);
    },
  });
}

// Delete purchase order (draft only)
export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First delete line items
      await supabase.from("purchase_order_lines").delete().eq("po_id", id);

      // Then delete the PO
      const { error } = await supabase
        .from("purchase_orders")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order-stats"] });
      toast.success("Purchase order deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete purchase order: ${error.message}`);
    },
  });
}

// Add line item
export function useAddPOLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (line: POLineInsert) => {
      const totalPrice = line.quantity * line.unit_price;
      const { data, error } = await supabase
        .from("purchase_order_lines")
        .insert({ ...line, total_price: totalPrice })
        .select()
        .single();

      if (error) throw error;

      // Update PO total
      await updatePOTotal(line.po_id);

      return data;
    },
    onSuccess: (_, line) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-order-lines", line.po_id] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order-stats"] });
    },
    onError: (error) => {
      toast.error(`Failed to add line item: ${error.message}`);
    },
  });
}

// Update line item
export function useUpdatePOLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, poId, updates }: { id: string; poId: string; updates: POLineUpdate }) => {
      const updateData: POLineUpdate & { total_price?: number } = { ...updates };

      if (updates.quantity !== undefined && updates.unit_price !== undefined) {
        updateData.total_price = updates.quantity * updates.unit_price;
      }

      const { data, error } = await supabase
        .from("purchase_order_lines")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Update PO total
      await updatePOTotal(poId);

      return data;
    },
    onSuccess: (_, { poId }) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-order-lines", poId] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order-stats"] });
    },
    onError: (error) => {
      toast.error(`Failed to update line item: ${error.message}`);
    },
  });
}

// Remove line item
export function useRemovePOLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, poId }: { id: string; poId: string }) => {
      const { error } = await supabase
        .from("purchase_order_lines")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Update PO total
      await updatePOTotal(poId);
    },
    onSuccess: (_, { poId }) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-order-lines", poId] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order-stats"] });
    },
    onError: (error) => {
      toast.error(`Failed to remove line item: ${error.message}`);
    },
  });
}

// Submit PO for approval (with workflow integration)
export function useSubmitPO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get PO details for workflow
      const { data: po, error: poError } = await supabase
        .from("purchase_orders")
        .select("po_number, total_amount")
        .eq("id", id)
        .single();

      if (poError) throw poError;

      // Update PO status to pending_approval
      const { data, error } = await supabase
        .from("purchase_orders")
        .update({ status: "pending_approval" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Check if there's an active workflow and create approval request
      const hasWorkflow = await hasActiveWorkflow("purchase_order");
      if (hasWorkflow) {
        // Find active workflow
        const { data: workflow } = await supabase
          .from("approval_workflows")
          .select(`*, steps:approval_steps(*)`)
          .eq("entity_type", "purchase_order")
          .eq("is_active", true)
          .order("version", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (workflow && workflow.steps && (workflow.steps as unknown[]).length > 0) {
          const sortedSteps = (workflow.steps as Array<{ id: string; step_order: number }>)
            .sort((a, b) => a.step_order - b.step_order);
          const firstStep = sortedSteps[0];

          const { data: userData } = await supabase.auth.getUser();

          // Create approval request
          const { data: request } = await supabase
            .from("approval_requests")
            .insert([{
              workflow_id: workflow.id,
              entity_type: "purchase_order",
              entity_id: id,
              entity_number: po.po_number,
              status: 'pending',
              current_step_id: firstStep.id,
              current_step_order: firstStep.step_order,
              submitted_by: userData?.user?.id,
            }])
            .select()
            .single();

          // Log submit action
          if (request) {
            await supabase.from("approval_actions").insert([{
              request_id: request.id,
              step_id: firstStep.id,
              user_id: userData?.user?.id,
              action: 'submit',
              comment: `Submitted PO for approval (Total: ${po.total_amount})`,
            }]);
          }
        }
      }

      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders", id] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order-stats"] });
      queryClient.invalidateQueries({ queryKey: ["approval-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-pending-approvals"] });
      toast.success("Purchase order submitted for approval");
    },
    onError: (error) => {
      toast.error(`Failed to submit purchase order: ${error.message}`);
    },
  });
}

export function useApprovePO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .update({
          status: "approved",
          approved_date: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders", id] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order-stats"] });
      toast.success("Purchase order approved");
    },
    onError: (error) => {
      toast.error(`Failed to approve purchase order: ${error.message}`);
    },
  });
}

// Cancel PO
export function useCancelPO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .update({
          status: "cancelled",
          notes: reason,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders", id] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order-stats"] });
      toast.success("Purchase order cancelled");
    },
    onError: (error) => {
      toast.error(`Failed to cancel purchase order: ${error.message}`);
    },
  });
}

// Generate GRN number
async function generateGRNNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `GRN-${year}-`;

  const { data } = await supabase
    .from("inbound_deliveries")
    .select("delivery_number")
    .ilike("delivery_number", `${prefix}%`)
    .order("delivery_number", { ascending: false })
    .limit(1);

  let nextNumber = 1;
  if (data && data.length > 0) {
    const lastNumber = parseInt(data[0].delivery_number.replace(prefix, ""), 10);
    nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
}

// Receive goods for a PO
export function useReceiveGoods() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      poId,
      lineUpdates,
    }: {
      poId: string;
      lineUpdates: {
        lineId: string;
        productId: string;
        receivedQuantity: number;
        receivingDelta: number;
        batchId?: string | null;
        binId?: string | null;
      }[];
    }): Promise<{ grnNumber: string | null; grnId: string | null }> => {
      console.log("[useReceiveGoods] Starting goods receipt for PO:", poId);
      console.log("[useReceiveGoods] Line updates:", lineUpdates);

      // Calculate total items being received in this transaction
      const totalReceivingNow = lineUpdates.reduce((sum, l) => sum + l.receivingDelta, 0);
      console.log("[useReceiveGoods] Total receiving now:", totalReceivingNow);

      if (totalReceivingNow === 0) {
        console.log("[useReceiveGoods] No items to receive, skipping");
        return { grnNumber: null, grnId: null };
      }

      // Get PO details for the delivery record
      const { data: po, error: poError } = await supabase
        .from("purchase_orders")
        .select("supplier_id, po_number")
        .eq("id", poId)
        .single();

      if (poError) {
        console.error("[useReceiveGoods] Failed to fetch PO:", poError);
        throw poError;
      }
      console.log("[useReceiveGoods] PO details:", po);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Generate GRN number and create inbound_delivery record FIRST
      const grnNumber = await generateGRNNumber();
      console.log("[useReceiveGoods] Generated GRN number:", grnNumber);
      
      const grnPayload = {
        delivery_number: grnNumber,
        po_id: poId,
        supplier_id: po.supplier_id,
        status: "completed" as const,
        actual_date: new Date().toISOString().split("T")[0],
        total_items: totalReceivingNow,
        received_items: totalReceivingNow,
        received_by: user?.id || null,
      };
      console.log("[useReceiveGoods] Creating GRN with payload:", grnPayload);

      const { data: grn, error: grnError } = await supabase
        .from("inbound_deliveries")
        .insert(grnPayload)
        .select("id, delivery_number")
        .single();

      if (grnError) {
        console.error("[useReceiveGoods] Failed to create GRN:", grnError);
        throw grnError;
      }
      
      if (!grn) {
        console.error("[useReceiveGoods] GRN creation returned no data");
        throw new Error("Failed to create GRN - no data returned");
      }
      
      console.log("[useReceiveGoods] GRN created successfully:", grn);
      const grnId = grn.id;

      // Insert GRN lines for line-level tracking
      const grnLines = lineUpdates
        .filter(l => l.receivingDelta > 0)
        .map(l => ({
          grn_id: grnId,
          po_line_id: l.lineId,
          product_id: l.productId,
          quantity_received: l.receivingDelta,
          batch_id: l.batchId || null,
          bin_id: l.binId || null,
        }));

      console.log("[useReceiveGoods] Creating GRN lines:", grnLines);

      if (grnLines.length > 0) {
        const { error: grnLinesError } = await supabase
          .from("grn_lines")
          .insert(grnLines);

        if (grnLinesError) {
          console.error("[useReceiveGoods] Failed to create GRN lines:", grnLinesError);
          throw grnLinesError;
        }
      }

      // NEW: Update inventory for each received line
      for (const update of lineUpdates) {
        if (update.receivingDelta > 0 && update.productId) {
          console.log("[useReceiveGoods] Updating inventory for product:", update.productId, "bin:", update.binId, "qty:", update.receivingDelta);
          
          // Check if inventory record exists for this product/bin combination
          let existingInventory = null;
          
          if (update.binId) {
            const { data } = await supabase
              .from("inventory")
              .select("*")
              .eq("product_id", update.productId)
              .eq("bin_id", update.binId)
              .maybeSingle();
            existingInventory = data;
          } else {
            // No bin specified - look for product-only inventory record
            const { data } = await supabase
              .from("inventory")
              .select("*")
              .eq("product_id", update.productId)
              .is("bin_id", null)
              .maybeSingle();
            existingInventory = data;
          }

          if (existingInventory) {
            // Update existing inventory
            const newQty = (existingInventory.quantity || 0) + update.receivingDelta;
            const newAvailable = (existingInventory.available_quantity || 0) + update.receivingDelta;
            
            console.log("[useReceiveGoods] Updating existing inventory ID:", existingInventory.id, "new qty:", newQty);
            await supabase
              .from("inventory")
              .update({
                quantity: newQty,
                available_quantity: newAvailable,
              })
              .eq("id", existingInventory.id);
          } else {
            // Create new inventory record
            console.log("[useReceiveGoods] Creating new inventory record");
            await supabase
              .from("inventory")
              .insert({
                product_id: update.productId,
                bin_id: update.binId || null,
                quantity: update.receivingDelta,
                reserved_quantity: 0,
                available_quantity: update.receivingDelta,
              });
          }

          // Log inventory transaction
          console.log("[useReceiveGoods] Logging inventory transaction");
          await supabase.from("inventory_transactions").insert({
            product_id: update.productId,
            bin_id: update.binId || null,
            batch_id: update.batchId || null,
            quantity: update.receivingDelta,
            transaction_type: "receipt",
            reference_type: "grn",
            reference_id: grnId,
            notes: `Received via GRN ${grnNumber} for PO ${po.po_number}`,
          });
        }
      }

      // Only update PO lines AFTER GRN is successfully created
      for (const { lineId, receivedQuantity } of lineUpdates) {
        console.log("[useReceiveGoods] Updating line", lineId, "with received qty:", receivedQuantity);
        const { error } = await supabase
          .from("purchase_order_lines")
          .update({ received_quantity: receivedQuantity })
          .eq("id", lineId);

        if (error) {
          console.error("[useReceiveGoods] Failed to update line:", lineId, error);
          throw error;
        }
      }

      // Check if fully received
      const { data: lines } = await supabase
        .from("purchase_order_lines")
        .select("quantity, received_quantity")
        .eq("po_id", poId);

      const fullyReceived = lines?.every(
        (line) => line.received_quantity >= line.quantity
      );
      console.log("[useReceiveGoods] Fully received:", fullyReceived);

      // Update PO status
      const newStatus = fullyReceived ? "received" : "in_transit";
      console.log("[useReceiveGoods] Updating PO status to:", newStatus);
      const { error } = await supabase
        .from("purchase_orders")
        .update({ status: newStatus })
        .eq("id", poId);

      if (error) {
        console.error("[useReceiveGoods] Failed to update PO status:", error);
        throw error;
      }

      console.log("[useReceiveGoods] Goods receipt completed successfully with inventory update");
      return { grnNumber, grnId };
    },
    onSuccess: (result, { poId }) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders", poId] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order-lines", poId] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order-stats"] });
      queryClient.invalidateQueries({ queryKey: ["inbound_deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["grn_lines"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
      const message = result.grnNumber 
        ? `Goods receipt ${result.grnNumber} recorded - inventory updated`
        : "Goods receipt recorded";
      toast.success(message);
    },
    onError: (error) => {
      console.error("[useReceiveGoods] Mutation error:", error);
      toast.error(`Failed to record receipt: ${error.message}`);
    },
  });
}

// Helper to recalculate PO total
async function updatePOTotal(poId: string) {
  const { data: lines } = await supabase
    .from("purchase_order_lines")
    .select("total_price")
    .eq("po_id", poId);

  const total = lines?.reduce((sum, line) => sum + (line.total_price || 0), 0) || 0;

  await supabase
    .from("purchase_orders")
    .update({ total_amount: total })
    .eq("id", poId);
}
