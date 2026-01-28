import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RFQRequest {
  id: string;
  rfq_number: string;
  pr_id: string | null;
  title: string;
  description: string | null;
  rfq_type: string;
  status: string;
  publish_date: string | null;
  response_deadline: string | null;
  evaluation_criteria: unknown;
  terms_conditions: string | null;
  currency: string;
  created_by: string | null;
  awarded_to: string | null;
  awarded_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  purchase_requisitions?: {
    id: string;
    pr_number: string;
  } | null;
  suppliers?: {
    id: string;
    company_name: string;
  } | null;
}

export interface RFQLine {
  id: string;
  rfq_id: string;
  pr_line_id: string | null;
  product_id: string | null;
  product_name: string | null;
  quantity: number;
  unit_of_measure: string;
  specifications: string | null;
  target_price: number | null;
  notes: string | null;
  created_at: string;
  products?: {
    id: string;
    sku: string;
    name: string;
  } | null;
}

export interface RFQResponse {
  id: string;
  rfq_id: string;
  supplier_id: string;
  status: string;
  total_bid_amount: number;
  delivery_days: number | null;
  valid_until: string | null;
  payment_terms: string | null;
  technical_score: number | null;
  commercial_score: number | null;
  overall_score: number | null;
  notes: string | null;
  submitted_date: string | null;
  created_at: string;
  updated_at: string;
  suppliers?: {
    id: string;
    company_name: string;
    supplier_code: string;
    email: string | null;
  } | null;
}

export interface RFQResponseLine {
  id: string;
  response_id: string;
  rfq_line_id: string;
  unit_price: number;
  total_price: number;
  lead_time_days: number | null;
  notes: string | null;
  created_at: string;
}

export interface RFQInvitedSupplier {
  id: string;
  rfq_id: string;
  supplier_id: string;
  invited_date: string;
  responded: boolean;
  suppliers?: {
    id: string;
    company_name: string;
    email: string | null;
  } | null;
}

// Fetch all RFQs
export function useRFQs() {
  return useQuery({
    queryKey: ["rfq-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rfq_requests")
        .select(`
          *,
          purchase_requisitions:pr_id (id, pr_number),
          suppliers:awarded_to (id, company_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as RFQRequest[];
    },
  });
}

// Fetch single RFQ
export function useRFQ(id: string | undefined) {
  return useQuery({
    queryKey: ["rfq-requests", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("rfq_requests")
        .select(`
          *,
          purchase_requisitions:pr_id (id, pr_number),
          suppliers:awarded_to (id, company_name)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as RFQRequest;
    },
    enabled: !!id,
  });
}

// Fetch RFQ lines
export function useRFQLines(rfqId: string | undefined) {
  return useQuery({
    queryKey: ["rfq-lines", rfqId],
    queryFn: async () => {
      if (!rfqId) return [];
      const { data, error } = await supabase
        .from("rfq_lines")
        .select(`
          *,
          products (id, sku, name)
        `)
        .eq("rfq_id", rfqId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as RFQLine[];
    },
    enabled: !!rfqId,
  });
}

// Fetch invited suppliers for RFQ
export function useRFQInvitedSuppliers(rfqId: string | undefined) {
  return useQuery({
    queryKey: ["rfq-invited-suppliers", rfqId],
    queryFn: async () => {
      if (!rfqId) return [];
      const { data, error } = await supabase
        .from("rfq_invited_suppliers")
        .select(`
          *,
          suppliers (id, company_name, email)
        `)
        .eq("rfq_id", rfqId);

      if (error) throw error;
      return data as RFQInvitedSupplier[];
    },
    enabled: !!rfqId,
  });
}

// Fetch responses for RFQ
export function useRFQResponses(rfqId: string | undefined) {
  return useQuery({
    queryKey: ["rfq-responses", rfqId],
    queryFn: async () => {
      if (!rfqId) return [];
      const { data, error } = await supabase
        .from("rfq_responses")
        .select(`
          *,
          suppliers (id, company_name, supplier_code, email)
        `)
        .eq("rfq_id", rfqId)
        .order("overall_score", { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data as RFQResponse[];
    },
    enabled: !!rfqId,
  });
}

// Fetch response lines
export function useRFQResponseLines(responseId: string | undefined) {
  return useQuery({
    queryKey: ["rfq-response-lines", responseId],
    queryFn: async () => {
      if (!responseId) return [];
      const { data, error } = await supabase
        .from("rfq_response_lines")
        .select("*")
        .eq("response_id", responseId);

      if (error) throw error;
      return data as RFQResponseLine[];
    },
    enabled: !!responseId,
  });
}

// RFQ Stats
export function useRFQStats() {
  return useQuery({
    queryKey: ["rfq-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rfq_requests")
        .select("id, status, created_at");

      if (error) throw error;

      return {
        total: data.length,
        draft: data.filter((r) => r.status === "draft").length,
        published: data.filter((r) => r.status === "published").length,
        underEvaluation: data.filter((r) => r.status === "under_evaluation").length,
        awarded: data.filter((r) => r.status === "awarded").length,
      };
    },
  });
}

// Generate next RFQ number
export function useNextRFQNumber() {
  return useQuery({
    queryKey: ["next-rfq-number"],
    queryFn: async () => {
      const year = new Date().getFullYear();
      const prefix = `RFQ-${year}-`;

      const { data, error } = await supabase
        .from("rfq_requests")
        .select("rfq_number")
        .ilike("rfq_number", `${prefix}%`)
        .order("rfq_number", { ascending: false })
        .limit(1);

      if (error) throw error;

      let nextNumber = 1;
      if (data && data.length > 0) {
        const lastNumber = parseInt(data[0].rfq_number.replace(prefix, ""), 10);
        nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
      }

      return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
    },
  });
}

// Create RFQ
export function useCreateRFQ() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rfq: Partial<RFQRequest>) => {
      const { purchase_requisitions, suppliers, ...insertData } = rfq;
      const { data, error } = await supabase
        .from("rfq_requests")
        .insert(insertData as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rfq-requests"] });
      queryClient.invalidateQueries({ queryKey: ["rfq-stats"] });
      queryClient.invalidateQueries({ queryKey: ["next-rfq-number"] });
      toast.success("RFQ created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create RFQ: ${error.message}`);
    },
  });
}

// Update RFQ
export function useUpdateRFQ() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<RFQRequest> }) => {
      const { purchase_requisitions, suppliers, ...updateData } = updates;
      const { data, error } = await supabase
        .from("rfq_requests")
        .update(updateData as never)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["rfq-requests"] });
      queryClient.invalidateQueries({ queryKey: ["rfq-requests", id] });
      queryClient.invalidateQueries({ queryKey: ["rfq-stats"] });
      toast.success("RFQ updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update RFQ: ${error.message}`);
    },
  });
}

// Delete RFQ
export function useDeleteRFQ() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rfq_requests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rfq-requests"] });
      queryClient.invalidateQueries({ queryKey: ["rfq-stats"] });
      toast.success("RFQ deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete RFQ: ${error.message}`);
    },
  });
}

// Publish RFQ
export function usePublishRFQ() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("rfq_requests")
        .update({
          status: "published",
          publish_date: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["rfq-requests"] });
      queryClient.invalidateQueries({ queryKey: ["rfq-requests", id] });
      queryClient.invalidateQueries({ queryKey: ["rfq-stats"] });
      toast.success("RFQ published to suppliers");
    },
    onError: (error) => {
      toast.error(`Failed to publish RFQ: ${error.message}`);
    },
  });
}

// Add RFQ line
export function useAddRFQLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (line: Partial<RFQLine>) => {
      const { products, ...insertData } = line;
      const { data, error } = await supabase
        .from("rfq_lines")
        .insert(insertData as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, line) => {
      queryClient.invalidateQueries({ queryKey: ["rfq-lines", line.rfq_id] });
    },
    onError: (error) => {
      toast.error(`Failed to add line: ${error.message}`);
    },
  });
}

// Remove RFQ line
export function useRemoveRFQLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, rfqId }: { id: string; rfqId: string }) => {
      const { error } = await supabase.from("rfq_lines").delete().eq("id", id);
      if (error) throw error;
      return { rfqId };
    },
    onSuccess: (_, { rfqId }) => {
      queryClient.invalidateQueries({ queryKey: ["rfq-lines", rfqId] });
    },
    onError: (error) => {
      toast.error(`Failed to remove line: ${error.message}`);
    },
  });
}

// Invite supplier
export function useInviteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ rfqId, supplierId }: { rfqId: string; supplierId: string }) => {
      const { data, error } = await supabase
        .from("rfq_invited_suppliers")
        .insert({ rfq_id: rfqId, supplier_id: supplierId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { rfqId }) => {
      queryClient.invalidateQueries({ queryKey: ["rfq-invited-suppliers", rfqId] });
      toast.success("Supplier invited");
    },
    onError: (error) => {
      toast.error(`Failed to invite supplier: ${error.message}`);
    },
  });
}

// Remove invited supplier
export function useRemoveInvitedSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, rfqId }: { id: string; rfqId: string }) => {
      const { error } = await supabase.from("rfq_invited_suppliers").delete().eq("id", id);
      if (error) throw error;
      return { rfqId };
    },
    onSuccess: (_, { rfqId }) => {
      queryClient.invalidateQueries({ queryKey: ["rfq-invited-suppliers", rfqId] });
    },
    onError: (error) => {
      toast.error(`Failed to remove supplier: ${error.message}`);
    },
  });
}

// Submit bid response
export function useSubmitBidResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      rfqId,
      supplierId,
      response,
      lines,
    }: {
      rfqId: string;
      supplierId: string;
      response: Partial<RFQResponse>;
      lines: Partial<RFQResponseLine>[];
    }) => {
      // Create response
      const { data: responseData, error: responseError } = await supabase
        .from("rfq_responses")
        .insert({
          ...response,
          rfq_id: rfqId,
          supplier_id: supplierId,
          status: "submitted",
          submitted_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (responseError) throw responseError;

      // Create response lines
      for (const line of lines) {
        await supabase.from("rfq_response_lines").insert([{
          rfq_line_id: line.rfq_line_id!,
          unit_price: line.unit_price!,
          response_id: responseData.id,
          total_price: line.total_price,
          lead_time_days: line.lead_time_days,
          notes: line.notes,
        }]);
      }

      // Mark supplier as responded
      await supabase
        .from("rfq_invited_suppliers")
        .update({ responded: true })
        .eq("rfq_id", rfqId)
        .eq("supplier_id", supplierId);

      // Check if all invited suppliers have responded
      const { data: invited } = await supabase
        .from("rfq_invited_suppliers")
        .select("responded")
        .eq("rfq_id", rfqId);

      const allResponded = invited?.every((i) => i.responded);
      if (allResponded) {
        await supabase
          .from("rfq_requests")
          .update({ status: "responses_received" })
          .eq("id", rfqId);
      }

      return responseData;
    },
    onSuccess: (_, { rfqId }) => {
      queryClient.invalidateQueries({ queryKey: ["rfq-responses", rfqId] });
      queryClient.invalidateQueries({ queryKey: ["rfq-invited-suppliers", rfqId] });
      queryClient.invalidateQueries({ queryKey: ["rfq-requests"] });
      toast.success("Bid submitted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to submit bid: ${error.message}`);
    },
  });
}

// Award RFQ to supplier
export function useAwardRFQ() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      rfqId,
      responseId,
      supplierId,
    }: {
      rfqId: string;
      responseId: string;
      supplierId: string;
    }) => {
      // Update response status
      await supabase
        .from("rfq_responses")
        .update({ status: "awarded" })
        .eq("id", responseId);

      // Mark other responses as rejected
      await supabase
        .from("rfq_responses")
        .update({ status: "rejected" })
        .eq("rfq_id", rfqId)
        .neq("id", responseId);

      // Update RFQ
      const { data, error } = await supabase
        .from("rfq_requests")
        .update({
          status: "awarded",
          awarded_to: supplierId,
          awarded_date: new Date().toISOString(),
        })
        .eq("id", rfqId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { rfqId }) => {
      queryClient.invalidateQueries({ queryKey: ["rfq-requests"] });
      queryClient.invalidateQueries({ queryKey: ["rfq-requests", rfqId] });
      queryClient.invalidateQueries({ queryKey: ["rfq-responses", rfqId] });
      queryClient.invalidateQueries({ queryKey: ["rfq-stats"] });
      toast.success("RFQ awarded successfully");
    },
    onError: (error) => {
      toast.error(`Failed to award RFQ: ${error.message}`);
    },
  });
}

// Create PO from awarded RFQ
export function useCreatePOFromRFQ() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ rfqId, responseId }: { rfqId: string; responseId: string }) => {
      // Get RFQ and response details
      const { data: rfq } = await supabase
        .from("rfq_requests")
        .select("*, purchase_requisitions:pr_id (id)")
        .eq("id", rfqId)
        .single();

      const { data: response } = await supabase
        .from("rfq_responses")
        .select("*")
        .eq("id", responseId)
        .single();

      const { data: rfqLines } = await supabase
        .from("rfq_lines")
        .select("*")
        .eq("rfq_id", rfqId);

      const { data: responseLines } = await supabase
        .from("rfq_response_lines")
        .select("*")
        .eq("response_id", responseId);

      if (!rfq || !response || !rfqLines || !responseLines) {
        throw new Error("RFQ data not found");
      }

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

      // Create PO
      const { data: po, error: poError } = await supabase
        .from("purchase_orders")
        .insert({
          po_number: poNumber,
          supplier_id: response.supplier_id,
          pr_id: rfq.purchase_requisitions?.id,
          rfq_response_id: responseId,
          order_date: new Date().toISOString().split("T")[0],
          status: "draft",
          total_amount: response.total_bid_amount,
          currency: rfq.currency,
          notes: `Created from ${rfq.rfq_number}`,
        })
        .select()
        .single();

      if (poError) throw poError;

      // Create PO lines from response lines
      for (const responseLine of responseLines) {
        const rfqLine = rfqLines.find((l) => l.id === responseLine.rfq_line_id);
        if (rfqLine) {
          await supabase.from("purchase_order_lines").insert({
            po_id: po.id,
            product_id: rfqLine.product_id,
            quantity: rfqLine.quantity,
            unit_price: responseLine.unit_price,
            total_price: responseLine.total_price,
          });
        }
      }

      // Close RFQ
      await supabase.from("rfq_requests").update({ status: "closed" }).eq("id", rfqId);

      return po;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rfq-requests"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["rfq-stats"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order-stats"] });
      toast.success("Purchase Order created from RFQ");
    },
    onError: (error) => {
      toast.error(`Failed to create PO: ${error.message}`);
    },
  });
}
