import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CONFIG_LABELS } from "@/hooks/useSystemConfig";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatDistanceToNow, format } from "date-fns";
import { ChevronDown, History, Settings } from "lucide-react";
import { useState } from "react";
import { Json } from "@/integrations/supabase/types";

interface ConfigChangeLog {
  id: string;
  action: string;
  entity_id: string | null;
  old_values: Json | null;
  new_values: Json | null;
  created_at: string | null;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
}

export function useConfigChangeHistory(limit = 50) {
  return useQuery({
    queryKey: ["config-change-history", limit],
    queryFn: async (): Promise<ConfigChangeLog[]> => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("entity_type", "config")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Fetch user profiles for display names
      const userIds = [...new Set(data?.map((log) => log.user_id).filter(Boolean))] as string[];
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

      return (
        data?.map((log) => ({
          ...log,
          user_name: log.user_id ? profiles[log.user_id]?.full_name : null,
          user_email: log.user_id ? profiles[log.user_id]?.email : null,
        })) || []
      );
    },
  });
}

function getInitials(name: string | null, email: string | null): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return "?";
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value).replace(/"/g, "");
}

interface ChangeItemProps {
  log: ConfigChangeLog;
}

function ChangeItem({ log }: ChangeItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  const userName = log.user_name || log.user_email || "Unknown User";
  const timeAgo = log.created_at
    ? formatDistanceToNow(new Date(log.created_at), { addSuffix: true })
    : "Unknown time";
  const fullDate = log.created_at
    ? format(new Date(log.created_at), "PPpp")
    : "";

  // Parse old and new values
  const oldValues = (log.old_values as Record<string, unknown>) || {};
  const newValues = (log.new_values as Record<string, unknown>) || {};

  // Get changed keys
  const changedKeys: string[] = [];
  if (newValues.updates && Array.isArray(newValues.updates)) {
    changedKeys.push(...(newValues.updates as string[]));
  } else if (log.entity_id && log.entity_id !== "bulk") {
    changedKeys.push(log.entity_id);
  } else {
    // Extract from old/new values
    const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);
    changedKeys.push(...allKeys);
  }

  const displayLabel =
    changedKeys.length === 1
      ? CONFIG_LABELS[changedKeys[0]] || changedKeys[0]
      : changedKeys.length > 1
      ? `${changedKeys.length} settings`
      : "Configuration";

  // Get actual value changes for display
  const valueChanges: Array<{ key: string; label: string; oldVal: unknown; newVal: unknown }> = [];
  
  if (oldValues.value !== undefined || newValues.value !== undefined) {
    // Single value change
    valueChanges.push({
      key: log.entity_id || "unknown",
      label: CONFIG_LABELS[log.entity_id || ""] || log.entity_id || "Value",
      oldVal: oldValues.value,
      newVal: newValues.value,
    });
  } else {
    // Multiple or bulk changes - extract from the objects
    changedKeys.forEach((key) => {
      if (oldValues[key] !== undefined || newValues[key] !== undefined) {
        valueChanges.push({
          key,
          label: CONFIG_LABELS[key] || key,
          oldVal: oldValues[key],
          newVal: newValues[key],
        });
      }
    });
  }

  const hasDetails = valueChanges.length > 0 && valueChanges.some(v => v.oldVal !== undefined || v.newVal !== undefined);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {getInitials(log.user_name, log.user_email)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium text-sm truncate">{userName}</span>
              <Badge variant="outline" className="text-xs shrink-0">
                Updated
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground shrink-0" title={fullDate}>
              {timeAgo}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <Settings className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{displayLabel}</span>
            {hasDetails && (
              <CollapsibleTrigger asChild>
                <button className="text-xs text-primary hover:underline flex items-center gap-0.5">
                  {isOpen ? "Hide" : "Show"} details
                  <ChevronDown
                    className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
              </CollapsibleTrigger>
            )}
          </div>

          <CollapsibleContent>
            {hasDetails && (
              <div className="mt-2 space-y-1.5 text-sm">
                {valueChanges.map((change, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-2 py-1.5 rounded bg-muted/50"
                  >
                    <span className="font-medium text-xs text-muted-foreground min-w-24">
                      {change.label}:
                    </span>
                    {change.oldVal !== undefined && (
                      <>
                        <span className="text-destructive line-through text-xs">
                          {formatValue(change.oldVal)}
                        </span>
                        <span className="text-muted-foreground">→</span>
                      </>
                    )}
                    <span className="text-primary font-medium text-xs">
                      {formatValue(change.newVal)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleContent>
        </div>
      </div>
    </Collapsible>
  );
}

export function ConfigChangeHistory() {
  const { data: logs, isLoading } = useConfigChangeHistory();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-lg">Change History</CardTitle>
            <CardDescription>
              Recent configuration changes and who made them
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg border">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="space-y-2">
              {logs.map((log) => (
                <ChangeItem key={log.id} log={log} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground font-medium">No changes recorded yet</p>
              <p className="text-sm text-muted-foreground">
                Configuration changes will appear here
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
