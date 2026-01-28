-- Add RLS policies for admin_users table
-- This table stores admin user IDs and should only be accessible to admins

-- SELECT: Only admins can view the admin users list
CREATE POLICY "Admins can view admin_users"
ON public.admin_users
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- INSERT: Only admins can add new admin users
CREATE POLICY "Admins can insert admin_users"
ON public.admin_users
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- DELETE: Only admins can remove admin users
CREATE POLICY "Admins can delete admin_users"
ON public.admin_users
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));