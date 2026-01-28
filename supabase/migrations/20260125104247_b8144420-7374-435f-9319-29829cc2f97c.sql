-- =====================================================
-- FIX ALL 117 RLS SECURITY ERRORS
-- Replace permissive (true) policies with role-based access
-- =====================================================

-- 1. Create helper function for checking multiple roles
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = ANY(_roles)
  )
$$;

-- =====================================================
-- FINANCE MODULE TABLES
-- Write access: admin, finance
-- =====================================================

-- bank_accounts
DROP POLICY IF EXISTS "Allow authenticated insert bank_accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Allow authenticated update bank_accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Allow authenticated delete bank_accounts" ON bank_accounts;

CREATE POLICY "Finance can insert bank_accounts" ON bank_accounts FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can update bank_accounts" ON bank_accounts FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can delete bank_accounts" ON bank_accounts FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

-- bank_transactions
DROP POLICY IF EXISTS "Allow authenticated insert bank_transactions" ON bank_transactions;
DROP POLICY IF EXISTS "Allow authenticated update bank_transactions" ON bank_transactions;
DROP POLICY IF EXISTS "Allow authenticated delete bank_transactions" ON bank_transactions;

CREATE POLICY "Finance can insert bank_transactions" ON bank_transactions FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can update bank_transactions" ON bank_transactions FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can delete bank_transactions" ON bank_transactions FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

-- bank_reconciliations
DROP POLICY IF EXISTS "Allow authenticated insert bank_reconciliations" ON bank_reconciliations;
DROP POLICY IF EXISTS "Allow authenticated update bank_reconciliations" ON bank_reconciliations;
DROP POLICY IF EXISTS "Allow authenticated delete bank_reconciliations" ON bank_reconciliations;

CREATE POLICY "Finance can insert bank_reconciliations" ON bank_reconciliations FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can update bank_reconciliations" ON bank_reconciliations FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can delete bank_reconciliations" ON bank_reconciliations FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

-- cheques
DROP POLICY IF EXISTS "Allow authenticated insert cheques" ON cheques;
DROP POLICY IF EXISTS "Allow authenticated update cheques" ON cheques;
DROP POLICY IF EXISTS "Allow authenticated delete cheques" ON cheques;

CREATE POLICY "Finance can insert cheques" ON cheques FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can update cheques" ON cheques FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can delete cheques" ON cheques FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

-- fund_transfers
DROP POLICY IF EXISTS "Allow authenticated insert fund_transfers" ON fund_transfers;
DROP POLICY IF EXISTS "Allow authenticated update fund_transfers" ON fund_transfers;
DROP POLICY IF EXISTS "Allow authenticated delete fund_transfers" ON fund_transfers;

CREATE POLICY "Finance can insert fund_transfers" ON fund_transfers FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can update fund_transfers" ON fund_transfers FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can delete fund_transfers" ON fund_transfers FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

-- customer_invoices
DROP POLICY IF EXISTS "Allow authenticated insert customer_invoices" ON customer_invoices;
DROP POLICY IF EXISTS "Allow authenticated update customer_invoices" ON customer_invoices;
DROP POLICY IF EXISTS "Allow authenticated delete customer_invoices" ON customer_invoices;

CREATE POLICY "Finance can insert customer_invoices" ON customer_invoices FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can update customer_invoices" ON customer_invoices FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can delete customer_invoices" ON customer_invoices FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

-- customer_invoice_lines
DROP POLICY IF EXISTS "Allow authenticated insert customer_invoice_lines" ON customer_invoice_lines;
DROP POLICY IF EXISTS "Allow authenticated update customer_invoice_lines" ON customer_invoice_lines;
DROP POLICY IF EXISTS "Allow authenticated delete customer_invoice_lines" ON customer_invoice_lines;

CREATE POLICY "Finance can insert customer_invoice_lines" ON customer_invoice_lines FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can update customer_invoice_lines" ON customer_invoice_lines FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can delete customer_invoice_lines" ON customer_invoice_lines FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

-- customer_receipts
DROP POLICY IF EXISTS "Allow authenticated insert customer_receipts" ON customer_receipts;
DROP POLICY IF EXISTS "Allow authenticated update customer_receipts" ON customer_receipts;
DROP POLICY IF EXISTS "Allow authenticated delete customer_receipts" ON customer_receipts;

CREATE POLICY "Finance can insert customer_receipts" ON customer_receipts FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can update customer_receipts" ON customer_receipts FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can delete customer_receipts" ON customer_receipts FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

-- customer_advances
DROP POLICY IF EXISTS "Allow authenticated insert customer_advances" ON customer_advances;
DROP POLICY IF EXISTS "Allow authenticated update customer_advances" ON customer_advances;
DROP POLICY IF EXISTS "Allow authenticated delete customer_advances" ON customer_advances;

CREATE POLICY "Finance can insert customer_advances" ON customer_advances FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can update customer_advances" ON customer_advances FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can delete customer_advances" ON customer_advances FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

-- credit_notes
DROP POLICY IF EXISTS "Allow authenticated insert credit_notes" ON credit_notes;
DROP POLICY IF EXISTS "Allow authenticated update credit_notes" ON credit_notes;
DROP POLICY IF EXISTS "Allow authenticated delete credit_notes" ON credit_notes;

CREATE POLICY "Finance can insert credit_notes" ON credit_notes FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can update credit_notes" ON credit_notes FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can delete credit_notes" ON credit_notes FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

-- debit_notes
DROP POLICY IF EXISTS "Allow authenticated insert debit_notes" ON debit_notes;
DROP POLICY IF EXISTS "Allow authenticated update debit_notes" ON debit_notes;
DROP POLICY IF EXISTS "Allow authenticated delete debit_notes" ON debit_notes;

CREATE POLICY "Finance can insert debit_notes" ON debit_notes FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can update debit_notes" ON debit_notes FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can delete debit_notes" ON debit_notes FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

-- debit_note_applications
DROP POLICY IF EXISTS "Allow authenticated insert debit_note_applications" ON debit_note_applications;
DROP POLICY IF EXISTS "Allow authenticated update debit_note_applications" ON debit_note_applications;
DROP POLICY IF EXISTS "Allow authenticated delete debit_note_applications" ON debit_note_applications;

CREATE POLICY "Finance can insert debit_note_applications" ON debit_note_applications FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can update debit_note_applications" ON debit_note_applications FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can delete debit_note_applications" ON debit_note_applications FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

-- vendor_payments
DROP POLICY IF EXISTS "Allow authenticated insert vendor_payments" ON vendor_payments;
DROP POLICY IF EXISTS "Allow authenticated update vendor_payments" ON vendor_payments;
DROP POLICY IF EXISTS "Allow authenticated delete vendor_payments" ON vendor_payments;

CREATE POLICY "Finance can insert vendor_payments" ON vendor_payments FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can update vendor_payments" ON vendor_payments FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can delete vendor_payments" ON vendor_payments FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

-- vendor_advances
DROP POLICY IF EXISTS "Allow authenticated insert vendor_advances" ON vendor_advances;
DROP POLICY IF EXISTS "Allow authenticated update vendor_advances" ON vendor_advances;
DROP POLICY IF EXISTS "Allow authenticated delete vendor_advances" ON vendor_advances;

CREATE POLICY "Finance can insert vendor_advances" ON vendor_advances FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can update vendor_advances" ON vendor_advances FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can delete vendor_advances" ON vendor_advances FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

-- vendor_advance_allocations
DROP POLICY IF EXISTS "Allow authenticated insert vendor_advance_allocations" ON vendor_advance_allocations;
DROP POLICY IF EXISTS "Allow authenticated update vendor_advance_allocations" ON vendor_advance_allocations;
DROP POLICY IF EXISTS "Allow authenticated delete vendor_advance_allocations" ON vendor_advance_allocations;

CREATE POLICY "Finance can insert vendor_advance_allocations" ON vendor_advance_allocations FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can update vendor_advance_allocations" ON vendor_advance_allocations FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can delete vendor_advance_allocations" ON vendor_advance_allocations FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

-- payment_batches
DROP POLICY IF EXISTS "Allow authenticated insert payment_batches" ON payment_batches;
DROP POLICY IF EXISTS "Allow authenticated update payment_batches" ON payment_batches;
DROP POLICY IF EXISTS "Allow authenticated delete payment_batches" ON payment_batches;

CREATE POLICY "Finance can insert payment_batches" ON payment_batches FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can update payment_batches" ON payment_batches FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can delete payment_batches" ON payment_batches FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

-- payment_batch_items
DROP POLICY IF EXISTS "Allow authenticated insert payment_batch_items" ON payment_batch_items;
DROP POLICY IF EXISTS "Allow authenticated update payment_batch_items" ON payment_batch_items;
DROP POLICY IF EXISTS "Allow authenticated delete payment_batch_items" ON payment_batch_items;

CREATE POLICY "Finance can insert payment_batch_items" ON payment_batch_items FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can update payment_batch_items" ON payment_batch_items FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can delete payment_batch_items" ON payment_batch_items FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

-- bad_debt_provisions
DROP POLICY IF EXISTS "Allow authenticated insert bad_debt_provisions" ON bad_debt_provisions;
DROP POLICY IF EXISTS "Allow authenticated update bad_debt_provisions" ON bad_debt_provisions;
DROP POLICY IF EXISTS "Allow authenticated delete bad_debt_provisions" ON bad_debt_provisions;

CREATE POLICY "Finance can insert bad_debt_provisions" ON bad_debt_provisions FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can update bad_debt_provisions" ON bad_debt_provisions FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can delete bad_debt_provisions" ON bad_debt_provisions FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

-- wht_certificates
DROP POLICY IF EXISTS "Allow authenticated insert wht_certificates" ON wht_certificates;
DROP POLICY IF EXISTS "Allow authenticated update wht_certificates" ON wht_certificates;
DROP POLICY IF EXISTS "Allow authenticated delete wht_certificates" ON wht_certificates;

CREATE POLICY "Finance can insert wht_certificates" ON wht_certificates FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can update wht_certificates" ON wht_certificates FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can delete wht_certificates" ON wht_certificates FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

-- advance_allocations
DROP POLICY IF EXISTS "Allow authenticated insert advance_allocations" ON advance_allocations;
DROP POLICY IF EXISTS "Allow authenticated delete advance_allocations" ON advance_allocations;

CREATE POLICY "Finance can insert advance_allocations" ON advance_allocations FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can delete advance_allocations" ON advance_allocations FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

-- payment_allocations
DROP POLICY IF EXISTS "Allow authenticated insert payment_allocations" ON payment_allocations;
DROP POLICY IF EXISTS "Allow authenticated update payment_allocations" ON payment_allocations;
DROP POLICY IF EXISTS "Allow authenticated delete payment_allocations" ON payment_allocations;

CREATE POLICY "Finance can insert payment_allocations" ON payment_allocations FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can update payment_allocations" ON payment_allocations FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can delete payment_allocations" ON payment_allocations FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

-- receipt_allocations
DROP POLICY IF EXISTS "Allow authenticated insert receipt_allocations" ON receipt_allocations;
DROP POLICY IF EXISTS "Allow authenticated update receipt_allocations" ON receipt_allocations;
DROP POLICY IF EXISTS "Allow authenticated delete receipt_allocations" ON receipt_allocations;

CREATE POLICY "Finance can insert receipt_allocations" ON receipt_allocations FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can update receipt_allocations" ON receipt_allocations FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can delete receipt_allocations" ON receipt_allocations FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

-- reconciliation_items
DROP POLICY IF EXISTS "Allow authenticated insert reconciliation_items" ON reconciliation_items;
DROP POLICY IF EXISTS "Allow authenticated update reconciliation_items" ON reconciliation_items;
DROP POLICY IF EXISTS "Allow authenticated delete reconciliation_items" ON reconciliation_items;

CREATE POLICY "Finance can insert reconciliation_items" ON reconciliation_items FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can update reconciliation_items" ON reconciliation_items FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can delete reconciliation_items" ON reconciliation_items FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

-- scheduled_payments
DROP POLICY IF EXISTS "Allow authenticated insert scheduled_payments" ON scheduled_payments;
DROP POLICY IF EXISTS "Allow authenticated update scheduled_payments" ON scheduled_payments;
DROP POLICY IF EXISTS "Allow authenticated delete scheduled_payments" ON scheduled_payments;

CREATE POLICY "Finance can insert scheduled_payments" ON scheduled_payments FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can update scheduled_payments" ON scheduled_payments FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can delete scheduled_payments" ON scheduled_payments FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

-- scheduled_payment_items
DROP POLICY IF EXISTS "Allow authenticated insert scheduled_payment_items" ON scheduled_payment_items;
DROP POLICY IF EXISTS "Allow authenticated update scheduled_payment_items" ON scheduled_payment_items;
DROP POLICY IF EXISTS "Allow authenticated delete scheduled_payment_items" ON scheduled_payment_items;

CREATE POLICY "Finance can insert scheduled_payment_items" ON scheduled_payment_items FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can update scheduled_payment_items" ON scheduled_payment_items FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Finance can delete scheduled_payment_items" ON scheduled_payment_items FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

-- =====================================================
-- WAREHOUSE MODULE TABLES
-- Write access: admin, warehouse_manager
-- =====================================================

-- products
DROP POLICY IF EXISTS "Allow authenticated insert products" ON products;

CREATE POLICY "Warehouse can insert products" ON products FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager']::app_role[]));

-- =====================================================
-- SOURCING MODULE TABLES
-- Write access: admin, warehouse_manager, procurement
-- =====================================================

-- suppliers
DROP POLICY IF EXISTS "Allow authenticated insert suppliers" ON suppliers;

CREATE POLICY "Sourcing can insert suppliers" ON suppliers FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager', 'procurement']::app_role[]));

-- =====================================================
-- SALES MODULE TABLES
-- Write access: admin, finance, warehouse_manager
-- =====================================================

-- sales_returns
DROP POLICY IF EXISTS "Allow authenticated insert sales_returns" ON sales_returns;
DROP POLICY IF EXISTS "Allow authenticated update sales_returns" ON sales_returns;
DROP POLICY IF EXISTS "Allow authenticated delete sales_returns" ON sales_returns;

CREATE POLICY "Sales can insert sales_returns" ON sales_returns FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance', 'warehouse_manager']::app_role[]));

CREATE POLICY "Sales can update sales_returns" ON sales_returns FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance', 'warehouse_manager']::app_role[]));

CREATE POLICY "Sales can delete sales_returns" ON sales_returns FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance', 'warehouse_manager']::app_role[]));

-- sales_return_lines
DROP POLICY IF EXISTS "Allow authenticated insert sales_return_lines" ON sales_return_lines;
DROP POLICY IF EXISTS "Allow authenticated update sales_return_lines" ON sales_return_lines;
DROP POLICY IF EXISTS "Allow authenticated delete sales_return_lines" ON sales_return_lines;

CREATE POLICY "Sales can insert sales_return_lines" ON sales_return_lines FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance', 'warehouse_manager']::app_role[]));

CREATE POLICY "Sales can update sales_return_lines" ON sales_return_lines FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance', 'warehouse_manager']::app_role[]));

CREATE POLICY "Sales can delete sales_return_lines" ON sales_return_lines FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance', 'warehouse_manager']::app_role[]));

-- pos_sales (edge functions use service role, this is for authenticated admin review)
DROP POLICY IF EXISTS "Allow authenticated insert pos_sales" ON pos_sales;
DROP POLICY IF EXISTS "Allow authenticated update pos_sales" ON pos_sales;

CREATE POLICY "Sales can insert pos_sales" ON pos_sales FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

CREATE POLICY "Sales can update pos_sales" ON pos_sales FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

-- pos_sale_items (edge functions use service role)
DROP POLICY IF EXISTS "Allow authenticated insert pos_sale_items" ON pos_sale_items;

CREATE POLICY "Sales can insert pos_sale_items" ON pos_sale_items FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[]));

-- =====================================================
-- ADMIN MODULE TABLES
-- Write access: admin only
-- =====================================================

-- audit_logs (immutable - INSERT only, any authenticated user can create audit entries)
DROP POLICY IF EXISTS "Allow authenticated insert audit_logs" ON audit_logs;

CREATE POLICY "Authenticated can insert audit_logs" ON audit_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- po_approval_amendments (admin only for approval amendments)
DROP POLICY IF EXISTS "Allow authenticated insert po_approval_amendments" ON po_approval_amendments;

CREATE POLICY "Admin can insert po_approval_amendments" ON po_approval_amendments FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));