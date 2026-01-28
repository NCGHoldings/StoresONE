-- =====================================================
-- FIX REMAINING PERMISSIVE POLICIES (BATCH 3)
-- Drop policies with actual names found in database
-- =====================================================

-- audit_logs
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON audit_logs;

CREATE POLICY "Audit insert any auth user" ON audit_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- bank_accounts
DROP POLICY IF EXISTS "Authenticated users can delete bank accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Authenticated users can insert bank accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Authenticated users can update bank accounts" ON bank_accounts;

-- bank_reconciliations  
DROP POLICY IF EXISTS "Authenticated users can delete bank reconciliations" ON bank_reconciliations;
DROP POLICY IF EXISTS "Authenticated users can insert bank reconciliations" ON bank_reconciliations;
DROP POLICY IF EXISTS "Authenticated users can update bank reconciliations" ON bank_reconciliations;

-- bank_transactions
DROP POLICY IF EXISTS "Authenticated users can delete bank transactions" ON bank_transactions;
DROP POLICY IF EXISTS "Authenticated users can insert bank transactions" ON bank_transactions;
DROP POLICY IF EXISTS "Authenticated users can update bank transactions" ON bank_transactions;

-- cheques
DROP POLICY IF EXISTS "Authenticated users can delete cheques" ON cheques;
DROP POLICY IF EXISTS "Authenticated users can insert cheques" ON cheques;
DROP POLICY IF EXISTS "Authenticated users can update cheques" ON cheques;

-- debit_note_applications
DROP POLICY IF EXISTS "Authenticated users can delete debit note applications" ON debit_note_applications;
DROP POLICY IF EXISTS "Authenticated users can create debit note applications" ON debit_note_applications;

-- debit_notes
DROP POLICY IF EXISTS "Users can delete debit notes" ON debit_notes;
DROP POLICY IF EXISTS "Users can create debit notes" ON debit_notes;
DROP POLICY IF EXISTS "Users can update debit notes" ON debit_notes;

-- fund_transfers
DROP POLICY IF EXISTS "Authenticated users can delete fund transfers" ON fund_transfers;
DROP POLICY IF EXISTS "Authenticated users can insert fund transfers" ON fund_transfers;
DROP POLICY IF EXISTS "Authenticated users can update fund transfers" ON fund_transfers;

-- payment_allocations
DROP POLICY IF EXISTS "Users can delete payment allocations" ON payment_allocations;
DROP POLICY IF EXISTS "Users can create payment allocations" ON payment_allocations;
DROP POLICY IF EXISTS "Users can update payment allocations" ON payment_allocations;

-- payment_batch_items
DROP POLICY IF EXISTS "Authenticated users can delete payment batch items" ON payment_batch_items;
DROP POLICY IF EXISTS "Authenticated users can insert payment batch items" ON payment_batch_items;
DROP POLICY IF EXISTS "Authenticated users can update payment batch items" ON payment_batch_items;

-- payment_batches
DROP POLICY IF EXISTS "Authenticated users can delete payment batches" ON payment_batches;
DROP POLICY IF EXISTS "Authenticated users can insert payment batches" ON payment_batches;
DROP POLICY IF EXISTS "Authenticated users can update payment batches" ON payment_batches;

-- po_approval_amendments
DROP POLICY IF EXISTS "Authenticated users can create amendments" ON po_approval_amendments;

-- pos_sale_items
DROP POLICY IF EXISTS "Service role can insert POS sale items" ON pos_sale_items;

-- pos_sales
DROP POLICY IF EXISTS "Service role can insert POS sales" ON pos_sales;
DROP POLICY IF EXISTS "Service role can update POS sales" ON pos_sales;