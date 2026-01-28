import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Search, Package, ClipboardCheck, CheckCircle, Eye } from "lucide-react";
import { format } from "date-fns";
import { useFormatCurrency } from "@/lib/formatters";
import {
  useSalesReturns,
  useReturnStats,
  useReceiveReturn,
  useSalesReturnDetails,
} from "@/hooks/useSalesReturns";
import { ReceiveReturnDialog } from "@/components/sales/ReceiveReturnDialog";
import { InspectReturnDialog } from "@/components/sales/InspectReturnDialog";
import { ReturnDetailsPanel } from "@/components/sales/ReturnDetailsPanel";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending Receipt", variant: "secondary" },
  received: { label: "Awaiting Inspection", variant: "default" },
  inspected: { label: "Ready to Complete", variant: "outline" },
  completed: { label: "Completed", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
};

export function CustomerReturnsTab() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReturnId, setSelectedReturnId] = useState<string | null>(null);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [inspectDialogOpen, setInspectDialogOpen] = useState(false);
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(false);

  const formatCurrency = useFormatCurrency();

  const { data: returns = [], isLoading } = useSalesReturns({
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const { data: stats } = useReturnStats();
  const { data: selectedReturnData } = useSalesReturnDetails(selectedReturnId);
  const receiveReturn = useReceiveReturn();

  // Filter for warehouse-relevant statuses (excluding completed/rejected for main view)
  const warehouseReturns = returns.filter((r) => {
    const matchesSearch =
      searchTerm === "" ||
      r.return_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customers?.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleReceive = async (receivedDate: string) => {
    if (!selectedReturnId) return;
    await receiveReturn.mutateAsync({ returnId: selectedReturnId, receivedDate });
    setReceiveDialogOpen(false);
    setSelectedReturnId(null);
  };

  const handleOpenReceiveDialog = (returnId: string) => {
    setSelectedReturnId(returnId);
    setReceiveDialogOpen(true);
  };

  const handleOpenInspectDialog = (returnId: string) => {
    setSelectedReturnId(returnId);
    setInspectDialogOpen(true);
  };

  const handleViewDetails = (returnId: string) => {
    setSelectedReturnId(returnId);
    setDetailsPanelOpen(true);
  };

  const selectedReturnNumber = returns.find((r) => r.id === selectedReturnId)?.return_number || "";

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Receipt</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting warehouse receipt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Inspection</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.awaitingInspection || 0}</div>
            <p className="text-xs text-muted-foreground">Ready for quality check</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">Returns processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Credit Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalCreditValue || 0)}</div>
            <p className="text-xs text-muted-foreground">Total credits issued</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by return # or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending Receipt</SelectItem>
                <SelectItem value="received">Awaiting Inspection</SelectItem>
                <SelectItem value="inspected">Ready to Complete</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Returns Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Return #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Sales Order</TableHead>
                <TableHead>Return Date</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : warehouseReturns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No returns found
                  </TableCell>
                </TableRow>
              ) : (
                warehouseReturns.map((ret) => {
                  const config = statusConfig[ret.status] || statusConfig.pending;
                  return (
                    <TableRow key={ret.id}>
                      <TableCell className="font-medium">{ret.return_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{ret.customers?.company_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {ret.customers?.customer_code}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{ret.sales_orders?.so_number || "-"}</TableCell>
                      <TableCell>{format(new Date(ret.return_date), "MMM dd, yyyy")}</TableCell>
                      <TableCell className="capitalize">{ret.return_reason.replace("_", " ")}</TableCell>
                      <TableCell>{formatCurrency(ret.total_amount || 0)}</TableCell>
                      <TableCell>
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(ret.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {ret.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => handleOpenReceiveDialog(ret.id)}
                              disabled={receiveReturn.isPending}
                            >
                              Receive
                            </Button>
                          )}
                          {ret.status === "received" && (
                            <Button size="sm" onClick={() => handleOpenInspectDialog(ret.id)}>
                              Inspect
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Receive Dialog */}
      <ReceiveReturnDialog
        open={receiveDialogOpen}
        onOpenChange={(open) => {
          setReceiveDialogOpen(open);
          if (!open) setSelectedReturnId(null);
        }}
        returnNumber={selectedReturnNumber}
        onConfirm={handleReceive}
        isPending={receiveReturn.isPending}
      />

      {/* Inspect Dialog */}
      {selectedReturnId && selectedReturnData && (
        <InspectReturnDialog
          open={inspectDialogOpen}
          onOpenChange={(open) => {
            setInspectDialogOpen(open);
            if (!open) setSelectedReturnId(null);
          }}
          returnId={selectedReturnId}
          lines={selectedReturnData.lines}
          onClose={() => {
            setInspectDialogOpen(false);
            setSelectedReturnId(null);
          }}
        />
      )}

      {/* Details Panel */}
      <Sheet open={detailsPanelOpen} onOpenChange={setDetailsPanelOpen}>
        <SheetContent className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Return Details</SheetTitle>
            <SheetDescription>View return information and line items</SheetDescription>
          </SheetHeader>
          {selectedReturnId && (
            <ReturnDetailsPanel
              returnId={selectedReturnId}
              onClose={() => {
                setDetailsPanelOpen(false);
                setSelectedReturnId(null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
