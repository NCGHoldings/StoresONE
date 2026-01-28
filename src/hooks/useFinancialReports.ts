import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, subYears, format } from "date-fns";

export type PeriodType = "month" | "quarter" | "year" | "custom";

export interface DateRange {
  start: string;
  end: string;
}

export function getDateRange(periodType: PeriodType, customRange?: DateRange): DateRange {
  const now = new Date();
  switch (periodType) {
    case "month":
      return {
        start: format(startOfMonth(now), "yyyy-MM-dd"),
        end: format(endOfMonth(now), "yyyy-MM-dd"),
      };
    case "quarter":
      return {
        start: format(startOfQuarter(now), "yyyy-MM-dd"),
        end: format(endOfQuarter(now), "yyyy-MM-dd"),
      };
    case "year":
      return {
        start: format(startOfYear(now), "yyyy-MM-dd"),
        end: format(endOfYear(now), "yyyy-MM-dd"),
      };
    case "custom":
      return customRange || { start: format(startOfMonth(now), "yyyy-MM-dd"), end: format(endOfMonth(now), "yyyy-MM-dd") };
    default:
      return {
        start: format(startOfMonth(now), "yyyy-MM-dd"),
        end: format(endOfMonth(now), "yyyy-MM-dd"),
      };
  }
}

// Trial Balance Hook - Aggregates GL entries by account
export function useTrialBalance(asOfDate?: string) {
  return useQuery({
    queryKey: ["trial-balance", asOfDate],
    queryFn: async () => {
      const dateFilter = asOfDate || format(new Date(), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("general_ledger")
        .select("account_code, account_name, debit, credit")
        .lte("entry_date", dateFilter);

      if (error) throw error;

      // Aggregate by account
      const accountTotals: Record<string, { code: string; name: string; debit: number; credit: number }> = {};
      
      data?.forEach((entry) => {
        if (!accountTotals[entry.account_code]) {
          accountTotals[entry.account_code] = {
            code: entry.account_code,
            name: entry.account_name,
            debit: 0,
            credit: 0,
          };
        }
        accountTotals[entry.account_code].debit += Number(entry.debit) || 0;
        accountTotals[entry.account_code].credit += Number(entry.credit) || 0;
      });

      const accounts = Object.values(accountTotals).sort((a, b) => a.code.localeCompare(b.code));
      const totalDebit = accounts.reduce((sum, acc) => sum + acc.debit, 0);
      const totalCredit = accounts.reduce((sum, acc) => sum + acc.credit, 0);

      return {
        accounts,
        totalDebit,
        totalCredit,
        isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
      };
    },
  });
}

// Balance Sheet Hook - Assets, Liabilities, Equity
export function useBalanceSheet(asOfDate?: string) {
  return useQuery({
    queryKey: ["balance-sheet", asOfDate],
    queryFn: async () => {
      const dateFilter = asOfDate || format(new Date(), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("general_ledger")
        .select("account_code, account_name, debit, credit")
        .lte("entry_date", dateFilter);

      if (error) throw error;

      // Categorize by account code prefix
      const categories = {
        assets: { total: 0, items: [] as { code: string; name: string; balance: number }[] },
        liabilities: { total: 0, items: [] as { code: string; name: string; balance: number }[] },
        equity: { total: 0, items: [] as { code: string; name: string; balance: number }[] },
      };

      const accountTotals: Record<string, { code: string; name: string; debit: number; credit: number }> = {};
      
      data?.forEach((entry) => {
        if (!accountTotals[entry.account_code]) {
          accountTotals[entry.account_code] = {
            code: entry.account_code,
            name: entry.account_name,
            debit: 0,
            credit: 0,
          };
        }
        accountTotals[entry.account_code].debit += Number(entry.debit) || 0;
        accountTotals[entry.account_code].credit += Number(entry.credit) || 0;
      });

      Object.values(accountTotals).forEach((account) => {
        const balance = account.debit - account.credit;
        const item = { code: account.code, name: account.name, balance: Math.abs(balance) };
        
        if (account.code.startsWith("1")) {
          // Assets (debit balance)
          categories.assets.items.push({ ...item, balance });
          categories.assets.total += balance;
        } else if (account.code.startsWith("2")) {
          // Liabilities (credit balance)
          categories.liabilities.items.push({ ...item, balance: -balance });
          categories.liabilities.total += -balance;
        } else if (account.code.startsWith("3")) {
          // Equity (credit balance)
          categories.equity.items.push({ ...item, balance: -balance });
          categories.equity.total += -balance;
        }
      });

      return categories;
    },
  });
}

// Income Statement Hook - Revenue and Expenses
export function useIncomeStatement(dateRange: DateRange) {
  return useQuery({
    queryKey: ["income-statement", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("general_ledger")
        .select("account_code, account_name, debit, credit")
        .gte("entry_date", dateRange.start)
        .lte("entry_date", dateRange.end);

      if (error) throw error;

      const categories = {
        revenue: { total: 0, items: [] as { code: string; name: string; amount: number }[] },
        expenses: { total: 0, items: [] as { code: string; name: string; amount: number }[] },
      };

      const accountTotals: Record<string, { code: string; name: string; debit: number; credit: number }> = {};
      
      data?.forEach((entry) => {
        if (!accountTotals[entry.account_code]) {
          accountTotals[entry.account_code] = {
            code: entry.account_code,
            name: entry.account_name,
            debit: 0,
            credit: 0,
          };
        }
        accountTotals[entry.account_code].debit += Number(entry.debit) || 0;
        accountTotals[entry.account_code].credit += Number(entry.credit) || 0;
      });

      Object.values(accountTotals).forEach((account) => {
        if (account.code.startsWith("4")) {
          // Revenue (credit balance)
          const amount = account.credit - account.debit;
          categories.revenue.items.push({ code: account.code, name: account.name, amount });
          categories.revenue.total += amount;
        } else if (account.code.startsWith("5") || account.code.startsWith("6") || account.code.startsWith("7") || account.code.startsWith("8") || account.code.startsWith("9")) {
          // Expenses (debit balance)
          const amount = account.debit - account.credit;
          categories.expenses.items.push({ code: account.code, name: account.name, amount });
          categories.expenses.total += amount;
        }
      });

      return {
        ...categories,
        netIncome: categories.revenue.total - categories.expenses.total,
      };
    },
  });
}

// Cash Flow Report Hook
export function useCashFlowReport(dateRange: DateRange) {
  return useQuery({
    queryKey: ["cash-flow-report", dateRange],
    queryFn: async () => {
      // Fetch customer receipts (operating inflows)
      const { data: receipts, error: receiptsError } = await supabase
        .from("customer_receipts")
        .select("amount, receipt_date")
        .gte("receipt_date", dateRange.start)
        .lte("receipt_date", dateRange.end)
        .eq("status", "posted");

      if (receiptsError) throw receiptsError;

      // Fetch vendor payments (operating outflows)
      const { data: payments, error: paymentsError } = await supabase
        .from("vendor_payments")
        .select("amount, payment_date")
        .gte("payment_date", dateRange.start)
        .lte("payment_date", dateRange.end)
        .eq("status", "posted");

      if (paymentsError) throw paymentsError;

      // Fetch bank transactions for detailed categorization
      const { data: transactions, error: transError } = await supabase
        .from("bank_transactions")
        .select("amount, transaction_type, transaction_date, description")
        .gte("transaction_date", dateRange.start)
        .lte("transaction_date", dateRange.end);

      if (transError) throw transError;

      // Fetch fund transfers (financing)
      const { data: transfers, error: transfersError } = await supabase
        .from("fund_transfers")
        .select("amount, transfer_date")
        .gte("transfer_date", dateRange.start)
        .lte("transfer_date", dateRange.end)
        .eq("status", "completed");

      if (transfersError) throw transfersError;

      // Fetch bank balances
      const { data: bankAccounts, error: bankError } = await supabase
        .from("bank_accounts")
        .select("current_balance")
        .eq("is_active", true);

      if (bankError) throw bankError;

      const totalReceipts = receipts?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
      const totalPayments = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      
      const deposits = transactions?.filter(t => t.transaction_type === "deposit").reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const withdrawals = transactions?.filter(t => t.transaction_type === "withdrawal").reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0;

      const operating = {
        inflows: totalReceipts + deposits,
        outflows: totalPayments + withdrawals,
        net: (totalReceipts + deposits) - (totalPayments + withdrawals),
      };

      const financing = {
        inflows: 0,
        outflows: 0,
        net: 0,
      };

      const investing = {
        inflows: 0,
        outflows: 0,
        net: 0,
      };

      const endingCash = bankAccounts?.reduce((sum, acc) => sum + Number(acc.current_balance || 0), 0) || 0;
      const netChange = operating.net + financing.net + investing.net;

      return {
        operating,
        investing,
        financing,
        beginningCash: endingCash - netChange,
        endingCash,
        netChange,
      };
    },
  });
}

// Variance Report Hook - Budget vs Actual by Cost Center
export function useVarianceReport(dateRange: DateRange) {
  return useQuery({
    queryKey: ["variance-report", dateRange],
    queryFn: async () => {
      // Fetch cost centers with budgets
      const { data: costCenters, error: ccError } = await supabase
        .from("cost_centers")
        .select("id, code, name, budget, spent")
        .eq("is_active", true);

      if (ccError) throw ccError;

      // Fetch actual spending from GL
      const { data: glEntries, error: glError } = await supabase
        .from("general_ledger")
        .select("cost_center_id, debit, credit")
        .gte("entry_date", dateRange.start)
        .lte("entry_date", dateRange.end)
        .not("cost_center_id", "is", null);

      if (glError) throw glError;

      // Aggregate actual by cost center
      const actualByCC: Record<string, number> = {};
      glEntries?.forEach((entry) => {
        if (entry.cost_center_id) {
          if (!actualByCC[entry.cost_center_id]) {
            actualByCC[entry.cost_center_id] = 0;
          }
          actualByCC[entry.cost_center_id] += (Number(entry.debit) || 0) - (Number(entry.credit) || 0);
        }
      });

      const report = costCenters?.map((cc) => {
        const budget = Number(cc.budget) || 0;
        const actual = actualByCC[cc.id] || Number(cc.spent) || 0;
        const variance = budget - actual;
        const variancePercent = budget > 0 ? ((variance / budget) * 100) : 0;
        
        return {
          id: cc.id,
          code: cc.code,
          name: cc.name,
          budget,
          actual,
          variance,
          variancePercent,
          isFavorable: variance >= 0,
        };
      }) || [];

      const totals = report.reduce(
        (acc, item) => ({
          budget: acc.budget + item.budget,
          actual: acc.actual + item.actual,
          variance: acc.variance + item.variance,
        }),
        { budget: 0, actual: 0, variance: 0 }
      );

      return { items: report, totals };
    },
  });
}

// Tax Summary Hook
export function useTaxSummary(dateRange: DateRange) {
  return useQuery({
    queryKey: ["tax-summary", dateRange],
    queryFn: async () => {
      // Fetch customer invoices for output VAT
      const { data: customerInvoices, error: ciError } = await supabase
        .from("customer_invoices")
        .select("tax_amount, invoice_date")
        .gte("invoice_date", dateRange.start)
        .lte("invoice_date", dateRange.end);

      if (ciError) throw ciError;

      // Fetch supplier invoices for input VAT
      const { data: supplierInvoices, error: siError } = await supabase
        .from("invoices")
        .select("amount, invoice_date")
        .gte("invoice_date", dateRange.start)
        .lte("invoice_date", dateRange.end);

      if (siError) throw siError;

      // Fetch WHT certificates
      const { data: whtCerts, error: whtError } = await supabase
        .from("wht_certificates")
        .select("wht_amount, certificate_date, filing_status")
        .gte("certificate_date", dateRange.start)
        .lte("certificate_date", dateRange.end);

      if (whtError) throw whtError;

      const outputVAT = customerInvoices?.reduce((sum, inv) => sum + (Number(inv.tax_amount) || 0), 0) || 0;
      // Estimate input VAT at 7% of invoice amount (simplified)
      const inputVAT = supplierInvoices?.reduce((sum, inv) => sum + (Number(inv.amount) * 0.07), 0) || 0;
      const netVAT = outputVAT - inputVAT;

      const whtTotal = whtCerts?.reduce((sum, cert) => sum + (Number(cert.wht_amount) || 0), 0) || 0;
      const whtCount = whtCerts?.length || 0;

      return {
        outputVAT,
        inputVAT,
        netVAT,
        isPayable: netVAT > 0,
        whtCertificatesIssued: whtCount,
        whtTotalDeducted: whtTotal,
      };
    },
  });
}

// Sales Performance Hook
export function useSalesPerformance(dateRange: DateRange) {
  return useQuery({
    queryKey: ["sales-performance", dateRange],
    queryFn: async () => {
      // Fetch sales orders
      const { data: salesOrders, error: soError } = await supabase
        .from("sales_orders")
        .select(`
          id, so_number, total_amount, order_date, status,
          customers (id, company_name)
        `)
        .gte("order_date", dateRange.start)
        .lte("order_date", dateRange.end);

      if (soError) throw soError;

      // Fetch customer invoices
      const { data: invoices, error: invError } = await supabase
        .from("customer_invoices")
        .select(`
          id, total_amount, invoice_date,
          customers (id, company_name)
        `)
        .gte("invoice_date", dateRange.start)
        .lte("invoice_date", dateRange.end);

      if (invError) throw invError;

      const totalSales = invoices?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0;
      const orderCount = salesOrders?.length || 0;
      const avgOrderValue = orderCount > 0 ? totalSales / orderCount : 0;

      // Group by customer
      const byCustomer: Record<string, { name: string; total: number; count: number }> = {};
      invoices?.forEach((inv) => {
        const custId = inv.customers?.id || "unknown";
        const custName = inv.customers?.company_name || "Unknown";
        if (!byCustomer[custId]) {
          byCustomer[custId] = { name: custName, total: 0, count: 0 };
        }
        byCustomer[custId].total += Number(inv.total_amount);
        byCustomer[custId].count += 1;
      });

      const customerBreakdown = Object.entries(byCustomer)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.total - a.total);

      const topCustomer = customerBreakdown[0] || null;

      // Monthly trend
      const monthlyTrend: Record<string, number> = {};
      invoices?.forEach((inv) => {
        const month = format(new Date(inv.invoice_date), "yyyy-MM");
        if (!monthlyTrend[month]) {
          monthlyTrend[month] = 0;
        }
        monthlyTrend[month] += Number(inv.total_amount);
      });

      const trendData = Object.entries(monthlyTrend)
        .map(([month, amount]) => ({ month, amount }))
        .sort((a, b) => a.month.localeCompare(b.month));

      return {
        totalSales,
        orderCount,
        avgOrderValue,
        topCustomer,
        customerBreakdown,
        trendData,
      };
    },
  });
}

// Segment Analysis Hook
export function useSegmentAnalysis(dateRange: DateRange) {
  return useQuery({
    queryKey: ["segment-analysis", dateRange],
    queryFn: async () => {
      const { data: glEntries, error } = await supabase
        .from("general_ledger")
        .select(`
          account_code, account_name, debit, credit,
          cost_centers (id, code, name)
        `)
        .gte("entry_date", dateRange.start)
        .lte("entry_date", dateRange.end);

      if (error) throw error;

      // Aggregate by cost center (segment)
      const segments: Record<string, { code: string; name: string; revenue: number; expenses: number }> = {};

      glEntries?.forEach((entry) => {
        const segId = entry.cost_centers?.id || "unallocated";
        const segCode = entry.cost_centers?.code || "N/A";
        const segName = entry.cost_centers?.name || "Unallocated";

        if (!segments[segId]) {
          segments[segId] = { code: segCode, name: segName, revenue: 0, expenses: 0 };
        }

        if (entry.account_code.startsWith("4")) {
          // Revenue
          segments[segId].revenue += (Number(entry.credit) || 0) - (Number(entry.debit) || 0);
        } else if (entry.account_code.startsWith("5") || entry.account_code.startsWith("6") || entry.account_code.startsWith("7")) {
          // Expenses
          segments[segId].expenses += (Number(entry.debit) || 0) - (Number(entry.credit) || 0);
        }
      });

      const segmentData = Object.entries(segments).map(([id, data]) => ({
        id,
        ...data,
        profit: data.revenue - data.expenses,
      }));

      const totalRevenue = segmentData.reduce((sum, seg) => sum + seg.revenue, 0);
      const totalExpenses = segmentData.reduce((sum, seg) => sum + seg.expenses, 0);
      const totalProfit = totalRevenue - totalExpenses;

      // Add contribution percentage
      const withContribution = segmentData.map((seg) => ({
        ...seg,
        revenueContribution: totalRevenue > 0 ? (seg.revenue / totalRevenue) * 100 : 0,
      }));

      return {
        segments: withContribution,
        totals: { revenue: totalRevenue, expenses: totalExpenses, profit: totalProfit },
      };
    },
  });
}

// Audit Logs Hook with enhanced filtering
export function useAuditLogsReport(filters: {
  dateRange?: DateRange;
  userId?: string;
  action?: string;
  entityType?: string;
}) {
  return useQuery({
    queryKey: ["audit-logs-report", filters],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (filters.dateRange) {
        query = query.gte("created_at", filters.dateRange.start).lte("created_at", filters.dateRange.end + "T23:59:59");
      }
      if (filters.userId) {
        query = query.eq("user_id", filters.userId);
      }
      if (filters.action) {
        query = query.eq("action", filters.action);
      }
      if (filters.entityType) {
        query = query.eq("entity_type", filters.entityType);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get unique entity types for filter dropdown
      const entityTypes = [...new Set(data?.map((log) => log.entity_type) || [])];
      const actions = [...new Set(data?.map((log) => log.action) || [])];

      return {
        logs: data || [],
        entityTypes,
        actions,
      };
    },
  });
}
