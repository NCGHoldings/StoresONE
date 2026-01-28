-- =====================================================
-- FIX FINAL BATCH OF "ALL" POLICIES WITH USING(true)
-- =====================================================

-- po_amendments
DROP POLICY IF EXISTS "Authenticated users can manage po amendments" ON po_amendments;

-- price_list_items
DROP POLICY IF EXISTS "Authenticated users can manage price list items" ON price_list_items;

-- price_lists
DROP POLICY IF EXISTS "Authenticated users can manage price lists" ON price_lists;

-- product_categories
DROP POLICY IF EXISTS "Authenticated users can manage product categories" ON product_categories;

-- purchase_order_lines
DROP POLICY IF EXISTS "Authenticated users can manage po lines" ON purchase_order_lines;

-- purchase_orders
DROP POLICY IF EXISTS "Authenticated users can manage purchase orders" ON purchase_orders;

-- purchase_requisition_lines
DROP POLICY IF EXISTS "Authenticated users can manage pr lines" ON purchase_requisition_lines;

-- purchase_requisitions
DROP POLICY IF EXISTS "Authenticated users can manage purchase requisitions" ON purchase_requisitions;

-- rfq_invited_suppliers
DROP POLICY IF EXISTS "Authenticated users can manage rfq invited suppliers" ON rfq_invited_suppliers;

-- rfq_lines
DROP POLICY IF EXISTS "Authenticated users can manage rfq lines" ON rfq_lines;

-- rfq_requests
DROP POLICY IF EXISTS "Authenticated users can manage rfq requests" ON rfq_requests;

-- rfq_response_lines
DROP POLICY IF EXISTS "Authenticated users can manage rfq response lines" ON rfq_response_lines;

-- rfq_responses
DROP POLICY IF EXISTS "Authenticated users can manage rfq responses" ON rfq_responses;

-- risk_flags
DROP POLICY IF EXISTS "Authenticated users can manage risk flags" ON risk_flags;

-- stock_transfers
DROP POLICY IF EXISTS "Authenticated users can manage stock transfers" ON stock_transfers;

-- storage_bins
DROP POLICY IF EXISTS "Authenticated users can manage storage bins" ON storage_bins;

-- storage_zones
DROP POLICY IF EXISTS "Authenticated users can manage storage zones" ON storage_zones;

-- supplier_evaluations
DROP POLICY IF EXISTS "Authenticated users can manage evaluations" ON supplier_evaluations;

-- supplier_registrations
DROP POLICY IF EXISTS "Authenticated users can manage registrations" ON supplier_registrations;

-- supplier_scorecards
DROP POLICY IF EXISTS "Authenticated users can manage scorecards" ON supplier_scorecards;