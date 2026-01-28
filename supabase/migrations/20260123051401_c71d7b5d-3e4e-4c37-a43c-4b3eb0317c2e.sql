-- Create grn_lines table to track line-level details for each GRN
CREATE TABLE public.grn_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grn_id UUID NOT NULL REFERENCES public.inbound_deliveries(id) ON DELETE CASCADE,
  po_line_id UUID NOT NULL REFERENCES public.purchase_order_lines(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity_received INTEGER NOT NULL DEFAULT 0,
  batch_id UUID REFERENCES public.inventory_batches(id),
  bin_id UUID REFERENCES public.storage_bins(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.grn_lines ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view GRN lines"
  ON public.grn_lines FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert GRN lines"
  ON public.grn_lines FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update GRN lines"
  ON public.grn_lines FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create index for faster lookups
CREATE INDEX idx_grn_lines_grn_id ON public.grn_lines(grn_id);
CREATE INDEX idx_grn_lines_po_line_id ON public.grn_lines(po_line_id);