-- Add lock columns to purchase_orders
ALTER TABLE purchase_orders 
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES auth.users(id);

-- Create po_approval_amendments table for tracking changes during approval
CREATE TABLE IF NOT EXISTS po_approval_amendments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE NOT NULL,
  approval_request_id UUID REFERENCES approval_requests(id),
  approval_step_id UUID REFERENCES approval_steps(id),
  amended_by UUID REFERENCES profiles(id),
  amendment_type TEXT NOT NULL CHECK (amendment_type IN ('line_add', 'line_remove', 'line_update', 'quantity_update', 'price_update')),
  line_id UUID REFERENCES purchase_order_lines(id) ON DELETE SET NULL,
  field_name TEXT,
  old_value JSONB,
  new_value JSONB,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE po_approval_amendments ENABLE ROW LEVEL SECURITY;

-- RLS policies for po_approval_amendments
CREATE POLICY "Users can view all amendments" 
ON po_approval_amendments 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can create amendments" 
ON po_approval_amendments 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Trigger to prevent updates on locked POs
CREATE OR REPLACE FUNCTION prevent_locked_po_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow updates that only change the lock status
  IF OLD.is_locked = true AND 
     (NEW.status IS DISTINCT FROM OLD.status OR
      NEW.notes IS DISTINCT FROM OLD.notes OR
      NEW.total_amount IS DISTINCT FROM OLD.total_amount OR
      NEW.expected_delivery IS DISTINCT FROM OLD.expected_delivery) THEN
    RAISE EXCEPTION 'Cannot modify a locked Purchase Order';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_po_lock
BEFORE UPDATE ON purchase_orders
FOR EACH ROW
WHEN (OLD.is_locked = true)
EXECUTE FUNCTION prevent_locked_po_update();

-- Trigger to prevent updates on lines of locked POs
CREATE OR REPLACE FUNCTION prevent_locked_po_line_update()
RETURNS TRIGGER AS $$
DECLARE
  po_locked BOOLEAN;
BEGIN
  SELECT is_locked INTO po_locked FROM purchase_orders WHERE id = COALESCE(NEW.po_id, OLD.po_id);
  IF po_locked = true THEN
    RAISE EXCEPTION 'Cannot modify lines of a locked Purchase Order';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_po_line_lock
BEFORE INSERT OR UPDATE OR DELETE ON purchase_order_lines
FOR EACH ROW
EXECUTE FUNCTION prevent_locked_po_line_update();

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_po_approval_amendments_po_id ON po_approval_amendments(po_id);
CREATE INDEX IF NOT EXISTS idx_po_approval_amendments_created_at ON po_approval_amendments(created_at DESC);