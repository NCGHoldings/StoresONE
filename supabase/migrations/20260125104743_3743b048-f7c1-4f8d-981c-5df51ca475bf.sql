-- =====================================================
-- FIX REMAINING POLICIES (BATCH 5)
-- Drop duplicates and fix auth.uid() IS NOT NULL patterns
-- =====================================================

-- audit_logs - remove duplicate
DROP POLICY IF EXISTS "Authenticated can insert audit_logs" ON audit_logs;

-- customer_po_lines - Use role-based policy
DROP POLICY IF EXISTS "Authenticated can delete customer_po_lines" ON customer_po_lines;
DROP POLICY IF EXISTS "Authenticated can insert customer_po_lines" ON customer_po_lines;
DROP POLICY IF EXISTS "Authenticated can update customer_po_lines" ON customer_po_lines;

-- customer_pos - Use role-based policy  
DROP POLICY IF EXISTS "Authenticated can insert customer_pos" ON customer_pos;
DROP POLICY IF EXISTS "Authenticated can update customer_pos" ON customer_pos;

-- customers - Use role-based policy
DROP POLICY IF EXISTS "Authenticated can insert customers" ON customers;
DROP POLICY IF EXISTS "Authenticated can update customers" ON customers;

-- grn_lines - Use role-based policy
DROP POLICY IF EXISTS "Authenticated users can insert GRN lines" ON grn_lines;
DROP POLICY IF EXISTS "Authenticated users can update GRN lines" ON grn_lines;

-- putaway_tasks - Use role-based policy
DROP POLICY IF EXISTS "Authenticated users can insert putaway tasks" ON putaway_tasks;
DROP POLICY IF EXISTS "Authenticated users can update putaway tasks" ON putaway_tasks;

-- sales_order_lines - Use role-based policy
DROP POLICY IF EXISTS "Authenticated can delete sales_order_lines" ON sales_order_lines;
DROP POLICY IF EXISTS "Authenticated can insert sales_order_lines" ON sales_order_lines;
DROP POLICY IF EXISTS "Authenticated can update sales_order_lines" ON sales_order_lines;

-- sales_orders - Use role-based policy
DROP POLICY IF EXISTS "Authenticated can insert sales_orders" ON sales_orders;
DROP POLICY IF EXISTS "Authenticated can update sales_orders" ON sales_orders;

-- approval_actions - Keep as authenticated (required for workflow)
DROP POLICY IF EXISTS "Users can add approval actions" ON approval_actions;

CREATE POLICY "Auth users can add approval actions" ON approval_actions FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance', 'procurement', 'warehouse_manager']::app_role[]));

-- approval_requests - Keep as authenticated (required for workflow)
DROP POLICY IF EXISTS "Users can create approval requests" ON approval_requests;
DROP POLICY IF EXISTS "Users can update approval requests" ON approval_requests;

CREATE POLICY "Auth users can create approval requests" ON approval_requests FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance', 'procurement', 'warehouse_manager']::app_role[]));

CREATE POLICY "Auth users can update approval requests" ON approval_requests FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance', 'procurement', 'warehouse_manager']::app_role[]));