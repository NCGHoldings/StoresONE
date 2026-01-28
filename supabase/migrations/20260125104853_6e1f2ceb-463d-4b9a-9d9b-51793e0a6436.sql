-- =====================================================
-- FIX REMAINING "ALL" POLICIES WITH USING(true)
-- These are compound policies that need to be dropped
-- =====================================================

-- blanket_order_lines
DROP POLICY IF EXISTS "Authenticated users can manage blanket order lines" ON blanket_order_lines;

-- blanket_orders
DROP POLICY IF EXISTS "Authenticated users can manage blanket orders" ON blanket_orders;

-- contracts
DROP POLICY IF EXISTS "Authenticated users can manage contracts" ON contracts;

-- cost_centers
DROP POLICY IF EXISTS "Authenticated users can manage cost centers" ON cost_centers;

-- general_ledger
DROP POLICY IF EXISTS "Authenticated users can manage ledger" ON general_ledger;

-- inbound_deliveries
DROP POLICY IF EXISTS "Authenticated users can manage inbound deliveries" ON inbound_deliveries;

-- inventory
DROP POLICY IF EXISTS "Authenticated users can manage inventory" ON inventory;

-- inventory_transactions
DROP POLICY IF EXISTS "Authenticated users can manage inventory transactions" ON inventory_transactions;

-- invoices
DROP POLICY IF EXISTS "Authenticated users can manage invoices" ON invoices;

-- material_demands
DROP POLICY IF EXISTS "Authenticated users can manage material demands" ON material_demands;

-- outbound_shipments
DROP POLICY IF EXISTS "Authenticated users can manage outbound shipments" ON outbound_shipments;