import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSecurityEvents } from '@/hooks/useSecurityEvents';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredModule?: string;
}

export function ProtectedRoute({ children, requiredModule }: ProtectedRouteProps) {
  const { user, roles, hasModuleAccess, isLoading } = useAuth();
  const location = useLocation();
  const { logAccessDenied } = useSecurityEvents();

  // Log access denied attempts
  useEffect(() => {
    if (!isLoading && user && requiredModule && !roles.includes('admin') && !hasModuleAccess(requiredModule)) {
      logAccessDenied(location.pathname, requiredModule);
    }
  }, [isLoading, user, requiredModule, roles, hasModuleAccess, location.pathname, logAccessDenied]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Admin has access to everything
  if (roles.includes('admin')) {
    return <>{children}</>;
  }

  // Check if user has access to the required module
  if (requiredModule && !hasModuleAccess(requiredModule)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
}
