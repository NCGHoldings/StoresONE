import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface APAgeingBucket {
  label: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface APAgeingData {
  buckets: APAgeingBucket[];
  total: number;
  byVendor: { vendorName: string; current: number; days30: number; days60: number; days90: number; over90: number; total: number }[];
}

export function useAPAgeing() {
  return useQuery({
    queryKey: ['ap-ageing'],
    queryFn: async () => {
      const today = new Date();
      
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*, suppliers(company_name)')
        .in('status', ['pending', 'approved', 'overdue']);
      
      if (error) throw error;

      const buckets: APAgeingBucket[] = [
        { label: 'Current', amount: 0, count: 0, percentage: 0 },
        { label: '1-30 Days', amount: 0, count: 0, percentage: 0 },
        { label: '31-60 Days', amount: 0, count: 0, percentage: 0 },
        { label: '61-90 Days', amount: 0, count: 0, percentage: 0 },
        { label: '90+ Days', amount: 0, count: 0, percentage: 0 },
      ];

      const vendorMap = new Map<string, { vendorName: string; current: number; days30: number; days60: number; days90: number; over90: number; total: number }>();

      invoices?.forEach(invoice => {
        const dueDate = new Date(invoice.due_date);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const amount = Number(invoice.amount);
        const vendorName = (invoice.suppliers as any)?.company_name || 'Unknown';
        if (!vendorMap.has(vendorName)) {
          vendorMap.set(vendorName, { vendorName, current: 0, days30: 0, days60: 0, days90: 0, over90: 0, total: 0 });
        }
        const vendor = vendorMap.get(vendorName)!;
        vendor.total += amount;

        if (daysOverdue <= 0) {
          buckets[0].amount += amount;
          buckets[0].count++;
          vendor.current += amount;
        } else if (daysOverdue <= 30) {
          buckets[1].amount += amount;
          buckets[1].count++;
          vendor.days30 += amount;
        } else if (daysOverdue <= 60) {
          buckets[2].amount += amount;
          buckets[2].count++;
          vendor.days60 += amount;
        } else if (daysOverdue <= 90) {
          buckets[3].amount += amount;
          buckets[3].count++;
          vendor.days90 += amount;
        } else {
          buckets[4].amount += amount;
          buckets[4].count++;
          vendor.over90 += amount;
        }
      });

      const total = buckets.reduce((sum, b) => sum + b.amount, 0);
      buckets.forEach(b => {
        b.percentage = total > 0 ? (b.amount / total) * 100 : 0;
      });

      return {
        buckets,
        total,
        byVendor: Array.from(vendorMap.values()).sort((a, b) => b.total - a.total),
      } as APAgeingData;
    },
  });
}
