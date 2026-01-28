-- Add batch tracking flag to products
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS batch_tracked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS serial_tracked BOOLEAN DEFAULT false;

-- Create inventory_batches table for batch/lot tracking
CREATE TABLE public.inventory_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  supplier_batch_ref TEXT,
  po_id UUID REFERENCES purchase_orders(id),
  po_line_id UUID REFERENCES purchase_order_lines(id),
  manufacturing_date DATE,
  expiry_date DATE,
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  received_by UUID REFERENCES profiles(id),
  initial_quantity INTEGER NOT NULL DEFAULT 0,
  current_quantity INTEGER NOT NULL DEFAULT 0,
  bin_id UUID REFERENCES storage_bins(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'quarantine', 'expired', 'consumed')),
  quality_status TEXT DEFAULT 'pending' CHECK (quality_status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, batch_number)
);

-- Add batch reference to inventory_transactions
ALTER TABLE inventory_transactions 
  ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES inventory_batches(id);

-- Enable RLS on inventory_batches
ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventory_batches
CREATE POLICY "Users can view inventory batches" 
  ON inventory_batches FOR SELECT 
  USING (true);

CREATE POLICY "Warehouse managers and procurement can insert batches" 
  ON inventory_batches FOR INSERT 
  WITH CHECK (
    public.has_role(auth.uid(), 'warehouse_manager') OR 
    public.has_role(auth.uid(), 'procurement') OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Warehouse managers can update batches" 
  ON inventory_batches FOR UPDATE 
  USING (
    public.has_role(auth.uid(), 'warehouse_manager') OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete batches" 
  ON inventory_batches FOR DELETE 
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_inventory_batches_updated_at
  BEFORE UPDATE ON inventory_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index for common queries
CREATE INDEX idx_inventory_batches_product ON inventory_batches(product_id);
CREATE INDEX idx_inventory_batches_batch_number ON inventory_batches(batch_number);
CREATE INDEX idx_inventory_batches_expiry ON inventory_batches(expiry_date);
CREATE INDEX idx_inventory_batches_status ON inventory_batches(status);