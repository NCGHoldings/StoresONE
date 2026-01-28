-- Create putaway_tasks table
CREATE TABLE public.putaway_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_number TEXT UNIQUE NOT NULL,
  grn_id UUID REFERENCES public.inbound_deliveries(id),
  grn_line_id UUID REFERENCES public.grn_lines(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 0,
  source_location TEXT DEFAULT 'Receiving Dock',
  suggested_bin_id UUID REFERENCES public.storage_bins(id),
  assigned_bin_id UUID REFERENCES public.storage_bins(id),
  batch_id UUID REFERENCES public.inventory_batches(id),
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'normal' 
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to UUID REFERENCES public.profiles(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX idx_putaway_tasks_status ON public.putaway_tasks(status);
CREATE INDEX idx_putaway_tasks_grn_id ON public.putaway_tasks(grn_id);
CREATE INDEX idx_putaway_tasks_product_id ON public.putaway_tasks(product_id);
CREATE INDEX idx_putaway_tasks_assigned_to ON public.putaway_tasks(assigned_to);

-- Enable Row Level Security
ALTER TABLE public.putaway_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view putaway tasks" 
  ON public.putaway_tasks FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert putaway tasks" 
  ON public.putaway_tasks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update putaway tasks" 
  ON public.putaway_tasks FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete putaway tasks"
  ON public.putaway_tasks FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Updated_at trigger (reusing existing function)
CREATE TRIGGER update_putaway_tasks_updated_at
  BEFORE UPDATE ON public.putaway_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();