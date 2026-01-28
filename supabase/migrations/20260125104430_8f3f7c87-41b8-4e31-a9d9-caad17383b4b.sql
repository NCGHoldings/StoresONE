-- =====================================================
-- FIX REMAINING RLS SECURITY ERRORS (BATCH 2)
-- Additional tables with permissive policies
-- =====================================================

-- =====================================================
-- WAREHOUSE MODULE - Remaining Tables
-- Write access: admin, warehouse_manager
-- =====================================================

-- products - UPDATE and DELETE
DROP POLICY IF EXISTS "Allow authenticated update products" ON products;
DROP POLICY IF EXISTS "Allow authenticated delete products" ON products;

CREATE POLICY "Warehouse can update products" ON products FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

CREATE POLICY "Warehouse can delete products" ON products FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

-- inventory
DROP POLICY IF EXISTS "Allow authenticated insert inventory" ON inventory;
DROP POLICY IF EXISTS "Allow authenticated update inventory" ON inventory;
DROP POLICY IF EXISTS "Allow authenticated delete inventory" ON inventory;

CREATE POLICY "Warehouse can insert inventory" ON inventory FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

CREATE POLICY "Warehouse can update inventory" ON inventory FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

CREATE POLICY "Warehouse can delete inventory" ON inventory FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

-- inventory_batches
DROP POLICY IF EXISTS "Allow authenticated insert inventory_batches" ON inventory_batches;
DROP POLICY IF EXISTS "Allow authenticated update inventory_batches" ON inventory_batches;
DROP POLICY IF EXISTS "Allow authenticated delete inventory_batches" ON inventory_batches;

CREATE POLICY "Warehouse can insert inventory_batches" ON inventory_batches FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

CREATE POLICY "Warehouse can update inventory_batches" ON inventory_batches FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

CREATE POLICY "Warehouse can delete inventory_batches" ON inventory_batches FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

-- inventory_transactions
DROP POLICY IF EXISTS "Allow authenticated insert inventory_transactions" ON inventory_transactions;
DROP POLICY IF EXISTS "Allow authenticated update inventory_transactions" ON inventory_transactions;
DROP POLICY IF EXISTS "Allow authenticated delete inventory_transactions" ON inventory_transactions;

CREATE POLICY "Warehouse can insert inventory_transactions" ON inventory_transactions FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

CREATE POLICY "Warehouse can update inventory_transactions" ON inventory_transactions FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

CREATE POLICY "Warehouse can delete inventory_transactions" ON inventory_transactions FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

-- storage_bins
DROP POLICY IF EXISTS "Allow authenticated insert storage_bins" ON storage_bins;
DROP POLICY IF EXISTS "Allow authenticated update storage_bins" ON storage_bins;
DROP POLICY IF EXISTS "Allow authenticated delete storage_bins" ON storage_bins;

CREATE POLICY "Warehouse can insert storage_bins" ON storage_bins FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

CREATE POLICY "Warehouse can update storage_bins" ON storage_bins FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

CREATE POLICY "Warehouse can delete storage_bins" ON storage_bins FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

-- storage_zones
DROP POLICY IF EXISTS "Allow authenticated insert storage_zones" ON storage_zones;
DROP POLICY IF EXISTS "Allow authenticated update storage_zones" ON storage_zones;
DROP POLICY IF EXISTS "Allow authenticated delete storage_zones" ON storage_zones;

CREATE POLICY "Warehouse can insert storage_zones" ON storage_zones FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

CREATE POLICY "Warehouse can update storage_zones" ON storage_zones FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

CREATE POLICY "Warehouse can delete storage_zones" ON storage_zones FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

-- putaway_tasks
DROP POLICY IF EXISTS "Allow authenticated insert putaway_tasks" ON putaway_tasks;
DROP POLICY IF EXISTS "Allow authenticated update putaway_tasks" ON putaway_tasks;
DROP POLICY IF EXISTS "Allow authenticated delete putaway_tasks" ON putaway_tasks;

CREATE POLICY "Warehouse can insert putaway_tasks" ON putaway_tasks FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

CREATE POLICY "Warehouse can update putaway_tasks" ON putaway_tasks FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

CREATE POLICY "Warehouse can delete putaway_tasks" ON putaway_tasks FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

-- inbound_deliveries
DROP POLICY IF EXISTS "Allow authenticated insert inbound_deliveries" ON inbound_deliveries;
DROP POLICY IF EXISTS "Allow authenticated update inbound_deliveries" ON inbound_deliveries;
DROP POLICY IF EXISTS "Allow authenticated delete inbound_deliveries" ON inbound_deliveries;

CREATE POLICY "Warehouse can insert inbound_deliveries" ON inbound_deliveries FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

CREATE POLICY "Warehouse can update inbound_deliveries" ON inbound_deliveries FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

CREATE POLICY "Warehouse can delete inbound_deliveries" ON inbound_deliveries FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

-- outbound_shipments
DROP POLICY IF EXISTS "Allow authenticated insert outbound_shipments" ON outbound_shipments;
DROP POLICY IF EXISTS "Allow authenticated update outbound_shipments" ON outbound_shipments;
DROP POLICY IF EXISTS "Allow authenticated delete outbound_shipments" ON outbound_shipments;

CREATE POLICY "Warehouse can insert outbound_shipments" ON outbound_shipments FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

CREATE POLICY "Warehouse can update outbound_shipments" ON outbound_shipments FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

CREATE POLICY "Warehouse can delete outbound_shipments" ON outbound_shipments FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

-- stock_transfers
DROP POLICY IF EXISTS "Allow authenticated insert stock_transfers" ON stock_transfers;
DROP POLICY IF EXISTS "Allow authenticated update stock_transfers" ON stock_transfers;
DROP POLICY IF EXISTS "Allow authenticated delete stock_transfers" ON stock_transfers;

CREATE POLICY "Warehouse can insert stock_transfers" ON stock_transfers FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

CREATE POLICY "Warehouse can update stock_transfers" ON stock_transfers FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

CREATE POLICY "Warehouse can delete stock_transfers" ON stock_transfers FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

-- grn_lines
DROP POLICY IF EXISTS "Allow authenticated insert grn_lines" ON grn_lines;
DROP POLICY IF EXISTS "Allow authenticated update grn_lines" ON grn_lines;
DROP POLICY IF EXISTS "Allow authenticated delete grn_lines" ON grn_lines;

CREATE POLICY "Warehouse can insert grn_lines" ON grn_lines FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

CREATE POLICY "Warehouse can update grn_lines" ON grn_lines FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

CREATE POLICY "Warehouse can delete grn_lines" ON grn_lines FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

-- =====================================================
-- PROCUREMENT MODULE
-- Write access: admin, procurement
-- =====================================================

-- purchase_orders
DROP POLICY IF EXISTS "Allow authenticated insert purchase_orders" ON purchase_orders;
DROP POLICY IF EXISTS "Allow authenticated update purchase_orders" ON purchase_orders;
DROP POLICY IF EXISTS "Allow authenticated delete purchase_orders" ON purchase_orders;

CREATE POLICY "Procurement can insert purchase_orders" ON purchase_orders FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

CREATE POLICY "Procurement can update purchase_orders" ON purchase_orders FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

CREATE POLICY "Procurement can delete purchase_orders" ON purchase_orders FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

-- purchase_order_lines
DROP POLICY IF EXISTS "Allow authenticated insert purchase_order_lines" ON purchase_order_lines;
DROP POLICY IF EXISTS "Allow authenticated update purchase_order_lines" ON purchase_order_lines;
DROP POLICY IF EXISTS "Allow authenticated delete purchase_order_lines" ON purchase_order_lines;

CREATE POLICY "Procurement can insert purchase_order_lines" ON purchase_order_lines FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

CREATE POLICY "Procurement can update purchase_order_lines" ON purchase_order_lines FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

CREATE POLICY "Procurement can delete purchase_order_lines" ON purchase_order_lines FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

-- purchase_requisitions
DROP POLICY IF EXISTS "Allow authenticated insert purchase_requisitions" ON purchase_requisitions;
DROP POLICY IF EXISTS "Allow authenticated update purchase_requisitions" ON purchase_requisitions;
DROP POLICY IF EXISTS "Allow authenticated delete purchase_requisitions" ON purchase_requisitions;

CREATE POLICY "Procurement can insert purchase_requisitions" ON purchase_requisitions FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

CREATE POLICY "Procurement can update purchase_requisitions" ON purchase_requisitions FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

CREATE POLICY "Procurement can delete purchase_requisitions" ON purchase_requisitions FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

-- purchase_requisition_lines
DROP POLICY IF EXISTS "Allow authenticated insert purchase_requisition_lines" ON purchase_requisition_lines;
DROP POLICY IF EXISTS "Allow authenticated update purchase_requisition_lines" ON purchase_requisition_lines;
DROP POLICY IF EXISTS "Allow authenticated delete purchase_requisition_lines" ON purchase_requisition_lines;

CREATE POLICY "Procurement can insert purchase_requisition_lines" ON purchase_requisition_lines FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

CREATE POLICY "Procurement can update purchase_requisition_lines" ON purchase_requisition_lines FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

CREATE POLICY "Procurement can delete purchase_requisition_lines" ON purchase_requisition_lines FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

-- blanket_orders
DROP POLICY IF EXISTS "Allow authenticated insert blanket_orders" ON blanket_orders;
DROP POLICY IF EXISTS "Allow authenticated update blanket_orders" ON blanket_orders;
DROP POLICY IF EXISTS "Allow authenticated delete blanket_orders" ON blanket_orders;

CREATE POLICY "Procurement can insert blanket_orders" ON blanket_orders FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

CREATE POLICY "Procurement can update blanket_orders" ON blanket_orders FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

CREATE POLICY "Procurement can delete blanket_orders" ON blanket_orders FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

-- blanket_order_lines
DROP POLICY IF EXISTS "Allow authenticated insert blanket_order_lines" ON blanket_order_lines;
DROP POLICY IF EXISTS "Allow authenticated update blanket_order_lines" ON blanket_order_lines;
DROP POLICY IF EXISTS "Allow authenticated delete blanket_order_lines" ON blanket_order_lines;

CREATE POLICY "Procurement can insert blanket_order_lines" ON blanket_order_lines FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

CREATE POLICY "Procurement can update blanket_order_lines" ON blanket_order_lines FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

CREATE POLICY "Procurement can delete blanket_order_lines" ON blanket_order_lines FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

-- rfq_requests
DROP POLICY IF EXISTS "Allow authenticated insert rfq_requests" ON rfq_requests;
DROP POLICY IF EXISTS "Allow authenticated update rfq_requests" ON rfq_requests;
DROP POLICY IF EXISTS "Allow authenticated delete rfq_requests" ON rfq_requests;

CREATE POLICY "Procurement can insert rfq_requests" ON rfq_requests FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

CREATE POLICY "Procurement can update rfq_requests" ON rfq_requests FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

CREATE POLICY "Procurement can delete rfq_requests" ON rfq_requests FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

-- rfq_lines
DROP POLICY IF EXISTS "Allow authenticated insert rfq_lines" ON rfq_lines;
DROP POLICY IF EXISTS "Allow authenticated update rfq_lines" ON rfq_lines;
DROP POLICY IF EXISTS "Allow authenticated delete rfq_lines" ON rfq_lines;

CREATE POLICY "Procurement can insert rfq_lines" ON rfq_lines FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

CREATE POLICY "Procurement can update rfq_lines" ON rfq_lines FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

CREATE POLICY "Procurement can delete rfq_lines" ON rfq_lines FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

-- rfq_responses
DROP POLICY IF EXISTS "Allow authenticated insert rfq_responses" ON rfq_responses;
DROP POLICY IF EXISTS "Allow authenticated update rfq_responses" ON rfq_responses;
DROP POLICY IF EXISTS "Allow authenticated delete rfq_responses" ON rfq_responses;

CREATE POLICY "Procurement can insert rfq_responses" ON rfq_responses FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

CREATE POLICY "Procurement can update rfq_responses" ON rfq_responses FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

CREATE POLICY "Procurement can delete rfq_responses" ON rfq_responses FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

-- po_amendments
DROP POLICY IF EXISTS "Allow authenticated insert po_amendments" ON po_amendments;
DROP POLICY IF EXISTS "Allow authenticated update po_amendments" ON po_amendments;
DROP POLICY IF EXISTS "Allow authenticated delete po_amendments" ON po_amendments;

CREATE POLICY "Procurement can insert po_amendments" ON po_amendments FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

CREATE POLICY "Procurement can update po_amendments" ON po_amendments FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

CREATE POLICY "Procurement can delete po_amendments" ON po_amendments FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

-- material_demands
DROP POLICY IF EXISTS "Allow authenticated insert material_demands" ON material_demands;
DROP POLICY IF EXISTS "Allow authenticated update material_demands" ON material_demands;
DROP POLICY IF EXISTS "Allow authenticated delete material_demands" ON material_demands;

CREATE POLICY "Procurement can insert material_demands" ON material_demands FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

CREATE POLICY "Procurement can update material_demands" ON material_demands FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

CREATE POLICY "Procurement can delete material_demands" ON material_demands FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

-- price_lists
DROP POLICY IF EXISTS "Allow authenticated insert price_lists" ON price_lists;
DROP POLICY IF EXISTS "Allow authenticated update price_lists" ON price_lists;
DROP POLICY IF EXISTS "Allow authenticated delete price_lists" ON price_lists;

CREATE POLICY "Procurement can insert price_lists" ON price_lists FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

CREATE POLICY "Procurement can update price_lists" ON price_lists FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

CREATE POLICY "Procurement can delete price_lists" ON price_lists FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

-- =====================================================
-- SOURCING MODULE - Remaining Tables
-- Write access: admin, warehouse_manager, procurement
-- =====================================================

-- suppliers - UPDATE and DELETE
DROP POLICY IF EXISTS "Allow authenticated update suppliers" ON suppliers;
DROP POLICY IF EXISTS "Allow authenticated delete suppliers" ON suppliers;

CREATE POLICY "Sourcing can update suppliers" ON suppliers FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager', 'procurement']::app_role[]));

CREATE POLICY "Sourcing can delete suppliers" ON suppliers FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager', 'procurement']::app_role[]));

-- supplier_evaluations
DROP POLICY IF EXISTS "Allow authenticated insert supplier_evaluations" ON supplier_evaluations;
DROP POLICY IF EXISTS "Allow authenticated update supplier_evaluations" ON supplier_evaluations;
DROP POLICY IF EXISTS "Allow authenticated delete supplier_evaluations" ON supplier_evaluations;

CREATE POLICY "Sourcing can insert supplier_evaluations" ON supplier_evaluations FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager', 'procurement']::app_role[]));

CREATE POLICY "Sourcing can update supplier_evaluations" ON supplier_evaluations FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager', 'procurement']::app_role[]));

CREATE POLICY "Sourcing can delete supplier_evaluations" ON supplier_evaluations FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager', 'procurement']::app_role[]));

-- supplier_scorecards
DROP POLICY IF EXISTS "Allow authenticated insert supplier_scorecards" ON supplier_scorecards;
DROP POLICY IF EXISTS "Allow authenticated update supplier_scorecards" ON supplier_scorecards;
DROP POLICY IF EXISTS "Allow authenticated delete supplier_scorecards" ON supplier_scorecards;

CREATE POLICY "Sourcing can insert supplier_scorecards" ON supplier_scorecards FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager', 'procurement']::app_role[]));

CREATE POLICY "Sourcing can update supplier_scorecards" ON supplier_scorecards FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager', 'procurement']::app_role[]));

CREATE POLICY "Sourcing can delete supplier_scorecards" ON supplier_scorecards FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager', 'procurement']::app_role[]));

-- supplier_registrations
DROP POLICY IF EXISTS "Allow authenticated insert supplier_registrations" ON supplier_registrations;
DROP POLICY IF EXISTS "Allow authenticated update supplier_registrations" ON supplier_registrations;
DROP POLICY IF EXISTS "Allow authenticated delete supplier_registrations" ON supplier_registrations;

CREATE POLICY "Sourcing can insert supplier_registrations" ON supplier_registrations FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager', 'procurement']::app_role[]));

CREATE POLICY "Sourcing can update supplier_registrations" ON supplier_registrations FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager', 'procurement']::app_role[]));

CREATE POLICY "Sourcing can delete supplier_registrations" ON supplier_registrations FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager', 'procurement']::app_role[]));

-- contracts
DROP POLICY IF EXISTS "Allow authenticated insert contracts" ON contracts;
DROP POLICY IF EXISTS "Allow authenticated update contracts" ON contracts;
DROP POLICY IF EXISTS "Allow authenticated delete contracts" ON contracts;

CREATE POLICY "Sourcing can insert contracts" ON contracts FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager', 'procurement']::app_role[]));

CREATE POLICY "Sourcing can update contracts" ON contracts FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager', 'procurement']::app_role[]));

CREATE POLICY "Sourcing can delete contracts" ON contracts FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager', 'procurement']::app_role[]));

-- risk_flags
DROP POLICY IF EXISTS "Allow authenticated insert risk_flags" ON risk_flags;
DROP POLICY IF EXISTS "Allow authenticated update risk_flags" ON risk_flags;
DROP POLICY IF EXISTS "Allow authenticated delete risk_flags" ON risk_flags;

CREATE POLICY "Sourcing can insert risk_flags" ON risk_flags FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager', 'procurement']::app_role[]));

CREATE POLICY "Sourcing can update risk_flags" ON risk_flags FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager', 'procurement']::app_role[]));

CREATE POLICY "Sourcing can delete risk_flags" ON risk_flags FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager', 'procurement']::app_role[]));

-- =====================================================
-- SALES MODULE - Remaining Tables
-- Write access: admin, finance, warehouse_manager
-- =====================================================

-- customers
DROP POLICY IF EXISTS "Allow authenticated insert customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated update customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated delete customers" ON customers;

CREATE POLICY "Sales can insert customers" ON customers FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance', 'warehouse_manager']::app_role[]));

CREATE POLICY "Sales can update customers" ON customers FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance', 'warehouse_manager']::app_role[]));

CREATE POLICY "Sales can delete customers" ON customers FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance', 'warehouse_manager']::app_role[]));

-- customer_pos
DROP POLICY IF EXISTS "Allow authenticated insert customer_pos" ON customer_pos;
DROP POLICY IF EXISTS "Allow authenticated update customer_pos" ON customer_pos;
DROP POLICY IF EXISTS "Allow authenticated delete customer_pos" ON customer_pos;

CREATE POLICY "Sales can insert customer_pos" ON customer_pos FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance', 'warehouse_manager']::app_role[]));

CREATE POLICY "Sales can update customer_pos" ON customer_pos FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance', 'warehouse_manager']::app_role[]));

CREATE POLICY "Sales can delete customer_pos" ON customer_pos FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance', 'warehouse_manager']::app_role[]));

-- customer_po_lines
DROP POLICY IF EXISTS "Allow authenticated insert customer_po_lines" ON customer_po_lines;
DROP POLICY IF EXISTS "Allow authenticated update customer_po_lines" ON customer_po_lines;
DROP POLICY IF EXISTS "Allow authenticated delete customer_po_lines" ON customer_po_lines;

CREATE POLICY "Sales can insert customer_po_lines" ON customer_po_lines FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance', 'warehouse_manager']::app_role[]));

CREATE POLICY "Sales can update customer_po_lines" ON customer_po_lines FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance', 'warehouse_manager']::app_role[]));

CREATE POLICY "Sales can delete customer_po_lines" ON customer_po_lines FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance', 'warehouse_manager']::app_role[]));

-- sales_orders
DROP POLICY IF EXISTS "Allow authenticated insert sales_orders" ON sales_orders;
DROP POLICY IF EXISTS "Allow authenticated update sales_orders" ON sales_orders;
DROP POLICY IF EXISTS "Allow authenticated delete sales_orders" ON sales_orders;

CREATE POLICY "Sales can insert sales_orders" ON sales_orders FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance', 'warehouse_manager']::app_role[]));

CREATE POLICY "Sales can update sales_orders" ON sales_orders FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance', 'warehouse_manager']::app_role[]));

CREATE POLICY "Sales can delete sales_orders" ON sales_orders FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance', 'warehouse_manager']::app_role[]));

-- sales_order_lines
DROP POLICY IF EXISTS "Allow authenticated insert sales_order_lines" ON sales_order_lines;
DROP POLICY IF EXISTS "Allow authenticated update sales_order_lines" ON sales_order_lines;
DROP POLICY IF EXISTS "Allow authenticated delete sales_order_lines" ON sales_order_lines;

CREATE POLICY "Sales can insert sales_order_lines" ON sales_order_lines FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance', 'warehouse_manager']::app_role[]));

CREATE POLICY "Sales can update sales_order_lines" ON sales_order_lines FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance', 'warehouse_manager']::app_role[]));

CREATE POLICY "Sales can delete sales_order_lines" ON sales_order_lines FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance', 'warehouse_manager']::app_role[]));

-- =====================================================
-- ADMIN MODULE - Remaining Tables
-- Write access: admin only
-- =====================================================

-- user_roles
DROP POLICY IF EXISTS "Allow authenticated insert user_roles" ON user_roles;
DROP POLICY IF EXISTS "Allow authenticated update user_roles" ON user_roles;
DROP POLICY IF EXISTS "Allow authenticated delete user_roles" ON user_roles;

CREATE POLICY "Admin can insert user_roles" ON user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update user_roles" ON user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete user_roles" ON user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- role_descriptions
DROP POLICY IF EXISTS "Allow authenticated insert role_descriptions" ON role_descriptions;
DROP POLICY IF EXISTS "Allow authenticated update role_descriptions" ON role_descriptions;
DROP POLICY IF EXISTS "Allow authenticated delete role_descriptions" ON role_descriptions;

CREATE POLICY "Admin can insert role_descriptions" ON role_descriptions FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update role_descriptions" ON role_descriptions FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete role_descriptions" ON role_descriptions FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- system_config
DROP POLICY IF EXISTS "Allow authenticated insert system_config" ON system_config;
DROP POLICY IF EXISTS "Allow authenticated update system_config" ON system_config;
DROP POLICY IF EXISTS "Allow authenticated delete system_config" ON system_config;

CREATE POLICY "Admin can insert system_config" ON system_config FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update system_config" ON system_config FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete system_config" ON system_config FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- approval_workflows
DROP POLICY IF EXISTS "Allow authenticated insert approval_workflows" ON approval_workflows;
DROP POLICY IF EXISTS "Allow authenticated update approval_workflows" ON approval_workflows;
DROP POLICY IF EXISTS "Allow authenticated delete approval_workflows" ON approval_workflows;

CREATE POLICY "Admin can insert approval_workflows" ON approval_workflows FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update approval_workflows" ON approval_workflows FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete approval_workflows" ON approval_workflows FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- FINANCE MODULE - Additional Tables
-- Write access: admin, finance
-- =====================================================

-- invoices
DROP POLICY IF EXISTS "Allow authenticated insert invoices" ON invoices;
DROP POLICY IF EXISTS "Allow authenticated update invoices" ON invoices;
DROP POLICY IF EXISTS "Allow authenticated delete invoices" ON invoices;

CREATE POLICY "Finance can insert invoices" ON invoices FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can update invoices" ON invoices FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can delete invoices" ON invoices FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

-- general_ledger
DROP POLICY IF EXISTS "Allow authenticated insert general_ledger" ON general_ledger;
DROP POLICY IF EXISTS "Allow authenticated update general_ledger" ON general_ledger;
DROP POLICY IF EXISTS "Allow authenticated delete general_ledger" ON general_ledger;

CREATE POLICY "Finance can insert general_ledger" ON general_ledger FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can update general_ledger" ON general_ledger FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can delete general_ledger" ON general_ledger FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

-- cost_centers
DROP POLICY IF EXISTS "Allow authenticated insert cost_centers" ON cost_centers;
DROP POLICY IF EXISTS "Allow authenticated update cost_centers" ON cost_centers;
DROP POLICY IF EXISTS "Allow authenticated delete cost_centers" ON cost_centers;

CREATE POLICY "Finance can insert cost_centers" ON cost_centers FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can update cost_centers" ON cost_centers FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can delete cost_centers" ON cost_centers FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

-- =====================================================
-- WAREHOUSE MODULE - Additional Tables
-- Write access: admin, warehouse_manager
-- =====================================================

-- product_categories
DROP POLICY IF EXISTS "Allow authenticated insert product_categories" ON product_categories;
DROP POLICY IF EXISTS "Allow authenticated update product_categories" ON product_categories;
DROP POLICY IF EXISTS "Allow authenticated delete product_categories" ON product_categories;

CREATE POLICY "Warehouse can insert product_categories" ON product_categories FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

CREATE POLICY "Warehouse can update product_categories" ON product_categories FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

CREATE POLICY "Warehouse can delete product_categories" ON product_categories FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));