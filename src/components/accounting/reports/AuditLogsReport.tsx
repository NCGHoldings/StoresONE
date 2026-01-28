import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { format } from "date-fns";
import { useAuditLogsReport, getDateRange, PeriodType, DateRange } from "@/hooks/useFinancialReports";
import { ReportHeader } from "./shared/ReportHeader";
import { ReportPeriodPicker } from "./shared/ReportPeriodPicker";
import { exportToCSV } from "./shared/ExportButton";

function JsonDiff({ label, data }: { label: string; data: unknown }) {
  if (!data) return null;
  return (
    <div className="mt-2">
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}:</p>
      <pre className="text-xs bg-muted/50 p-2 rounded overflow-auto max-h-32">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

export function AuditLogsReport() {
  const [periodType, setPeriodType] = useState<PeriodType>("month");
  const [customRange, setCustomRange] = useState<DateRange>(getDateRange("month"));
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [selectedEntity, setSelectedEntity] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const dateRange = periodType === "custom" ? customRange : getDateRange(periodType);

  const { data, isLoading } = useAuditLogsReport({
    dateRange,
    action: selectedAction || undefined,
    entityType: selectedEntity || undefined,
  });

  const filteredLogs = data?.logs.filter((log) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.entity_type?.toLowerCase().includes(search) ||
      log.document_number?.toLowerCase().includes(search) ||
      log.action?.toLowerCase().includes(search)
    );
  }) || [];

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleExport = () => {
    const exportData = filteredLogs.map((log) => ({
      Timestamp: log.created_at ? format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss") : "",
      Action: log.action,
      "Entity Type": log.entity_type,
      "Document Number": log.document_number || "",
      Module: log.module || "",
      "Change Type": log.change_type || "",
    }));
    exportToCSV(exportData, `audit-logs-${dateRange.start}-${dateRange.end}`);
  };

  const handlePrint = () => window.print();

  const getActionBadge = (action: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      INSERT: "default",
      UPDATE: "secondary",
      DELETE: "destructive",
    };
    return <Badge variant={variants[action] || "secondary"}>{action}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Audit Logs"
        subtitle={`System activity trail - ${format(new Date(dateRange.start), "MMM d, yyyy")} to ${format(new Date(dateRange.end), "MMM d, yyyy")}`}
        onExport={handleExport}
        onPrint={handlePrint}
      >
        <ReportPeriodPicker
          periodType={periodType}
          onPeriodTypeChange={setPeriodType}
          customRange={customRange}
          onCustomRangeChange={setCustomRange}
        />
      </ReportHeader>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Actions</SelectItem>
                {data?.actions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedEntity} onValueChange={setSelectedEntity}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Entities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Entities</SelectItem>
                {data?.entityTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(selectedAction || selectedEntity || searchTerm) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedAction("");
                  setSelectedEntity("");
                  setSearchTerm("");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>

          <div className="text-sm text-muted-foreground mb-2">
            Showing {filteredLogs.length} of {data?.logs.length || 0} entries
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-8"></TableHead>
                <TableHead className="font-semibold">Timestamp</TableHead>
                <TableHead className="font-semibold">Action</TableHead>
                <TableHead className="font-semibold">Entity Type</TableHead>
                <TableHead className="font-semibold">Document #</TableHead>
                <TableHead className="font-semibold">Module</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No audit logs found for the selected filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <Collapsible key={log.id} asChild>
                    <>
                      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => toggleRow(log.id)}>
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              {expandedRows.has(log.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.created_at ? format(new Date(log.created_at), "MMM d, HH:mm:ss") : "-"}
                        </TableCell>
                        <TableCell>{getActionBadge(log.action)}</TableCell>
                        <TableCell>{log.entity_type}</TableCell>
                        <TableCell className="font-mono text-sm">{log.document_number || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.module || "SYS"}</Badge>
                        </TableCell>
                      </TableRow>
                      <CollapsibleContent asChild>
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={6} className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm mb-2">
                                  <span className="text-muted-foreground">Entity ID: </span>
                                  <span className="font-mono">{log.entity_id || "N/A"}</span>
                                </p>
                                <p className="text-sm mb-2">
                                  <span className="text-muted-foreground">User ID: </span>
                                  <span className="font-mono text-xs">{log.user_id || "System"}</span>
                                </p>
                                <p className="text-sm">
                                  <span className="text-muted-foreground">IP Address: </span>
                                  <span className="font-mono">{log.ip_address || "N/A"}</span>
                                </p>
                              </div>
                              <div>
                                <JsonDiff label="Old Values" data={log.old_values} />
                                <JsonDiff label="New Values" data={log.new_values} />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
