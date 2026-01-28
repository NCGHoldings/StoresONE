import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CreditNoteApplication {
  id: string;
  credit_note_id: string;
  invoice_id: string;
  amount: number;
  applied_at: string;
  applied_by: string | null;
  notes: string | null;
  customer_invoices?: {
    invoice_number: string;
  };
}

export function useCreditNoteApplications(creditNoteId: string | null) {
  return useQuery({
    queryKey: ["credit-note-applications", creditNoteId],
    queryFn: async () => {
      if (!creditNoteId) return [];
      
      const { data, error } = await supabase
        .from("credit_note_applications")
        .select(`
          *,
          customer_invoices(invoice_number)
        `)
        .eq("credit_note_id", creditNoteId)
        .order("applied_at", { ascending: false });

      if (error) throw error;
      return data as CreditNoteApplication[];
    },
    enabled: !!creditNoteId,
  });
}

export function useCreateCreditNoteApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      creditNoteId, 
      invoiceId, 
      amount,
      notes 
    }: { 
      creditNoteId: string; 
      invoiceId: string; 
      amount: number;
      notes?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();

      // Get credit note
      const { data: creditNote, error: cnError } = await supabase
        .from("credit_notes")
        .select("amount, amount_applied, customer_id")
        .eq("id", creditNoteId)
        .single();

      if (cnError || !creditNote) throw new Error("Credit note not found");

      const currentApplied = creditNote.amount_applied || 0;
      const remaining = creditNote.amount - currentApplied;

      if (amount > remaining) {
        throw new Error(`Cannot apply more than remaining balance (${remaining.toFixed(2)})`);
      }

      // Get invoice
      const { data: invoice, error: invError } = await supabase
        .from("customer_invoices")
        .select("total_amount, amount_paid, status")
        .eq("id", invoiceId)
        .single();

      if (invError || !invoice) throw new Error("Invoice not found");

      const invoiceBalance = invoice.total_amount - (invoice.amount_paid || 0);
      if (amount > invoiceBalance) {
        throw new Error(`Cannot apply more than invoice balance (${invoiceBalance.toFixed(2)})`);
      }

      // Create application record
      const { data: application, error: appError } = await supabase
        .from("credit_note_applications")
        .insert({
          credit_note_id: creditNoteId,
          invoice_id: invoiceId,
          amount,
          applied_by: user.user?.id,
          notes,
        })
        .select()
        .single();

      if (appError) throw appError;

      // Update credit note amount_applied
      const newApplied = currentApplied + amount;
      const newStatus = newApplied >= creditNote.amount ? "applied" : "partial";

      await supabase
        .from("credit_notes")
        .update({ 
          amount_applied: newApplied,
          status: newStatus,
          applied_to_invoice_id: invoiceId // Keep last applied invoice for reference
        })
        .eq("id", creditNoteId);

      // Update invoice amount_paid
      const newAmountPaid = (invoice.amount_paid || 0) + amount;
      const newInvoiceStatus = newAmountPaid >= invoice.total_amount ? "paid" : "partial";

      await supabase
        .from("customer_invoices")
        .update({ 
          amount_paid: newAmountPaid,
          status: newInvoiceStatus
        })
        .eq("id", invoiceId);

      return application;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-note-applications"] });
      queryClient.invalidateQueries({ queryKey: ["credit-notes"] });
      queryClient.invalidateQueries({ queryKey: ["customer-invoices"] });
      toast.success("Credit note applied successfully");
    },
    onError: (error) => {
      toast.error("Failed to apply credit note: " + error.message);
    },
  });
}
