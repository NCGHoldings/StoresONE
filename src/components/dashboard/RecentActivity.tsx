import { Package, ShoppingCart, DollarSign, Warehouse, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRecentActivity } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

type ActivityType = "warehouse" | "procurement" | "finance" | "inventory";
type ActivityStatus = "success" | "warning" | "info" | "error";

interface ActivityDisplay {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  time: string;
  status: ActivityStatus;
}

const iconMap = {
  warehouse: Warehouse,
  procurement: ShoppingCart,
  finance: DollarSign,
  inventory: Package,
};

// Map entity_type to activity type for icon selection
function getActivityType(entityType: string): ActivityType {
  const lower = entityType.toLowerCase();
  if (lower.includes("purchase") || lower.includes("supplier") || lower.includes("rfq") || lower.includes("blanket")) {
    return "procurement";
  }
  if (lower.includes("invoice") || lower.includes("payment") || lower.includes("receipt") || lower.includes("credit") || lower.includes("debit")) {
    return "finance";
  }
  if (lower.includes("inventory") || lower.includes("batch") || lower.includes("product")) {
    return "inventory";
  }
  return "warehouse";
}

// Map action to status
function getActivityStatus(action: string): ActivityStatus {
  const lower = action.toLowerCase();
  if (lower.includes("delete") || lower.includes("cancel") || lower.includes("reject")) {
    return "error";
  }
  if (lower.includes("update") || lower.includes("pending") || lower.includes("warning")) {
    return "warning";
  }
  if (lower.includes("create") || lower.includes("insert") || lower.includes("approve") || lower.includes("complete")) {
    return "success";
  }
  return "info";
}

// Format entity type for display
function formatEntityType(entityType: string): string {
  return entityType
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Calculate relative time
function getRelativeTime(dateString: string | null): string {
  if (!dateString) return "Unknown";
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
}

// Format action for display
function formatAction(action: string): string {
  const map: Record<string, string> = {
    "INSERT": "Created",
    "UPDATE": "Updated",
    "DELETE": "Deleted",
    "CREATE": "Created",
  };
  return map[action.toUpperCase()] || action;
}

export function RecentActivity() {
  const { data: activities, isLoading } = useRecentActivity(5);

  // Transform audit logs to activity display format
  const displayActivities: ActivityDisplay[] = (activities || []).map(log => ({
    id: log.id,
    type: getActivityType(log.entity_type),
    title: `${formatEntityType(log.entity_type)} ${formatAction(log.action)}`,
    description: log.document_number || log.entity_id || "System activity",
    time: getRelativeTime(log.created_at),
    status: getActivityStatus(log.action),
  }));

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">
          Recent Activity
        </h2>
        <a href="/admin/audit" className="text-sm text-primary hover:underline">
          View All
        </a>
      </div>
      <div className="space-y-4">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex gap-4 p-3">
              <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))
        ) : displayActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock size={32} className="mx-auto mb-2 opacity-50" />
            <p>No recent activity</p>
          </div>
        ) : (
          displayActivities.map((activity) => {
            const Icon = iconMap[activity.type];
            return (
              <div
                key={activity.id}
                className="flex gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    activity.status === "success" && "bg-success/10 text-success",
                    activity.status === "warning" && "bg-warning/10 text-warning",
                    activity.status === "info" && "bg-primary/10 text-primary",
                    activity.status === "error" && "bg-destructive/10 text-destructive"
                  )}
                >
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {activity.title}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {activity.description}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                  <Clock size={14} />
                  <span className="text-xs">{activity.time}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
