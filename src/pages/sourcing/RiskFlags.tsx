import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRiskFlags, RiskFlag, useResolveRiskFlag } from "@/hooks/useRiskFlags";
import { Plus, AlertTriangle, AlertOctagon, ShieldAlert, CheckCircle } from "lucide-react";
import { useState } from "react";
import { RiskFlagFormDialog } from "@/components/sourcing/RiskFlagFormDialog";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

export default function RiskFlags() {
  const { data: flags, isLoading } = useRiskFlags();
  const resolveRiskFlag = useResolveRiskFlag();
  const [showForm, setShowForm] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<RiskFlag | null>(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const stats = {
    total: flags?.filter((f) => f.is_active).length ?? 0,
    warning: flags?.filter((f) => f.is_active && f.flag_type === "warning").length ?? 0,
    critical: flags?.filter((f) => f.is_active && f.flag_type === "critical").length ?? 0,
    blacklisted: flags?.filter((f) => f.is_active && f.flag_type === "blacklisted").length ?? 0,
  };

  const handleResolve = async () => {
    if (selectedFlag) {
      await resolveRiskFlag.mutateAsync({ id: selectedFlag.id, resolution_notes: resolutionNotes });
      setResolveDialogOpen(false);
      setSelectedFlag(null);
      setResolutionNotes("");
    }
  };

  const columns = [
    {
      key: "supplier",
      label: "Supplier",
      render: (flag: RiskFlag) => flag.suppliers?.company_name ?? "-",
      sortable: true,
    },
    {
      key: "flag_type",
      label: "Severity",
      render: (flag: RiskFlag) => <StatusBadge status={flag.flag_type} />,
    },
    { key: "reason", label: "Reason", sortable: true },
    {
      key: "flagged_date",
      label: "Flagged Date",
      render: (flag: RiskFlag) => format(new Date(flag.flagged_date), "MMM dd, yyyy"),
      sortable: true,
    },
    {
      key: "is_active",
      label: "Status",
      render: (flag: RiskFlag) => (
        <StatusBadge status={flag.is_active ? "active" : "resolved"} type={flag.is_active ? "warning" : "success"} />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (flag: RiskFlag) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFlag(flag);
              setShowForm(true);
            }}
          >
            View
          </Button>
          {flag.is_active && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFlag(flag);
                setResolveDialogOpen(true);
              }}
            >
              Resolve
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <PageHeader
        title="Risk Flags & Blacklist"
        subtitle="Manage supplier risk assessments and blacklist status"
        actions={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Risk Flag
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Flags</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.warning}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertOctagon className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.critical}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Blacklisted</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.blacklisted}</div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <DataTable
          data={flags ?? []}
          columns={columns}
          searchable
          searchKeys={["reason"]}
        />
      )}

      <RiskFlagFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        flag={selectedFlag}
        onClose={() => {
          setShowForm(false);
          setSelectedFlag(null);
        }}
      />

      {/* Resolve Dialog */}
      <AlertDialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resolve Risk Flag</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the risk flag as resolved. Please provide resolution notes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder="Enter resolution notes..."
            rows={4}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResolve} disabled={!resolutionNotes.trim()}>
              Resolve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
