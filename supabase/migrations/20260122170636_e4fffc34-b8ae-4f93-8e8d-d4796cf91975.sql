-- Create role_descriptions table for role metadata
CREATE TABLE public.role_descriptions (
  role public.app_role PRIMARY KEY,
  description TEXT,
  module_access TEXT[],
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.role_descriptions ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view role descriptions
CREATE POLICY "Authenticated users can view role descriptions"
ON public.role_descriptions FOR SELECT
TO authenticated USING (true);

-- Only admins can manage role descriptions
CREATE POLICY "Admins can manage role descriptions"
ON public.role_descriptions FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update role descriptions"
ON public.role_descriptions FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete role descriptions"
ON public.role_descriptions FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Seed initial role descriptions
INSERT INTO public.role_descriptions (role, description, module_access) VALUES
('admin', 'Full system access with user and configuration management', ARRAY['dashboard', 'warehouse', 'procurement', 'sourcing', 'finance', 'admin']),
('warehouse_manager', 'Manage inventory, storage, inbound/outbound operations', ARRAY['dashboard', 'warehouse']),
('procurement', 'Handle purchase orders, vendor management, sourcing', ARRAY['dashboard', 'procurement', 'sourcing']),
('finance', 'Access to financial modules, invoicing, and reporting', ARRAY['dashboard', 'finance']),
('viewer', 'Read-only access to assigned modules', ARRAY['dashboard']);

-- Create system_config table for application settings
CREATE TABLE public.system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view config
CREATE POLICY "Authenticated users can view system config"
ON public.system_config FOR SELECT
TO authenticated USING (true);

-- Only admins can manage config
CREATE POLICY "Admins can insert system config"
ON public.system_config FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update system config"
ON public.system_config FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete system config"
ON public.system_config FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Seed default configuration
INSERT INTO public.system_config (key, value, category, description) VALUES
('company_name', '"WMS Pro Enterprise"', 'organization', 'Company display name'),
('default_currency', '"USD"', 'organization', 'Default transaction currency'),
('date_format', '"MM/DD/YYYY"', 'organization', 'Date display format'),
('timezone', '"America/New_York"', 'organization', 'System timezone'),
('default_user_role', '"viewer"', 'users', 'Default role for new users'),
('session_timeout_minutes', '60', 'users', 'Session timeout in minutes'),
('require_2fa', 'false', 'users', 'Require two-factor authentication'),
('low_stock_threshold', '10', 'inventory', 'Low stock warning threshold'),
('auto_reorder_enabled', 'false', 'inventory', 'Enable automatic reorder'),
('default_uom', '"EA"', 'inventory', 'Default unit of measure'),
('po_number_prefix', '"PO-"', 'procurement', 'Purchase order number prefix'),
('default_payment_terms', '30', 'procurement', 'Default payment terms in days'),
('require_po_approval', 'true', 'procurement', 'Require approval for purchase orders'),
('approval_threshold', '5000', 'procurement', 'Amount threshold requiring approval'),
('fiscal_year_start', '"01-01"', 'finance', 'Fiscal year start (MM-DD)'),
('default_tax_rate', '0', 'finance', 'Default tax rate percentage');

-- Create trigger to update updated_at on role_descriptions
CREATE OR REPLACE FUNCTION public.update_role_descriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_role_descriptions_updated_at
BEFORE UPDATE ON public.role_descriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_role_descriptions_updated_at();

-- Create trigger to update updated_at on system_config
CREATE OR REPLACE FUNCTION public.update_system_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_system_config_updated_at
BEFORE UPDATE ON public.system_config
FOR EACH ROW
EXECUTE FUNCTION public.update_system_config_updated_at();

-- Add admin view policy for audit_logs (only if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Admins can view audit logs'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''admin''::public.app_role))';
  END IF;
END $$;