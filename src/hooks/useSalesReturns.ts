import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SalesReturn {
  id: string;
  return_number: string;
  sales_order_id: string | null;
  customer_id: string;
  status: "pending" | "received" | "inspected" | "completed" | "rejected";
  return_reason: "defective" | "wrong_item" | "damaged" | "customer_request" | "other";
  reason_notes: string | null;
  return_date: string;
  received_date: string | null;
  completed_date: string | null;
  total_amount: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  customers?: {
    company_name: string;
    customer_code: string;
  };
  sales_orders?: {
    so_number: string;
  };
}

export interface SalesReturnLine {
  id: string;
  return_id: string;
  so_line_id: string | null;
  product_id: string;
  quantity_returned: number;
  quantity_received: number | null;
  unit_price: number;
  total_price: number | null;
  bin_id: string | null;
  batch_id: string | null;
  disposition: "restock" | "scrap" | "rework" | null;
  inspection_notes: string | null;
  line_number: number;
  created_at: string;
  products?: {
    sku: string;
    name: string;
  };
  storage_bins?: {
    bin_code: string;
  };
}

export type SalesReturnInsert = {
  return_number: string;
  sales_order_id?: string | null;
  customer_id: string;
  status?: string;
  return_reason: string;
  reason_notes?: string | null;
  return_date: string;
  total_amount?: number | null;
  created_by?: string | null;
};

export type SalesReturnLineInsert = {
  return_id: string;
  so_line_id?: string | null;
  product_id: string;
  quantity_returned: number;
  unit_price: number;
  bin_id?: string | null;
  batch_id?: string | null;
  line_number: number;
};

// Generate return number
async function generateReturnNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `RET-${year}-`;
  
  const { data } = await supabase
    .from("sales_returns")
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

export function useSalesReturns(filters?: { status?: string; customerId?: string }) {
  return useQuery({
    queryKey: ["sales_returns", filters],
    queryFn: async () => {
      let query = supabase
        .from("sales_returns")
        .select(`
          *,
          customers (
            company_name,
            customer_code
          ),
          sales_orders (
            so_number
          )
        `)
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters?.customerId) {
        query = query.eq("customer_id", filters.customerId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SalesReturn[];
    },
  });
}

export function useSalesReturnDetails(id: string | null) {
  return useQuery({
    queryKey: ["sales_returns", id],
    queryFn: async () => {
      if (!id) return null;

      const { data: ret, error: retError } = await supabase
        .from("sales_returns")
        .select(`
          *,
          customers (
            company_name,
            customer_code
          ),
          sales_orders (
            so_number
          )
        `)
        .eq("id", id)
        .single();

      if (retError) throw retError;

      const { data: lines, error: linesError } = await supabase
        .from("sales_return_lines")
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
        .eq("return_id", id)
        .order("line_number", { ascending: true });

      if (linesError) throw linesError;

      return { return: ret as SalesReturn, lines: lines as SalesReturnLine[] };
    },
    enabled: !!id,
  });
}

export function useReturnStats() {
  return useQuery({
    queryKey: ["sales_returns_stats"],
    queryFn: async () => {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
      
      const { data: all, error } = await supabase
        .from("sales_returns")
        .select("id, status, total_amount, return_date");

      if (error) throw error;

      const pending = all?.filter(r => r.status === "pending").length || 0;
      const awaitingInspection = all?.filter(r => r.status === "received").length || 0;
      const completedThisMonth = all?.filter(
        r => r.status === "completed" && r.return_date >= startOfMonth
      ).length || 0;
      const totalCreditValue = all?.filter(r => r.status === "completed")
        .reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0;

      return {
        pending,
        awaitingInspection,
        completedThisMonth,
        totalCreditValue,
      };
    },
  });
}

export function useCreateSalesReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      returnData,
      lines,
    }: {
      returnData: Omit<SalesReturnInsert, "return_number">;
      lines: Omit<SalesReturnLineInsert, "return_id">[];
    }) => {
      const returnNumber = await generateReturnNumber();

      // Calculate total
      const totalAmount = lines.reduce((sum, l) => sum + l.quantity_returned * l.unit_price, 0);

      const { data: ret, error: retError } = await supabase
        .from("sales_returns")
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
          .from("sales_return_lines")
          .insert(linesWithReturnId);

        if (linesError) throw linesError;
      }

      return ret;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales_returns"] });
      toast.success("Sales Return created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create Sales Return: " + error.message);
    },
  });
}

export function useReceiveReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ returnId, receivedDate }: { returnId: string; receivedDate: string }) => {
      const { data, error } = await supabase
        .from("sales_returns")
        .update({
          status: "received",
          received_date: receivedDate,
        })
        .eq("id", returnId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales_returns"] });
      toast.success("Return marked as received");
    },
    onError: (error) => {
      toast.error("Failed to receive return: " + error.message);
    },
  });
}

export function useInspectReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      returnId,
      lineUpdates,
    }: {
      returnId: string;
      lineUpdates: {
        lineId: string;
        quantityReceived: number;
        disposition: "restock" | "scrap" | "rework";
        binId?: string | null;
        inspectionNotes?: string;
      }[];
    }) => {
      // Update each line
      for (const update of lineUpdates) {
        await supabase
          .from("sales_return_lines")
          .update({
            quantity_received: update.quantityReceived,
            disposition: update.disposition,
            bin_id: update.binId || null,
            inspection_notes: update.inspectionNotes || null,
          })
          .eq("id", update.lineId);
      }

      // Update return status
      const { data, error } = await supabase
        .from("sales_returns")
        .update({ status: "inspected" })
        .eq("id", returnId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales_returns"] });
      toast.success("Inspection completed");
    },
    onError: (error) => {
      toast.error("Failed to complete inspection: " + error.message);
    },
  });
}

export function useCompleteReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (returnId: string) => {
      // Get return and lines
      const { data: ret, error: retError } = await supabase
        .from("sales_returns")
        .select("*")
        .eq("id", returnId)
        .single();

      if (retError) throw retError;

      const { data: lines, error: linesError } = await supabase
        .from("sales_return_lines")
        .select("*")
        .eq("return_id", returnId);

      if (linesError) throw linesError;

      // Process each line
      for (const line of lines || []) {
        if (line.disposition === "restock" && line.quantity_received > 0) {
          // Find or create inventory record
          let inventory = null;
          
          if (line.bin_id) {
            const { data } = await supabase
              .from("inventory")
              .select("*")
              .eq("product_id", line.product_id)
              .eq("bin_id", line.bin_id)
              .maybeSingle();
            inventory = data;
          }

          if (inventory) {
            // Update existing inventory
            await supabase
              .from("inventory")
              .update({
                quantity: (inventory.quantity || 0) + line.quantity_received,
                available_quantity: (inventory.available_quantity || 0) + line.quantity_received,
              })
              .eq("id", inventory.id);
          } else if (line.bin_id) {
            // Create new inventory record
            await supabase
              .from("inventory")
              .insert({
                product_id: line.product_id,
                bin_id: line.bin_id,
                batch_id: line.batch_id,
                quantity: line.quantity_received,
                available_quantity: line.quantity_received,
                reserved_quantity: 0,
              });
          }

          // Log inventory transaction
          await supabase.from("inventory_transactions").insert({
            product_id: line.product_id,
            bin_id: line.bin_id,
            batch_id: line.batch_id,
            quantity: line.quantity_received,
            transaction_type: "receipt",
            reference_type: "sales_return",
            reference_id: returnId,
            notes: `Return restock: ${ret.return_number}`,
          });
        }
      }

      // Update return status
      const { data, error } = await supabase
        .from("sales_returns")
        .update({
          status: "completed",
          completed_date: new Date().toISOString().split("T")[0],
        })
        .eq("id", returnId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales_returns"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory_transactions"] });
      toast.success("Return completed and inventory updated");
    },
    onError: (error) => {
      toast.error("Failed to complete return: " + error.message);
    },
  });
}

export function useRejectReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ returnId, reason }: { returnId: string; reason: string }) => {
      const { data, error } = await supabase
        .from("sales_returns")
        .update({
          status: "rejected",
          reason_notes: reason,
        })
        .eq("id", returnId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales_returns"] });
      toast.success("Return rejected");
    },
    onError: (error) => {
      toast.error("Failed to reject return: " + error.message);
    },
  });
}
