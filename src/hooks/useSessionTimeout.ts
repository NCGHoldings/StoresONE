import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { toast } from 'sonner';

const DEFAULT_TIMEOUT_MINUTES = 60;
const WARNING_BEFORE_TIMEOUT_MS = 60000; // 1 minute warning

export function useSessionTimeout() {
  const { user, signOut } = useAuth();
  const { data: config } = useSystemConfig();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const getTimeoutMinutes = useCallback((): number => {
    const configValue = config?.find(c => c.key === 'session_timeout_minutes')?.value;
    if (configValue) {
      const parsed = parseInt(String(configValue).replace(/"/g, ''), 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return DEFAULT_TIMEOUT_MINUTES;
  }, [config]);

  const resetTimeout = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }

    if (!user) return;

    const timeoutMs = getTimeoutMinutes() * 60 * 1000;
    
    // Set warning timer
    warningRef.current = setTimeout(() => {
      toast.warning('Your session will expire in 1 minute due to inactivity', {
        duration: 10000,
        action: {
          label: 'Stay signed in',
          onClick: () => resetTimeout(),
        },
      });
    }, timeoutMs - WARNING_BEFORE_TIMEOUT_MS);

    // Set logout timer
    timeoutRef.current = setTimeout(async () => {
      toast.error('Session expired due to inactivity');
      await signOut();
    }, timeoutMs);
  }, [user, getTimeoutMinutes, signOut]);

  // Track user activity
  useEffect(() => {
    if (!user) return;

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      const now = Date.now();
      // Only reset if more than 30 seconds since last activity
      if (now - lastActivityRef.current > 30000) {
        resetTimeout();
      }
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Initialize timeout
    resetTimeout();

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current);
      }
    };
  }, [user, resetTimeout]);

  return {
    resetTimeout,
    timeoutMinutes: getTimeoutMinutes(),
  };
}
