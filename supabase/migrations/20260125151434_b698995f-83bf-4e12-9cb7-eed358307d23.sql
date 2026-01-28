CREATE OR REPLACE FUNCTION public.audit_trigger_fn()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO audit_logs (
    entity_type, entity_id, action,
    old_values, new_values, user_id,
    change_type, module
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END,
    auth.uid(),
    TG_OP,
    CASE 
      WHEN TG_TABLE_NAME LIKE '%purchase%' OR TG_TABLE_NAME LIKE '%supplier%' THEN 'MM'
      WHEN TG_TABLE_NAME LIKE '%invoice%' OR TG_TABLE_NAME LIKE '%payment%' THEN 'FI'
      WHEN TG_TABLE_NAME LIKE '%sales%' OR TG_TABLE_NAME LIKE '%customer%' THEN 'SD'
      WHEN TG_TABLE_NAME LIKE '%inventory%' OR TG_TABLE_NAME LIKE '%batch%' THEN 'WM'
      ELSE 'SYS'
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$function$;