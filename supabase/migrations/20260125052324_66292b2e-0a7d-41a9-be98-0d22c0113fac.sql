-- Create POS Sales Log table
CREATE TABLE public.pos_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pos_terminal_id TEXT NOT NULL,
  pos_transaction_id TEXT NOT NULL UNIQUE,
  transaction_datetime TIMESTAMPTZ NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  invoice_id UUID REFERENCES public.customer_invoices(id),
  receipt_id UUID REFERENCES public.customer_receipts(id),
  subtotal NUMERIC(14,2) NOT NULL,
  tax_amount NUMERIC(14,2) NOT NULL,
  total_amount NUMERIC(14,2) NOT NULL,
  amount_paid NUMERIC(14,2) NOT NULL,
  change_given NUMERIC(14,2) DEFAULT 0,
  payment_method TEXT,
  bank_account_id UUID REFERENCES public.bank_accounts(id),
  status TEXT DEFAULT 'completed',
  error_message TEXT,
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create POS Sale Items table
CREATE TABLE public.pos_sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pos_sale_id UUID NOT NULL REFERENCES public.pos_sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  sku TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  discount NUMERIC(12,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL,
  line_total NUMERIC(14,2) NOT NULL,
  cost_at_sale NUMERIC(12,2),
  batches_used JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.pos_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_sale_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pos_sales - Allow authenticated users to read
CREATE POLICY "Authenticated users can view POS sales"
  ON public.pos_sales FOR SELECT
  USING (auth.role() = 'authenticated');

-- RLS Policy for insert - service role only (edge function uses service role)
CREATE POLICY "Service role can insert POS sales"
  ON public.pos_sales FOR INSERT
  WITH CHECK (true);

-- RLS Policy for update - service role only
CREATE POLICY "Service role can update POS sales"
  ON public.pos_sales FOR UPDATE
  USING (true);

-- RLS Policies for pos_sale_items
CREATE POLICY "Authenticated users can view POS sale items"
  ON public.pos_sale_items FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can insert POS sale items"
  ON public.pos_sale_items FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_pos_sales_transaction_id ON public.pos_sales(pos_transaction_id);
CREATE INDEX idx_pos_sales_terminal_id ON public.pos_sales(pos_terminal_id);
CREATE INDEX idx_pos_sales_customer_id ON public.pos_sales(customer_id);
CREATE INDEX idx_pos_sales_created_at ON public.pos_sales(created_at DESC);
CREATE INDEX idx_pos_sale_items_pos_sale_id ON public.pos_sale_items(pos_sale_id);
CREATE INDEX idx_pos_sale_items_product_id ON public.pos_sale_items(product_id);

-- Add POS config entries to system_config
INSERT INTO public.system_config (key, value, category, description)
VALUES 
  ('pos_price_tolerance', '10', 'pos', 'Price mismatch tolerance percentage for POS sales'),
  ('pos_require_stock', 'true', 'pos', 'Reject POS sales if insufficient stock'),
  ('walk_in_customer_code', '"WALK-IN"', 'pos', 'Customer code for walk-in POS sales')
ON CONFLICT (key) DO NOTHING;