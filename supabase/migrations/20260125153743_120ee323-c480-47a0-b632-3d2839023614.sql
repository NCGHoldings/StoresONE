-- Fix RLS policy for notifications INSERT - restrict to proper conditions
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Notifications can only be inserted by:
-- 1. The system via triggers (SECURITY DEFINER functions)
-- 2. Edge functions using service role
-- So we actually don't need an INSERT policy for regular authenticated users
-- The SECURITY DEFINER functions bypass RLS

-- Add delete policy for users to clean up their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
TO authenticated
USING (user_id = auth.uid());