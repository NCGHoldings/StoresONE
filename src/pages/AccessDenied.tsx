import { Link } from 'react-router-dom';
import { ShieldX, Home, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export default function AccessDenied() {
  const { signOut, roles, moduleAccess } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <ShieldX className="w-8 h-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription className="text-base">
            You don't have permission to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            If you believe this is an error, please contact your administrator to request the appropriate access level.
          </p>
          
          {roles.length > 0 && (
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md text-left">
              <p><strong>Your roles:</strong> {roles.join(', ')}</p>
              <p><strong>Module access:</strong> {moduleAccess.length > 0 ? moduleAccess.join(', ') : 'None'}</p>
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Return to Dashboard
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link to="/profile">
                <User className="mr-2 h-4 w-4" />
                Go to Profile
              </Link>
            </Button>
            
            <Button variant="ghost" className="w-full" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
