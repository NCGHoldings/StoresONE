-- Enhance credit_notes table with amount_applied and currency tracking
ALTER TABLE public.credit_notes
ADD COLUMN IF NOT EXISTS amount_applied NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';

-- Create credit_note_applications table to track partial applications
CREATE TABLE IF NOT EXISTS public.credit_note_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  credit_note_id UUID NOT NULL REFERENCES public.credit_notes(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.customer_invoices(id) ON DELETE RESTRICT,
  amount NUMERIC(15,2) NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  applied_by UUID REFERENCES public.profiles(id),
  notes TEXT
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_credit_note_applications_credit_note_id 
ON public.credit_note_applications(credit_note_id);

CREATE INDEX IF NOT EXISTS idx_credit_note_applications_invoice_id 
ON public.credit_note_applications(invoice_id);

-- Enable RLS on credit_note_applications
ALTER TABLE public.credit_note_applications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for credit_note_applications
CREATE POLICY "Enable read access for authenticated users" 
ON public.credit_note_applications 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable insert for authenticated users" 
ON public.credit_note_applications 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" 
ON public.credit_note_applications 
FOR UPDATE 
TO authenticated 
USING (true);

-- Add indexes to debit_note_applications for better performance
CREATE INDEX IF NOT EXISTS idx_debit_note_applications_debit_note_id 
ON public.debit_note_applications(debit_note_id);

CREATE INDEX IF NOT EXISTS idx_debit_note_applications_invoice_id 
ON public.debit_note_applications(invoice_id);