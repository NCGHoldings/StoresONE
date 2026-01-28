import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type SecurityEventType = 
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'ROLE_ASSIGNMENT'
  | 'ROLE_REMOVAL'
  | 'ROLE_ESCALATION_ATTEMPT'
  | 'ACCESS_DENIED'
  | 'SESSION_TIMEOUT'
  | 'SOD_CONFLICT_DETECTED'
  | 'SENSITIVE_DATA_ACCESS'
  | 'BULK_OPERATION'
  | 'EXPORT_DATA'
  | 'IMPORT_DATA'
  | 'CONFIG_CHANGE'
  | 'DUAL_APPROVAL_REQUIRED'
  | 'APPROVAL_GRANTED'
  | 'APPROVAL_DENIED';

interface SecurityEventDetails {
  [key: string]: unknown;
}

export function useSecurityEvents() {
  const { user, session } = useAuth();

  /**
   * Log a security-relevant event to the audit trail
   */
  const logSecurityEvent = useCallback(async (
    event: SecurityEventType,
    details: SecurityEventDetails = {}
  ) => {
    try {
      const { error } = await supabase.from('audit_logs').insert({
        user_id: user?.id || null,
        entity_type: 'security',
        entity_id: null,
        action: event,
        new_values: {
          ...details,
          timestamp: new Date().toISOString(),
          user_email: user?.email,
          session_id: session?.access_token?.substring(0, 8), // First 8 chars for reference
        },
        ip_address: null, // Could be captured from request headers
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      });

      if (error) {
        console.error('Failed to log security event:', error);
      }
    } catch (err) {
      // Don't throw - security logging should never break the app
      console.error('Error logging security event:', err);
    }
  }, [user, session]);

  /**
   * Log access denied event
   */
  const logAccessDenied = useCallback((
    route: string, 
    requiredPermission?: string
  ) => {
    return logSecurityEvent('ACCESS_DENIED', {
      route,
      requiredPermission,
    });
  }, [logSecurityEvent]);

  /**
   * Log role escalation attempt
   */
  const logRoleEscalationAttempt = useCallback((
    targetRole: string,
    targetUserId?: string
  ) => {
    return logSecurityEvent('ROLE_ESCALATION_ATTEMPT', {
      targetRole,
      targetUserId,
    });
  }, [logSecurityEvent]);

  /**
   * Log sensitive data access
   */
  const logSensitiveDataAccess = useCallback((
    dataType: string,
    recordId?: string,
    details?: Record<string, unknown>
  ) => {
    return logSecurityEvent('SENSITIVE_DATA_ACCESS', {
      dataType,
      recordId,
      ...details,
    });
  }, [logSecurityEvent]);

  /**
   * Log bulk operation
   */
  const logBulkOperation = useCallback((
    operation: string,
    recordCount: number,
    entityType: string
  ) => {
    return logSecurityEvent('BULK_OPERATION', {
      operation,
      recordCount,
      entityType,
    });
  }, [logSecurityEvent]);

  /**
   * Log configuration change
   */
  const logConfigChange = useCallback((
    configKey: string,
    oldValue: unknown,
    newValue: unknown
  ) => {
    return logSecurityEvent('CONFIG_CHANGE', {
      configKey,
      oldValue,
      newValue,
    });
  }, [logSecurityEvent]);

  return {
    logSecurityEvent,
    logAccessDenied,
    logRoleEscalationAttempt,
    logSensitiveDataAccess,
    logBulkOperation,
    logConfigChange,
  };
}
