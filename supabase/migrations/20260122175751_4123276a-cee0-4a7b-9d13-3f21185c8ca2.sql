-- =====================================================
-- SAP-STYLE PROCUREMENT MODULE - DATABASE SCHEMA
-- =====================================================

-- Create new enums
CREATE TYPE pr_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'converted', 'closed');
CREATE TYPE rfq_status AS ENUM ('draft', 'published', 'responses_received', 'under_evaluation', 'awarded', 'closed', 'cancelled');
CREATE TYPE rfq_response_status AS ENUM ('draft', 'submitted', 'under_review', 'awarded', 'rejected');
CREATE TYPE blanket_order_status AS ENUM ('draft', 'active', 'suspended', 'expired', 'closed');
CREATE TYPE amendment_status AS ENUM ('pending', 'approved', 'rejected', 'applied');
CREATE TYPE demand_type AS ENUM ('forecast', 'sales_order', 'production', 'manual', 'safety_stock');

-- =====================================================
-- 1. PURCHASE REQUISITIONS
-- =====================================================
CREATE TABLE public.purchase_requisitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pr_number TEXT NOT NULL UNIQUE,
  requestor_id UUID REFERENCES public.profiles(id),
  department TEXT,
  urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'critical')),
  status pr_status DEFAULT 'draft',
  total_estimated_value NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  required_date DATE,
  justification TEXT,
  cost_center_id UUID REFERENCES public.cost_centers(id),
  approved_by UUID REFERENCES public.profiles(id),
  approved_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.purchase_requisition_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pr_id UUID NOT NULL REFERENCES public.purchase_requisitions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_of_measure TEXT DEFAULT 'EA',
  estimated_price NUMERIC DEFAULT 0,
  total_price NUMERIC DEFAULT 0,
  delivery_date_required DATE,
  specifications TEXT,
  suggested_supplier_id UUID REFERENCES public.suppliers(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- 2. RFQ/RFP MANAGEMENT
-- =====================================================
CREATE TABLE public.rfq_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rfq_number TEXT NOT NULL UNIQUE,
  pr_id UUID REFERENCES public.purchase_requisitions(id),
  title TEXT NOT NULL,
  description TEXT,
  rfq_type TEXT DEFAULT 'rfq' CHECK (rfq_type IN ('rfq', 'rfp', 'rfi')),
  status rfq_status DEFAULT 'draft',
  publish_date TIMESTAMP WITH TIME ZONE,
  response_deadline TIMESTAMP WITH TIME ZONE,
  evaluation_criteria JSONB DEFAULT '[]'::jsonb,
  terms_conditions TEXT,
  currency TEXT DEFAULT 'USD',
  created_by UUID REFERENCES public.profiles(id),
  awarded_to UUID REFERENCES public.suppliers(id),
  awarded_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.rfq_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rfq_id UUID NOT NULL REFERENCES public.rfq_requests(id) ON DELETE CASCADE,
  pr_line_id UUID REFERENCES public.purchase_requisition_lines(id),
  product_id UUID REFERENCES public.products(id),
  product_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_of_measure TEXT DEFAULT 'EA',
  specifications TEXT,
  target_price NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.rfq_invited_suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rfq_id UUID NOT NULL REFERENCES public.rfq_requests(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  invited_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  responded BOOLEAN DEFAULT false,
  UNIQUE(rfq_id, supplier_id)
);

CREATE TABLE public.rfq_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rfq_id UUID NOT NULL REFERENCES public.rfq_requests(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  status rfq_response_status DEFAULT 'draft',
  total_bid_amount NUMERIC DEFAULT 0,
  delivery_days INTEGER,
  valid_until DATE,
  payment_terms TEXT,
  technical_score NUMERIC,
  commercial_score NUMERIC,
  overall_score NUMERIC,
  notes TEXT,
  submitted_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(rfq_id, supplier_id)
);

CREATE TABLE public.rfq_response_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  response_id UUID NOT NULL REFERENCES public.rfq_responses(id) ON DELETE CASCADE,
  rfq_line_id UUID NOT NULL REFERENCES public.rfq_lines(id),
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC DEFAULT 0,
  lead_time_days INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- 3. BLANKET/CONTRACT ORDERS
-- =====================================================
CREATE TABLE public.blanket_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bo_number TEXT NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  contract_id UUID REFERENCES public.contracts(id),
  status blanket_order_status DEFAULT 'draft',
  total_value NUMERIC DEFAULT 0,
  consumed_value NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  payment_terms TEXT,
  delivery_terms TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  approved_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.blanket_order_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bo_id UUID NOT NULL REFERENCES public.blanket_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT,
  agreed_price NUMERIC NOT NULL DEFAULT 0,
  max_quantity INTEGER,
  released_quantity INTEGER DEFAULT 0,
  unit_of_measure TEXT DEFAULT 'EA',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- 4. PO AMENDMENTS (VERSIONING)
-- =====================================================
CREATE TABLE public.po_amendments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  amendment_reason TEXT NOT NULL,
  changed_fields TEXT[] DEFAULT '{}',
  old_values JSONB,
  new_values JSONB,
  status amendment_status DEFAULT 'pending',
  requested_by UUID REFERENCES public.profiles(id),
  requested_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- 5. MATERIAL DEMAND PLANNING
-- =====================================================
CREATE TABLE public.material_demands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id),
  demand_type demand_type NOT NULL,
  required_date DATE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  fulfilled_quantity INTEGER DEFAULT 0,
  source_type TEXT,
  source_id UUID,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'planned', 'fulfilled', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- 6. CATEGORY CATALOGS
-- =====================================================
CREATE TABLE public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.product_categories(id),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add category_id to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.product_categories(id);

-- =====================================================
-- 7. PRICE LISTS
-- =====================================================
CREATE TABLE public.price_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  name TEXT NOT NULL,
  description TEXT,
  currency TEXT DEFAULT 'USD',
  valid_from DATE NOT NULL,
  valid_to DATE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.price_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  price_list_id UUID NOT NULL REFERENCES public.price_lists(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  min_quantity INTEGER DEFAULT 1,
  max_quantity INTEGER,
  lead_time_days INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- MODIFY EXISTING TABLES FOR INTEGRATION
-- =====================================================

-- Add linking columns to purchase_orders
ALTER TABLE public.purchase_orders 
  ADD COLUMN IF NOT EXISTS pr_id UUID REFERENCES public.purchase_requisitions(id),
  ADD COLUMN IF NOT EXISTS blanket_order_id UUID REFERENCES public.blanket_orders(id),
  ADD COLUMN IF NOT EXISTS rfq_response_id UUID REFERENCES public.rfq_responses(id),
  ADD COLUMN IF NOT EXISTS amendment_version INTEGER DEFAULT 1;

-- Add linking columns to purchase_order_lines
ALTER TABLE public.purchase_order_lines
  ADD COLUMN IF NOT EXISTS blanket_line_id UUID REFERENCES public.blanket_order_lines(id),
  ADD COLUMN IF NOT EXISTS pr_line_id UUID REFERENCES public.purchase_requisition_lines(id);

-- Add goods_receipt_id to invoices for 3-way match
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS goods_receipt_id UUID REFERENCES public.inbound_deliveries(id);

-- =====================================================
-- ENABLE RLS ON ALL NEW TABLES
-- =====================================================

ALTER TABLE public.purchase_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requisition_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_invited_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_response_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blanket_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blanket_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.po_amendments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_demands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_list_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - PURCHASE REQUISITIONS
-- =====================================================
CREATE POLICY "Authenticated users can view purchase requisitions"
  ON public.purchase_requisitions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage purchase requisitions"
  ON public.purchase_requisitions FOR ALL USING (true);

CREATE POLICY "Authenticated users can view pr lines"
  ON public.purchase_requisition_lines FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage pr lines"
  ON public.purchase_requisition_lines FOR ALL USING (true);

-- =====================================================
-- RLS POLICIES - RFQ
-- =====================================================
CREATE POLICY "Authenticated users can view rfq requests"
  ON public.rfq_requests FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage rfq requests"
  ON public.rfq_requests FOR ALL USING (true);

CREATE POLICY "Authenticated users can view rfq lines"
  ON public.rfq_lines FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage rfq lines"
  ON public.rfq_lines FOR ALL USING (true);

CREATE POLICY "Authenticated users can view rfq invited suppliers"
  ON public.rfq_invited_suppliers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage rfq invited suppliers"
  ON public.rfq_invited_suppliers FOR ALL USING (true);

CREATE POLICY "Authenticated users can view rfq responses"
  ON public.rfq_responses FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage rfq responses"
  ON public.rfq_responses FOR ALL USING (true);

CREATE POLICY "Authenticated users can view rfq response lines"
  ON public.rfq_response_lines FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage rfq response lines"
  ON public.rfq_response_lines FOR ALL USING (true);

-- =====================================================
-- RLS POLICIES - BLANKET ORDERS
-- =====================================================
CREATE POLICY "Authenticated users can view blanket orders"
  ON public.blanket_orders FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage blanket orders"
  ON public.blanket_orders FOR ALL USING (true);

CREATE POLICY "Authenticated users can view blanket order lines"
  ON public.blanket_order_lines FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage blanket order lines"
  ON public.blanket_order_lines FOR ALL USING (true);

-- =====================================================
-- RLS POLICIES - PO AMENDMENTS
-- =====================================================
CREATE POLICY "Authenticated users can view po amendments"
  ON public.po_amendments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage po amendments"
  ON public.po_amendments FOR ALL USING (true);

-- =====================================================
-- RLS POLICIES - MATERIAL DEMANDS
-- =====================================================
CREATE POLICY "Authenticated users can view material demands"
  ON public.material_demands FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage material demands"
  ON public.material_demands FOR ALL USING (true);

-- =====================================================
-- RLS POLICIES - PRODUCT CATEGORIES
-- =====================================================
CREATE POLICY "Authenticated users can view product categories"
  ON public.product_categories FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage product categories"
  ON public.product_categories FOR ALL USING (true);

-- =====================================================
-- RLS POLICIES - PRICE LISTS
-- =====================================================
CREATE POLICY "Authenticated users can view price lists"
  ON public.price_lists FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage price lists"
  ON public.price_lists FOR ALL USING (true);

CREATE POLICY "Authenticated users can view price list items"
  ON public.price_list_items FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage price list items"
  ON public.price_list_items FOR ALL USING (true);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_pr_status ON public.purchase_requisitions(status);
CREATE INDEX idx_pr_requestor ON public.purchase_requisitions(requestor_id);
CREATE INDEX idx_pr_lines_pr_id ON public.purchase_requisition_lines(pr_id);

CREATE INDEX idx_rfq_status ON public.rfq_requests(status);
CREATE INDEX idx_rfq_lines_rfq_id ON public.rfq_lines(rfq_id);
CREATE INDEX idx_rfq_responses_rfq_id ON public.rfq_responses(rfq_id);
CREATE INDEX idx_rfq_responses_supplier ON public.rfq_responses(supplier_id);

CREATE INDEX idx_bo_supplier ON public.blanket_orders(supplier_id);
CREATE INDEX idx_bo_status ON public.blanket_orders(status);
CREATE INDEX idx_bo_lines_bo_id ON public.blanket_order_lines(bo_id);

CREATE INDEX idx_amendments_po_id ON public.po_amendments(po_id);
CREATE INDEX idx_demands_product ON public.material_demands(product_id);
CREATE INDEX idx_demands_date ON public.material_demands(required_date);

CREATE INDEX idx_categories_parent ON public.product_categories(parent_id);
CREATE INDEX idx_price_lists_supplier ON public.price_lists(supplier_id);
CREATE INDEX idx_price_list_items_list ON public.price_list_items(price_list_id);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE TRIGGER update_purchase_requisitions_updated_at
  BEFORE UPDATE ON public.purchase_requisitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rfq_requests_updated_at
  BEFORE UPDATE ON public.rfq_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rfq_responses_updated_at
  BEFORE UPDATE ON public.rfq_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blanket_orders_updated_at
  BEFORE UPDATE ON public.blanket_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_material_demands_updated_at
  BEFORE UPDATE ON public.material_demands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_categories_updated_at
  BEFORE UPDATE ON public.product_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_price_lists_updated_at
  BEFORE UPDATE ON public.price_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();