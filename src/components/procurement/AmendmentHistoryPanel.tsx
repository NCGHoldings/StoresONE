import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Plus, Minus, Edit2 } from "lucide-react";
import { POApprovalAmendment, usePOApprovalAmendments } from "@/hooks/usePOApprovalAmendments";
import { useFormatCurrency } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";

interface AmendmentHistoryPanelProps {
  poId: string;
}

export function AmendmentHistoryPanel({ poId }: AmendmentHistoryPanelProps) {
  const { data: amendments, isLoading } = usePOApprovalAmendments(poId);
  const formatCurrency = useFormatCurrency();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" />
            Amendment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!amendments || amendments.length === 0) {
    return null;
  }

  const getAmendmentIcon = (type: string) => {
    switch (type) {
      case "line_add":
        return <Plus className="h-4 w-4 text-green-600" />;
      case "line_remove":
        return <Minus className="h-4 w-4 text-red-600" />;
      default:
        return <Edit2 className="h-4 w-4 text-amber-600" />;
    }
  };

  const getAmendmentLabel = (type: string) => {
    switch (type) {
      case "line_add":
        return "Line Added";
      case "line_remove":
        return "Line Removed";
      case "quantity_update":
        return "Quantity Updated";
      case "price_update":
        return "Price Updated";
      case "line_update":
        return "Line Updated";
      default:
        return "Amendment";
    }
  };

  const getAmendmentBadgeVariant = (type: string) => {
    switch (type) {
      case "line_add":
        return "default" as const;
      case "line_remove":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  const formatChange = (amendment: POApprovalAmendment) => {
    const oldVal = amendment.old_value as Record<string, number> | null;
    const newVal = amendment.new_value as Record<string, number> | null;

    if (amendment.amendment_type === "line_add" && newVal) {
      return (
        <span className="text-green-600">
          +{newVal.quantity} units @ {formatCurrency(newVal.unit_price as number)}
        </span>
      );
    }

    if (amendment.amendment_type === "line_remove" && oldVal) {
      return (
        <span className="text-red-600 line-through">
          {oldVal.quantity} units @ {formatCurrency(oldVal.unit_price as number)}
        </span>
      );
    }

    if (oldVal && newVal) {
      const changes: JSX.Element[] = [];

      if (oldVal.quantity !== undefined && newVal.quantity !== undefined) {
        const diff = (newVal.quantity as number) - (oldVal.quantity as number);
        changes.push(
          <span key="qty">
            Qty: {oldVal.quantity} → {newVal.quantity}{" "}
            <span className={diff > 0 ? "text-green-600" : "text-red-600"}>
              ({diff > 0 ? "+" : ""}{diff})
            </span>
          </span>
        );
      }

      if (oldVal.unit_price !== undefined && newVal.unit_price !== undefined) {
        changes.push(
          <span key="price">
            Price: {formatCurrency(oldVal.unit_price as number)} →{" "}
            {formatCurrency(newVal.unit_price as number)}
          </span>
        );
      }

      return (
        <div className="flex flex-col gap-1 text-sm">
          {changes.map((change, i) => (
            <div key={i}>{change}</div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4" />
          Amendment History
          <Badge variant="outline" className="ml-auto">
            {amendments.length} change{amendments.length !== 1 ? "s" : ""}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {amendments.map((amendment) => (
              <div
                key={amendment.id}
                className="border-l-2 border-muted pl-4 pb-4 relative"
              >
                <div className="absolute -left-2 top-0 bg-background p-1 rounded-full">
                  {getAmendmentIcon(amendment.amendment_type)}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={getAmendmentBadgeVariant(amendment.amendment_type)}>
                      {getAmendmentLabel(amendment.amendment_type)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(amendment.created_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                  
                  <div className="text-sm">
                    {formatChange(amendment)}
                  </div>

                  <div className="text-sm">
                    <span className="text-muted-foreground">By:</span>{" "}
                    <span className="font-medium">
                      {amendment.profiles?.full_name || "Unknown"}
                    </span>
                  </div>

                  <div className="text-sm bg-muted/50 p-2 rounded-md italic">
                    "{amendment.reason}"
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
