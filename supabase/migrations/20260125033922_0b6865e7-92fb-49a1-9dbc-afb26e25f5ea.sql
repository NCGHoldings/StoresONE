-- =============================================
-- AR MODULE TABLES
-- =============================================

-- 1. Customer Invoices (AR Invoices)
CREATE TABLE public.customer_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  sales_order_id UUID REFERENCES public.sales_orders(id),
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL,
  amount_paid NUMERIC(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled', 'written_off')),
  payment_terms INTEGER DEFAULT 30,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Customer Invoice Lines
CREATE TABLE public.customer_invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.customer_invoices(id) ON DELETE CASCADE,
  so_line_id UUID REFERENCES public.sales_order_lines(id),
  product_id UUID REFERENCES public.products(id),
  description TEXT,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  tax_rate NUMERIC(5,2) DEFAULT 0,
  line_total NUMERIC(12,2) NOT NULL,
  line_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Customer Receipts
CREATE TABLE public.customer_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  receipt_date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'check', 'bank_transfer', 'credit_card')),
  reference_number TEXT,
  bank_account TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'allocated', 'reconciled')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Receipt Allocations (link receipts to invoices)
CREATE TABLE public.receipt_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES public.customer_receipts(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.customer_invoices(id),
  amount NUMERIC(12,2) NOT NULL,
  allocated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Credit Notes
CREATE TABLE public.credit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_note_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  invoice_id UUID REFERENCES public.customer_invoices(id),
  sales_return_id UUID REFERENCES public.sales_returns(id),
  credit_date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  reason TEXT CHECK (reason IN ('return', 'adjustment', 'pricing_error', 'goodwill', 'other')),
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'applied', 'cancelled')),
  applied_to_invoice_id UUID REFERENCES public.customer_invoices(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Customer Advances
CREATE TABLE public.customer_advances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advance_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  receipt_id UUID REFERENCES public.customer_receipts(id),
  advance_date DATE NOT NULL,
  original_amount NUMERIC(12,2) NOT NULL,
  remaining_amount NUMERIC(12,2) NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'partially_applied', 'fully_applied')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Advance Allocations
CREATE TABLE public.advance_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advance_id UUID NOT NULL REFERENCES public.customer_advances(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.customer_invoices(id),
  amount NUMERIC(12,2) NOT NULL,
  allocated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Bad Debt Provisions
CREATE TABLE public.bad_debt_provisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provision_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  invoice_id UUID REFERENCES public.customer_invoices(id),
  provision_date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  provision_type TEXT CHECK (provision_type IN ('provision', 'write_off', 'recovery')),
  reason TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'reversed')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_customer_invoices_customer ON public.customer_invoices(customer_id);
CREATE INDEX idx_customer_invoices_status ON public.customer_invoices(status);
CREATE INDEX idx_customer_invoices_due_date ON public.customer_invoices(due_date);
CREATE INDEX idx_customer_invoice_lines_invoice ON public.customer_invoice_lines(invoice_id);
CREATE INDEX idx_customer_receipts_customer ON public.customer_receipts(customer_id);
CREATE INDEX idx_receipt_allocations_receipt ON public.receipt_allocations(receipt_id);
CREATE INDEX idx_receipt_allocations_invoice ON public.receipt_allocations(invoice_id);
CREATE INDEX idx_credit_notes_customer ON public.credit_notes(customer_id);
CREATE INDEX idx_customer_advances_customer ON public.customer_advances(customer_id);
CREATE INDEX idx_advance_allocations_advance ON public.advance_allocations(advance_id);
CREATE INDEX idx_bad_debt_provisions_customer ON public.bad_debt_provisions(customer_id);

-- =============================================
-- TRIGGERS FOR updated_at
-- =============================================

CREATE TRIGGER update_customer_invoices_updated_at
  BEFORE UPDATE ON public.customer_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_receipts_updated_at
  BEFORE UPDATE ON public.customer_receipts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.customer_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advance_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bad_debt_provisions ENABLE ROW LEVEL SECURITY;

-- Customer Invoices policies
CREATE POLICY "Allow authenticated read customer_invoices" ON public.customer_invoices
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert customer_invoices" ON public.customer_invoices
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update customer_invoices" ON public.customer_invoices
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete customer_invoices" ON public.customer_invoices
  FOR DELETE TO authenticated USING (true);

-- Customer Invoice Lines policies
CREATE POLICY "Allow authenticated read customer_invoice_lines" ON public.customer_invoice_lines
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert customer_invoice_lines" ON public.customer_invoice_lines
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update customer_invoice_lines" ON public.customer_invoice_lines
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete customer_invoice_lines" ON public.customer_invoice_lines
  FOR DELETE TO authenticated USING (true);

-- Customer Receipts policies
CREATE POLICY "Allow authenticated read customer_receipts" ON public.customer_receipts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert customer_receipts" ON public.customer_receipts
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update customer_receipts" ON public.customer_receipts
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete customer_receipts" ON public.customer_receipts
  FOR DELETE TO authenticated USING (true);

-- Receipt Allocations policies
CREATE POLICY "Allow authenticated read receipt_allocations" ON public.receipt_allocations
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert receipt_allocations" ON public.receipt_allocations
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated delete receipt_allocations" ON public.receipt_allocations
  FOR DELETE TO authenticated USING (true);

-- Credit Notes policies
CREATE POLICY "Allow authenticated read credit_notes" ON public.credit_notes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert credit_notes" ON public.credit_notes
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update credit_notes" ON public.credit_notes
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete credit_notes" ON public.credit_notes
  FOR DELETE TO authenticated USING (true);

-- Customer Advances policies
CREATE POLICY "Allow authenticated read customer_advances" ON public.customer_advances
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert customer_advances" ON public.customer_advances
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update customer_advances" ON public.customer_advances
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete customer_advances" ON public.customer_advances
  FOR DELETE TO authenticated USING (true);

-- Advance Allocations policies
CREATE POLICY "Allow authenticated read advance_allocations" ON public.advance_allocations
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert advance_allocations" ON public.advance_allocations
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated delete advance_allocations" ON public.advance_allocations
  FOR DELETE TO authenticated USING (true);

-- Bad Debt Provisions policies
CREATE POLICY "Allow authenticated read bad_debt_provisions" ON public.bad_debt_provisions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert bad_debt_provisions" ON public.bad_debt_provisions
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update bad_debt_provisions" ON public.bad_debt_provisions
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete bad_debt_provisions" ON public.bad_debt_provisions
  FOR DELETE TO authenticated USING (true);