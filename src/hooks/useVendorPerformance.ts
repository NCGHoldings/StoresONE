import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VendorPerformanceMetrics {
  supplierId: string;
  supplierName: string;
  avgDeliveryDays: number;
  onTimeDeliveryPct: number;
  qualityScore: number;
  priceCompetitiveness: number;
  overallScore: number;
}

export function useVendorPerformance() {
  return useQuery({
    queryKey: ['vendor-performance'],
    queryFn: async () => {
      // Get evaluations for performance metrics
      const { data: evaluations, error: evalError } = await supabase
        .from('supplier_evaluations')
        .select('*, suppliers(id, company_name)');
      
      if (evalError) throw evalError;

      // Get scorecards for additional metrics
      const { data: scorecards, error: scoreError } = await supabase
        .from('supplier_scorecards')
        .select('*, suppliers(id, company_name)');
      
      if (scoreError) throw scoreError;

      // Get delivery data from GRNs
      const { data: grns, error: grnError } = await supabase
        .from('inbound_deliveries')
        .select('supplier_id, actual_date, expected_date, po_id, purchase_orders(expected_delivery)')
        .not('actual_date', 'is', null);
      
      if (grnError) throw grnError;

      // Aggregate by supplier
      const supplierMap = new Map<string, VendorPerformanceMetrics>();

      // Process evaluations
      evaluations?.forEach(eval_ => {
        const supplierId = eval_.supplier_id;
        const supplierName = (eval_.suppliers as any)?.company_name || 'Unknown';
        
        if (!supplierMap.has(supplierId)) {
          supplierMap.set(supplierId, {
            supplierId,
            supplierName,
            avgDeliveryDays: 0,
            onTimeDeliveryPct: 0,
            qualityScore: 0,
            priceCompetitiveness: 0,
            overallScore: 0,
          });
        }
        
        const metrics = supplierMap.get(supplierId)!;
        metrics.qualityScore = Math.max(metrics.qualityScore, Number(eval_.quality_score || 0));
        metrics.priceCompetitiveness = Math.max(metrics.priceCompetitiveness, Number(eval_.price_score || 0));
      });

      // Process scorecards for overall scores
      scorecards?.forEach(card => {
        const supplierId = card.supplier_id;
        if (supplierMap.has(supplierId)) {
          const metrics = supplierMap.get(supplierId)!;
          // Calculate overall score from scorecard fields
          metrics.overallScore = Math.round(
            ((card.on_time_delivery_rate || 0) + (100 - (card.defect_rate || 0)) + (card.compliance_score || 0)) / 3
          );
        }
      });

      // Process GRNs for delivery metrics
      const deliveryBySupplierId = new Map<string, { totalDays: number; onTime: number; total: number }>();
      
      grns?.forEach(grn => {
        const supplierId = grn.supplier_id;
        if (!supplierId) return;
        
        if (!deliveryBySupplierId.has(supplierId)) {
          deliveryBySupplierId.set(supplierId, { totalDays: 0, onTime: 0, total: 0 });
        }
        
        const delivery = deliveryBySupplierId.get(supplierId)!;
        delivery.total++;
        
        const receivedDate = new Date(grn.actual_date!);
        const expectedDate = grn.expected_date ? new Date(grn.expected_date) : 
          (grn.purchase_orders?.expected_delivery ? new Date(grn.purchase_orders.expected_delivery) : null);
        
        if (expectedDate) {
          const daysDiff = Math.floor((receivedDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24));
          delivery.totalDays += Math.abs(daysDiff);
          if (daysDiff <= 0) delivery.onTime++;
        }
      });

      // Apply delivery metrics
      deliveryBySupplierId.forEach((delivery, supplierId) => {
        if (supplierMap.has(supplierId)) {
          const metrics = supplierMap.get(supplierId)!;
          metrics.avgDeliveryDays = delivery.total > 0 ? Math.round(delivery.totalDays / delivery.total) : 0;
          metrics.onTimeDeliveryPct = delivery.total > 0 ? Math.round((delivery.onTime / delivery.total) * 100) : 0;
        }
      });

      return Array.from(supplierMap.values()).sort((a, b) => b.overallScore - a.overallScore);
    },
  });
}

export function useVendorPerformanceStats() {
  const { data: vendors } = useVendorPerformance();
  
  return useQuery({
    queryKey: ['vendor-performance-stats'],
    queryFn: async () => {
      if (!vendors || vendors.length === 0) {
        return { avgDeliveryTime: 0, avgOnTimeDelivery: 0, avgQualityScore: 0, avgPriceScore: 0 };
      }

      const avgDeliveryTime = Math.round(vendors.reduce((sum, v) => sum + v.avgDeliveryDays, 0) / vendors.length);
      const avgOnTimeDelivery = Math.round(vendors.reduce((sum, v) => sum + v.onTimeDeliveryPct, 0) / vendors.length);
      const avgQualityScore = Math.round(vendors.reduce((sum, v) => sum + v.qualityScore, 0) / vendors.length * 10) / 10;
      const avgPriceScore = Math.round(vendors.reduce((sum, v) => sum + v.priceCompetitiveness, 0) / vendors.length * 10) / 10;

      return { avgDeliveryTime, avgOnTimeDelivery, avgQualityScore, avgPriceScore };
    },
    enabled: !!vendors,
  });
}
