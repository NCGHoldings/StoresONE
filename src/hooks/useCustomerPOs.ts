import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CustomerPO {
  id: string;
  cpo_number: string;
  internal_ref: string;
  customer_id: string;
  order_date: string;
  required_date: string | null;
  total_amount: number | null;
  currency: string | null;
  status: "received" | "reviewed" | "converted" | "rejected" | "fulfilled" | "on_hold";
  shipping_address: string | null;
  notes: string | null;
  received_by: string | null;
  received_at: string | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
  customers?: {
    company_name: string;
    customer_code: string;
  };
}

export interface CustomerPOLine {
  id: string;
  cpo_id: string;
  line_number: number;
  product_id: string | null;
  customer_sku: string | null;
  description: string | null;
  quantity: number;
  unit_price: number | null;
  total_price: number | null;
  notes: string | null;
  created_at: string;
  products?: {
    sku: string;
    name: string;
  };
}

export type CustomerPOInsert = {
  cpo_number: string;
  internal_ref: string;
  customer_id: string;
  order_date: string;
  required_date?: string | null;
  total_amount?: number | null;
  currency?: string | null;
  status?: string;
  shipping_address?: string | null;
  notes?: string | null;
  received_by?: string | null;
};

export type CustomerPOLineInsert = {
  cpo_id: string;
  line_number: number;
  product_id?: string | null;
  customer_sku?: string | null;
  description?: string | null;
  quantity: number;
  unit_price?: number | null;
  total_price?: number | null;
  notes?: string | null;
};

export function useCustomerPOs() {
  return useQuery({
    queryKey: ["customer_pos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_pos")
        .select(`
          *,
          customers (
            company_name,
            customer_code
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CustomerPO[];
    },
  });
}

export function useCustomerPODetails(id: string | null) {
  return useQuery({
    queryKey: ["customer_pos", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data: cpo, error: cpoError } = await supabase
        .from("customer_pos")
        .select(`
          *,
          customers (
            company_name,
            customer_code,
            shipping_address
          )
        `)
        .eq("id", id)
        .single();

      if (cpoError) throw cpoError;

      const { data: lines, error: linesError } = await supabase
        .from("customer_po_lines")
        .select(`
          *,
          products (
            sku,
            name
          )
        `)
        .eq("cpo_id", id)
        .order("line_number", { ascending: true });

      if (linesError) throw linesError;

      return { cpo: cpo as CustomerPO, lines: lines as CustomerPOLine[] };
    },
    enabled: !!id,
  });
}

export function useCreateCustomerPO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cpo, lines }: { cpo: CustomerPOInsert; lines: Omit<CustomerPOLineInsert, "cpo_id">[] }) => {
      const { data: cpoData, error: cpoError } = await supabase
        .from("customer_pos")
        .insert(cpo)
        .select()
        .single();

      if (cpoError) throw cpoError;

      if (lines.length > 0) {
        const linesWithCpoId = lines.map((line) => ({
          ...line,
          cpo_id: cpoData.id,
        }));

        const { error: linesError } = await supabase
          .from("customer_po_lines")
          .insert(linesWithCpoId);

        if (linesError) throw linesError;
      }

      return cpoData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer_pos"] });
      toast.success("Customer PO created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create Customer PO: " + error.message);
    },
  });
}

export function useUpdateCustomerPO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CustomerPOInsert> }) => {
      const { data, error } = await supabase
        .from("customer_pos")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer_pos"] });
      toast.success("Customer PO updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update Customer PO: " + error.message);
    },
  });
}

export function useConvertToSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cpoId: string) => {
      // Get CPO details
      const { data: cpo, error: cpoError } = await supabase
        .from("customer_pos")
        .select(`
          *,
          customers (
            id,
            shipping_address,
            billing_address,
            payment_terms
          )
        `)
        .eq("id", cpoId)
        .single();

      if (cpoError) throw cpoError;

      // Get CPO lines
      const { data: lines, error: linesError } = await supabase
        .from("customer_po_lines")
        .select("*")
        .eq("cpo_id", cpoId);

      if (linesError) throw linesError;

      // Generate SO number
      const year = new Date().getFullYear();
      const { data: lastSO } = await supabase
        .from("sales_orders")
        .select("so_number")
        .ilike("so_number", `SO-${year}-%`)
        .order("created_at", { ascending: false })
        .limit(1);

      let nextNum = 1;
      if (lastSO && lastSO.length > 0) {
        const match = lastSO[0].so_number.match(/SO-\d+-(\d+)/);
        if (match) nextNum = parseInt(match[1], 10) + 1;
      }
      const soNumber = `SO-${year}-${nextNum.toString().padStart(4, "0")}`;

      // Create Sales Order
      const { data: so, error: soError } = await supabase
        .from("sales_orders")
        .insert({
          so_number: soNumber,
          customer_id: cpo.customer_id,
          customer_po_id: cpoId,
          order_date: new Date().toISOString().split("T")[0],
          required_date: cpo.required_date,
          total_amount: cpo.total_amount,
          shipping_address: cpo.shipping_address || (cpo.customers as any)?.shipping_address,
          billing_address: (cpo.customers as any)?.billing_address,
          payment_terms: (cpo.customers as any)?.payment_terms,
          status: "draft",
          priority: "normal",
        })
        .select()
        .single();

      if (soError) throw soError;

      // Create SO lines
      if (lines && lines.length > 0) {
        // Validate all lines have products mapped before conversion
        const unmappedLines = lines.filter(line => !line.product_id);
        if (unmappedLines.length > 0) {
          const lineNumbers = unmappedLines.map(l => l.line_number).join(", ");
          throw new Error(
            `Cannot convert: Line(s) ${lineNumbers} have no product assigned. Please map all lines to products first.`
          );
        }

        const soLines = lines.map((line, idx) => ({
          so_id: so.id,
          cpo_line_id: line.id,
          line_number: idx + 1,
          product_id: line.product_id!,
          quantity_ordered: line.quantity,
          unit_price: line.unit_price,
          total_price: line.total_price,
          status: "pending",
        }));

        const { error: soLinesError } = await supabase
          .from("sales_order_lines")
          .insert(soLines);

        if (soLinesError) throw soLinesError;
      }

      // Update CPO status
      await supabase
        .from("customer_pos")
        .update({ status: "converted", converted_at: new Date().toISOString() })
        .eq("id", cpoId);

      return so;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer_pos"] });
      queryClient.invalidateQueries({ queryKey: ["sales_orders"] });
      toast.success("Sales Order created successfully");
    },
    onError: (error) => {
      toast.error("Failed to convert to Sales Order: " + error.message);
    },
  });
}

export function useCustomerPOStats() {
  return useQuery({
    queryKey: ["customer_pos", "stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_pos")
        .select("status");

      if (error) throw error;

      const stats = {
        total: data.length,
        received: data.filter((c) => c.status === "received").length,
        reviewed: data.filter((c) => c.status === "reviewed").length,
        converted: data.filter((c) => c.status === "converted").length,
        fulfilled: data.filter((c) => c.status === "fulfilled").length,
      };

      return stats;
    },
  });
}

export async function generateInternalRef(): Promise<string> {
  const year = new Date().getFullYear();
  const { data } = await supabase
    .from("customer_pos")
    .select("internal_ref")
    .ilike("internal_ref", `CPO-${year}-%`)
    .order("created_at", { ascending: false })
    .limit(1);

  let nextNumber = 1;
  if (data && data.length > 0) {
    const match = data[0].internal_ref.match(/CPO-\d+-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `CPO-${year}-${nextNumber.toString().padStart(4, "0")}`;
}

export function useUpdateCustomerPOLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ lineId, updates }: { 
      lineId: string; 
      updates: { product_id?: string | null } 
    }) => {
      const { data, error } = await supabase
        .from("customer_po_lines")
        .update(updates)
        .eq("id", lineId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer_pos"] });
      toast.success("Product mapping updated");
    },
    onError: (error) => {
      toast.error("Failed to update line: " + error.message);
    },
  });
}
