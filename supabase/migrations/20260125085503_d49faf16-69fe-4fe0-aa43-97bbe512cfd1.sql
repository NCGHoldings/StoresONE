-- Add columns to invoices table for partial payment tracking and scheduling
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS amount_paid numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS scheduled_payment_date date,
ADD COLUMN IF NOT EXISTS scheduled_payment_amount numeric;

-- Add amount_applied column to debit_notes to track partial applications
ALTER TABLE public.debit_notes 
ADD COLUMN IF NOT EXISTS amount_applied numeric DEFAULT 0;

-- Create scheduled_payments table for managing future payments
CREATE TABLE IF NOT EXISTS public.scheduled_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_number text NOT NULL UNIQUE,
  supplier_id uuid REFERENCES public.suppliers(id),
  scheduled_date date NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processed', 'cancelled')),
  payment_method text,
  bank_account_id uuid REFERENCES public.bank_accounts(id),
  notes text,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamp with time zone,
  processed_at timestamp with time zone,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create scheduled_payment_items to link scheduled payments to invoices
CREATE TABLE IF NOT EXISTS public.scheduled_payment_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scheduled_payment_id uuid NOT NULL REFERENCES public.scheduled_payments(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id),
  amount numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Create debit_note_applications table for tracking partial debit note applications
CREATE TABLE IF NOT EXISTS public.debit_note_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  debit_note_id uuid NOT NULL REFERENCES public.debit_notes(id),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id),
  amount numeric NOT NULL,
  applied_at timestamp with time zone DEFAULT now(),
  applied_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on new tables
ALTER TABLE public.scheduled_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_payment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debit_note_applications ENABLE ROW LEVEL SECURITY;

-- Create policies for scheduled_payments
CREATE POLICY "Authenticated users can view scheduled payments"
  ON public.scheduled_payments FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can create scheduled payments"
  ON public.scheduled_payments FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update scheduled payments"
  ON public.scheduled_payments FOR UPDATE
  TO authenticated USING (true);

-- Create policies for scheduled_payment_items
CREATE POLICY "Authenticated users can view scheduled payment items"
  ON public.scheduled_payment_items FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can create scheduled payment items"
  ON public.scheduled_payment_items FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can delete scheduled payment items"
  ON public.scheduled_payment_items FOR DELETE
  TO authenticated USING (true);

-- Create policies for debit_note_applications
CREATE POLICY "Authenticated users can view debit note applications"
  ON public.debit_note_applications FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can create debit note applications"
  ON public.debit_note_applications FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can delete debit note applications"
  ON public.debit_note_applications FOR DELETE
  TO authenticated USING (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_supplier ON public.scheduled_payments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_date ON public.scheduled_payments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_payment_items_payment ON public.scheduled_payment_items(scheduled_payment_id);
CREATE INDEX IF NOT EXISTS idx_debit_note_applications_note ON public.debit_note_applications(debit_note_id);
CREATE INDEX IF NOT EXISTS idx_debit_note_applications_invoice ON public.debit_note_applications(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_supplier ON public.invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_invoices_scheduled_date ON public.invoices(scheduled_payment_date);