-- Create enum for purchase return status
CREATE TYPE public.purchase_return_status AS ENUM (
  'draft',
  'pending_pickup',
  'shipped',
  'received_by_supplier',
  'credit_received',
  'cancelled'
);

-- Create enum for return reason
CREATE TYPE public.return_reason AS ENUM (
  'defective',
  'wrong_item',
  'damaged',
  'excess',
  'quality_issue',
  'other'
);

-- Create purchase_returns table
CREATE TABLE public.purchase_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number TEXT NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  purchase_order_id UUID REFERENCES public.purchase_orders(id),
  grn_id UUID REFERENCES public.inbound_deliveries(id),
  status public.purchase_return_status NOT NULL DEFAULT 'draft',
  return_reason public.return_reason NOT NULL DEFAULT 'defective',
  return_date DATE NOT NULL DEFAULT CURRENT_DATE,
  shipped_date DATE,
  received_date DATE,
  credit_date DATE,
  credit_note_number TEXT,
  total_amount NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create purchase_return_lines table
CREATE TABLE public.purchase_return_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID NOT NULL REFERENCES public.purchase_returns(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  po_line_id UUID REFERENCES public.purchase_order_lines(id),
  grn_line_id UUID REFERENCES public.grn_lines(id),
  batch_id UUID REFERENCES public.inventory_batches(id),
  bin_id UUID REFERENCES public.storage_bins(id),
  quantity_returned NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit_cost NUMERIC(12,2) DEFAULT 0,
  line_total NUMERIC(12,2) GENERATED ALWAYS AS (quantity_returned * unit_cost) STORED,
  reason_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_purchase_returns_supplier ON public.purchase_returns(supplier_id);
CREATE INDEX idx_purchase_returns_status ON public.purchase_returns(status);
CREATE INDEX idx_purchase_returns_po ON public.purchase_returns(purchase_order_id);
CREATE INDEX idx_purchase_returns_grn ON public.purchase_returns(grn_id);
CREATE INDEX idx_purchase_return_lines_return ON public.purchase_return_lines(return_id);
CREATE INDEX idx_purchase_return_lines_product ON public.purchase_return_lines(product_id);

-- Enable RLS
ALTER TABLE public.purchase_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_return_lines ENABLE ROW LEVEL SECURITY;

-- RLS policies for purchase_returns
CREATE POLICY "Authenticated users can view purchase returns"
ON public.purchase_returns FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users with warehouse or procurement roles can insert purchase returns"
ON public.purchase_returns FOR INSERT
TO authenticated
WITH CHECK (
  public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager', 'procurement']::app_role[])
);

CREATE POLICY "Users with warehouse or procurement roles can update purchase returns"
ON public.purchase_returns FOR UPDATE
TO authenticated
USING (
  public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager', 'procurement']::app_role[])
);

CREATE POLICY "Only admins can delete purchase returns"
ON public.purchase_returns FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);

-- RLS policies for purchase_return_lines
CREATE POLICY "Authenticated users can view purchase return lines"
ON public.purchase_return_lines FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users with warehouse or procurement roles can manage return lines"
ON public.purchase_return_lines FOR ALL
TO authenticated
USING (
  public.has_any_role(auth.uid(), ARRAY['admin', 'warehouse_manager', 'procurement']::app_role[])
);

-- Trigger to update updated_at
CREATE TRIGGER update_purchase_returns_updated_at
  BEFORE UPDATE ON public.purchase_returns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add audit trigger
CREATE TRIGGER audit_purchase_returns
  AFTER INSERT OR UPDATE OR DELETE ON public.purchase_returns
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

CREATE TRIGGER audit_purchase_return_lines
  AFTER INSERT OR UPDATE OR DELETE ON public.purchase_return_lines
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();