import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

export interface AuditLogParams {
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
}

/**
 * Log an audit event to the audit_logs table
 * This function is designed to be called from mutations to track changes
 */
export async function logAudit({
  action,
  entityType,
  entityId,
  oldValues,
  newValues,
}: AuditLogParams): Promise<void> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    
    await supabase.from('audit_logs').insert([{
      user_id: userData?.user?.id || null,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      old_values: oldValues as Json,
      new_values: newValues as Json,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    }]);
  } catch (error) {
    // Log errors but don't throw - audit logging should not break the main operation
    console.error('Failed to log audit event:', error);
  }
}

// Common action types
export const AuditActions = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  ROLE_ASSIGNED: 'ROLE_ASSIGNED',
  ROLE_REMOVED: 'ROLE_REMOVED',
  STATUS_CHANGE: 'STATUS_CHANGE',
  APPROVAL: 'APPROVAL',
  EXPORT: 'EXPORT',
  IMPORT: 'IMPORT',
} as const;

// Common entity types
export const EntityTypes = {
  USER: 'user',
  ROLE: 'role',
  PROFILE: 'profile',
  PURCHASE_ORDER: 'purchase_order',
  INVOICE: 'invoice',
  SUPPLIER: 'supplier',
  INVENTORY: 'inventory',
  PRODUCT: 'product',
  STOCK_TRANSFER: 'stock_transfer',
  CONTRACT: 'contract',
  CONFIG: 'config',
} as const;
