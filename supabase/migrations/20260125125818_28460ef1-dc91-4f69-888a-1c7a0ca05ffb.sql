-- Fix: Audit Logs Accessible to All Authenticated Users
-- Drop the overly permissive policy that allows all authenticated users to view all audit logs

DROP POLICY IF EXISTS "Authenticated users can view audit logs" ON public.audit_logs;

-- Ensure admin-only access policy exists (may already exist from previous migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'audit_logs' 
    AND policyname = 'Admins can view all audit logs'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can view all audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''admin''::app_role))';
  END IF;
END $$;

-- Add policy for users to view their own audit entries (privacy-friendly)
DROP POLICY IF EXISTS "Users can view own audit entries" ON public.audit_logs;
CREATE POLICY "Users can view own audit entries" 
ON public.audit_logs FOR SELECT TO authenticated 
USING (user_id = auth.uid());