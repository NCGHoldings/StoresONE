import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CustomerInvoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  sales_order_id: string | null;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number | null;
  total_amount: number;
  amount_paid: number | null;
  currency: string | null;
  status: string | null;
  payment_terms: number | null;
  notes: string | null;
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

export interface CustomerInvoiceLine {
  id: string;
  invoice_id: string;
  so_line_id: string | null;
  product_id: string | null;
  description: string | null;
  quantity: number;
  unit_price: number;
  tax_rate: number | null;
  line_total: number;
  line_number: number;
  created_at: string;
  products?: {
    name: string;
    sku: string;
  };
}

export interface InvoiceFormData {
  customer_id: string;
  sales_order_id?: string | null;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  tax_amount?: number;
  total_amount: number;
  payment_terms?: number;
  notes?: string;
  lines: {
    product_id?: string | null;
    description?: string;
    quantity: number;
    unit_price: number;
    tax_rate?: number;
    line_total: number;
  }[];
}

export function useCustomerInvoices(status?: string) {
  return useQuery({
    queryKey: ["customer-invoices", status],
    queryFn: async () => {
      let query = supabase
        .from("customer_invoices")
        .select(`
          *,
          customers(company_name, customer_code),
          sales_orders(so_number)
        `)
        .order("created_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CustomerInvoice[];
    },
  });
}

export function useCustomerInvoice(id: string | null) {
  return useQuery({
    queryKey: ["customer-invoices", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("customer_invoices")
        .select(`
          *,
          customers(company_name, customer_code),
          sales_orders(so_number)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as CustomerInvoice;
    },
    enabled: !!id,
  });
}

export function useCustomerInvoiceLines(invoiceId: string | null) {
  return useQuery({
    queryKey: ["customer-invoice-lines", invoiceId],
    queryFn: async () => {
      if (!invoiceId) return [];
      const { data, error } = await supabase
        .from("customer_invoice_lines")
        .select(`
          *,
          products(name, sku)
        `)
        .eq("invoice_id", invoiceId)
        .order("line_number", { ascending: true });

      if (error) throw error;
      return data as CustomerInvoiceLine[];
    },
    enabled: !!invoiceId,
  });
}

export function useCustomerInvoiceStats() {
  return useQuery({
    queryKey: ["customer-invoices", "stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_invoices")
        .select("status, total_amount, amount_paid, due_date");

      if (error) throw error;

      const today = new Date();
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const stats = {
        totalInvoices: data.length,
        pendingAmount: data
          .filter(inv => ["draft", "sent", "partial"].includes(inv.status || ""))
          .reduce((sum, inv) => sum + (inv.total_amount - (inv.amount_paid || 0)), 0),
        overdueAmount: data
          .filter(inv => new Date(inv.due_date) < today && !["paid", "cancelled", "written_off"].includes(inv.status || ""))
          .reduce((sum, inv) => sum + (inv.total_amount - (inv.amount_paid || 0)), 0),
        collectedThisMonth: data
          .filter(inv => inv.status === "paid")
          .reduce((sum, inv) => sum + (inv.amount_paid || 0), 0),
      };

      return stats;
    },
  });
}

export function useARAgeing() {
  return useQuery({
    queryKey: ["ar-ageing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_invoices")
        .select("id, total_amount, amount_paid, due_date, status")
        .not("status", "in", '("paid","cancelled","written_off")');

      if (error) throw error;

      const today = new Date();
      const ageing = {
        current: 0,
        days30: 0,
        days60: 0,
        days90: 0,
        over90: 0,
      };

      data.forEach((inv) => {
        const balance = inv.total_amount - (inv.amount_paid || 0);
        const dueDate = new Date(inv.due_date);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysOverdue <= 0) {
          ageing.current += balance;
        } else if (daysOverdue <= 30) {
          ageing.days30 += balance;
        } else if (daysOverdue <= 60) {
          ageing.days60 += balance;
        } else if (daysOverdue <= 90) {
          ageing.days90 += balance;
        } else {
          ageing.over90 += balance;
        }
      });

      return ageing;
    },
  });
}

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const { data } = await supabase
    .from("customer_invoices")
    .select("invoice_number")
    .like("invoice_number", `INV-${year}-%`)
    .order("created_at", { ascending: false })
    .limit(1);

  let nextNumber = 1;
  if (data?.[0]?.invoice_number) {
    const match = data[0].invoice_number.match(/INV-\d+-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `INV-${year}-${nextNumber.toString().padStart(4, "0")}`;
}

export function useCreateCustomerInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: InvoiceFormData) => {
      const invoiceNumber = await generateInvoiceNumber();
      
      const { data: user } = await supabase.auth.getUser();
      
      const { data: invoice, error: invoiceError } = await supabase
        .from("customer_invoices")
        .insert({
          invoice_number: invoiceNumber,
          customer_id: formData.customer_id,
          sales_order_id: formData.sales_order_id || null,
          invoice_date: formData.invoice_date,
          due_date: formData.due_date,
          subtotal: formData.subtotal,
          tax_amount: formData.tax_amount || 0,
          total_amount: formData.total_amount,
          payment_terms: formData.payment_terms || 30,
          notes: formData.notes,
          status: "draft",
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      if (formData.lines.length > 0) {
        const lines = formData.lines.map((line, index) => ({
          invoice_id: invoice.id,
          product_id: line.product_id || null,
          description: line.description,
          quantity: line.quantity,
          unit_price: line.unit_price,
          tax_rate: line.tax_rate || 0,
          line_total: line.line_total,
          line_number: index + 1,
        }));

        const { error: linesError } = await supabase
          .from("customer_invoice_lines")
          .insert(lines);

        if (linesError) throw linesError;
      }

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-invoices"] });
      toast.success("Invoice created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create invoice: " + error.message);
    },
  });
}

export function useUpdateCustomerInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CustomerInvoice> }) => {
      const { data, error } = await supabase
        .from("customer_invoices")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-invoices"] });
      toast.success("Invoice updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update invoice: " + error.message);
    },
  });
}

export function useSendInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("customer_invoices")
        .update({ status: "sent" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-invoices"] });
      toast.success("Invoice sent successfully");
    },
    onError: (error) => {
      toast.error("Failed to send invoice: " + error.message);
    },
  });
}

export function useOpenCustomerInvoices(customerId: string | null) {
  return useQuery({
    queryKey: ["customer-invoices", "open", customerId],
    queryFn: async () => {
      if (!customerId) return [];
      const { data, error } = await supabase
        .from("customer_invoices")
        .select("id, invoice_number, total_amount, amount_paid, due_date")
        .eq("customer_id", customerId)
        .in("status", ["sent", "partial", "overdue"])
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });
}
