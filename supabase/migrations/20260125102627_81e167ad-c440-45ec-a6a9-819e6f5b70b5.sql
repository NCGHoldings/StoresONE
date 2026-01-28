-- Ensure viewer role has dashboard access
UPDATE public.role_descriptions 
SET module_access = ARRAY['dashboard']::text[],
    updated_at = now()
WHERE role = 'viewer';