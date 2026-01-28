import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type InvoiceStatus = 'pending' | 'approved' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  invoice_number: string;
  supplier_id: string | null;
  po_id: string | null;
  invoice_date: string;
  due_date: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  payment_date: string | null;
  payment_reference: string | null;
  notes: string | null;
  created_by: string | null;
  approved_by: string | null;
  approved_date: string | null;
  created_at: string;
  updated_at: string;
  suppliers?: {
    company_name: string;
    supplier_code: string;
  };
  purchase_orders?: {
    po_number: string;
  };
}

export interface InvoiceFormData {
  invoice_number: string;
  supplier_id: string | null;
  po_id: string | null;
  invoice_date: string;
  due_date: string;
  amount: number;
  currency: string;
  notes?: string;
}

// Fetch all invoices with supplier info
export function useInvoices() {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          suppliers (company_name, supplier_code),
          purchase_orders (po_number)
        `)
        .order("invoice_date", { ascending: false });

      if (error) throw error;
      return data as Invoice[];
    },
  });
}

// Fetch single invoice
export function useInvoice(id: string | null) {
  return useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          suppliers (company_name, supplier_code, email, phone),
          purchase_orders (po_number, total_amount)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Invoice;
    },
    enabled: !!id,
  });
}

// Invoice statistics
export function useInvoiceStats() {
  return useQuery({
    queryKey: ["invoice-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("amount, status, due_date, payment_date");

      if (error) throw error;

      const today = new Date();
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const stats = {
        totalPayables: 0,
        pendingApproval: 0,
        overdue: 0,
        paidThisMonth: 0,
        overdueCount: 0,
        pendingCount: 0,
      };

      data?.forEach((inv) => {
        if (inv.status !== 'paid' && inv.status !== 'cancelled') {
          stats.totalPayables += Number(inv.amount) || 0;
        }
        if (inv.status === 'pending') {
          stats.pendingApproval += Number(inv.amount) || 0;
          stats.pendingCount++;
        }
        if (inv.status === 'overdue') {
          stats.overdue += Number(inv.amount) || 0;
          stats.overdueCount++;
        }
        if (inv.status === 'paid' && inv.payment_date) {
          const paymentDate = new Date(inv.payment_date);
          if (paymentDate >= thisMonth) {
            stats.paidThisMonth += Number(inv.amount) || 0;
          }
        }
      });

      return stats;
    },
  });
}

// Aging report data
export function useInvoiceAging() {
  return useQuery({
    queryKey: ["invoice-aging"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("amount, due_date, status")
        .in("status", ["pending", "approved", "overdue"]);

      if (error) throw error;

      const today = new Date();
      const aging = {
        current: 0,
        days30: 0,
        days60: 0,
        days90: 0,
        over90: 0,
      };

      data?.forEach((inv) => {
        const dueDate = new Date(inv.due_date);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const amount = Number(inv.amount) || 0;

        if (daysOverdue <= 0) {
          aging.current += amount;
        } else if (daysOverdue <= 30) {
          aging.days30 += amount;
        } else if (daysOverdue <= 60) {
          aging.days60 += amount;
        } else if (daysOverdue <= 90) {
          aging.days90 += amount;
        } else {
          aging.over90 += amount;
        }
      });

      return aging;
    },
  });
}

// Create invoice
export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoice: InvoiceFormData) => {
      const { data, error } = await supabase
        .from("invoices")
        .insert(invoice)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-stats"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-aging"] });
      toast.success("Invoice created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create invoice: ${error.message}`);
    },
  });
}

// Update invoice
export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Invoice> & { id: string }) => {
      const { data, error } = await supabase
        .from("invoices")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-stats"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-aging"] });
      toast.success("Invoice updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update invoice: ${error.message}`);
    },
  });
}

// Approve invoice
export function useApproveInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("invoices")
        .update({
          status: 'approved' as InvoiceStatus,
          approved_date: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-stats"] });
      toast.success("Invoice approved");
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve invoice: ${error.message}`);
    },
  });
}

// Pay invoice
export function usePayInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payment_reference }: { id: string; payment_reference?: string }) => {
      const { data, error } = await supabase
        .from("invoices")
        .update({
          status: 'paid' as InvoiceStatus,
          payment_date: new Date().toISOString().split('T')[0],
          payment_reference,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-stats"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-aging"] });
      toast.success("Payment recorded successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to record payment: ${error.message}`);
    },
  });
}

// Cancel invoice
export function useCancelInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("invoices")
        .update({ status: 'cancelled' as InvoiceStatus })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-stats"] });
      toast.success("Invoice cancelled");
    },
    onError: (error: Error) => {
      toast.error(`Failed to cancel invoice: ${error.message}`);
    },
  });
}
