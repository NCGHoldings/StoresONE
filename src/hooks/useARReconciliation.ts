import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReconciliationTransaction {
  id: string;
  date: string;
  type: 'invoice' | 'receipt' | 'credit_note' | 'advance';
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface ReconciliationData {
  customerId: string;
  customerName: string;
  periodStart: string;
  periodEnd: string;
  openingBalance: number;
  closingBalance: number;
  totalDebits: number;
  totalCredits: number;
  transactions: ReconciliationTransaction[];
  discrepancies: { message: string; amount: number }[];
}

export function useARReconciliation(customerId: string | null, periodStart: string, periodEnd: string) {
  return useQuery({
    queryKey: ['ar-reconciliation', customerId, periodStart, periodEnd],
    queryFn: async () => {
      if (!customerId) return null;

      // Get customer info
      const { data: customer, error: custError } = await supabase
        .from('customers')
        .select('id, company_name')
        .eq('id', customerId)
        .single();
      
      if (custError) throw custError;

      // Get invoices in period
      const { data: invoices, error: invError } = await supabase
        .from('customer_invoices')
        .select('id, invoice_number, invoice_date, total_amount')
        .eq('customer_id', customerId)
        .gte('invoice_date', periodStart)
        .lte('invoice_date', periodEnd)
        .order('invoice_date');
      
      if (invError) throw invError;

      // Get receipts in period
      const { data: receipts, error: recError } = await supabase
        .from('customer_receipts')
        .select('id, receipt_number, receipt_date, amount')
        .eq('customer_id', customerId)
        .gte('receipt_date', periodStart)
        .lte('receipt_date', periodEnd)
        .order('receipt_date');
      
      if (recError) throw recError;

      // Get credit notes in period
      const { data: creditNotes, error: cnError } = await supabase
        .from('credit_notes')
        .select('id, credit_note_number, credit_date, amount')
        .eq('customer_id', customerId)
        .gte('credit_date', periodStart)
        .lte('credit_date', periodEnd)
        .order('credit_date');
      
      if (cnError) throw cnError;

      // Get advances in period
      const { data: advances, error: advError } = await supabase
        .from('customer_advances')
        .select('id, advance_number, advance_date, original_amount')
        .eq('customer_id', customerId)
        .gte('advance_date', periodStart)
        .lte('advance_date', periodEnd)
        .order('advance_date');
      
      if (advError) throw advError;

      // Calculate opening balance (all transactions before period start)
      const { data: priorInvoices } = await supabase
        .from('customer_invoices')
        .select('total_amount')
        .eq('customer_id', customerId)
        .lt('invoice_date', periodStart);

      const { data: priorReceipts } = await supabase
        .from('customer_receipts')
        .select('amount')
        .eq('customer_id', customerId)
        .lt('receipt_date', periodStart);

      const { data: priorCredits } = await supabase
        .from('credit_notes')
        .select('amount')
        .eq('customer_id', customerId)
        .lt('credit_date', periodStart);

      const { data: priorAdvances } = await supabase
        .from('customer_advances')
        .select('original_amount')
        .eq('customer_id', customerId)
        .lt('advance_date', periodStart);

      const priorDebits = priorInvoices?.reduce((sum, i) => sum + Number(i.total_amount), 0) || 0;
      const priorCreditsTotal = (priorReceipts?.reduce((sum, r) => sum + Number(r.amount), 0) || 0) +
        (priorCredits?.reduce((sum, c) => sum + Number(c.amount), 0) || 0) +
        (priorAdvances?.reduce((sum, a) => sum + Number(a.original_amount), 0) || 0);
      
      const openingBalance = priorDebits - priorCreditsTotal;

      // Build transaction list
      const transactions: ReconciliationTransaction[] = [];
      let runningBalance = openingBalance;

      // Add all transactions sorted by date
      const allTxns = [
        ...(invoices?.map(i => ({ 
          id: i.id, 
          date: i.invoice_date, 
          type: 'invoice' as const, 
          reference: i.invoice_number, 
          description: 'Sales Invoice',
          amount: Number(i.total_amount),
          isDebit: true 
        })) || []),
        ...(receipts?.map(r => ({ 
          id: r.id, 
          date: r.receipt_date, 
          type: 'receipt' as const, 
          reference: r.receipt_number, 
          description: 'Payment Received',
          amount: Number(r.amount),
          isDebit: false 
        })) || []),
        ...(creditNotes?.map(c => ({ 
          id: c.id, 
          date: c.credit_date, 
          type: 'credit_note' as const, 
          reference: c.credit_note_number, 
          description: 'Credit Note',
          amount: Number(c.amount),
          isDebit: false 
        })) || []),
        ...(advances?.map(a => ({ 
          id: a.id, 
          date: a.advance_date, 
          type: 'advance' as const, 
          reference: a.advance_number, 
          description: 'Advance Payment',
          amount: Number(a.original_amount),
          isDebit: false 
        })) || []),
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      allTxns.forEach(txn => {
        if (txn.isDebit) {
          runningBalance += txn.amount;
          transactions.push({
            id: txn.id,
            date: txn.date,
            type: txn.type,
            reference: txn.reference,
            description: txn.description,
            debit: txn.amount,
            credit: 0,
            balance: runningBalance,
          });
        } else {
          runningBalance -= txn.amount;
          transactions.push({
            id: txn.id,
            date: txn.date,
            type: txn.type,
            reference: txn.reference,
            description: txn.description,
            debit: 0,
            credit: txn.amount,
            balance: runningBalance,
          });
        }
      });

      const totalDebits = transactions.reduce((sum, t) => sum + t.debit, 0);
      const totalCredits = transactions.reduce((sum, t) => sum + t.credit, 0);
      const closingBalance = openingBalance + totalDebits - totalCredits;

      // Check for discrepancies
      const discrepancies: { message: string; amount: number }[] = [];
      if (Math.abs(closingBalance - runningBalance) > 0.01) {
        discrepancies.push({
          message: 'Calculated closing balance does not match running total',
          amount: Math.abs(closingBalance - runningBalance),
        });
      }

      return {
        customerId: customer.id,
        customerName: customer.company_name,
        periodStart,
        periodEnd,
        openingBalance,
        closingBalance,
        totalDebits,
        totalCredits,
        transactions,
        discrepancies,
      } as ReconciliationData;
    },
    enabled: !!customerId && !!periodStart && !!periodEnd,
  });
}
