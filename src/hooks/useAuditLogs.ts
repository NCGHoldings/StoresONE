import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

export interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  user_id: string | null;
  old_values: Json | null;
  new_values: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string | null;
  // Joined data
  user_name?: string | null;
  user_email?: string | null;
}

export interface AuditLogFilters {
  userId?: string | null;
  action?: string | null;
  entityType?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  search?: string;
}

// Fetch audit logs with filters
export function useAuditLogs(filters: AuditLogFilters = {}) {
  return useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: async (): Promise<AuditLog[]> => {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (filters.userId) {
        query = query.eq("user_id", filters.userId);
      }
      if (filters.action) {
        query = query.eq("action", filters.action);
      }
      if (filters.entityType) {
        query = query.eq("entity_type", filters.entityType);
      }
      if (filters.startDate) {
        query = query.gte("created_at", filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query = query.lte("created_at", filters.endDate.toISOString());
      }
      if (filters.search) {
        query = query.or(`entity_id.ilike.%${filters.search}%,action.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get user profiles for the logs
      const userIds = [...new Set(data?.map((log) => log.user_id).filter(Boolean) as string[])];
      
      let profiles: Record<string, { full_name: string | null; email: string | null }> = {};
      
      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);
        
        profileData?.forEach((p) => {
          profiles[p.id] = { full_name: p.full_name, email: p.email };
        });
      }

      // Merge logs with user info
      return (data || []).map((log) => ({
        ...log,
        user_name: log.user_id ? profiles[log.user_id]?.full_name : null,
        user_email: log.user_id ? profiles[log.user_id]?.email : null,
      }));
    },
  });
}

// Get unique actions for filter dropdown
export function useAuditActions() {
  return useQuery({
    queryKey: ["audit-actions"],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("action")
        .limit(1000);

      if (error) throw error;

      const actions = [...new Set(data?.map((d) => d.action))];
      return actions.sort();
    },
  });
}

// Get unique entity types for filter dropdown
export function useAuditEntityTypes() {
  return useQuery({
    queryKey: ["audit-entity-types"],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("entity_type")
        .limit(1000);

      if (error) throw error;

      const types = [...new Set(data?.map((d) => d.entity_type))];
      return types.sort();
    },
  });
}

// Get audit log stats
export function useAuditLogStats() {
  return useQuery({
    queryKey: ["audit-log-stats"],
    queryFn: async () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from("audit_logs")
        .select("action, created_at")
        .gte("created_at", weekAgo.toISOString());

      if (error) throw error;

      const total = data?.length || 0;
      const todayCount = data?.filter((d) => 
        new Date(d.created_at || "").toDateString() === today.toDateString()
      ).length || 0;

      // Count by action type
      const byAction: Record<string, number> = {};
      data?.forEach((d) => {
        byAction[d.action] = (byAction[d.action] || 0) + 1;
      });

      return {
        total,
        today: todayCount,
        thisWeek: total,
        byAction,
      };
    },
  });
}

// Action display labels
export const ACTION_LABELS: Record<string, string> = {
  CREATE: "Created",
  UPDATE: "Updated",
  DELETE: "Deleted",
  LOGIN: "Logged in",
  LOGOUT: "Logged out",
  LOGIN_FAILED: "Login failed",
  ROLE_ASSIGNED: "Role assigned",
  ROLE_REMOVED: "Role removed",
  STATUS_CHANGE: "Status changed",
  APPROVAL: "Approved",
  EXPORT: "Exported",
  IMPORT: "Imported",
};

// Action colors for badges
export const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  LOGIN: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  LOGOUT: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  LOGIN_FAILED: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  ROLE_ASSIGNED: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  ROLE_REMOVED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  STATUS_CHANGE: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  APPROVAL: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
};

// Entity type labels
export const ENTITY_LABELS: Record<string, string> = {
  user: "User",
  role: "Role",
  profile: "Profile",
  purchase_order: "Purchase Order",
  invoice: "Invoice",
  supplier: "Supplier",
  inventory: "Inventory",
  product: "Product",
  stock_transfer: "Stock Transfer",
  contract: "Contract",
  config: "Configuration",
};
