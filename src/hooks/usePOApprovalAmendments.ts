import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface POApprovalAmendment {
  id: string;
  po_id: string;
  approval_request_id: string | null;
  approval_step_id: string | null;
  amended_by: string | null;
  amendment_type: string;
  line_id: string | null;
  field_name: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  reason: string;
  created_at: string;
  profiles?: { id: string; full_name: string | null } | null;
}

// Fetch amendments for a PO
export function usePOApprovalAmendments(poId: string | undefined) {
  return useQuery({
    queryKey: ["po-approval-amendments", poId],
    queryFn: async () => {
      if (!poId) return [];
      const { data, error } = await supabase
        .from("po_approval_amendments")
        .select(`
          *,
          profiles:amended_by (id, full_name)
        `)
        .eq("po_id", poId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as POApprovalAmendment[];
    },
    enabled: !!poId,
  });
}

// Amend a line item during approval
export function useAmendPOLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      poId,
      lineId,
      updates,
      reason,
      approvalRequestId,
      approvalStepId,
    }: {
      poId: string;
      lineId: string;
      updates: { quantity?: number; unit_price?: number };
      reason: string;
      approvalRequestId?: string;
      approvalStepId?: string;
    }) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get current line values
      const { data: currentLine, error: lineError } = await supabase
        .from("purchase_order_lines")
        .select("*")
        .eq("id", lineId)
        .single();

      if (lineError) throw lineError;

      // Determine what changed
      const changedFields: string[] = [];
      const oldValues: Record<string, unknown> = {};
      const newValues: Record<string, unknown> = {};

      if (updates.quantity !== undefined && updates.quantity !== currentLine.quantity) {
        changedFields.push("quantity");
        oldValues.quantity = currentLine.quantity;
        newValues.quantity = updates.quantity;
      }

      if (updates.unit_price !== undefined && updates.unit_price !== currentLine.unit_price) {
        changedFields.push("unit_price");
        oldValues.unit_price = currentLine.unit_price;
        newValues.unit_price = updates.unit_price;
      }

      if (changedFields.length === 0) {
        throw new Error("No changes detected");
      }

      // Calculate new total
      const newQuantity = updates.quantity ?? currentLine.quantity;
      const newUnitPrice = updates.unit_price ?? currentLine.unit_price;
      const newTotalPrice = newQuantity * newUnitPrice;

      // Update the line
      const { error: updateError } = await supabase
        .from("purchase_order_lines")
        .update({
          quantity: newQuantity,
          unit_price: newUnitPrice,
          total_price: newTotalPrice,
        })
        .eq("id", lineId);

      if (updateError) throw updateError;

      // Record the amendment
      const amendmentType = changedFields.length > 1 ? "line_update" : `${changedFields[0]}_update`;
      const { error: amendError } = await supabase
        .from("po_approval_amendments")
        .insert([{
          po_id: poId,
          approval_request_id: approvalRequestId || null,
          approval_step_id: approvalStepId || null,
          amended_by: user.id,
          amendment_type: amendmentType,
          line_id: lineId,
          field_name: changedFields.join(", "),
          old_value: oldValues as unknown as null,
          new_value: newValues as unknown as null,
          reason,
        }]);

      if (amendError) throw amendError;

      // Update PO total
      await updatePOTotal(poId);

      return { poId, lineId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["po-approval-amendments", data.poId] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order-lines", data.poId] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order", data.poId] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Line item amended");
    },
    onError: (error) => {
      toast.error(`Failed to amend: ${error.message}`);
    },
  });
}

// Add a new line during approval
export function useAddPOLineWithAmendment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      poId,
      line,
      reason,
      approvalRequestId,
      approvalStepId,
    }: {
      poId: string;
      line: { product_id?: string; quantity: number; unit_price: number };
      reason: string;
      approvalRequestId?: string;
      approvalStepId?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const totalPrice = line.quantity * line.unit_price;

      // Insert the new line
      const { data: newLine, error: insertError } = await supabase
        .from("purchase_order_lines")
        .insert({
          po_id: poId,
          product_id: line.product_id || null,
          quantity: line.quantity,
          unit_price: line.unit_price,
          total_price: totalPrice,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Record the amendment
      const { error: amendError } = await supabase
        .from("po_approval_amendments")
        .insert([{
          po_id: poId,
          approval_request_id: approvalRequestId || null,
          approval_step_id: approvalStepId || null,
          amended_by: user.id,
          amendment_type: "line_add",
          line_id: newLine.id,
          field_name: null,
          old_value: null,
          new_value: { quantity: line.quantity, unit_price: line.unit_price, product_id: line.product_id },
          reason,
        }]);

      if (amendError) throw amendError;

      await updatePOTotal(poId);

      return { poId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["po-approval-amendments", data.poId] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order-lines", data.poId] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order", data.poId] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Line item added");
    },
    onError: (error) => {
      toast.error(`Failed to add line: ${error.message}`);
    },
  });
}

// Remove a line during approval
export function useRemovePOLineWithAmendment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      poId,
      lineId,
      reason,
      approvalRequestId,
      approvalStepId,
    }: {
      poId: string;
      lineId: string;
      reason: string;
      approvalRequestId?: string;
      approvalStepId?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get line info before deletion
      const { data: line, error: lineError } = await supabase
        .from("purchase_order_lines")
        .select("*")
        .eq("id", lineId)
        .single();

      if (lineError) throw lineError;

      // Record the amendment first (before deletion)
      const { error: amendError } = await supabase
        .from("po_approval_amendments")
        .insert([{
          po_id: poId,
          approval_request_id: approvalRequestId || null,
          approval_step_id: approvalStepId || null,
          amended_by: user.id,
          amendment_type: "line_remove",
          line_id: null,
          field_name: null,
          old_value: { quantity: line.quantity, unit_price: line.unit_price, product_id: line.product_id },
          new_value: null,
          reason,
        }]);

      if (amendError) throw amendError;

      // Delete the line
      const { error: deleteError } = await supabase
        .from("purchase_order_lines")
        .delete()
        .eq("id", lineId);

      if (deleteError) throw deleteError;

      await updatePOTotal(poId);

      return { poId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["po-approval-amendments", data.poId] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order-lines", data.poId] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order", data.poId] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Line item removed");
    },
    onError: (error) => {
      toast.error(`Failed to remove line: ${error.message}`);
    },
  });
}

// Lock PO after final approval
export function useLockPO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (poId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("purchase_orders")
        .update({
          is_locked: true,
          locked_at: new Date().toISOString(),
          locked_by: user.id,
          status: "approved",
        })
        .eq("id", poId);

      if (error) throw error;
      return poId;
    },
    onSuccess: (poId) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-order", poId] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Purchase Order approved and locked");
    },
    onError: (error) => {
      toast.error(`Failed to lock PO: ${error.message}`);
    },
  });
}

// Helper to update PO total
async function updatePOTotal(poId: string) {
  const { data: lines, error: linesError } = await supabase
    .from("purchase_order_lines")
    .select("total_price")
    .eq("po_id", poId);

  if (linesError) throw linesError;

  const total = lines.reduce((sum, line) => sum + (line.total_price || 0), 0);

  const { error: updateError } = await supabase
    .from("purchase_orders")
    .update({ total_amount: total })
    .eq("id", poId);

  if (updateError) throw updateError;
}
