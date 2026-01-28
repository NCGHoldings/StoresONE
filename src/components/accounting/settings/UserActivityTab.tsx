import { useState } from "react";
import { format } from "date-fns";
import { Activity, User, Clock, FileText, ChevronDown, ChevronRight, Filter, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { KPICard } from "../KPICard";
import {
  useAuditLogs,
  useAuditLogStats,
  useAuditActions,
  useAuditEntityTypes,
  ACTION_LABELS,
  ACTION_COLORS,
  ENTITY_LABELS,
  AuditLogFilters,
} from "@/hooks/useAuditLogs";

// Finance-relevant entity types
const FINANCE_ENTITY_TYPES = [
  "invoice",
  "customer_invoice",
  "vendor_payment",
  "customer_receipt",
  "general_ledger",
  "bank_transaction",
  "cost_center",
  "purchase_order",
  "credit_note",
  "debit_note",
];

export function UserActivityTab() {
  const [filters, setFilters] = useState<AuditLogFilters>({
    entityType: undefined,
    action: undefined,
    search: "",
  });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Apply finance filter by default
  const financeFilters = {
    ...filters,
    // If no specific entity type selected, we'll filter client-side for finance types
  };

  const { data: logs = [], isLoading, refetch } = useAuditLogs(financeFilters);
  const { data: stats } = useAuditLogStats();
  const { data: actions = [] } = useAuditActions();
  const { data: entityTypes = [] } = useAuditEntityTypes();

  // Filter to finance-relevant logs if no specific entity type selected
  const filteredLogs = filters.entityType
    ? logs
    : logs.filter((log) => FINANCE_ENTITY_TYPES.includes(log.entity_type));

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getActionBadgeClass = (action: string) => {
    return ACTION_COLORS[action] || "bg-gray-100 text-gray-800";
  };

  const formatEntityType = (type: string) => {
    return ENTITY_LABELS[type] || type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatJsonDiff = (oldValues: unknown, newValues: unknown) => {
    const old = oldValues as Record<string, unknown> | null;
    const newV = newValues as Record<string, unknown> | null;

    if (!old && !newV) return null;

    const allKeys = new Set([
      ...Object.keys(old || {}),
      ...Object.keys(newV || {}),
    ]);

    return (
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-medium text-muted-foreground mb-2">Previous Values</p>
          <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-32">
            {old ? JSON.stringify(old, null, 2) : "N/A"}
          </pre>
        </div>
        <div>
          <p className="font-medium text-muted-foreground mb-2">New Values</p>
          <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-32">
            {newV ? JSON.stringify(newV, null, 2) : "N/A"}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <KPICard
          icon={Activity}
          label="Total Events"
          value={stats?.total || 0}
          subtitle="This week"
          variant="primary"
        />
        <KPICard
          icon={Clock}
          label="Today"
          value={stats?.today || 0}
          subtitle="Activities"
          variant="default"
        />
        <KPICard
          icon={FileText}
          label="Creates"
          value={stats?.byAction?.CREATE || 0}
          subtitle="New records"
          variant="success"
        />
        <KPICard
          icon={User}
          label="Updates"
          value={stats?.byAction?.UPDATE || 0}
          subtitle="Modifications"
          variant="warning"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Search by entity ID..."
                value={filters.search || ""}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Entity Type</Label>
              <Select
                value={filters.entityType || "all"}
                onValueChange={(v) => setFilters({ ...filters, entityType: v === "all" ? undefined : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All finance types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Finance Types</SelectItem>
                  {FINANCE_ENTITY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatEntityType(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Action</Label>
              <Select
                value={filters.action || "all"}
                onValueChange={(v) => setFilters({ ...filters, action: v === "all" ? undefined : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {actions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {ACTION_LABELS[action] || action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setFilters({ entityType: undefined, action: undefined, search: "" })}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            Recent finance module activities (showing {filteredLogs.length} events)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No activity logs found matching your filters.</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Entity ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <Collapsible key={log.id} asChild>
                      <>
                        <TableRow className="cursor-pointer hover:bg-muted/50">
                          <TableCell>
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => toggleRow(log.id)}
                              >
                                {expandedRows.has(log.id) ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.created_at
                              ? format(new Date(log.created_at), "MMM dd, yyyy HH:mm:ss")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{log.user_name || "System"}</p>
                              <p className="text-xs text-muted-foreground">{log.user_email || "-"}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getActionBadgeClass(log.action)}>
                              {ACTION_LABELS[log.action] || log.action}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatEntityType(log.entity_type)}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {log.entity_id?.substring(0, 8) || "-"}
                          </TableCell>
                        </TableRow>
                        {expandedRows.has(log.id) && (
                          <TableRow>
                            <TableCell colSpan={6} className="bg-muted/30 p-4">
                              <CollapsibleContent>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="font-medium text-muted-foreground">IP Address</p>
                                      <p>{log.ip_address || "N/A"}</p>
                                    </div>
                                    <div>
                                      <p className="font-medium text-muted-foreground">Full Entity ID</p>
                                      <p className="font-mono text-xs">{log.entity_id || "N/A"}</p>
                                    </div>
                                  </div>
                                  {(log.old_values || log.new_values) && (
                                    <div>
                                      <p className="font-medium text-muted-foreground mb-2">Changes</p>
                                      {formatJsonDiff(log.old_values, log.new_values)}
                                    </div>
                                  )}
                                </div>
                              </CollapsibleContent>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    </Collapsible>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
