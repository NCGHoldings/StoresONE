-- Insert role descriptions for new roles
INSERT INTO role_descriptions (role, description, module_access) VALUES
  ('sales', 'Sales and Distribution - manages customers, orders, and deliveries', ARRAY['dashboard', 'sales']),
  ('controller', 'Financial Controller - view-only access to finance for audit purposes', ARRAY['dashboard', 'finance'])
ON CONFLICT (role) DO NOTHING;

-- Phase 2: Create Segregation of Duties (SoD) conflict matrix table
CREATE TABLE IF NOT EXISTS sod_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conflict_name TEXT NOT NULL,
  role_a app_role NOT NULL,
  role_b app_role NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  is_blocking BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on sod_conflicts
ALTER TABLE sod_conflicts ENABLE ROW LEVEL SECURITY;

-- Only admins can manage SoD conflicts
CREATE POLICY "Admins can manage sod_conflicts" ON sod_conflicts
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Allow authenticated users to read SoD conflicts (for validation)
CREATE POLICY "Authenticated can read sod_conflicts" ON sod_conflicts
  FOR SELECT TO authenticated
  USING (true);

-- Insert default SoD conflict rules
INSERT INTO sod_conflicts (conflict_name, role_a, role_b, risk_level, is_blocking, description) VALUES
  ('Vendor Creation + Payment', 'procurement', 'finance', 'high', true, 'User cannot both create vendors and process payments'),
  ('PO Creation + GRN', 'procurement', 'warehouse_manager', 'medium', false, 'User cannot both create POs and receive goods'),
  ('Customer Creation + Credit Memo', 'sales', 'finance', 'high', true, 'User cannot both create customers and issue credit memos'),
  ('User Management + Finance', 'admin', 'finance', 'medium', false, 'Admin with finance access requires additional oversight')
ON CONFLICT DO NOTHING;

-- Create function to check SoD conflicts for a user
CREATE OR REPLACE FUNCTION check_sod_conflicts(_user_id UUID)
RETURNS TABLE(conflict_name TEXT, risk_level TEXT, is_blocking BOOLEAN) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sc.conflict_name, sc.risk_level, sc.is_blocking
  FROM sod_conflicts sc
  WHERE EXISTS (
    SELECT 1 FROM user_roles ur1 
    WHERE ur1.user_id = _user_id AND ur1.role = sc.role_a
  )
  AND EXISTS (
    SELECT 1 FROM user_roles ur2 
    WHERE ur2.user_id = _user_id AND ur2.role = sc.role_b
  );
$$;

-- Phase 5: Add enhanced audit logging columns
ALTER TABLE audit_logs 
  ADD COLUMN IF NOT EXISTS session_id TEXT,
  ADD COLUMN IF NOT EXISTS transaction_code TEXT,
  ADD COLUMN IF NOT EXISTS change_type TEXT,
  ADD COLUMN IF NOT EXISTS module TEXT,
  ADD COLUMN IF NOT EXISTS document_number TEXT;

-- Create enhanced audit trigger function with search_path security
CREATE OR REPLACE FUNCTION audit_trigger_fn()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_logs (
    entity_type, entity_id, action,
    old_values, new_values, user_id,
    change_type, module
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id)::TEXT,
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END,
    auth.uid(),
    TG_OP,
    CASE 
      WHEN TG_TABLE_NAME LIKE '%purchase%' OR TG_TABLE_NAME LIKE '%supplier%' THEN 'MM'
      WHEN TG_TABLE_NAME LIKE '%invoice%' OR TG_TABLE_NAME LIKE '%payment%' THEN 'FI'
      WHEN TG_TABLE_NAME LIKE '%sales%' OR TG_TABLE_NAME LIKE '%customer%' THEN 'SD'
      WHEN TG_TABLE_NAME LIKE '%inventory%' OR TG_TABLE_NAME LIKE '%batch%' THEN 'WM'
      ELSE 'SYS'
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply audit triggers to critical tables
DROP TRIGGER IF EXISTS audit_purchase_orders ON purchase_orders;
CREATE TRIGGER audit_purchase_orders
  AFTER INSERT OR UPDATE OR DELETE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

DROP TRIGGER IF EXISTS audit_invoices ON invoices;
CREATE TRIGGER audit_invoices
  AFTER INSERT OR UPDATE OR DELETE ON invoices
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

DROP TRIGGER IF EXISTS audit_customer_invoices ON customer_invoices;
CREATE TRIGGER audit_customer_invoices
  AFTER INSERT OR UPDATE OR DELETE ON customer_invoices
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

DROP TRIGGER IF EXISTS audit_vendors ON suppliers;
CREATE TRIGGER audit_vendors
  AFTER INSERT OR UPDATE OR DELETE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

DROP TRIGGER IF EXISTS audit_customers ON customers;
CREATE TRIGGER audit_customers
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

DROP TRIGGER IF EXISTS audit_vendor_payments ON vendor_payments;
CREATE TRIGGER audit_vendor_payments
  AFTER INSERT OR UPDATE OR DELETE ON vendor_payments
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

DROP TRIGGER IF EXISTS audit_customer_receipts ON customer_receipts;
CREATE TRIGGER audit_customer_receipts
  AFTER INSERT OR UPDATE OR DELETE ON customer_receipts
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

-- Phase 6: Create PO status transition validator
CREATE OR REPLACE FUNCTION validate_po_status_transition()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  valid_transitions JSONB := '{
    "draft": ["pending_approval", "cancelled"],
    "pending_approval": ["approved", "rejected", "cancelled"],
    "approved": ["in_transit", "received", "partial_received", "cancelled"],
    "in_transit": ["received", "partial_received"],
    "partial_received": ["received", "in_transit"],
    "received": [],
    "rejected": ["draft"],
    "cancelled": []
  }'::JSONB;
BEGIN
  IF OLD.status IS NOT NULL AND OLD.status != NEW.status THEN
    IF NOT (valid_transitions -> OLD.status ? NEW.status) THEN
      RAISE EXCEPTION 'Invalid status transition: % -> %', OLD.status, NEW.status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS po_status_transition ON purchase_orders;
CREATE TRIGGER po_status_transition
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION validate_po_status_transition();

-- Add security configuration to system_config
INSERT INTO system_config (key, value, category, description) VALUES
  ('password_min_length', '8', 'security', 'Minimum password length'),
  ('password_require_uppercase', 'true', 'security', 'Require uppercase letter'),
  ('password_require_lowercase', 'true', 'security', 'Require lowercase letter'),
  ('password_require_number', 'true', 'security', 'Require number'),
  ('password_require_special', 'true', 'security', 'Require special character'),
  ('login_lockout_attempts', '5', 'security', 'Failed attempts before lockout'),
  ('login_lockout_duration', '15', 'security', 'Lockout duration in minutes'),
  ('dual_approval_threshold', '50000', 'finance', 'Amount requiring dual approval'),
  ('closed_periods', '[]', 'finance', 'Closed posting periods (JSON array)')
ON CONFLICT (key) DO NOTHING;

-- Phase 7: Tighten RLS policies for sensitive data
-- Cost centers - restrict to finance roles
DROP POLICY IF EXISTS "Allow authenticated read cost_centers" ON cost_centers;
CREATE POLICY "Finance roles can read cost_centers" ON cost_centers 
  FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin', 'finance', 'controller']::app_role[]));

-- Invoices (AP) - restrict to finance and procurement
DROP POLICY IF EXISTS "Allow authenticated read invoices" ON invoices;
CREATE POLICY "Finance and procurement can read invoices" ON invoices 
  FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin', 'finance', 'procurement', 'controller']::app_role[]));

-- Vendor payments - restrict to finance
DROP POLICY IF EXISTS "Allow authenticated read vendor_payments" ON vendor_payments;
CREATE POLICY "Finance can read vendor_payments" ON vendor_payments 
  FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin', 'finance', 'controller']::app_role[]));

-- Customer receipts - restrict to finance and sales
DROP POLICY IF EXISTS "Allow authenticated read customer_receipts" ON customer_receipts;
CREATE POLICY "Finance and sales can read customer_receipts" ON customer_receipts 
  FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin', 'finance', 'sales', 'controller']::app_role[]));

-- General ledger entries - restrict to finance
DROP POLICY IF EXISTS "Allow authenticated read general_ledger" ON general_ledger;
CREATE POLICY "Finance can read general_ledger" ON general_ledger 
  FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin', 'finance', 'controller']::app_role[]));

-- Bank accounts - restrict to finance
DROP POLICY IF EXISTS "Allow authenticated read bank_accounts" ON bank_accounts;
CREATE POLICY "Finance can read bank_accounts" ON bank_accounts 
  FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin', 'finance', 'controller']::app_role[]));

-- Bank transactions - restrict to finance
DROP POLICY IF EXISTS "Allow authenticated read bank_transactions" ON bank_transactions;
CREATE POLICY "Finance can read bank_transactions" ON bank_transactions 
  FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin', 'finance', 'controller']::app_role[]));