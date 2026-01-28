-- ============================================
-- Customer PO to Sales Order Fulfillment System
-- ============================================

-- Customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  billing_address TEXT,
  shipping_address TEXT,
  tax_id TEXT,
  payment_terms INTEGER DEFAULT 30,
  credit_limit NUMERIC(15,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'inactive', 'on_hold')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Customer POs table
CREATE TABLE public.customer_pos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpo_number TEXT NOT NULL,
  internal_ref TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  required_date DATE,
  total_amount NUMERIC(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'received' 
    CHECK (status IN ('received', 'reviewed', 'converted', 'rejected', 'fulfilled', 'on_hold')),
  shipping_address TEXT,
  notes TEXT,
  received_by UUID REFERENCES public.profiles(id),
  received_at TIMESTAMPTZ DEFAULT now(),
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Customer PO Lines table
CREATE TABLE public.customer_po_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpo_id UUID NOT NULL REFERENCES public.customer_pos(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL DEFAULT 1,
  product_id UUID REFERENCES public.products(id),
  customer_sku TEXT,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(15,2) DEFAULT 0,
  total_price NUMERIC(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sales Orders table
CREATE TABLE public.sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  so_number TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  customer_po_id UUID REFERENCES public.customer_pos(id),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  required_date DATE,
  ship_date DATE,
  total_amount NUMERIC(15,2) DEFAULT 0,
  tax_amount NUMERIC(15,2) DEFAULT 0,
  shipping_cost NUMERIC(15,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft', 'confirmed', 'picking', 'shipping', 'shipped', 'delivered', 'cancelled')),
  shipping_address TEXT,
  billing_address TEXT,
  payment_terms INTEGER,
  priority TEXT DEFAULT 'normal' 
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sales Order Lines table
CREATE TABLE public.sales_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  so_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  cpo_line_id UUID REFERENCES public.customer_po_lines(id),
  line_number INTEGER NOT NULL DEFAULT 1,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity_ordered INTEGER NOT NULL DEFAULT 1,
  quantity_reserved INTEGER DEFAULT 0,
  quantity_picked INTEGER DEFAULT 0,
  quantity_shipped INTEGER DEFAULT 0,
  unit_price NUMERIC(15,2) DEFAULT 0,
  total_price NUMERIC(15,2) DEFAULT 0,
  bin_id UUID REFERENCES public.storage_bins(id),
  status TEXT DEFAULT 'pending' 
    CHECK (status IN ('pending', 'reserved', 'picking', 'picked', 'shipped')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_customers_code ON public.customers(customer_code);
CREATE INDEX idx_customers_status ON public.customers(status);
CREATE INDEX idx_customer_pos_customer ON public.customer_pos(customer_id);
CREATE INDEX idx_customer_pos_status ON public.customer_pos(status);
CREATE INDEX idx_sales_orders_customer ON public.sales_orders(customer_id);
CREATE INDEX idx_sales_orders_status ON public.sales_orders(status);
CREATE INDEX idx_sales_order_lines_so ON public.sales_order_lines(so_id);
CREATE INDEX idx_sales_order_lines_product ON public.sales_order_lines(product_id);

-- RLS Policies
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_pos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_po_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_order_lines ENABLE ROW LEVEL SECURITY;

-- Select policies
CREATE POLICY "Users can view customers" ON public.customers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view customer_pos" ON public.customer_pos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view customer_po_lines" ON public.customer_po_lines FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view sales_orders" ON public.sales_orders FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view sales_order_lines" ON public.sales_order_lines FOR SELECT USING (auth.uid() IS NOT NULL);

-- Insert policies
CREATE POLICY "Authenticated can insert customers" ON public.customers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can insert customer_pos" ON public.customer_pos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can insert customer_po_lines" ON public.customer_po_lines FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can insert sales_orders" ON public.sales_orders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can insert sales_order_lines" ON public.sales_order_lines FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Update policies
CREATE POLICY "Authenticated can update customers" ON public.customers FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update customer_pos" ON public.customer_pos FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update customer_po_lines" ON public.customer_po_lines FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update sales_orders" ON public.sales_orders FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update sales_order_lines" ON public.sales_order_lines FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Delete policies for line items (cascading)
CREATE POLICY "Authenticated can delete customer_po_lines" ON public.customer_po_lines FOR DELETE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can delete sales_order_lines" ON public.sales_order_lines FOR DELETE USING (auth.uid() IS NOT NULL);

-- Triggers for updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_pos_updated_at BEFORE UPDATE ON public.customer_pos 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_orders_updated_at BEFORE UPDATE ON public.sales_orders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_order_lines_updated_at BEFORE UPDATE ON public.sales_order_lines 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();