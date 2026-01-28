import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface APTransaction {
  id: string;
  date: string;
  type: "invoice" | "payment" | "debit_note" | "advance";
  reference: string;
  description: string;
  debit: number;
  credit: number;
  running_balance: number;
}

export interface APReconciliationData {
  supplier: {
    id: string;
    company_name: string;
    supplier_code: string;
  };
  opening_balance: number;
  transactions: APTransaction[];
  closing_balance: number;
  total_debits: number;
  total_credits: number;
  discrepancy: number;
}

export function useAPReconciliation(
  supplierId: string | null,
  startDate: string | null,
  endDate: string | null
) {
  return useQuery({
    queryKey: ["ap-reconciliation", supplierId, startDate, endDate],
    queryFn: async (): Promise<APReconciliationData | null> => {
      if (!supplierId || !startDate || !endDate) return null;

      // Get supplier info
      const { data: supplier, error: suppError } = await supabase
        .from("suppliers")
        .select("id, company_name, supplier_code")
        .eq("id", supplierId)
        .single();

      if (suppError) throw suppError;

      // Get invoices before start date for opening balance
      const { data: priorInvoices, error: priorInvError } = await supabase
        .from("invoices")
        .select("amount, amount_paid, status")
        .eq("supplier_id", supplierId)
        .lt("invoice_date", startDate)
        .not("status", "eq", "cancelled");

      if (priorInvError) throw priorInvError;

      // Get payments before start date
      const { data: priorPayments, error: priorPayError } = await supabase
        .from("vendor_payments")
        .select("amount, status")
        .eq("supplier_id", supplierId)
        .lt("payment_date", startDate)
        .eq("status", "paid");

      if (priorPayError) throw priorPayError;

      // Get debit notes before start date
      const { data: priorDebitNotes, error: priorDnError } = await supabase
        .from("debit_notes")
        .select("amount_applied, status")
        .eq("supplier_id", supplierId)
        .lt("debit_date", startDate)
        .eq("status", "applied");

      if (priorDnError) throw priorDnError;

      // Calculate opening balance
      const priorInvoiceTotal = (priorInvoices || []).reduce(
        (sum, i) => sum + Number(i.amount || 0), 0
      );
      const priorPaymentTotal = (priorPayments || []).reduce(
        (sum, p) => sum + Number(p.amount || 0), 0
      );
      const priorDebitNoteTotal = (priorDebitNotes || []).reduce(
        (sum, d) => sum + Number(d.amount_applied || 0), 0
      );
      const opening_balance = priorInvoiceTotal - priorPaymentTotal - priorDebitNoteTotal;

      // Get invoices in period
      const { data: invoices, error: invError } = await supabase
        .from("invoices")
        .select("id, invoice_number, invoice_date, amount, notes")
        .eq("supplier_id", supplierId)
        .gte("invoice_date", startDate)
        .lte("invoice_date", endDate)
        .not("status", "eq", "cancelled");

      if (invError) throw invError;

      // Get payments in period
      const { data: payments, error: payError } = await supabase
        .from("vendor_payments")
        .select("id, payment_number, payment_date, amount, payment_method")
        .eq("supplier_id", supplierId)
        .gte("payment_date", startDate)
        .lte("payment_date", endDate)
        .eq("status", "paid");

      if (payError) throw payError;

      // Get debit notes in period
      const { data: debitNotes, error: dnError } = await supabase
        .from("debit_notes")
        .select("id, debit_note_number, debit_date, amount_applied, reason")
        .eq("supplier_id", supplierId)
        .gte("debit_date", startDate)
        .lte("debit_date", endDate)
        .eq("status", "applied");

      if (dnError) throw dnError;

      // Get advances in period
      const { data: advances, error: advError } = await supabase
        .from("vendor_advances")
        .select("id, advance_number, advance_date, original_amount, remaining_amount")
        .eq("supplier_id", supplierId)
        .gte("advance_date", startDate)
        .lte("advance_date", endDate);

      if (advError) throw advError;

      // Build transactions list
      const allTransactions: Omit<APTransaction, "running_balance">[] = [
        ...(invoices || []).map((inv) => ({
          id: inv.id,
          date: inv.invoice_date,
          type: "invoice" as const,
          reference: inv.invoice_number,
          description: inv.notes || "Vendor Invoice",
          debit: Number(inv.amount || 0),
          credit: 0,
        })),
        ...(payments || []).map((pay) => ({
          id: pay.id,
          date: pay.payment_date,
          type: "payment" as const,
          reference: pay.payment_number,
          description: `Payment - ${pay.payment_method || ""}`,
          debit: 0,
          credit: Number(pay.amount || 0),
        })),
        ...(debitNotes || []).map((dn) => ({
          id: dn.id,
          date: dn.debit_date,
          type: "debit_note" as const,
          reference: dn.debit_note_number,
          description: dn.reason || "Debit Note",
          debit: 0,
          credit: Number(dn.amount_applied || 0),
        })),
        ...(advances || []).map((adv) => ({
          id: adv.id,
          date: adv.advance_date,
          type: "advance" as const,
          reference: adv.advance_number,
          description: "Vendor Advance",
          debit: 0,
          credit: Number(adv.original_amount || 0) - Number(adv.remaining_amount || 0),
        })),
      ];

      // Sort by date
      allTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Calculate running balances
      let runningBalance = opening_balance;
      const transactions: APTransaction[] = allTransactions.map((t) => {
        runningBalance += t.debit - t.credit;
        return {
          ...t,
          running_balance: runningBalance,
        };
      });

      const total_debits = transactions.reduce((sum, t) => sum + t.debit, 0);
      const total_credits = transactions.reduce((sum, t) => sum + t.credit, 0);
      const closing_balance = opening_balance + total_debits - total_credits;

      // Discrepancy check (should be 0)
      const discrepancy = closing_balance - runningBalance;

      return {
        supplier,
        opening_balance,
        transactions,
        closing_balance,
        total_debits,
        total_credits,
        discrepancy,
      };
    },
    enabled: !!supplierId && !!startDate && !!endDate,
  });
}
