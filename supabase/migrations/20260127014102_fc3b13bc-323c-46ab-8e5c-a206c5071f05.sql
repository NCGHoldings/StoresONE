-- Add notes column to sales_returns for POS integration idempotency
ALTER TABLE public.sales_returns ADD COLUMN IF NOT EXISTS notes TEXT;