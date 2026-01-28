import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VendorAdvance {
  id: string;
  advance_number: string;
  supplier_id: string;
  payment_id: string | null;
  advance_date: string;
  original_amount: number;
  remaining_amount: number;
  notes: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  suppliers?: { name: string } | null;
}

export interface VendorAdvanceFormData {
  advance_number: string;
  supplier_id: string;
  payment_id?: string;
  advance_date: string;
  original_amount: number;
  remaining_amount: number;
  notes?: string;
}

export interface AdvanceAllocation {
  id: string;
  advance_id: string;
  invoice_id: string;
  amount: number;
  allocated_at: string;
  invoices?: { invoice_number: string; amount: number } | null;
}

const QUERY_KEY = 'vendor-advances';

export function useVendorAdvances() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_advances')
        .select('*, suppliers(company_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        suppliers: d.suppliers ? { name: (d.suppliers as any).company_name } : null
      })) as VendorAdvance[];
    },
  });
}

export function useVendorAdvanceStats() {
  return useQuery({
    queryKey: [QUERY_KEY, 'stats'],
    queryFn: async () => {
      const { data: advances, error } = await supabase
        .from('vendor_advances')
        .select('original_amount, remaining_amount, status');
      
      if (error) throw error;

      const totalAdvances = advances?.reduce((sum, a) => sum + Number(a.original_amount), 0) || 0;
      const activeBalance = advances?.filter(a => a.status === 'active')
        .reduce((sum, a) => sum + Number(a.remaining_amount), 0) || 0;
      const partiallyApplied = advances?.filter(a => a.status === 'partially_applied').length || 0;
      const fullyApplied = advances?.filter(a => a.status === 'fully_applied').length || 0;

      return { totalAdvances, activeBalance, partiallyApplied, fullyApplied };
    },
  });
}

export function useCreateVendorAdvance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: VendorAdvanceFormData) => {
      const { data: result, error } = await supabase
        .from('vendor_advances')
        .insert([{ ...data, remaining_amount: data.original_amount }])
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Advance recorded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to record advance: ${error.message}`);
    },
  });
}

export function useAdvanceAllocations(advanceId: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY, 'allocations', advanceId],
    queryFn: async () => {
      if (!advanceId) return [];
      const { data, error } = await supabase
        .from('vendor_advance_allocations')
        .select('*, invoices(invoice_number, amount)')
        .eq('advance_id', advanceId);
      if (error) throw error;
      return data as AdvanceAllocation[];
    },
    enabled: !!advanceId,
  });
}

export function useCreateAdvanceAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { advance_id: string; invoice_id: string; amount: number }) => {
      // First create the allocation
      const { data: result, error } = await supabase
        .from('vendor_advance_allocations')
        .insert([data])
        .select()
        .single();
      if (error) throw error;

      // Then update the advance remaining amount
      const { data: advance } = await supabase
        .from('vendor_advances')
        .select('remaining_amount')
        .eq('id', data.advance_id)
        .single();

      if (advance) {
        const newRemaining = Number(advance.remaining_amount) - data.amount;
        const newStatus = newRemaining <= 0 ? 'fully_applied' : 'partially_applied';
        
        await supabase
          .from('vendor_advances')
          .update({ remaining_amount: Math.max(0, newRemaining), status: newStatus })
          .eq('id', data.advance_id);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Advance allocated to invoice');
    },
    onError: (error: Error) => {
      toast.error(`Failed to allocate advance: ${error.message}`);
    },
  });
}
