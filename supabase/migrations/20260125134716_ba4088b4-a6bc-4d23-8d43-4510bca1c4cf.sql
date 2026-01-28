-- Fix: General Ledger Publicly Readable - Restrict to finance and controller roles only

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view ledger" ON public.general_ledger;

-- Create restrictive policy for finance and controller roles only
CREATE POLICY "Finance and controller can view ledger" 
ON public.general_ledger FOR SELECT TO authenticated 
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'finance', 'controller']::app_role[]));

-- Ensure INSERT is also restricted to finance roles
DROP POLICY IF EXISTS "Authenticated users can create ledger entries" ON public.general_ledger;
CREATE POLICY "Finance can create ledger entries" 
ON public.general_ledger FOR INSERT TO authenticated 
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'finance', 'controller']::app_role[]));