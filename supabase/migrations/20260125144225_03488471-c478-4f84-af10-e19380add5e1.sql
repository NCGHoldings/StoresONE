-- Fix missing RLS policies for approval_steps table

-- Drop the anon-only select policy (too restrictive for authenticated users)
DROP POLICY IF EXISTS "Anon can read steps" ON public.approval_steps;

-- Allow all authenticated users to view workflow steps
CREATE POLICY "Authenticated users can view steps" 
ON public.approval_steps 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow admin role to insert new steps
CREATE POLICY "Admin can insert steps" 
ON public.approval_steps 
FOR INSERT 
TO authenticated 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admin role to update existing steps
CREATE POLICY "Admin can update steps" 
ON public.approval_steps 
FOR UPDATE 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admin role to delete steps
CREATE POLICY "Admin can delete steps" 
ON public.approval_steps 
FOR DELETE 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));