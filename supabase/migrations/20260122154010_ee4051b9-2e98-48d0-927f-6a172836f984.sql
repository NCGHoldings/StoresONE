-- Create enum types for the system
CREATE TYPE public.supplier_status AS ENUM ('active', 'inactive', 'pending', 'blacklisted');
CREATE TYPE public.registration_status AS ENUM ('pending', 'under_review', 'approved', 'rejected');
CREATE TYPE public.risk_flag_type AS ENUM ('warning', 'critical', 'blacklisted');
CREATE TYPE public.contract_status AS ENUM ('draft', 'active', 'expired', 'terminated', 'renewed');
CREATE TYPE public.delivery_status AS ENUM ('scheduled', 'in_transit', 'arrived', 'receiving', 'completed', 'cancelled');
CREATE TYPE public.shipment_status AS ENUM ('pending', 'picking', 'packing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE public.transfer_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.bin_status AS ENUM ('available', 'occupied', 'reserved', 'blocked');
CREATE TYPE public.transaction_type AS ENUM ('receipt', 'issue', 'transfer_in', 'transfer_out', 'adjustment', 'count');
CREATE TYPE public.scorecard_trend AS ENUM ('improving', 'stable', 'declining');
CREATE TYPE public.app_role AS ENUM ('admin', 'warehouse_manager', 'procurement', 'finance', 'viewer');

-- =====================================================
-- MASTER DATA TABLES
-- =====================================================

-- Suppliers Master Table
CREATE TABLE public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_code TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    tax_id TEXT,
    payment_terms INTEGER DEFAULT 30,
    registration_date DATE DEFAULT CURRENT_DATE,
    status public.supplier_status DEFAULT 'pending',
    category TEXT,
    industry TEXT,
    website TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Products/Materials Table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    unit_of_measure TEXT DEFAULT 'EA',
    weight DECIMAL(10,3),
    length DECIMAL(10,2),
    width DECIMAL(10,2),
    height DECIMAL(10,2),
    min_stock_level INTEGER DEFAULT 0,
    max_stock_level INTEGER,
    reorder_point INTEGER,
    lead_time_days INTEGER DEFAULT 7,
    unit_cost DECIMAL(12,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Storage Zones Table
CREATE TABLE public.storage_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    warehouse_id TEXT DEFAULT 'WH001',
    zone_type TEXT,
    temperature_controlled BOOLEAN DEFAULT false,
    min_temperature DECIMAL(5,2),
    max_temperature DECIMAL(5,2),
    max_capacity INTEGER,
    current_utilization INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Storage Bins Table
CREATE TABLE public.storage_bins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bin_code TEXT UNIQUE NOT NULL,
    zone_id UUID REFERENCES public.storage_zones(id) ON DELETE SET NULL,
    row_number TEXT,
    column_number TEXT,
    level_number TEXT,
    capacity INTEGER DEFAULT 100,
    current_quantity INTEGER DEFAULT 0,
    status public.bin_status DEFAULT 'available',
    bin_type TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- SUPPLIER MANAGEMENT TABLES
-- =====================================================

-- Supplier Registrations Table
CREATE TABLE public.supplier_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
    submitted_date TIMESTAMPTZ DEFAULT now(),
    reviewed_by UUID,
    reviewed_date TIMESTAMPTZ,
    status public.registration_status DEFAULT 'pending',
    documents_url TEXT[],
    compliance_verified BOOLEAN DEFAULT false,
    business_license_verified BOOLEAN DEFAULT false,
    insurance_verified BOOLEAN DEFAULT false,
    notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Supplier Evaluations Table
CREATE TABLE public.supplier_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
    evaluation_date DATE DEFAULT CURRENT_DATE,
    evaluator_id UUID,
    quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
    delivery_score INTEGER CHECK (delivery_score >= 0 AND delivery_score <= 100),
    price_score INTEGER CHECK (price_score >= 0 AND price_score <= 100),
    service_score INTEGER CHECK (service_score >= 0 AND service_score <= 100),
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    comments TEXT,
    evaluation_period TEXT,
    strengths TEXT[],
    weaknesses TEXT[],
    recommendations TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Supplier Scorecards Table
CREATE TABLE public.supplier_scorecards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    on_time_delivery_rate DECIMAL(5,2),
    defect_rate DECIMAL(5,2),
    response_time_avg DECIMAL(5,2),
    compliance_score INTEGER,
    total_orders INTEGER DEFAULT 0,
    total_value DECIMAL(15,2) DEFAULT 0,
    ranking INTEGER,
    trend public.scorecard_trend DEFAULT 'stable',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Risk Flags / Blacklist Table
CREATE TABLE public.risk_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
    flag_type public.risk_flag_type NOT NULL,
    reason TEXT NOT NULL,
    flagged_by UUID,
    flagged_date TIMESTAMPTZ DEFAULT now(),
    resolution_date TIMESTAMPTZ,
    resolution_notes TEXT,
    is_active BOOLEAN DEFAULT true,
    evidence_urls TEXT[],
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Contracts Repository Table
CREATE TABLE public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_number TEXT UNIQUE NOT NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    value DECIMAL(15,2),
    currency TEXT DEFAULT 'USD',
    terms_conditions TEXT,
    status public.contract_status DEFAULT 'draft',
    document_url TEXT,
    auto_renewal BOOLEAN DEFAULT false,
    notice_period_days INTEGER DEFAULT 30,
    signed_date DATE,
    signed_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- WAREHOUSE OPERATIONS TABLES
-- =====================================================

-- Purchase Orders Table
CREATE TABLE public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number TEXT UNIQUE NOT NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    order_date DATE DEFAULT CURRENT_DATE,
    expected_delivery DATE,
    status TEXT DEFAULT 'draft',
    total_amount DECIMAL(15,2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    notes TEXT,
    created_by UUID,
    approved_by UUID,
    approved_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Purchase Order Lines Table
CREATE TABLE public.purchase_order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2),
    received_quantity INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Inbound Deliveries Table
CREATE TABLE public.inbound_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_number TEXT UNIQUE NOT NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    po_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
    expected_date DATE,
    actual_date DATE,
    status public.delivery_status DEFAULT 'scheduled',
    carrier TEXT,
    tracking_number TEXT,
    dock_door TEXT,
    total_items INTEGER DEFAULT 0,
    received_items INTEGER DEFAULT 0,
    discrepancy_notes TEXT,
    quality_check_passed BOOLEAN,
    received_by UUID,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Outbound Shipments Table
CREATE TABLE public.outbound_shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_number TEXT UNIQUE NOT NULL,
    customer_name TEXT,
    customer_address TEXT,
    sales_order_id TEXT,
    ship_date DATE,
    carrier TEXT,
    tracking_number TEXT,
    status public.shipment_status DEFAULT 'pending',
    total_items INTEGER DEFAULT 0,
    shipped_items INTEGER DEFAULT 0,
    weight DECIMAL(10,2),
    shipping_cost DECIMAL(10,2),
    priority TEXT DEFAULT 'normal',
    picked_by UUID,
    packed_by UUID,
    shipped_by UUID,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Stock Transfers Table
CREATE TABLE public.stock_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_number TEXT UNIQUE NOT NULL,
    from_bin_id UUID REFERENCES public.storage_bins(id) ON DELETE SET NULL,
    to_bin_id UUID REFERENCES public.storage_bins(id) ON DELETE SET NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    transfer_date DATE DEFAULT CURRENT_DATE,
    reason TEXT,
    status public.transfer_status DEFAULT 'pending',
    priority TEXT DEFAULT 'normal',
    created_by UUID,
    completed_by UUID,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Inventory Table (current stock levels)
CREATE TABLE public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    bin_id UUID REFERENCES public.storage_bins(id) ON DELETE SET NULL,
    quantity INTEGER DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    lot_number TEXT,
    expiry_date DATE,
    last_counted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(product_id, bin_id, lot_number)
);

-- Inventory Transactions Table
CREATE TABLE public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    bin_id UUID REFERENCES public.storage_bins(id) ON DELETE SET NULL,
    transaction_type public.transaction_type NOT NULL,
    quantity INTEGER NOT NULL,
    reference_type TEXT,
    reference_id UUID,
    transaction_date TIMESTAMPTZ DEFAULT now(),
    created_by UUID,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- USER MANAGEMENT TABLES
-- =====================================================

-- User Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    department TEXT,
    employee_id TEXT,
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- User Roles Table (separate as per security requirements)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- Audit Logs Table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_bins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbound_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbound_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECURITY DEFINER FUNCTION FOR ROLE CHECK
-- =====================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- =====================================================
-- RLS POLICIES - PUBLIC READ FOR AUTHENTICATED USERS
-- =====================================================

-- Suppliers policies
CREATE POLICY "Authenticated users can view suppliers" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert suppliers" ON public.suppliers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update suppliers" ON public.suppliers FOR UPDATE TO authenticated USING (true);

-- Products policies
CREATE POLICY "Authenticated users can view products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update products" ON public.products FOR UPDATE TO authenticated USING (true);

-- Storage zones policies
CREATE POLICY "Authenticated users can view storage zones" ON public.storage_zones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage storage zones" ON public.storage_zones FOR ALL TO authenticated USING (true);

-- Storage bins policies
CREATE POLICY "Authenticated users can view storage bins" ON public.storage_bins FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage storage bins" ON public.storage_bins FOR ALL TO authenticated USING (true);

-- Supplier registrations policies
CREATE POLICY "Authenticated users can view registrations" ON public.supplier_registrations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage registrations" ON public.supplier_registrations FOR ALL TO authenticated USING (true);

-- Supplier evaluations policies
CREATE POLICY "Authenticated users can view evaluations" ON public.supplier_evaluations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage evaluations" ON public.supplier_evaluations FOR ALL TO authenticated USING (true);

-- Supplier scorecards policies
CREATE POLICY "Authenticated users can view scorecards" ON public.supplier_scorecards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage scorecards" ON public.supplier_scorecards FOR ALL TO authenticated USING (true);

-- Risk flags policies
CREATE POLICY "Authenticated users can view risk flags" ON public.risk_flags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage risk flags" ON public.risk_flags FOR ALL TO authenticated USING (true);

-- Contracts policies
CREATE POLICY "Authenticated users can view contracts" ON public.contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage contracts" ON public.contracts FOR ALL TO authenticated USING (true);

-- Purchase orders policies
CREATE POLICY "Authenticated users can view purchase orders" ON public.purchase_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage purchase orders" ON public.purchase_orders FOR ALL TO authenticated USING (true);

-- Purchase order lines policies
CREATE POLICY "Authenticated users can view po lines" ON public.purchase_order_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage po lines" ON public.purchase_order_lines FOR ALL TO authenticated USING (true);

-- Inbound deliveries policies
CREATE POLICY "Authenticated users can view inbound deliveries" ON public.inbound_deliveries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage inbound deliveries" ON public.inbound_deliveries FOR ALL TO authenticated USING (true);

-- Outbound shipments policies
CREATE POLICY "Authenticated users can view outbound shipments" ON public.outbound_shipments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage outbound shipments" ON public.outbound_shipments FOR ALL TO authenticated USING (true);

-- Stock transfers policies
CREATE POLICY "Authenticated users can view stock transfers" ON public.stock_transfers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage stock transfers" ON public.stock_transfers FOR ALL TO authenticated USING (true);

-- Inventory policies
CREATE POLICY "Authenticated users can view inventory" ON public.inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage inventory" ON public.inventory FOR ALL TO authenticated USING (true);

-- Inventory transactions policies
CREATE POLICY "Authenticated users can view inventory transactions" ON public.inventory_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage inventory transactions" ON public.inventory_transactions FOR ALL TO authenticated USING (true);

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Audit logs policies
CREATE POLICY "Authenticated users can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inbound_deliveries_updated_at BEFORE UPDATE ON public.inbound_deliveries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_outbound_shipments_updated_at BEFORE UPDATE ON public.outbound_shipments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON public.supplier_registrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_suppliers_status ON public.suppliers(status);
CREATE INDEX idx_suppliers_category ON public.suppliers(category);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_storage_bins_zone ON public.storage_bins(zone_id);
CREATE INDEX idx_storage_bins_status ON public.storage_bins(status);
CREATE INDEX idx_contracts_supplier ON public.contracts(supplier_id);
CREATE INDEX idx_contracts_status ON public.contracts(status);
CREATE INDEX idx_contracts_end_date ON public.contracts(end_date);
CREATE INDEX idx_risk_flags_supplier ON public.risk_flags(supplier_id);
CREATE INDEX idx_risk_flags_active ON public.risk_flags(is_active);
CREATE INDEX idx_evaluations_supplier ON public.supplier_evaluations(supplier_id);
CREATE INDEX idx_scorecards_supplier ON public.supplier_scorecards(supplier_id);
CREATE INDEX idx_purchase_orders_supplier ON public.purchase_orders(supplier_id);
CREATE INDEX idx_inbound_deliveries_supplier ON public.inbound_deliveries(supplier_id);
CREATE INDEX idx_inbound_deliveries_status ON public.inbound_deliveries(status);
CREATE INDEX idx_outbound_shipments_status ON public.outbound_shipments(status);
CREATE INDEX idx_stock_transfers_status ON public.stock_transfers(status);
CREATE INDEX idx_inventory_product ON public.inventory(product_id);
CREATE INDEX idx_inventory_bin ON public.inventory(bin_id);
CREATE INDEX idx_inventory_transactions_product ON public.inventory_transactions(product_id);
CREATE INDEX idx_inventory_transactions_date ON public.inventory_transactions(transaction_date);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);