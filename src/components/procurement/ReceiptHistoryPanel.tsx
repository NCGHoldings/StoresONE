import { useState } from "react";
import { format } from "date-fns";
import { Package, CalendarCheck, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GRNDetailsPanel } from "./GRNDetailsPanel";
import type { InboundDelivery } from "@/hooks/useInboundDeliveries";

interface ReceiptHistoryPanelProps {
  grns: InboundDelivery[];
  totalOrdered: number;
  totalReceived: number;
}

export function ReceiptHistoryPanel({
  grns,
  totalOrdered,
  totalReceived,
}: ReceiptHistoryPanelProps) {
  const [selectedGRN, setSelectedGRN] = useState<InboundDelivery | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  const remaining = totalOrdered - totalReceived;
  const percentComplete = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;

  const handleViewDetails = (grn: InboundDelivery) => {
    setSelectedGRN(grn);
    setDetailsOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Receipt History
            </CardTitle>
            <Badge variant="secondary">{grns.length} GRN{grns.length !== 1 ? "s" : ""}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-3">
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <div className="text-xs text-muted-foreground">Ordered</div>
              <div className="text-lg font-semibold">{totalOrdered}</div>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <div className="text-xs text-muted-foreground">Received</div>
              <div className="text-lg font-semibold text-success">{totalReceived}</div>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <div className="text-xs text-muted-foreground">Remaining</div>
              <div className={`text-lg font-semibold ${remaining > 0 ? "text-warning" : "text-success"}`}>
                {remaining}
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <div className="text-xs text-muted-foreground">Progress</div>
              <div className="text-lg font-semibold">{percentComplete}%</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                percentComplete === 100 ? "bg-success" : "bg-primary"
              }`}
              style={{ width: `${Math.min(percentComplete, 100)}%` }}
            />
          </div>

          {/* GRN Table */}
          {grns.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>GRN #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grns.map((grn) => (
                    <TableRow 
                      key={grn.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleViewDetails(grn)}
                    >
                      <TableCell className="font-medium">{grn.delivery_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <CalendarCheck className="h-3.5 w-3.5" />
                          {grn.actual_date
                            ? format(new Date(grn.actual_date), "MMM d, yyyy")
                            : "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {grn.received_items || 0}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={grn.status === "completed" ? "default" : "secondary"}
                          className={grn.status === "completed" ? "bg-success/10 text-success hover:bg-success/10" : ""}
                        >
                          {grn.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(grn);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No receipts recorded yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      <GRNDetailsPanel
        grn={selectedGRN}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </>
  );
}
