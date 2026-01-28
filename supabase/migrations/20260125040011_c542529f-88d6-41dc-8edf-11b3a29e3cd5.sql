-- =============================================
-- AP MODULE TABLES MIGRATION
-- =============================================

-- 1. vendor_payments table - Track payments made to vendors
CREATE TABLE public.vendor_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number TEXT NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  payment_date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('check', 'wire_transfer', 'ach', 'credit_card', 'cash')),
  bank_account TEXT,
  reference_number TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. payment_allocations table - Link payments to multiple invoices
CREATE TABLE public.payment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.vendor_payments(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id),
  amount NUMERIC(12,2) NOT NULL,
  allocated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. debit_notes table - Return credits and adjustments from vendors
CREATE TABLE public.debit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debit_note_number TEXT NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  invoice_id UUID REFERENCES public.invoices(id),
  grn_id UUID REFERENCES public.inbound_deliveries(id),
  debit_date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  reason TEXT CHECK (reason IN ('return', 'price_adjustment', 'quality_issue', 'shortage', 'other')),
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'applied', 'cancelled')),
  applied_to_invoice_id UUID REFERENCES public.invoices(id),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. vendor_advances table - Prepayments to vendors
CREATE TABLE public.vendor_advances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advance_number TEXT NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  payment_id UUID REFERENCES public.vendor_payments(id),
  advance_date DATE NOT NULL,
  original_amount NUMERIC(12,2) NOT NULL,
  remaining_amount NUMERIC(12,2) NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'partially_applied', 'fully_applied')),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. vendor_advance_allocations table - Link vendor advances to invoices
CREATE TABLE public.vendor_advance_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advance_id UUID NOT NULL REFERENCES public.vendor_advances(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id),
  amount NUMERIC(12,2) NOT NULL,
  allocated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. wht_certificates table - Withholding Tax tracking
CREATE TABLE public.wht_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_number TEXT NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  payment_id UUID REFERENCES public.vendor_payments(id),
  certificate_date DATE NOT NULL,
  gross_amount NUMERIC(12,2) NOT NULL,
  wht_rate NUMERIC(5,2) NOT NULL,
  wht_amount NUMERIC(12,2) NOT NULL,
  tax_type TEXT,
  filing_status TEXT DEFAULT 'pending' CHECK (filing_status IN ('pending', 'submitted', 'accepted', 'rejected')),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_vendor_payments_supplier ON public.vendor_payments(supplier_id);
CREATE INDEX idx_vendor_payments_status ON public.vendor_payments(status);
CREATE INDEX idx_vendor_payments_date ON public.vendor_payments(payment_date);

CREATE INDEX idx_payment_allocations_payment ON public.payment_allocations(payment_id);
CREATE INDEX idx_payment_allocations_invoice ON public.payment_allocations(invoice_id);

CREATE INDEX idx_debit_notes_supplier ON public.debit_notes(supplier_id);
CREATE INDEX idx_debit_notes_status ON public.debit_notes(status);

CREATE INDEX idx_vendor_advances_supplier ON public.vendor_advances(supplier_id);
CREATE INDEX idx_vendor_advances_status ON public.vendor_advances(status);

CREATE INDEX idx_vendor_advance_allocations_advance ON public.vendor_advance_allocations(advance_id);
CREATE INDEX idx_vendor_advance_allocations_invoice ON public.vendor_advance_allocations(invoice_id);

CREATE INDEX idx_wht_certificates_supplier ON public.wht_certificates(supplier_id);
CREATE INDEX idx_wht_certificates_payment ON public.wht_certificates(payment_id);

-- =============================================
-- TRIGGERS FOR updated_at
-- =============================================

CREATE TRIGGER update_vendor_payments_updated_at
  BEFORE UPDATE ON public.vendor_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.vendor_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_advance_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wht_certificates ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - vendor_payments
-- =============================================

CREATE POLICY "Users can view vendor payments"
  ON public.vendor_payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create vendor payments"
  ON public.vendor_payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update vendor payments"
  ON public.vendor_payments FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete vendor payments"
  ON public.vendor_payments FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- RLS POLICIES - payment_allocations
-- =============================================

CREATE POLICY "Users can view payment allocations"
  ON public.payment_allocations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create payment allocations"
  ON public.payment_allocations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update payment allocations"
  ON public.payment_allocations FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete payment allocations"
  ON public.payment_allocations FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- RLS POLICIES - debit_notes
-- =============================================

CREATE POLICY "Users can view debit notes"
  ON public.debit_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create debit notes"
  ON public.debit_notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update debit notes"
  ON public.debit_notes FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete debit notes"
  ON public.debit_notes FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- RLS POLICIES - vendor_advances
-- =============================================

CREATE POLICY "Users can view vendor advances"
  ON public.vendor_advances FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create vendor advances"
  ON public.vendor_advances FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update vendor advances"
  ON public.vendor_advances FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete vendor advances"
  ON public.vendor_advances FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- RLS POLICIES - vendor_advance_allocations
-- =============================================

CREATE POLICY "Users can view vendor advance allocations"
  ON public.vendor_advance_allocations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create vendor advance allocations"
  ON public.vendor_advance_allocations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update vendor advance allocations"
  ON public.vendor_advance_allocations FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete vendor advance allocations"
  ON public.vendor_advance_allocations FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- RLS POLICIES - wht_certificates
-- =============================================

CREATE POLICY "Users can view WHT certificates"
  ON public.wht_certificates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create WHT certificates"
  ON public.wht_certificates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update WHT certificates"
  ON public.wht_certificates FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete WHT certificates"
  ON public.wht_certificates FOR DELETE
  TO authenticated
  USING (true);