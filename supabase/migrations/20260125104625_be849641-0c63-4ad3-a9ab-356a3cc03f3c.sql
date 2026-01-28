-- =====================================================
-- FIX REMAINING PERMISSIVE POLICIES (BATCH 4)
-- Final batch with actual policy names
-- =====================================================

-- products
DROP POLICY IF EXISTS "Authenticated users can insert products" ON products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON products;

-- reconciliation_items
DROP POLICY IF EXISTS "Authenticated users can delete reconciliation items" ON reconciliation_items;
DROP POLICY IF EXISTS "Authenticated users can insert reconciliation items" ON reconciliation_items;
DROP POLICY IF EXISTS "Authenticated users can update reconciliation items" ON reconciliation_items;

-- sales_return_lines
DROP POLICY IF EXISTS "Users can delete sales return lines" ON sales_return_lines;
DROP POLICY IF EXISTS "Users can create sales return lines" ON sales_return_lines;
DROP POLICY IF EXISTS "Users can update sales return lines" ON sales_return_lines;

-- sales_returns
DROP POLICY IF EXISTS "Users can delete sales returns" ON sales_returns;
DROP POLICY IF EXISTS "Users can create sales returns" ON sales_returns;
DROP POLICY IF EXISTS "Users can update sales returns" ON sales_returns;

-- scheduled_payment_items
DROP POLICY IF EXISTS "Authenticated users can delete scheduled payment items" ON scheduled_payment_items;
DROP POLICY IF EXISTS "Authenticated users can create scheduled payment items" ON scheduled_payment_items;

-- scheduled_payments
DROP POLICY IF EXISTS "Authenticated users can create scheduled payments" ON scheduled_payments;
DROP POLICY IF EXISTS "Authenticated users can update scheduled payments" ON scheduled_payments;

-- suppliers
DROP POLICY IF EXISTS "Authenticated users can insert suppliers" ON suppliers;
DROP POLICY IF EXISTS "Authenticated users can update suppliers" ON suppliers;

-- vendor_advance_allocations
DROP POLICY IF EXISTS "Users can delete vendor advance allocations" ON vendor_advance_allocations;
DROP POLICY IF EXISTS "Users can create vendor advance allocations" ON vendor_advance_allocations;
DROP POLICY IF EXISTS "Users can update vendor advance allocations" ON vendor_advance_allocations;

-- vendor_advances
DROP POLICY IF EXISTS "Users can delete vendor advances" ON vendor_advances;
DROP POLICY IF EXISTS "Users can create vendor advances" ON vendor_advances;
DROP POLICY IF EXISTS "Users can update vendor advances" ON vendor_advances;

-- vendor_payments
DROP POLICY IF EXISTS "Users can delete vendor payments" ON vendor_payments;
DROP POLICY IF EXISTS "Users can create vendor payments" ON vendor_payments;
DROP POLICY IF EXISTS "Users can update vendor payments" ON vendor_payments;

-- wht_certificates
DROP POLICY IF EXISTS "Users can delete WHT certificates" ON wht_certificates;
DROP POLICY IF EXISTS "Users can create WHT certificates" ON wht_certificates;
DROP POLICY IF EXISTS "Users can update WHT certificates" ON wht_certificates;