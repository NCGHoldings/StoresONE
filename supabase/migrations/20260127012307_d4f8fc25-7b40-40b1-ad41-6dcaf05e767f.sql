-- Fix overly permissive RLS policies on credit_note_applications

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.credit_note_applications;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.credit_note_applications;

-- Create proper INSERT policy - allow authenticated users to insert their own applications
CREATE POLICY "Users can insert credit note applications" 
ON public.credit_note_applications 
FOR INSERT 
TO authenticated 
WITH CHECK (applied_by = auth.uid() OR applied_by IS NULL);

-- Create proper UPDATE policy - only allow updates by the user who applied or admins
CREATE POLICY "Users can update own credit note applications" 
ON public.credit_note_applications 
FOR UPDATE 
TO authenticated 
USING (applied_by = auth.uid() OR public.is_admin(auth.uid()));