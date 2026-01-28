import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CreditNote {
  id: string;
  credit_note_number: string;
  customer_id: string;
  invoice_id: string | null;
  sales_return_id: string | null;
  credit_date: string;
  amount: number;
  amount_applied: number | null;
  currency: string | null;
  reason: string | null;
  notes: string | null;
  status: string | null;
  applied_to_invoice_id: string | null;
  created_by: string | null;
  created_at: string;
  customers?: {
    company_name: string;
    customer_code: string;
  };
  customer_invoices?: {
    invoice_number: string;
  };
  sales_returns?: {
    return_number: string;
  };
}

export interface CreditNoteFormData {
  customer_id: string;
  invoice_id?: string | null;
  sales_return_id?: string | null;
  credit_date: string;
  amount: number;
  reason?: string;
  notes?: string;
}

export function useCreditNotes(status?: string) {
  return useQuery({
    queryKey: ["credit-notes", status],
    queryFn: async () => {
      let query = supabase
        .from("credit_notes")
        .select(`
          *,
          customers(company_name, customer_code),
          customer_invoices!credit_notes_invoice_id_fkey(invoice_number),
          sales_returns(return_number)
        `)
        .order("created_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CreditNote[];
    },
  });
}

export function useCreditNote(id: string | null) {
  return useQuery({
    queryKey: ["credit-notes", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("credit_notes")
        .select(`
          *,
          customers(company_name, customer_code),
          customer_invoices!credit_notes_invoice_id_fkey(invoice_number),
          sales_returns(return_number)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as CreditNote;
    },
    enabled: !!id,
  });
}

export function useCreditNoteStats() {
  return useQuery({
    queryKey: ["credit-notes", "stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_notes")
        .select("id, amount, status, sales_return_id, created_at");

      if (error) throw error;

      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const stats = {
        pendingCredits: data
          .filter(cn => cn.status === "pending")
          .reduce((sum, cn) => sum + cn.amount, 0),
        appliedThisMonth: data
          .filter(cn => cn.status === "applied" && new Date(cn.created_at) >= thisMonth)
          .reduce((sum, cn) => sum + cn.amount, 0),
        totalCreditValue: data.reduce((sum, cn) => sum + cn.amount, 0),
        fromReturns: data.filter(cn => cn.sales_return_id).length,
      };

      return stats;
    },
  });
}

async function generateCreditNoteNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const { data } = await supabase
    .from("credit_notes")
    .select("credit_note_number")
    .like("credit_note_number", `CN-${year}-%`)
    .order("created_at", { ascending: false })
    .limit(1);

  let nextNumber = 1;
  if (data?.[0]?.credit_note_number) {
    const match = data[0].credit_note_number.match(/CN-\d+-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `CN-${year}-${nextNumber.toString().padStart(4, "0")}`;
}

export function useCreateCreditNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: CreditNoteFormData) => {
      const creditNoteNumber = await generateCreditNoteNumber();
      const { data: user } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("credit_notes")
        .insert({
          credit_note_number: creditNoteNumber,
          customer_id: formData.customer_id,
          invoice_id: formData.invoice_id || null,
          sales_return_id: formData.sales_return_id || null,
          credit_date: formData.credit_date,
          amount: formData.amount,
          reason: formData.reason,
          notes: formData.notes,
          status: "pending",
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-notes"] });
      toast.success("Credit note created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create credit note: " + error.message);
    },
  });
}

export function useApproveCreditNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("credit_notes")
        .update({ status: "approved" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-notes"] });
      toast.success("Credit note approved");
    },
    onError: (error) => {
      toast.error("Failed to approve credit note: " + error.message);
    },
  });
}

export function useApplyCreditNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      creditNoteId, 
      invoiceId,
      amount 
    }: { 
      creditNoteId: string; 
      invoiceId: string;
      amount: number;
    }) => {
      const { data: user } = await supabase.auth.getUser();

      // Get credit note
      const { data: creditNote } = await supabase
        .from("credit_notes")
        .select("amount, amount_applied")
        .eq("id", creditNoteId)
        .single();

      if (!creditNote) throw new Error("Credit note not found");

      const currentApplied = creditNote.amount_applied || 0;
      const remaining = creditNote.amount - currentApplied;
      const applyAmount = Math.min(amount, remaining);

      if (applyAmount <= 0) throw new Error("No remaining balance to apply");

      // Get invoice
      const { data: invoice } = await supabase
        .from("customer_invoices")
        .select("amount_paid, total_amount")
        .eq("id", invoiceId)
        .single();

      if (!invoice) throw new Error("Invoice not found");

      const invoiceBalance = invoice.total_amount - (invoice.amount_paid || 0);
      const actualApply = Math.min(applyAmount, invoiceBalance);

      // Create application record
      await supabase.from("credit_note_applications").insert({
        credit_note_id: creditNoteId,
        invoice_id: invoiceId,
        amount: actualApply,
        applied_by: user.user?.id,
      });

      // Update credit note
      const newApplied = currentApplied + actualApply;
      const newCNStatus = newApplied >= creditNote.amount ? "applied" : "partial";

      await supabase
        .from("credit_notes")
        .update({ 
          amount_applied: newApplied,
          status: newCNStatus, 
          applied_to_invoice_id: invoiceId 
        })
        .eq("id", creditNoteId);

      // Update invoice
      const newAmountPaid = (invoice.amount_paid || 0) + actualApply;
      const newInvStatus = newAmountPaid >= invoice.total_amount ? "paid" : "partial";

      const { data, error } = await supabase
        .from("customer_invoices")
        .update({ amount_paid: newAmountPaid, status: newInvStatus })
        .eq("id", invoiceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-notes"] });
      queryClient.invalidateQueries({ queryKey: ["credit-note-applications"] });
      queryClient.invalidateQueries({ queryKey: ["customer-invoices"] });
      toast.success("Credit note applied to invoice");
    },
    onError: (error) => {
      toast.error("Failed to apply credit note: " + error.message);
    },
  });
}
