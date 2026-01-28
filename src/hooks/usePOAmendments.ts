import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface POAmendment {
  id: string;
  po_id: string;
  version: number;
  amendment_reason: string;
  changed_fields: string[];
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  status: string;
  requested_by: string | null;
  requested_date: string;
  reviewed_by: string | null;
  reviewed_date: string | null;
  notes: string | null;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string | null;
  } | null;
}

// Fetch amendments for a PO
export function usePOAmendments(poId: string | undefined) {
  return useQuery({
    queryKey: ["po-amendments", poId],
    queryFn: async () => {
      if (!poId) return [];
      const { data, error } = await supabase
        .from("po_amendments")
        .select(`
          *
        `)
        .eq("po_id", poId)
        .order("version", { ascending: false });

      if (error) throw error;
      return data as unknown as POAmendment[];
    },
    enabled: !!poId,
  });
}

// Get current PO version
export function usePOCurrentVersion(poId: string | undefined) {
  return useQuery({
    queryKey: ["po-current-version", poId],
    queryFn: async () => {
      if (!poId) return 1;
      const { data } = await supabase
        .from("purchase_orders")
        .select("amendment_version")
        .eq("id", poId)
        .single();

      return data?.amendment_version || 1;
    },
    enabled: !!poId,
  });
}

// Create amendment request
export function useCreateAmendment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      poId,
      reason,
      changedFields,
      oldValues,
      newValues,
    }: {
      poId: string;
      reason: string;
      changedFields: string[];
      oldValues: Record<string, unknown>;
      newValues: Record<string, unknown>;
    }) => {
      // Get current version
      const { data: po } = await supabase
        .from("purchase_orders")
        .select("amendment_version")
        .eq("id", poId)
        .single();

      const nextVersion = (po?.amendment_version || 1) + 1;

      const { data, error } = await supabase
        .from("po_amendments")
        .insert({
          po_id: poId,
          version: nextVersion,
          amendment_reason: reason,
          changed_fields: changedFields,
          old_values: oldValues as never,
          new_values: newValues as never,
          status: "pending" as const,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { poId }) => {
      queryClient.invalidateQueries({ queryKey: ["po-amendments", poId] });
      toast.success("Amendment request created");
    },
    onError: (error) => {
      toast.error(`Failed to create amendment: ${error.message}`);
    },
  });
}

// Approve amendment
export function useApproveAmendment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amendmentId, poId }: { amendmentId: string; poId: string }) => {
      // Get amendment details
      const { data: amendment } = await supabase
        .from("po_amendments")
        .select("*")
        .eq("id", amendmentId)
        .single();

      if (!amendment) throw new Error("Amendment not found");

      // Apply changes to PO
      const newValues = amendment.new_values as Record<string, unknown>;
      if (newValues) {
        await supabase
          .from("purchase_orders")
          .update({
            ...newValues,
            amendment_version: amendment.version,
          })
          .eq("id", poId);
      }

      // Update amendment status
      const { data, error } = await supabase
        .from("po_amendments")
        .update({
          status: "applied",
          reviewed_date: new Date().toISOString(),
        })
        .eq("id", amendmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { poId }) => {
      queryClient.invalidateQueries({ queryKey: ["po-amendments", poId] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders", poId] });
      queryClient.invalidateQueries({ queryKey: ["po-current-version", poId] });
      toast.success("Amendment approved and applied");
    },
    onError: (error) => {
      toast.error(`Failed to approve amendment: ${error.message}`);
    },
  });
}

// Reject amendment
export function useRejectAmendment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      amendmentId,
      poId,
      reason,
    }: {
      amendmentId: string;
      poId: string;
      reason?: string;
    }) => {
      const { data, error } = await supabase
        .from("po_amendments")
        .update({
          status: "rejected",
          reviewed_date: new Date().toISOString(),
          notes: reason,
        })
        .eq("id", amendmentId)
        .select()
        .single();

      if (error) throw error;
      return { data, poId };
    },
    onSuccess: (_, { poId }) => {
      queryClient.invalidateQueries({ queryKey: ["po-amendments", poId] });
      toast.success("Amendment rejected");
    },
    onError: (error) => {
      toast.error(`Failed to reject amendment: ${error.message}`);
    },
  });
}
