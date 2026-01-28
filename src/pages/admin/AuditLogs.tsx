import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Download, CalendarIcon, FileText, Clock, Activity, User } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import {
  useAuditLogs,
  useAuditActions,
  useAuditEntityTypes,
  useAuditLogStats,
  AuditLog,
  AuditLogFilters,
  ACTION_LABELS,
  ACTION_COLORS,
  ENTITY_LABELS,
} from "@/hooks/useAuditLogs";
import { Json } from "@/integrations/supabase/types";

export default function AuditLogs() {
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: logs, isLoading } = useAuditLogs(filters);
  const { data: actions } = useAuditActions();
  const { data: entityTypes } = useAuditEntityTypes();
  const { data: stats } = useAuditLogStats();

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search }));
  };

  const handleViewDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailOpen(true);
  };

  const handleExportCSV = () => {
    if (!logs || logs.length === 0) return;

    const headers = ["Timestamp", "User", "Action", "Entity Type", "Entity ID", "Details"];
    const rows = logs.map((log) => [
      log.created_at ? format(parseISO(log.created_at), "yyyy-MM-dd HH:mm:ss") : "",
      log.user_name || log.user_email || "System",
      log.action,
      log.entity_type,
      log.entity_id || "",
      JSON.stringify(log.new_values || log.old_values || {}),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFilters({});
    setSearch("");
  };

  return (
    <MainLayout>
      <PageHeader
        title="Audit Logs"
        subtitle="View system activity and security events"
      />

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={Activity}
            label="Today"
            value={stats?.today}
            iconColor="text-blue-500"
          />
          <StatCard
            icon={Clock}
            label="This Week"
            value={stats?.thisWeek}
            iconColor="text-green-500"
          />
          <StatCard
            icon={User}
            label="User Actions"
            value={stats?.byAction?.UPDATE || 0}
            iconColor="text-purple-500"
          />
          <StatCard
            icon={FileText}
            label="Total Logged"
            value={logs?.length}
            iconColor="text-orange-500"
          />
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Filters</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
                <Button size="sm" onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <div className="flex gap-2 flex-1 min-w-[200px]">
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button variant="secondary" onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              <Select
                value={filters.action || "all"}
                onValueChange={(v) =>
                  setFilters((prev) => ({ ...prev, action: v === "all" ? null : v }))
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {actions?.map((action) => (
                    <SelectItem key={action} value={action}>
                      {ACTION_LABELS[action] || action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.entityType || "all"}
                onValueChange={(v) =>
                  setFilters((prev) => ({ ...prev, entityType: v === "all" ? null : v }))
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  {entityTypes?.map((type) => (
                    <SelectItem key={type} value={type}>
                      {ENTITY_LABELS[type] || type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-40 justify-start text-left font-normal",
                      !filters.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.startDate
                      ? format(filters.startDate, "PP")
                      : "Start Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.startDate || undefined}
                    onSelect={(date) =>
                      setFilters((prev) => ({ ...prev, startDate: date }))
                    }
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-40 justify-start text-left font-normal",
                      !filters.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.endDate
                      ? format(filters.endDate, "PP")
                      : "End Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.endDate || undefined}
                    onSelect={(date) =>
                      setFilters((prev) => ({ ...prev, endDate: date }))
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>
              Showing {logs?.length || 0} entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-44">Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead className="w-20">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-8 w-14" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : logs && logs.length > 0 ? (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.created_at
                            ? format(parseISO(log.created_at), "MMM d, h:mm a")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {log.user_name || "System"}
                          </div>
                          {log.user_email && (
                            <div className="text-xs text-muted-foreground">
                              {log.user_email}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "text-xs",
                              ACTION_COLORS[log.action] || "bg-gray-100"
                            )}
                          >
                            {ACTION_LABELS[log.action] || log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {ENTITY_LABELS[log.entity_type] || log.entity_type}
                        </TableCell>
                        <TableCell className="font-mono text-xs truncate max-w-32">
                          {log.entity_id || "—"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(log)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <Activity className="h-12 w-12 mx-auto mb-2 opacity-30" />
                        <p className="text-muted-foreground">
                          No audit logs found
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              {selectedLog?.created_at &&
                format(parseISO(selectedLog.created_at), "MMMM d, yyyy 'at' h:mm:ss a")}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">User</Label>
                  <p className="font-medium">
                    {selectedLog.user_name || selectedLog.user_email || "System"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Action</Label>
                  <Badge className={ACTION_COLORS[selectedLog.action]}>
                    {ACTION_LABELS[selectedLog.action] || selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Entity Type</Label>
                  <p>{ENTITY_LABELS[selectedLog.entity_type] || selectedLog.entity_type}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Entity ID</Label>
                  <p className="font-mono text-sm">{selectedLog.entity_id || "—"}</p>
                </div>
              </div>

              {(selectedLog.old_values || selectedLog.new_values) && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Changes</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedLog.old_values && (
                      <div>
                        <p className="text-xs font-medium mb-1 text-red-600">Before</p>
                        <ScrollArea className="h-48 rounded border p-2 bg-red-50 dark:bg-red-950/20">
                          <pre className="text-xs whitespace-pre-wrap">
                            {JSON.stringify(selectedLog.old_values, null, 2)}
                          </pre>
                        </ScrollArea>
                      </div>
                    )}
                    {selectedLog.new_values && (
                      <div>
                        <p className="text-xs font-medium mb-1 text-green-600">After</p>
                        <ScrollArea className="h-48 rounded border p-2 bg-green-50 dark:bg-green-950/20">
                          <pre className="text-xs whitespace-pre-wrap">
                            {JSON.stringify(selectedLog.new_values, null, 2)}
                          </pre>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedLog.user_agent && (
                <div>
                  <Label className="text-xs text-muted-foreground">User Agent</Label>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedLog.user_agent}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  iconColor = "text-muted-foreground",
}: {
  icon: typeof Activity;
  label: string;
  value: number | undefined;
  iconColor?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            {value !== undefined ? (
              <p className="text-2xl font-bold">{value}</p>
            ) : (
              <Skeleton className="h-8 w-12 mt-1" />
            )}
          </div>
          <Icon className={cn("h-8 w-8", iconColor)} />
        </div>
      </CardContent>
    </Card>
  );
}
