import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAudit, AuditActions, EntityTypes } from "@/lib/auditLog";

export interface SystemConfigItem {
  key: string;
  value: unknown;
  category: string;
  description: string | null;
  updated_at: string | null;
  updated_by: string | null;
}

export interface SystemConfigByCategory {
  organization: SystemConfigItem[];
  users: SystemConfigItem[];
  inventory: SystemConfigItem[];
  procurement: SystemConfigItem[];
  finance: SystemConfigItem[];
}

// Fetch all system configuration
export function useSystemConfig() {
  return useQuery({
    queryKey: ["system-config"],
    queryFn: async (): Promise<SystemConfigItem[]> => {
      const { data, error } = await supabase
        .from("system_config")
        .select("*")
        .order("category", { ascending: true });

      if (error) throw error;

      // Parse JSONB values
      return (data || []).map((item) => ({
        ...item,
        value: item.value,
      }));
    },
  });
}

// Get config grouped by category
export function useSystemConfigByCategory() {
  const { data, ...rest } = useSystemConfig();

  const grouped = useMemo(() => {
    const result: SystemConfigByCategory = {
      organization: [],
      users: [],
      inventory: [],
      procurement: [],
      finance: [],
    };

    data?.forEach((item) => {
      const category = item.category as keyof SystemConfigByCategory;
      if (result[category]) {
        result[category].push(item);
      }
    });

    return result;
  }, [data]);

  return { data: grouped, ...rest };
}

// Get a single config value
export function useConfigValue<T>(key: string, defaultValue: T): T {
  const { data } = useSystemConfig();
  const item = data?.find((c) => c.key === key);
  return item?.value !== undefined ? (item.value as T) : defaultValue;
}

// Update a single config value
export function useUpdateConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      key,
      value,
    }: {
      key: string;
      value: unknown;
    }) => {
      const { data: userData } = await supabase.auth.getUser();

      // Get old value for audit
      const { data: oldData } = await supabase
        .from("system_config")
        .select("value")
        .eq("key", key)
        .single();

      const { error } = await supabase
        .from("system_config")
        .update({
          value: value as never,
          updated_by: userData?.user?.id,
        })
        .eq("key", key);

      if (error) throw error;

      // Log audit
      await logAudit({
        action: AuditActions.UPDATE,
        entityType: EntityTypes.CONFIG,
        entityId: key,
        oldValues: { value: oldData?.value },
        newValues: { value },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-config"] });
      toast.success("Configuration updated");
    },
    onError: (error) => {
      toast.error(`Failed to update configuration: ${error.message}`);
    },
  });
}

// Bulk update config values
export function useBulkUpdateConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Array<{ key: string; value: unknown }>) => {
      const { data: userData } = await supabase.auth.getUser();

      // Get current values first for comparison
      const { data: currentConfig } = await supabase
        .from("system_config")
        .select("key, value")
        .in("key", updates.map((u) => u.key));

      // Build old values map
      const oldValuesMap: Record<string, unknown> = {};
      currentConfig?.forEach((c) => {
        oldValuesMap[c.key] = c.value;
      });

      // Filter to only actually changed values
      const changedUpdates = updates.filter(
        (u) => JSON.stringify(oldValuesMap[u.key]) !== JSON.stringify(u.value)
      );

      // Update only changed values
      for (const update of changedUpdates) {
        const { error } = await supabase
          .from("system_config")
          .update({
            value: update.value as never,
            updated_by: userData?.user?.id,
          })
          .eq("key", update.key);

        if (error) throw error;
      }

      // Log audit with old/new values if there were changes
      if (changedUpdates.length > 0) {
        await logAudit({
          action: AuditActions.UPDATE,
          entityType: EntityTypes.CONFIG,
          entityId: changedUpdates.length === 1 ? changedUpdates[0].key : "bulk",
          oldValues: Object.fromEntries(
            changedUpdates.map((u) => [u.key, oldValuesMap[u.key]])
          ),
          newValues: Object.fromEntries(
            changedUpdates.map((u) => [u.key, u.value])
          ),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-config"] });
      queryClient.invalidateQueries({ queryKey: ["config-change-history"] });
      toast.success("Configuration saved");
    },
    onError: (error) => {
      toast.error(`Failed to save configuration: ${error.message}`);
    },
  });
}

// Configuration categories with labels and icons
export const CONFIG_CATEGORIES = [
  { id: "organization", label: "Organization", icon: "Building2" },
  { id: "users", label: "Users & Security", icon: "Users" },
  { id: "inventory", label: "Inventory", icon: "Package" },
  { id: "procurement", label: "Procurement", icon: "ShoppingCart" },
  { id: "finance", label: "Finance", icon: "DollarSign" },
] as const;

// Config field display names
export const CONFIG_LABELS: Record<string, string> = {
  company_name: "Company Name",
  default_currency: "Default Currency",
  date_format: "Date Format",
  timezone: "Timezone",
  default_user_role: "Default User Role",
  session_timeout_minutes: "Session Timeout (minutes)",
  require_2fa: "Require Two-Factor Auth",
  low_stock_threshold: "Low Stock Threshold",
  auto_reorder_enabled: "Auto Reorder",
  default_uom: "Default Unit of Measure",
  po_number_prefix: "PO Number Prefix",
  default_payment_terms: "Default Payment Terms (days)",
  require_po_approval: "Require PO Approval",
  approval_threshold: "Approval Threshold ($)",
  fiscal_year_start: "Fiscal Year Start",
  default_tax_rate: "Default Tax Rate (%)",
};
