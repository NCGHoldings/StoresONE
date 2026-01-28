import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DebitNoteApplication {
  id: string;
  debit_note_id: string;
  invoice_id: string;
  amount: number;
  applied_at: string;
  applied_by: string | null;
  invoices?: {
    invoice_number: string;
  };
}

export function useDebitNoteApplications(debitNoteId: string | null) {
  return useQuery({
    queryKey: ["debit-note-applications", debitNoteId],
    queryFn: async () => {
      if (!debitNoteId) return [];
      
      const { data, error } = await supabase
        .from("debit_note_applications")
        .select(`
          *,
          invoices(invoice_number)
        `)
        .eq("debit_note_id", debitNoteId)
        .order("applied_at", { ascending: false });

      if (error) throw error;
      return data as DebitNoteApplication[];
    },
    enabled: !!debitNoteId,
  });
}

export function useCreateDebitNoteApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      debitNoteId, 
      invoiceId, 
      amount 
    }: { 
      debitNoteId: string; 
      invoiceId: string; 
      amount: number;
    }) => {
      const { data: user } = await supabase.auth.getUser();

      // Get debit note
      const { data: debitNote, error: dnError } = await supabase
        .from("debit_notes")
        .select("amount, amount_applied, supplier_id")
        .eq("id", debitNoteId)
        .single();

      if (dnError || !debitNote) throw new Error("Debit note not found");

      const currentApplied = debitNote.amount_applied || 0;
      const remaining = debitNote.amount - currentApplied;

      if (amount > remaining) {
        throw new Error(`Cannot apply more than remaining balance (${remaining.toFixed(2)})`);
      }

      // Get invoice
      const { data: invoice, error: invError } = await supabase
        .from("invoices")
        .select("amount, amount_paid, status")
        .eq("id", invoiceId)
        .single();

      if (invError || !invoice) throw new Error("Invoice not found");

      const invoiceBalance = invoice.amount - (invoice.amount_paid || 0);
      if (amount > invoiceBalance) {
        throw new Error(`Cannot apply more than invoice balance (${invoiceBalance.toFixed(2)})`);
      }

      // Create application record
      const { data: application, error: appError } = await supabase
        .from("debit_note_applications")
        .insert({
          debit_note_id: debitNoteId,
          invoice_id: invoiceId,
          amount,
          applied_by: user.user?.id,
        })
        .select()
        .single();

      if (appError) throw appError;

      // Update debit note amount_applied
      const newApplied = currentApplied + amount;
      const newStatus = newApplied >= debitNote.amount ? "applied" : "partial";

      await supabase
        .from("debit_notes")
        .update({ 
          amount_applied: newApplied,
          status: newStatus,
          applied_to_invoice_id: invoiceId
        })
        .eq("id", debitNoteId);

      // Update invoice amount_paid (reduce the amount owed)
      const newAmountPaid = (invoice.amount_paid || 0) + amount;
      const newInvoiceStatus = newAmountPaid >= invoice.amount ? "paid" : "approved";

      await supabase
        .from("invoices")
        .update({ 
          amount_paid: newAmountPaid,
          status: newInvoiceStatus
        })
        .eq("id", invoiceId);

      return application;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debit-note-applications"] });
      queryClient.invalidateQueries({ queryKey: ["debit-notes"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Debit note applied successfully");
    },
    onError: (error) => {
      toast.error("Failed to apply debit note: " + error.message);
    },
  });
}
