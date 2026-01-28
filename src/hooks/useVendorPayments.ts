import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VendorPayment {
  id: string;
  payment_number: string;
  supplier_id: string;
  payment_date: string;
  amount: number;
  payment_method: string | null;
  bank_account: string | null;
  reference_number: string | null;
  notes: string | null;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  suppliers?: { name: string } | null;
}

export interface PaymentFormData {
  payment_number: string;
  supplier_id: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  bank_account?: string;
  reference_number?: string;
  notes?: string;
}

export interface PaymentAllocation {
  id: string;
  payment_id: string;
  invoice_id: string;
  amount: number;
  allocated_at: string;
  invoices?: { invoice_number: string; amount: number } | null;
}

const QUERY_KEY = 'vendor-payments';

export function useVendorPayments() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_payments')
        .select('*, suppliers(company_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        suppliers: d.suppliers ? { name: (d.suppliers as any).company_name } : null
      })) as VendorPayment[];
    },
  });
}

export function useVendorPayment(id: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('vendor_payments')
        .select('*, suppliers(company_name)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return {
        ...data,
        suppliers: data.suppliers ? { name: (data.suppliers as any).company_name } : null
      } as VendorPayment;
    },
    enabled: !!id,
  });
}

export function useVendorPaymentStats() {
  return useQuery({
    queryKey: [QUERY_KEY, 'stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

      const { data: payments, error } = await supabase
        .from('vendor_payments')
        .select('amount, status, payment_date');
      
      if (error) throw error;

      const paymentsToday = payments?.filter(p => p.payment_date === today && p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      
      const paymentsThisWeek = payments?.filter(p => p.payment_date >= weekAgo && p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      
      const pendingApproval = payments?.filter(p => p.status === 'pending').length || 0;
      
      const paidThisMonth = payments?.filter(p => p.payment_date >= monthStart && p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      return { paymentsToday, paymentsThisWeek, pendingApproval, paidThisMonth };
    },
  });
}

export function useCreateVendorPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const { data: result, error } = await supabase
        .from('vendor_payments')
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Payment recorded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to record payment: ${error.message}`);
    },
  });
}

export function useUpdateVendorPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: PaymentFormData & { id: string }) => {
      const { data: result, error } = await supabase
        .from('vendor_payments')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Payment updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update payment: ${error.message}`);
    },
  });
}

export function useApproveVendorPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: result, error } = await supabase
        .from('vendor_payments')
        .update({ status: 'approved', approved_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Payment approved');
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve payment: ${error.message}`);
    },
  });
}

export function useMarkPaymentPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: result, error } = await supabase
        .from('vendor_payments')
        .update({ status: 'paid' })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Payment marked as paid');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update payment: ${error.message}`);
    },
  });
}

export function usePaymentAllocations(paymentId: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY, 'allocations', paymentId],
    queryFn: async () => {
      if (!paymentId) return [];
      const { data, error } = await supabase
        .from('payment_allocations')
        .select('*, invoices(invoice_number, amount)')
        .eq('payment_id', paymentId);
      if (error) throw error;
      return data as PaymentAllocation[];
    },
    enabled: !!paymentId,
  });
}

export function useCreatePaymentAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { payment_id: string; invoice_id: string; amount: number }) => {
      const { data: result, error } = await supabase
        .from('payment_allocations')
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Payment allocated to invoice');
    },
    onError: (error: Error) => {
      toast.error(`Failed to allocate payment: ${error.message}`);
    },
  });
}

export function useDeletePaymentAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payment_allocations')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Allocation removed');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove allocation: ${error.message}`);
    },
  });
}
