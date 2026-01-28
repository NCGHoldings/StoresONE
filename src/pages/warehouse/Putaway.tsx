import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Package,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Plus,
  Loader2,
  MapPin,
} from "lucide-react";
import {
  usePutawayTasks,
  usePutawayStats,
  useStartPutaway,
} from "@/hooks/usePutawayTasks";
import { PutawayFormDialog } from "@/components/warehouse/PutawayFormDialog";
import { PutawayDetailsPanel } from "@/components/warehouse/PutawayDetailsPanel";
import type { PutawayTask } from "@/hooks/usePutawayTasks";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-600",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  normal: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

export default function Putaway() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<PutawayTask | null>(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: tasks = [], isLoading } = usePutawayTasks(
    statusFilter === "all" ? undefined : statusFilter
  );
  const { data: stats } = usePutawayStats();
  const startPutaway = useStartPutaway();

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.task_number.toLowerCase().includes(search.toLowerCase()) ||
      task.products?.name?.toLowerCase().includes(search.toLowerCase()) ||
      task.products?.sku?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const handleStartTask = async (task: PutawayTask) => {
    await startPutaway.mutateAsync(task.id);
  };

  const handleCompleteTask = (task: PutawayTask) => {
    setSelectedTask(task);
    setCompleteDialogOpen(true);
  };

  const handleViewDetails = (task: PutawayTask) => {
    setSelectedTask(task);
    setDetailsOpen(true);
  };

  const columns = [
    {
      key: "task_number",
      label: "Task #",
      render: (task: PutawayTask) => (
        <button
          onClick={() => handleViewDetails(task)}
          className="font-mono text-primary hover:underline"
        >
          {task.task_number}
        </button>
      ),
    },
    {
      key: "products",
      label: "Product",
      render: (task: PutawayTask) => (
        <div>
          <p className="font-medium">{task.products?.name || "Unknown"}</p>
          <p className="text-xs text-muted-foreground">{task.products?.sku}</p>
        </div>
      ),
    },
    {
      key: "inbound_deliveries",
      label: "GRN",
      render: (task: PutawayTask) => (
        <span className="text-sm">
          {task.inbound_deliveries?.delivery_number || "—"}
        </span>
      ),
    },
    {
      key: "quantity",
      label: "Qty",
      render: (task: PutawayTask) => (
        <span className="font-medium">{task.quantity}</span>
      ),
    },
    {
      key: "suggested_bin",
      label: "Suggested Bin",
      render: (task: PutawayTask) => (
        <div className="flex items-center gap-1">
          {task.suggested_bin ? (
            <>
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="font-mono text-sm">{task.suggested_bin.bin_code}</span>
            </>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )}
        </div>
      ),
    },
    {
      key: "assigned_bin",
      label: "Assigned Bin",
      render: (task: PutawayTask) => (
        <div className="flex items-center gap-1">
          {task.assigned_bin ? (
            <>
              <MapPin className="h-3 w-3 text-primary" />
              <span className="font-mono text-sm font-medium">
                {task.assigned_bin.bin_code}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (task: PutawayTask) => (
        <Badge className={statusColors[task.status] || ""}>
          {task.status.replace("_", " ")}
        </Badge>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      render: (task: PutawayTask) => (
        <Badge variant="outline" className={priorityColors[task.priority] || ""}>
          {task.priority}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (task: PutawayTask) => (
        <div className="flex gap-2">
          {task.status === "pending" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStartTask(task)}
              disabled={startPutaway.isPending}
            >
              <Play className="h-3 w-3 mr-1" />
              Start
            </Button>
          )}
          {(task.status === "pending" || task.status === "in_progress") && (
            <Button
              size="sm"
              onClick={() => handleCompleteTask(task)}
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Complete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Putaway Management"
          subtitle="Manage putaway tasks for received goods"
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{stats?.pending || 0}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">{stats?.inProgress || 0}</p>
                </div>
                <Play className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed Today</p>
                  <p className="text-2xl font-bold">{stats?.completedToday || 0}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                </div>
                <Package className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by task #, product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Data Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No putaway tasks found</h3>
            <p className="text-muted-foreground">
              Putaway tasks are automatically created when goods are received without a bin assignment.
            </p>
          </div>
        ) : (
          <DataTable data={filteredTasks} columns={columns} />
        )}

        {/* Complete Dialog */}
        <PutawayFormDialog
          task={selectedTask}
          open={completeDialogOpen}
          onOpenChange={setCompleteDialogOpen}
        />

        {/* Details Panel */}
        <PutawayDetailsPanel
          task={selectedTask}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      </div>
    </MainLayout>
  );
}
