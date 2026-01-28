import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface WHTCertificate {
  id: string;
  certificate_number: string;
  supplier_id: string;
  payment_id: string | null;
  certificate_date: string;
  gross_amount: number;
  wht_rate: number;
  wht_amount: number;
  tax_type: string | null;
  filing_status: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  suppliers?: { name: string } | null;
}

export interface WHTFormData {
  certificate_number: string;
  supplier_id: string;
  payment_id?: string;
  certificate_date: string;
  gross_amount: number;
  wht_rate: number;
  wht_amount: number;
  tax_type?: string;
  notes?: string;
}

const QUERY_KEY = 'wht-certificates';

export function useWHTCertificates() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wht_certificates')
        .select('*, suppliers(company_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        suppliers: d.suppliers ? { name: (d.suppliers as any).company_name } : null
      })) as WHTCertificate[];
    },
  });
}

export function useWHTStats() {
  return useQuery({
    queryKey: [QUERY_KEY, 'stats'],
    queryFn: async () => {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];

      const { data: certs, error } = await supabase
        .from('wht_certificates')
        .select('wht_amount, filing_status, certificate_date');
      
      if (error) throw error;

      const certificatesThisMonth = certs?.filter(c => c.certificate_date >= monthStart).length || 0;
      const totalWHTYTD = certs?.filter(c => c.certificate_date >= yearStart)
        .reduce((sum, c) => sum + Number(c.wht_amount), 0) || 0;
      const pendingSubmission = certs?.filter(c => c.filing_status === 'pending').length || 0;
      const submitted = certs?.filter(c => c.filing_status === 'submitted').length || 0;

      return { certificatesThisMonth, totalWHTYTD, pendingSubmission, submitted };
    },
  });
}

export function useCreateWHTCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: WHTFormData) => {
      const { data: result, error } = await supabase
        .from('wht_certificates')
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('WHT certificate recorded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to record WHT certificate: ${error.message}`);
    },
  });
}

export function useUpdateWHTCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: WHTFormData & { id: string }) => {
      const { data: result, error } = await supabase
        .from('wht_certificates')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('WHT certificate updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update WHT certificate: ${error.message}`);
    },
  });
}

export function useSubmitWHTCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: result, error } = await supabase
        .from('wht_certificates')
        .update({ filing_status: 'submitted' })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('WHT certificate marked as submitted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update certificate: ${error.message}`);
    },
  });
}
