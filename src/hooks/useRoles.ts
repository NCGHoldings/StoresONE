import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database, Constants } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface RoleDescription {
  role: AppRole;
  description: string | null;
  module_access: string[] | null;
  updated_at: string | null;
  updated_by: string | null;
}

export interface RoleWithStats extends RoleDescription {
  userCount: number;
}

const ALL_ROLES = Constants.public.Enums.app_role;

// Fetch role descriptions from the database
export function useRoleDescriptions() {
  return useQuery({
    queryKey: ["role-descriptions"],
    queryFn: async (): Promise<RoleDescription[]> => {
      const { data, error } = await supabase
        .from("role_descriptions")
        .select("*");

      if (error) throw error;
      return data || [];
    },
  });
}

// Fetch roles with user counts
export function useRolesWithStats() {
  return useQuery({
    queryKey: ["roles-with-stats"],
    queryFn: async (): Promise<RoleWithStats[]> => {
      // Get role descriptions
      const { data: descriptions, error: descError } = await supabase
        .from("role_descriptions")
        .select("*");

      if (descError) throw descError;

      // Get user counts per role
      const { data: roleCounts, error: countError } = await supabase
        .from("user_roles")
        .select("role");

      if (countError) throw countError;

      // Count users per role
      const countMap: Record<string, number> = {};
      roleCounts?.forEach((ur) => {
        countMap[ur.role] = (countMap[ur.role] || 0) + 1;
      });

      // Merge descriptions with counts, ensuring all roles are represented
      const rolesWithStats: RoleWithStats[] = ALL_ROLES.map((role) => {
        const desc = descriptions?.find((d) => d.role === role);
        return {
          role,
          description: desc?.description || null,
          module_access: desc?.module_access || [],
          updated_at: desc?.updated_at || null,
          updated_by: desc?.updated_by || null,
          userCount: countMap[role] || 0,
        };
      });

      return rolesWithStats;
    },
  });
}

// Get users for a specific role
export function useUsersByRole(role: AppRole | null) {
  return useQuery({
    queryKey: ["users-by-role", role],
    enabled: !!role,
    queryFn: async () => {
      if (!role) return [];

      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          id,
          user_id,
          role
        `)
        .eq("role", role);

      if (error) throw error;

      // Get profile details for each user
      const userIds = data?.map((ur) => ur.user_id) || [];
      if (userIds.length === 0) return [];

      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, is_active")
        .in("id", userIds);

      if (profileError) throw profileError;

      return profiles || [];
    },
  });
}

// Update role description
export function useUpdateRoleDescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      role,
      description,
      moduleAccess,
    }: {
      role: AppRole;
      description: string;
      moduleAccess: string[];
    }) => {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("role_descriptions")
        .upsert({
          role,
          description,
          module_access: moduleAccess,
          updated_by: userData?.user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-descriptions"] });
      queryClient.invalidateQueries({ queryKey: ["roles-with-stats"] });
      toast.success("Role description updated");
    },
    onError: (error) => {
      toast.error(`Failed to update role: ${error.message}`);
    },
  });
}

// Module access labels for display
export const MODULE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  warehouse: "Warehouse",
  procurement: "Procurement",
  sourcing: "Sourcing",
  finance: "Finance",
  sales: "Sales",
  admin: "Administration",
};

// Role display labels
export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrator",
  warehouse_manager: "Warehouse Manager",
  procurement: "Procurement",
  finance: "Finance",
  viewer: "Viewer",
  sales: "Sales",
  controller: "Controller",
};

// Role colors for badges
export const ROLE_COLORS: Record<AppRole, string> = {
  admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  warehouse_manager: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  procurement: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  finance: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  viewer: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  sales: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  controller: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
};
