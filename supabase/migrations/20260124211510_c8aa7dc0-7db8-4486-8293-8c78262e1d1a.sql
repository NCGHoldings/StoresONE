-- Create sales_returns table
CREATE TABLE public.sales_returns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  return_number TEXT NOT NULL UNIQUE,
  sales_order_id UUID REFERENCES public.sales_orders(id),
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'inspected', 'completed', 'rejected')),
  return_reason TEXT NOT NULL CHECK (return_reason IN ('defective', 'wrong_item', 'damaged', 'customer_request', 'other')),
  reason_notes TEXT,
  return_date DATE NOT NULL DEFAULT CURRENT_DATE,
  received_date DATE,
  completed_date DATE,
  total_amount NUMERIC(12, 2) DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create sales_return_lines table
CREATE TABLE public.sales_return_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  return_id UUID NOT NULL REFERENCES public.sales_returns(id) ON DELETE CASCADE,
  so_line_id UUID REFERENCES public.sales_order_lines(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity_returned INTEGER NOT NULL DEFAULT 0,
  quantity_received INTEGER DEFAULT 0,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_price NUMERIC(12, 2) GENERATED ALWAYS AS (quantity_returned * unit_price) STORED,
  bin_id UUID REFERENCES public.storage_bins(id),
  batch_id UUID REFERENCES public.inventory_batches(id),
  disposition TEXT CHECK (disposition IN ('restock', 'scrap', 'rework')),
  inspection_notes TEXT,
  line_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_return_lines ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sales_returns
CREATE POLICY "Users can view sales returns" ON public.sales_returns
  FOR SELECT USING (true);

CREATE POLICY "Users can create sales returns" ON public.sales_returns
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update sales returns" ON public.sales_returns
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete sales returns" ON public.sales_returns
  FOR DELETE USING (true);

-- RLS Policies for sales_return_lines
CREATE POLICY "Users can view sales return lines" ON public.sales_return_lines
  FOR SELECT USING (true);

CREATE POLICY "Users can create sales return lines" ON public.sales_return_lines
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update sales return lines" ON public.sales_return_lines
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete sales return lines" ON public.sales_return_lines
  FOR DELETE USING (true);

-- Create updated_at trigger for sales_returns
CREATE TRIGGER update_sales_returns_updated_at
  BEFORE UPDATE ON public.sales_returns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_sales_returns_customer ON public.sales_returns(customer_id);
CREATE INDEX idx_sales_returns_sales_order ON public.sales_returns(sales_order_id);
CREATE INDEX idx_sales_returns_status ON public.sales_returns(status);
CREATE INDEX idx_sales_return_lines_return ON public.sales_return_lines(return_id);
CREATE INDEX idx_sales_return_lines_product ON public.sales_return_lines(product_id);