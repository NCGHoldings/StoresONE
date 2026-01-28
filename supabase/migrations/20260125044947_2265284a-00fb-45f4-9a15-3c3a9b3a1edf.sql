-- Banking Module Tables

-- 1. Bank Accounts - Central bank account master
CREATE TABLE public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  branch_name TEXT,
  swift_code TEXT,
  iban TEXT,
  currency TEXT DEFAULT 'USD',
  account_type TEXT CHECK (account_type IN ('checking', 'savings', 'money_market', 'petty_cash')),
  current_balance NUMERIC(14,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  gl_account_id UUID,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Bank Transactions - All bank movements
CREATE TABLE public.bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number TEXT NOT NULL UNIQUE,
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id),
  transaction_date DATE NOT NULL,
  value_date DATE,
  transaction_type TEXT CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer_in', 'transfer_out', 'fee', 'interest', 'cheque_issued', 'cheque_received')),
  amount NUMERIC(14,2) NOT NULL,
  running_balance NUMERIC(14,2),
  reference_number TEXT,
  description TEXT,
  payee_payer TEXT,
  is_reconciled BOOLEAN DEFAULT false,
  reconciled_at TIMESTAMPTZ,
  reconciled_by UUID REFERENCES auth.users(id),
  source_type TEXT,
  source_id UUID,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Cheques - Cheque register
CREATE TABLE public.cheques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cheque_number TEXT NOT NULL,
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id),
  cheque_type TEXT CHECK (cheque_type IN ('issued', 'received')),
  cheque_date DATE NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  payee_payer TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'cleared', 'bounced', 'cancelled', 'stale')),
  clearance_date DATE,
  is_post_dated BOOLEAN DEFAULT false,
  post_date DATE,
  memo TEXT,
  vendor_payment_id UUID,
  customer_receipt_id UUID,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Bank Reconciliations - Reconciliation sessions
CREATE TABLE public.bank_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id),
  statement_date DATE NOT NULL,
  statement_balance NUMERIC(14,2) NOT NULL,
  book_balance NUMERIC(14,2) NOT NULL,
  adjusted_balance NUMERIC(14,2),
  difference NUMERIC(14,2),
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'approved')),
  reconciled_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Reconciliation Items - Individual items in reconciliation
CREATE TABLE public.reconciliation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_id UUID NOT NULL REFERENCES public.bank_reconciliations(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.bank_transactions(id),
  item_type TEXT CHECK (item_type IN ('outstanding_cheque', 'deposit_in_transit', 'bank_charge', 'interest', 'error', 'other')),
  amount NUMERIC(14,2) NOT NULL,
  description TEXT,
  is_cleared BOOLEAN DEFAULT false
);

-- 6. Fund Transfers - Inter-account transfers
CREATE TABLE public.fund_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_number TEXT NOT NULL UNIQUE,
  from_account_id UUID NOT NULL REFERENCES public.bank_accounts(id),
  to_account_id UUID NOT NULL REFERENCES public.bank_accounts(id),
  transfer_date DATE NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  exchange_rate NUMERIC(10,6) DEFAULT 1,
  converted_amount NUMERIC(14,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'cancelled')),
  purpose TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Payment Batches - Bulk payment processing
CREATE TABLE public.payment_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number TEXT NOT NULL UNIQUE,
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id),
  batch_date DATE NOT NULL,
  total_amount NUMERIC(14,2) NOT NULL,
  payment_count INTEGER DEFAULT 0,
  batch_type TEXT CHECK (batch_type IN ('vendor_payments', 'employee_reimbursements', 'payroll', 'other')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'processed', 'cancelled')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Payment Batch Items - Items in a batch
CREATE TABLE public.payment_batch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.payment_batches(id) ON DELETE CASCADE,
  vendor_payment_id UUID REFERENCES public.vendor_payments(id),
  payee_name TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  payment_method TEXT,
  reference TEXT,
  status TEXT DEFAULT 'pending'
);

-- Enable RLS on all tables
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cheques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_batch_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bank_accounts
CREATE POLICY "Authenticated users can view bank accounts" ON public.bank_accounts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert bank accounts" ON public.bank_accounts
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update bank accounts" ON public.bank_accounts
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete bank accounts" ON public.bank_accounts
  FOR DELETE TO authenticated USING (true);

-- RLS Policies for bank_transactions
CREATE POLICY "Authenticated users can view bank transactions" ON public.bank_transactions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert bank transactions" ON public.bank_transactions
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update bank transactions" ON public.bank_transactions
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete bank transactions" ON public.bank_transactions
  FOR DELETE TO authenticated USING (true);

-- RLS Policies for cheques
CREATE POLICY "Authenticated users can view cheques" ON public.cheques
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert cheques" ON public.cheques
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update cheques" ON public.cheques
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete cheques" ON public.cheques
  FOR DELETE TO authenticated USING (true);

-- RLS Policies for bank_reconciliations
CREATE POLICY "Authenticated users can view bank reconciliations" ON public.bank_reconciliations
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert bank reconciliations" ON public.bank_reconciliations
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update bank reconciliations" ON public.bank_reconciliations
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete bank reconciliations" ON public.bank_reconciliations
  FOR DELETE TO authenticated USING (true);

-- RLS Policies for reconciliation_items
CREATE POLICY "Authenticated users can view reconciliation items" ON public.reconciliation_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert reconciliation items" ON public.reconciliation_items
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update reconciliation items" ON public.reconciliation_items
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete reconciliation items" ON public.reconciliation_items
  FOR DELETE TO authenticated USING (true);

-- RLS Policies for fund_transfers
CREATE POLICY "Authenticated users can view fund transfers" ON public.fund_transfers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert fund transfers" ON public.fund_transfers
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update fund transfers" ON public.fund_transfers
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete fund transfers" ON public.fund_transfers
  FOR DELETE TO authenticated USING (true);

-- RLS Policies for payment_batches
CREATE POLICY "Authenticated users can view payment batches" ON public.payment_batches
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert payment batches" ON public.payment_batches
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update payment batches" ON public.payment_batches
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete payment batches" ON public.payment_batches
  FOR DELETE TO authenticated USING (true);

-- RLS Policies for payment_batch_items
CREATE POLICY "Authenticated users can view payment batch items" ON public.payment_batch_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert payment batch items" ON public.payment_batch_items
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update payment batch items" ON public.payment_batch_items
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete payment batch items" ON public.payment_batch_items
  FOR DELETE TO authenticated USING (true);

-- Indexes for better performance
CREATE INDEX idx_bank_transactions_account ON public.bank_transactions(bank_account_id);
CREATE INDEX idx_bank_transactions_date ON public.bank_transactions(transaction_date);
CREATE INDEX idx_bank_transactions_reconciled ON public.bank_transactions(is_reconciled);
CREATE INDEX idx_cheques_account ON public.cheques(bank_account_id);
CREATE INDEX idx_cheques_status ON public.cheques(status);
CREATE INDEX idx_cheques_date ON public.cheques(cheque_date);
CREATE INDEX idx_fund_transfers_from ON public.fund_transfers(from_account_id);
CREATE INDEX idx_fund_transfers_to ON public.fund_transfers(to_account_id);
CREATE INDEX idx_fund_transfers_status ON public.fund_transfers(status);
CREATE INDEX idx_payment_batches_account ON public.payment_batches(bank_account_id);
CREATE INDEX idx_payment_batches_status ON public.payment_batches(status);
CREATE INDEX idx_reconciliation_items_reconciliation ON public.reconciliation_items(reconciliation_id);

-- Trigger to update updated_at on bank_accounts
CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();