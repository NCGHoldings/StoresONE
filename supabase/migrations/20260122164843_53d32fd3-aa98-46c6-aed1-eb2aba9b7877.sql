-- First, drop the existing restrictive policy on user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- Create new policy allowing users to view own roles OR admins to view all
CREATE POLICY "Users can view own roles or admins can view all"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);

-- Allow admins to insert roles for any user
CREATE POLICY "Admins can assign roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update roles
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete roles
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);

-- Drop old restrictive profile view policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Upgrade sudarakap@lyceumglobal.co to admin
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = 'e732da27-45fe-4e3d-9a79-a98b639b27d8';