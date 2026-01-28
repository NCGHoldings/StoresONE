import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DebitNote {
  id: string;
  debit_note_number: string;
  supplier_id: string;
  invoice_id: string | null;
  grn_id: string | null;
  debit_date: string;
  amount: number;
  amount_applied: number | null;
  reason: string | null;
  notes: string | null;
  status: string;
  applied_to_invoice_id: string | null;
  created_by: string | null;
  created_at: string;
  suppliers?: { name: string } | null;
  invoices?: { invoice_number: string } | null;
}

export interface DebitNoteFormData {
  debit_note_number: string;
  supplier_id: string;
  invoice_id?: string;
  grn_id?: string;
  debit_date: string;
  amount: number;
  reason: string;
  notes?: string;
}

const QUERY_KEY = 'debit-notes';

export function useDebitNotes() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('debit_notes')
        .select('*, suppliers(company_name), invoices!debit_notes_invoice_id_fkey(invoice_number)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        suppliers: d.suppliers ? { name: (d.suppliers as any).company_name } : null,
        invoices: d.invoices ? { invoice_number: (d.invoices as any).invoice_number } : null
      })) as DebitNote[];
    },
  });
}

export function useDebitNote(id: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('debit_notes')
        .select('*, suppliers(company_name), invoices!debit_notes_invoice_id_fkey(invoice_number)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return {
        ...data,
        suppliers: data.suppliers ? { name: (data.suppliers as any).company_name } : null,
        invoices: data.invoices ? { invoice_number: (data.invoices as any).invoice_number } : null
      } as DebitNote;
    },
    enabled: !!id,
  });
}

export function useDebitNoteStats() {
  return useQuery({
    queryKey: [QUERY_KEY, 'stats'],
    queryFn: async () => {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

      const { data: notes, error } = await supabase
        .from('debit_notes')
        .select('amount, status, debit_date, reason');
      
      if (error) throw error;

      const pending = notes?.filter(n => n.status === 'pending').length || 0;
      const appliedThisMonth = notes?.filter(n => n.status === 'applied' && n.debit_date >= monthStart)
        .reduce((sum, n) => sum + Number(n.amount), 0) || 0;
      const totalValue = notes?.reduce((sum, n) => sum + Number(n.amount), 0) || 0;
      const fromReturns = notes?.filter(n => n.reason === 'return').length || 0;

      return { pending, appliedThisMonth, totalValue, fromReturns };
    },
  });
}

export function useCreateDebitNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: DebitNoteFormData) => {
      const { data: result, error } = await supabase
        .from('debit_notes')
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Debit note created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create debit note: ${error.message}`);
    },
  });
}

export function useUpdateDebitNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: DebitNoteFormData & { id: string }) => {
      const { data: result, error } = await supabase
        .from('debit_notes')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Debit note updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update debit note: ${error.message}`);
    },
  });
}

export function useApproveDebitNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: result, error } = await supabase
        .from('debit_notes')
        .update({ status: 'approved' })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Debit note approved');
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve debit note: ${error.message}`);
    },
  });
}

export function useApplyDebitNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, invoiceId, amount }: { id: string; invoiceId: string; amount: number }) => {
      const { data: user } = await supabase.auth.getUser();

      // Get debit note
      const { data: debitNote } = await supabase
        .from('debit_notes')
        .select('amount, amount_applied')
        .eq('id', id)
        .single();

      if (!debitNote) throw new Error('Debit note not found');

      const currentApplied = debitNote.amount_applied || 0;
      const remaining = debitNote.amount - currentApplied;
      const applyAmount = Math.min(amount, remaining);

      if (applyAmount <= 0) throw new Error('No remaining balance to apply');

      // Get invoice
      const { data: invoice } = await supabase
        .from('invoices')
        .select('amount, amount_paid')
        .eq('id', invoiceId)
        .single();

      if (!invoice) throw new Error('Invoice not found');

      const invoiceBalance = invoice.amount - (invoice.amount_paid || 0);
      const actualApply = Math.min(applyAmount, invoiceBalance);

      // Create application record
      await supabase.from('debit_note_applications').insert({
        debit_note_id: id,
        invoice_id: invoiceId,
        amount: actualApply,
        applied_by: user.user?.id,
      });

      // Update debit note
      const newApplied = currentApplied + actualApply;
      const newDNStatus = newApplied >= debitNote.amount ? 'applied' : 'approved';

      await supabase
        .from('debit_notes')
        .update({ 
          amount_applied: newApplied,
          status: newDNStatus, 
          applied_to_invoice_id: invoiceId 
        })
        .eq('id', id);

      // Update invoice
      const newAmountPaid = (invoice.amount_paid || 0) + actualApply;
      const newInvStatus = newAmountPaid >= invoice.amount ? 'paid' : 'approved';

      const { data: result, error } = await supabase
        .from('invoices')
        .update({ amount_paid: newAmountPaid, status: newInvStatus })
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['debit-note-applications'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Debit note applied to invoice');
    },
    onError: (error: Error) => {
      toast.error(`Failed to apply debit note: ${error.message}`);
    },
  });
}
