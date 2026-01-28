-- Enable RLS on invoices table (if not already enabled)
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to recreate them properly
DROP POLICY IF EXISTS "Authenticated users can view invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can view all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Finance roles can view invoices" ON public.invoices;
DROP POLICY IF EXISTS "Finance roles can insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "Finance roles can update invoices" ON public.invoices;
DROP POLICY IF EXISTS "Finance roles can delete invoices" ON public.invoices;

-- Create SELECT policy - only admin, finance, procurement, and controller can view
CREATE POLICY "Finance roles can view invoices" 
ON public.invoices 
FOR SELECT 
TO authenticated
USING (
  public.has_any_role(auth.uid(), ARRAY['admin', 'finance', 'procurement', 'controller']::app_role[])
);

-- Create INSERT policy - only admin and finance can create invoices
CREATE POLICY "Finance roles can insert invoices" 
ON public.invoices 
FOR INSERT 
TO authenticated
WITH CHECK (
  public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[])
);

-- Create UPDATE policy - only admin and finance can update invoices
CREATE POLICY "Finance roles can update invoices" 
ON public.invoices 
FOR UPDATE 
TO authenticated
USING (
  public.has_any_role(auth.uid(), ARRAY['admin', 'finance']::app_role[])
);

-- Create DELETE policy - only admin can delete invoices
CREATE POLICY "Finance roles can delete invoices" 
ON public.invoices 
FOR DELETE 
TO authenticated
USING (
  public.has_any_role(auth.uid(), ARRAY['admin']::app_role[])
);