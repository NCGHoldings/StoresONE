import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export type AppRole = Database['public']['Enums']['app_role'];

export interface UserWithRoles {
  id: string;
  email: string | null;
  full_name: string | null;
  department: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  roles: AppRole[];
}

export function useUsers() {
  return useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async (): Promise<UserWithRoles[]> => {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Merge profiles with roles
      return (profiles || []).map(profile => ({
        ...profile,
        roles: (roles || [])
          .filter(r => r.user_id === profile.id)
          .map(r => r.role) as AppRole[]
      }));
    }
  });
}

export function useUserStats(users: UserWithRoles[] | undefined) {
  const totalUsers = users?.length || 0;
  const activeUsers = users?.filter(u => u.is_active !== false).length || 0;
  const inactiveUsers = totalUsers - activeUsers;
  
  const roleCounts = users?.reduce((acc, user) => {
    user.roles.forEach(role => {
      acc[role] = (acc[role] || 0) + 1;
    });
    return acc;
  }, {} as Record<AppRole, number>) || {};

  return { totalUsers, activeUsers, inactiveUsers, roleCounts };
}

export function useAssignRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });
      
      if (error) {
        // Check if it's a duplicate key error
        if (error.code === '23505') {
          throw new Error('User already has this role');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success('Role assigned successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign role');
    }
  });
}

export function useRemoveRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success('Role removed successfully');
    },
    onError: () => {
      toast.error('Failed to remove role');
    }
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
    },
    onError: () => {
      toast.error('Failed to update user status');
    }
  });
}

interface CreateUserParams {
  email: string;
  fullName: string;
  department?: string;
  phone?: string;
  roles: AppRole[];
  sendInvite: boolean;
  temporaryPassword?: string;
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateUserParams) => {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: params,
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success(data.message || 'User created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create user');
    },
  });
}

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Administrator',
  warehouse_manager: 'Warehouse Manager',
  procurement: 'Procurement',
  finance: 'Finance',
  viewer: 'Viewer',
  sales: 'Sales',
  controller: 'Controller',
};

export const ROLE_COLORS: Record<AppRole, string> = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  warehouse_manager: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  procurement: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
  finance: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400',
  sales: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  controller: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
};
