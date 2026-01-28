import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  moduleAccess: string[];
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  hasModuleAccess: (module: string) => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [moduleAccess, setModuleAccess] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileData) {
        setProfile(profileData);
      }

      // Fetch roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      const userRoles = rolesData?.map(r => r.role) || [];
      setRoles(userRoles);

      // Fetch module access for the user's roles
      if (userRoles.length > 0) {
        const { data: roleDescriptions } = await supabase
          .from('role_descriptions')
          .select('module_access')
          .in('role', userRoles);

        // Combine all module access arrays (union of all roles' permissions)
        const allModules = new Set<string>();
        roleDescriptions?.forEach(row => {
          row.module_access?.forEach((m: string) => allModules.add(m));
        });
        setModuleAccess(Array.from(allModules));
      } else {
        setModuleAccess([]);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // Defer Supabase calls with setTimeout to prevent deadlock
        if (currentSession?.user) {
          setTimeout(() => {
            fetchUserData(currentSession.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
          setModuleAccess([]);
        }

        if (event === 'SIGNED_OUT') {
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      
      if (existingSession?.user) {
        fetchUserData(existingSession.user.id).finally(() => {
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
    setModuleAccess([]);
  };

  const hasRole = (role: AppRole) => roles.includes(role);

  const hasAnyRole = (checkRoles: AppRole[]) => 
    checkRoles.some(role => roles.includes(role));

  // Check if user has access to a specific module
  const hasModuleAccess = (module: string): boolean => {
    // Admin role has access to everything
    if (roles.includes('admin')) return true;
    // Check if module is in the user's combined module access
    return moduleAccess.includes(module);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        moduleAccess,
        isLoading,
        signIn,
        signUp,
        signOut,
        hasRole,
        hasAnyRole,
        hasModuleAccess,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
