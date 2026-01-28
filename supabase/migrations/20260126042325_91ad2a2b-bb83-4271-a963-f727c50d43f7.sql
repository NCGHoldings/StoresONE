-- Fix 1: Add missing write policies for rfq_invited_suppliers
CREATE POLICY "Procurement can insert rfq_invited_suppliers" 
  ON public.rfq_invited_suppliers 
  FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

CREATE POLICY "Procurement can update rfq_invited_suppliers" 
  ON public.rfq_invited_suppliers 
  FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

CREATE POLICY "Procurement can delete rfq_invited_suppliers" 
  ON public.rfq_invited_suppliers 
  FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

-- Fix 2: Restrict purchase requisition visibility to procurement and admin roles only
DROP POLICY IF EXISTS "Authenticated users can view purchase requisitions" ON public.purchase_requisitions;
DROP POLICY IF EXISTS "Authenticated users can view pr lines" ON public.purchase_requisition_lines;

CREATE POLICY "Procurement can read purchase_requisitions" 
  ON public.purchase_requisitions 
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));

CREATE POLICY "Procurement can read purchase_requisition_lines" 
  ON public.purchase_requisition_lines 
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement']::app_role[]));