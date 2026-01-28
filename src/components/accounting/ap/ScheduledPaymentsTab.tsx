import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/DataTable";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Calendar, Clock, CheckCircle, XCircle, Play, DollarSign } from "lucide-react";
import { format } from "date-fns";
import {
  useScheduledPayments,
  useScheduledPaymentStats,
  useApproveScheduledPayment,
  useCancelScheduledPayment,
  useProcessScheduledPayment,
} from "@/hooks/useScheduledPayments";
import { useFormatCurrency } from "@/lib/formatters";
import { KPICard } from "../KPICard";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  processed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

export default function ScheduledPaymentsTab() {
  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "cancel" | "process";
    id: string;
    scheduleNumber: string;
  } | null>(null);

  const { data: scheduledPayments, isLoading } = useScheduledPayments();
  const { data: stats } = useScheduledPaymentStats();
  const approvePayment = useApproveScheduledPayment();
  const cancelPayment = useCancelScheduledPayment();
  const processPayment = useProcessScheduledPayment();
  const formatCurrency = useFormatCurrency();

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    switch (confirmAction.type) {
      case "approve":
        await approvePayment.mutateAsync(confirmAction.id);
        break;
      case "cancel":
        await cancelPayment.mutateAsync(confirmAction.id);
        break;
      case "process":
        await processPayment.mutateAsync(confirmAction.id);
        break;
    }
    setConfirmAction(null);
  };

  const getActionButtons = (payment: any) => {
    const buttons = [];

    if (payment.status === "pending") {
      buttons.push(
        <Button
          key="approve"
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmAction({
              type: "approve",
              id: payment.id,
              scheduleNumber: payment.schedule_number,
            });
          }}
        >
          <CheckCircle className="mr-1 h-3 w-3" />
          Approve
        </Button>
      );
      buttons.push(
        <Button
          key="cancel"
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmAction({
              type: "cancel",
              id: payment.id,
              scheduleNumber: payment.schedule_number,
            });
          }}
        >
          <XCircle className="mr-1 h-3 w-3" />
          Cancel
        </Button>
      );
    }

    if (payment.status === "approved") {
      buttons.push(
        <Button
          key="process"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmAction({
              type: "process",
              id: payment.id,
              scheduleNumber: payment.schedule_number,
            });
          }}
        >
          <Play className="mr-1 h-3 w-3" />
          Process Now
        </Button>
      );
      buttons.push(
        <Button
          key="cancel"
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmAction({
              type: "cancel",
              id: payment.id,
              scheduleNumber: payment.schedule_number,
            });
          }}
        >
          <XCircle className="mr-1 h-3 w-3" />
          Cancel
        </Button>
      );
    }

    return <div className="flex gap-1">{buttons}</div>;
  };

  // Separate payments by status
  const pendingPayments = (scheduledPayments || []).filter(
    (p) => p.status === "pending" || p.status === "approved"
  );
  const processedPayments = (scheduledPayments || []).filter(
    (p) => p.status === "processed" || p.status === "cancelled"
  );

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          icon={Clock}
          label="Pending Approval"
          value={stats?.pendingCount || 0}
          subtitle={formatCurrency(stats?.pendingAmount || 0)}
          variant="warning"
        />
        <KPICard
          icon={CheckCircle}
          label="Approved"
          value={stats?.approvedCount || 0}
          subtitle={formatCurrency(stats?.approvedAmount || 0)}
          variant="primary"
        />
        <KPICard
          icon={Calendar}
          label="Due This Week"
          value={stats?.dueThisWeekCount || 0}
          subtitle={formatCurrency(stats?.dueThisWeekAmount || 0)}
          variant="destructive"
        />
        <KPICard
          icon={DollarSign}
          label="Total Scheduled"
          value={formatCurrency((stats?.pendingAmount || 0) + (stats?.approvedAmount || 0))}
          variant="default"
        />
      </div>

      {/* Pending/Approved Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Upcoming Scheduled Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : pendingPayments.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No scheduled payments pending
            </div>
          ) : (
            <DataTable
              columns={[
                { key: "schedule_number", label: "Schedule #" },
                {
                  key: "suppliers",
                  label: "Vendor",
                  render: (row) => row.suppliers?.company_name || "—",
                },
                {
                  key: "scheduled_date",
                  label: "Scheduled Date",
                  render: (row) => {
                    const date = new Date(row.scheduled_date);
                    const today = new Date();
                    const isPast = date < today;
                    return (
                      <span className={isPast ? "text-red-600 font-medium" : ""}>
                        {format(date, "MMM dd, yyyy")}
                        {isPast && " (Overdue)"}
                      </span>
                    );
                  },
                },
                {
                  key: "total_amount",
                  label: "Amount",
                  render: (row) => (
                    <span className="font-medium">{formatCurrency(row.total_amount)}</span>
                  ),
                },
                {
                  key: "payment_method",
                  label: "Method",
                  render: (row) => row.payment_method?.replace("_", " ") || "—",
                },
                {
                  key: "status",
                  label: "Status",
                  render: (row) => (
                    <Badge className={statusStyles[row.status]}>{row.status}</Badge>
                  ),
                },
                {
                  key: "actions",
                  label: "",
                  render: (row) => getActionButtons(row),
                },
              ]}
              data={pendingPayments}
              onRowClick={() => {}}
            />
          )}
        </CardContent>
      </Card>

      {/* Processed Payments History */}
      {processedPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: "schedule_number", label: "Schedule #" },
                {
                  key: "suppliers",
                  label: "Vendor",
                  render: (row) => row.suppliers?.company_name || "—",
                },
                {
                  key: "scheduled_date",
                  label: "Scheduled Date",
                  render: (row) => format(new Date(row.scheduled_date), "MMM dd, yyyy"),
                },
                {
                  key: "processed_at",
                  label: "Processed",
                  render: (row) =>
                    row.processed_at
                      ? format(new Date(row.processed_at), "MMM dd, yyyy")
                      : "—",
                },
                {
                  key: "total_amount",
                  label: "Amount",
                  render: (row) => formatCurrency(row.total_amount),
                },
                {
                  key: "status",
                  label: "Status",
                  render: (row) => (
                    <Badge className={statusStyles[row.status]}>{row.status}</Badge>
                  ),
                },
              ]}
              data={processedPayments}
              onRowClick={() => {}}
            />
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "approve" && "Approve Scheduled Payment"}
              {confirmAction?.type === "cancel" && "Cancel Scheduled Payment"}
              {confirmAction?.type === "process" && "Process Payment Now"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "approve" &&
                `Are you sure you want to approve scheduled payment ${confirmAction.scheduleNumber}?`}
              {confirmAction?.type === "cancel" &&
                `Are you sure you want to cancel scheduled payment ${confirmAction.scheduleNumber}? This action cannot be undone.`}
              {confirmAction?.type === "process" &&
                `This will immediately process payment ${confirmAction.scheduleNumber} and create the actual vendor payment. Continue?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={confirmAction?.type === "cancel" ? "bg-destructive text-destructive-foreground" : ""}
            >
              {confirmAction?.type === "approve" && "Approve"}
              {confirmAction?.type === "cancel" && "Cancel Payment"}
              {confirmAction?.type === "process" && "Process Now"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
