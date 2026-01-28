import { cn } from "@/lib/utils";

type StatusType = 
  | "success" 
  | "warning" 
  | "error" 
  | "info" 
  | "neutral"
  | "active"
  | "inactive"
  | "pending"
  | "blacklisted";

interface StatusBadgeProps {
  status: string;
  type?: StatusType;
  className?: string;
}

const statusTypeMap: Record<string, StatusType> = {
  // General statuses
  active: "success",
  approved: "success",
  completed: "success",
  delivered: "success",
  shipped: "success",
  
  inactive: "neutral",
  draft: "neutral",
  cancelled: "neutral",
  
  pending: "warning",
  under_review: "warning",
  in_transit: "warning",
  receiving: "warning",
  picking: "warning",
  packing: "warning",
  in_progress: "warning",
  scheduled: "warning",
  
  rejected: "error",
  blacklisted: "error",
  expired: "error",
  terminated: "error",
  critical: "error",
  blocked: "error",
  
  warning: "warning",
  renewed: "info",
  arrived: "info",
};

const styleMap: Record<StatusType, string> = {
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  error: "bg-destructive/10 text-destructive border-destructive/20",
  info: "bg-primary/10 text-primary border-primary/20",
  neutral: "bg-muted text-muted-foreground border-muted-foreground/20",
  active: "bg-success/10 text-success border-success/20",
  inactive: "bg-muted text-muted-foreground border-muted-foreground/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  blacklisted: "bg-destructive/10 text-destructive border-destructive/20",
};

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  const resolvedType = type || statusTypeMap[status.toLowerCase().replace(/\s+/g, "_")] || "neutral";
  
  const formattedStatus = status
    .replace(/_/g, " ")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        styleMap[resolvedType],
        className
      )}
    >
      {formattedStatus}
    </span>
  );
}
