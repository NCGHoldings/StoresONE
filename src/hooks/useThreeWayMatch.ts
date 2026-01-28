import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useConfigValue } from "./useSystemConfig";

export interface MatchItem {
  invoiceId: string;
  invoiceNumber: string;
  invoiceAmount: number;
  invoiceDate: string;
  supplierId: string;
  supplierName: string;
  poId: string | null;
  poNumber: string | null;
  poAmount: number | null;
  grId: string | null;
  grNumber: string | null;
  grReceivedItems: number | null;
  poTotalItems: number | null;
  matchStatus: "full_match" | "partial_match" | "mismatch" | "pending";
  variancePercent: number;
  varianceAmount: number;
  invoiceStatus: string;
}

export interface MatchStats {
  total: number;
  fullMatch: number;
  partialMatch: number;
  mismatch: number;
  pending: number;
  totalValue: number;
  matchedValue: number;
}

// Use system config tolerance
export function useMatchTolerance() {
  const percentTolerance = useConfigValue<number>("match_tolerance_percent", 2);
  const amountTolerance = useConfigValue<number>("match_tolerance_amount", 100);
  return { percentTolerance, amountTolerance };
}

// Fetch all invoices with match data
export function useThreeWayMatchData() {
  const { percentTolerance, amountTolerance } = useMatchTolerance();

  return useQuery({
    queryKey: ["three-way-match", percentTolerance, amountTolerance],
    queryFn: async () => {
      // Get all invoices with PO and GR data
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select(`
          id,
          invoice_number,
          amount,
          invoice_date,
          status,
          supplier_id,
          po_id,
          goods_receipt_id,
          suppliers (id, company_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const matchItems: MatchItem[] = [];

      for (const invoice of invoices || []) {
        let poData = null;
        let grData = null;
        let poTotalItems = 0;

        // Get PO data
        if (invoice.po_id) {
          const { data: po } = await supabase
            .from("purchase_orders")
            .select("id, po_number, total_amount")
            .eq("id", invoice.po_id)
            .single();
          poData = po;

          // Get PO line totals
          const { data: poLines } = await supabase
            .from("purchase_order_lines")
            .select("quantity")
            .eq("po_id", invoice.po_id);
          poTotalItems = poLines?.reduce((sum, l) => sum + l.quantity, 0) || 0;
        }

        // Get GR data
        if (invoice.goods_receipt_id) {
          const { data: gr } = await supabase
            .from("inbound_deliveries")
            .select("id, delivery_number, received_items")
            .eq("id", invoice.goods_receipt_id)
            .single();
          grData = gr;
        } else if (invoice.po_id) {
          // Try to find GR by PO
          const { data: gr } = await supabase
            .from("inbound_deliveries")
            .select("id, delivery_number, received_items")
            .eq("po_id", invoice.po_id)
            .limit(1)
            .single();
          grData = gr;
        }

        // Calculate variance
        const invoiceAmount = invoice.amount || 0;
        const poAmount = poData?.total_amount || 0;
        const varianceAmount = Math.abs(invoiceAmount - poAmount);
        const variancePercent = poAmount > 0 ? (varianceAmount / poAmount) * 100 : 0;

        // Determine match status
        let matchStatus: MatchItem["matchStatus"] = "pending";
        if (!invoice.po_id) {
          matchStatus = "pending";
        } else if (
          variancePercent <= percentTolerance &&
          varianceAmount <= amountTolerance &&
          grData
        ) {
          matchStatus = "full_match";
        } else if (variancePercent <= percentTolerance * 2 || !grData) {
          matchStatus = "partial_match";
        } else {
          matchStatus = "mismatch";
        }

        matchItems.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
          invoiceAmount,
          invoiceDate: invoice.invoice_date,
          supplierId: invoice.supplier_id || "",
          supplierName: invoice.suppliers?.company_name || "Unknown",
          poId: invoice.po_id,
          poNumber: poData?.po_number || null,
          poAmount: poData?.total_amount || null,
          grId: grData?.id || null,
          grNumber: grData?.delivery_number || null,
          grReceivedItems: grData?.received_items || null,
          poTotalItems,
          matchStatus,
          variancePercent,
          varianceAmount,
          invoiceStatus: invoice.status,
        });
      }

      return matchItems;
    },
  });
}

// Match statistics
export function useMatchStats() {
  const { data: matchData } = useThreeWayMatchData();

  return useQuery({
    queryKey: ["match-stats", matchData],
    queryFn: async (): Promise<MatchStats> => {
      if (!matchData) {
        return {
          total: 0,
          fullMatch: 0,
          partialMatch: 0,
          mismatch: 0,
          pending: 0,
          totalValue: 0,
          matchedValue: 0,
        };
      }

      return {
        total: matchData.length,
        fullMatch: matchData.filter((m) => m.matchStatus === "full_match").length,
        partialMatch: matchData.filter((m) => m.matchStatus === "partial_match").length,
        mismatch: matchData.filter((m) => m.matchStatus === "mismatch").length,
        pending: matchData.filter((m) => m.matchStatus === "pending").length,
        totalValue: matchData.reduce((sum, m) => sum + m.invoiceAmount, 0),
        matchedValue: matchData
          .filter((m) => m.matchStatus === "full_match")
          .reduce((sum, m) => sum + m.invoiceAmount, 0),
      };
    },
    enabled: !!matchData,
  });
}

// Link invoice to GR
export function useLinkInvoiceToGR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invoiceId,
      grId,
    }: {
      invoiceId: string;
      grId: string;
    }) => {
      const { data, error } = await supabase
        .from("invoices")
        .update({ goods_receipt_id: grId })
        .eq("id", invoiceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["three-way-match"] });
      queryClient.invalidateQueries({ queryKey: ["match-stats"] });
      toast.success("Invoice linked to Goods Receipt");
    },
    onError: (error) => {
      toast.error(`Failed to link: ${error.message}`);
    },
  });
}

// Approve matched invoice for payment
export function useApproveForPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { data, error } = await supabase
        .from("invoices")
        .update({ status: "approved" })
        .eq("id", invoiceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["three-way-match"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice approved for payment");
    },
    onError: (error) => {
      toast.error(`Failed to approve: ${error.message}`);
    },
  });
}

// Flag invoice for investigation
export function useFlagForInvestigation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invoiceId,
      reason,
    }: {
      invoiceId: string;
      reason: string;
    }) => {
      const { data, error } = await supabase
        .from("invoices")
        .update({
          status: "pending" as const,
          notes: `DISPUTED: ${reason}`,
        })
        .eq("id", invoiceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["three-way-match"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice flagged for investigation");
    },
    onError: (error) => {
      toast.error(`Failed to flag invoice: ${error.message}`);
    },
  });
}
