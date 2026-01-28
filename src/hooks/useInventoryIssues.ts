import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EnrichedIssue {
  id: string;
  product_id: string | null;
  bin_id: string | null;
  batch_id: string | null;
  quantity: number;
  transaction_type: string;
  transaction_date: string | null;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_at: string | null;
  created_by: string | null;
  products: { sku: string; name: string } | null;
  storage_bins: { bin_code: string } | null;
  inventory_batches: { batch_number: string } | null;
  sales_order?: {
    so_number: string;
    customer_po_id: string | null;
    customer_pos?: {
      cpo_number: string;
      internal_ref: string;
      customers?: {
        company_name: string;
        customer_code: string;
      } | null;
    } | null;
  } | null;
}

export interface IssueFilters {
  dateFrom?: string;
  dateTo?: string;
  productSearch?: string;
  referenceType?: string;
  customerId?: string;
}

export function useInventoryIssues(filters: IssueFilters = {}) {
  return useQuery({
    queryKey: ["inventory-issues", filters],
    queryFn: async (): Promise<EnrichedIssue[]> => {
      // Build the query for issues
      let query = supabase
        .from("inventory_transactions")
        .select(`
          *,
          products(sku, name),
          storage_bins(bin_code),
          inventory_batches(batch_number)
        `)
        .eq("transaction_type", "issue")
        .order("transaction_date", { ascending: false });

      // Apply date filters
      if (filters.dateFrom) {
        query = query.gte("transaction_date", filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte("transaction_date", filters.dateTo);
      }
      if (filters.referenceType) {
        query = query.eq("reference_type", filters.referenceType);
      }

      const { data: issues, error } = await query;

      if (error) throw error;
      if (!issues || issues.length === 0) return [];

      // Filter by product search if provided
      let filteredIssues = issues;
      if (filters.productSearch) {
        const search = filters.productSearch.toLowerCase();
        filteredIssues = issues.filter((issue) => {
          const product = issue.products as { sku: string; name: string } | null;
          return (
            product?.sku?.toLowerCase().includes(search) ||
            product?.name?.toLowerCase().includes(search)
          );
        });
      }

      // Collect unique sales_order reference_ids for batch enrichment
      const soReferenceIds = filteredIssues
        .filter((i) => i.reference_type === "sales_order" && i.reference_id)
        .map((i) => i.reference_id as string);

      // Batch fetch sales orders with CPO and customer data
      let salesOrdersMap: Record<string, any> = {};
      if (soReferenceIds.length > 0) {
        const { data: salesOrders } = await supabase
          .from("sales_orders")
          .select(`
            id,
            so_number,
            customer_po_id,
            customer_pos(
              cpo_number,
              internal_ref,
              customers(company_name, customer_code)
            )
          `)
          .in("id", soReferenceIds);

        if (salesOrders) {
          salesOrdersMap = salesOrders.reduce((acc, so) => {
            acc[so.id] = so;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      // Enrich issues with sales order data
      const enrichedIssues: EnrichedIssue[] = filteredIssues.map((issue) => {
        const enriched: EnrichedIssue = {
          ...issue,
          products: issue.products as { sku: string; name: string } | null,
          storage_bins: issue.storage_bins as { bin_code: string } | null,
          inventory_batches: issue.inventory_batches as { batch_number: string } | null,
        };

        if (issue.reference_type === "sales_order" && issue.reference_id) {
          const so = salesOrdersMap[issue.reference_id];
          if (so) {
            enriched.sales_order = {
              so_number: so.so_number,
              customer_po_id: so.customer_po_id,
              customer_pos: so.customer_pos,
            };
          }
        }

        return enriched;
      });

      // Filter by customer if provided
      if (filters.customerId) {
        return enrichedIssues.filter((issue) => {
          const customer = issue.sales_order?.customer_pos?.customers;
          return customer?.customer_code === filters.customerId ||
                 customer?.company_name?.toLowerCase().includes(filters.customerId.toLowerCase());
        });
      }

      return enrichedIssues;
    },
  });
}

export function useIssueStats() {
  return useQuery({
    queryKey: ["inventory-issues-stats"],
    queryFn: async () => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Get all issues for stats
      const { data: allIssues } = await supabase
        .from("inventory_transactions")
        .select("id, quantity, product_id, transaction_date")
        .eq("transaction_type", "issue")
        .gte("transaction_date", monthStart);

      if (!allIssues) {
        return {
          todayCount: 0,
          weekCount: 0,
          monthTotal: 0,
          topProduct: null,
        };
      }

      const todayIssues = allIssues.filter((i) => i.transaction_date && i.transaction_date >= todayStart);
      const weekIssues = allIssues.filter((i) => i.transaction_date && i.transaction_date >= weekStart);

      // Calculate totals
      const monthTotal = allIssues.reduce((sum, i) => sum + Math.abs(i.quantity), 0);

      // Find top product
      const productCounts: Record<string, number> = {};
      allIssues.forEach((i) => {
        if (i.product_id) {
          productCounts[i.product_id] = (productCounts[i.product_id] || 0) + 1;
        }
      });

      let topProductId: string | null = null;
      let topCount = 0;
      Object.entries(productCounts).forEach(([productId, count]) => {
        if (count > topCount) {
          topProductId = productId;
          topCount = count;
        }
      });

      // Get top product details
      let topProduct: { sku: string; name: string; count: number } | null = null;
      if (topProductId) {
        const { data: product } = await supabase
          .from("products")
          .select("sku, name")
          .eq("id", topProductId)
          .single();

        if (product) {
          topProduct = { ...product, count: topCount };
        }
      }

      return {
        todayCount: todayIssues.length,
        weekCount: weekIssues.length,
        monthTotal,
        topProduct,
      };
    },
  });
}
