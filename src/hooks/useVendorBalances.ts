import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface VendorBalance {
  id: string;
  supplier_code: string;
  company_name: string;
  total_invoiced: number;
  total_paid: number;
  total_debit_notes: number;
  total_advances: number;
  outstanding_balance: number;
  credit_limit: number | null;
  available_credit: number | null;
  invoices_count: number;
  overdue_amount: number;
  days_payable_outstanding: number;
}

export interface VendorInvoiceWithBalance {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount: number;
  amount_paid: number;
  balance_due: number;
  status: string;
  is_overdue: boolean;
  days_overdue: number;
  scheduled_payment_date: string | null;
  scheduled_payment_amount: number | null;
  po_number?: string;
  grn_number?: string;
}

export function useVendorBalances() {
  return useQuery({
    queryKey: ["vendor-balances"],
    queryFn: async () => {
      // Get all suppliers
      const { data: suppliers, error: suppError } = await supabase
        .from("suppliers")
        .select("id, supplier_code, company_name")
        .eq("status", "active");

      if (suppError) throw suppError;

      // Get all invoices
      const { data: invoices, error: invError } = await supabase
        .from("invoices")
        .select("supplier_id, amount, amount_paid, status, due_date, invoice_date")
        .not("status", "eq", "cancelled");

      if (invError) throw invError;

      // Get all payment allocations
      const { data: allocations, error: allocError } = await supabase
        .from("payment_allocations")
        .select("invoice_id, amount");

      if (allocError) throw allocError;

      // Get all debit notes
      const { data: debitNotes, error: dnError } = await supabase
        .from("debit_notes")
        .select("supplier_id, amount, amount_applied, status");

      if (dnError) throw dnError;

      // Get all vendor advances
      const { data: advances, error: advError } = await supabase
        .from("vendor_advances")
        .select("supplier_id, original_amount, remaining_amount, status");

      if (advError) throw advError;

      const today = new Date();

      // Calculate balances for each vendor
      const balances: VendorBalance[] = (suppliers || []).map((supplier) => {
        const vendorInvoices = (invoices || []).filter((i) => i.supplier_id === supplier.id);
        const vendorDebitNotes = (debitNotes || []).filter((d) => d.supplier_id === supplier.id && d.status !== "cancelled");
        const vendorAdvances = (advances || []).filter((a) => a.supplier_id === supplier.id && a.status !== "cancelled");

        const total_invoiced = vendorInvoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);
        const total_paid = vendorInvoices.reduce((sum, i) => sum + Number(i.amount_paid || 0), 0);
        const total_debit_notes = vendorDebitNotes.reduce((sum, d) => sum + Number(d.amount_applied || 0), 0);
        const total_advances = vendorAdvances.reduce((sum, a) => 
          sum + (Number(a.original_amount || 0) - Number(a.remaining_amount || 0)), 0);

        const outstanding_balance = total_invoiced - total_paid - total_debit_notes;

        // Calculate overdue amount
        const overdue_amount = vendorInvoices
          .filter((i) => {
            const dueDate = new Date(i.due_date);
            return dueDate < today && i.status !== "paid";
          })
          .reduce((sum, i) => sum + (Number(i.amount || 0) - Number(i.amount_paid || 0)), 0);

        // Calculate DPO (Days Payable Outstanding)
        const avgInvoiceAge = vendorInvoices
          .filter((i) => i.status !== "paid")
          .reduce((sum, i) => {
            const invoiceDate = new Date(i.invoice_date);
            const daysDiff = Math.floor((today.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
            return sum + daysDiff;
          }, 0);
        const unpaidCount = vendorInvoices.filter((i) => i.status !== "paid").length;
        const days_payable_outstanding = unpaidCount > 0 ? Math.round(avgInvoiceAge / unpaidCount) : 0;

        return {
          id: supplier.id,
          supplier_code: supplier.supplier_code,
          company_name: supplier.company_name,
          total_invoiced,
          total_paid,
          total_debit_notes,
          total_advances,
          outstanding_balance,
          credit_limit: null, // Could be added to suppliers table if needed
          available_credit: null,
          invoices_count: vendorInvoices.filter((i) => i.status !== "paid").length,
          overdue_amount,
          days_payable_outstanding,
        };
      });

      return balances.filter((b) => b.invoices_count > 0 || b.outstanding_balance > 0);
    },
  });
}

export function useVendorBalance(supplierId: string | null) {
  return useQuery({
    queryKey: ["vendor-balance", supplierId],
    queryFn: async () => {
      if (!supplierId) return null;

      const { data: supplier, error: suppError } = await supabase
        .from("suppliers")
        .select("id, supplier_code, company_name")
        .eq("id", supplierId)
        .single();

      if (suppError) throw suppError;

      const { data: invoices, error: invError } = await supabase
        .from("invoices")
        .select("amount, amount_paid, status, due_date")
        .eq("supplier_id", supplierId)
        .not("status", "eq", "cancelled");

      if (invError) throw invError;

      const { data: debitNotes, error: dnError } = await supabase
        .from("debit_notes")
        .select("amount, amount_applied, status")
        .eq("supplier_id", supplierId)
        .not("status", "eq", "cancelled");

      if (dnError) throw dnError;

      const { data: advances, error: advError } = await supabase
        .from("vendor_advances")
        .select("original_amount, remaining_amount, status")
        .eq("supplier_id", supplierId)
        .not("status", "eq", "cancelled");

      if (advError) throw advError;

      const today = new Date();
      const total_invoiced = (invoices || []).reduce((sum, i) => sum + Number(i.amount || 0), 0);
      const total_paid = (invoices || []).reduce((sum, i) => sum + Number(i.amount_paid || 0), 0);
      const total_debit_notes = (debitNotes || []).reduce((sum, d) => sum + Number(d.amount_applied || 0), 0);
      const total_advances_used = (advances || []).reduce((sum, a) => 
        sum + (Number(a.original_amount || 0) - Number(a.remaining_amount || 0)), 0);
      const available_advances = (advances || []).reduce((sum, a) => sum + Number(a.remaining_amount || 0), 0);
      const available_debit_notes = (debitNotes || [])
        .filter((d) => d.status !== "applied")
        .reduce((sum, d) => sum + (Number(d.amount || 0) - Number(d.amount_applied || 0)), 0);

      const outstanding_balance = total_invoiced - total_paid - total_debit_notes;
      const overdue_amount = (invoices || [])
        .filter((i) => new Date(i.due_date) < today && i.status !== "paid")
        .reduce((sum, i) => sum + (Number(i.amount || 0) - Number(i.amount_paid || 0)), 0);

      return {
        ...supplier,
        total_invoiced,
        total_paid,
        total_debit_notes,
        total_advances_used,
        available_advances,
        available_debit_notes,
        outstanding_balance,
        overdue_amount,
        invoices_count: (invoices || []).filter((i) => i.status !== "paid").length,
      };
    },
    enabled: !!supplierId,
  });
}

export function useVendorInvoicesWithBalance(supplierId: string | null) {
  return useQuery({
    queryKey: ["vendor-invoices-balance", supplierId],
    queryFn: async () => {
      if (!supplierId) return [];

      const { data: invoices, error } = await supabase
        .from("invoices")
        .select(`
          id,
          invoice_number,
          invoice_date,
          due_date,
          amount,
          amount_paid,
          status,
          scheduled_payment_date,
          scheduled_payment_amount,
          purchase_orders (po_number)
        `)
        .eq("supplier_id", supplierId)
        .not("status", "in", "(paid,cancelled)")
        .order("due_date", { ascending: true });

      if (error) throw error;

      const today = new Date();

      return (invoices || []).map((inv): VendorInvoiceWithBalance => {
        const dueDate = new Date(inv.due_date);
        const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
        const balance_due = Number(inv.amount || 0) - Number(inv.amount_paid || 0);

        return {
          id: inv.id,
          invoice_number: inv.invoice_number,
          invoice_date: inv.invoice_date,
          due_date: inv.due_date,
          amount: Number(inv.amount || 0),
          amount_paid: Number(inv.amount_paid || 0),
          balance_due,
          status: inv.status || "pending",
          is_overdue: daysOverdue > 0 && inv.status !== "paid",
          days_overdue: daysOverdue,
          scheduled_payment_date: inv.scheduled_payment_date,
          scheduled_payment_amount: inv.scheduled_payment_amount ? Number(inv.scheduled_payment_amount) : null,
          po_number: (inv.purchase_orders as any)?.po_number,
        };
      });
    },
    enabled: !!supplierId,
  });
}

export function useVendorDebitNotes(supplierId: string | null) {
  return useQuery({
    queryKey: ["vendor-debit-notes", supplierId],
    queryFn: async () => {
      if (!supplierId) return [];

      const { data, error } = await supabase
        .from("debit_notes")
        .select("*")
        .eq("supplier_id", supplierId)
        .not("status", "eq", "cancelled")
        .order("debit_date", { ascending: false });

      if (error) throw error;

      return (data || []).map((dn) => ({
        ...dn,
        available_amount: Number(dn.amount || 0) - Number(dn.amount_applied || 0),
      }));
    },
    enabled: !!supplierId,
  });
}

export function useVendorAdvances(supplierId: string | null) {
  return useQuery({
    queryKey: ["vendor-advances-balance", supplierId],
    queryFn: async () => {
      if (!supplierId) return [];

      const { data, error } = await supabase
        .from("vendor_advances")
        .select("*")
        .eq("supplier_id", supplierId)
        .gt("remaining_amount", 0)
        .order("advance_date", { ascending: false });

      if (error) throw error;

      return data || [];
    },
    enabled: !!supplierId,
  });
}
