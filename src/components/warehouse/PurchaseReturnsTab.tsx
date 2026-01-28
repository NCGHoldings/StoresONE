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
import { Search, Plus, Truck, CreditCard, Eye, FileText } from "lucide-react";
import { format } from "date-fns";
import { useFormatCurrency } from "@/lib/formatters";
import {
  usePurchaseReturns,
  usePurchaseReturnStats,
  type PurchaseReturnStatus,
} from "@/hooks/usePurchaseReturns";
import { PurchaseReturnFormDialog } from "@/components/warehouse/PurchaseReturnFormDialog";
import { PurchaseReturnDetailsPanel } from "@/components/warehouse/PurchaseReturnDetailsPanel";

const statusConfig: Record<PurchaseReturnStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  pending_pickup: { label: "Pending Pickup", variant: "outline" },
  shipped: { label: "Shipped", variant: "default" },
  received_by_supplier: { label: "Received by Supplier", variant: "default" },
  credit_received: { label: "Credit Received", variant: "default" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

export function PurchaseReturnsTab() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReturnId, setSelectedReturnId] = useState<string | null>(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(false);

  const formatCurrency = useFormatCurrency();

  const { data: returns = [], isLoading } = usePurchaseReturns({
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const { data: stats } = usePurchaseReturnStats();

  const filteredReturns = returns.filter((r) => {
    const matchesSearch =
      searchTerm === "" ||
      r.return_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.suppliers?.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleViewDetails = (returnId: string) => {
    setSelectedReturnId(returnId);
    setDetailsPanelOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedReturnId(null);
    setFormDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.draft || 0}</div>
            <p className="text-xs text-muted-foreground">Returns in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Pickup</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingPickup || 0}</div>
            <p className="text-xs text-muted-foreground">Ready for supplier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Credit</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.shipped || 0) + (stats?.awaitingCredit || 0)}</div>
            <p className="text-xs text-muted-foreground">Shipped or pending credit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Credit Received</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalCreditValue || 0)}</div>
            <p className="text-xs text-muted-foreground">Total credits received</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-4 md:flex-row md:items-center flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by return # or supplier..."
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
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_pickup">Pending Pickup</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="received_by_supplier">Received by Supplier</SelectItem>
                  <SelectItem value="credit_received">Credit Received</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              New Return
            </Button>
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
                <TableHead>Supplier</TableHead>
                <TableHead>PO / GRN</TableHead>
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
              ) : filteredReturns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No returns found
                  </TableCell>
                </TableRow>
              ) : (
                filteredReturns.map((ret) => {
                  const config = statusConfig[ret.status];
                  return (
                    <TableRow key={ret.id}>
                      <TableCell className="font-medium">{ret.return_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{ret.suppliers?.company_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {ret.suppliers?.supplier_code}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {ret.purchase_orders?.po_number || "-"}
                          {ret.inbound_deliveries?.delivery_number && (
                            <p className="text-xs text-muted-foreground">
                              GRN: {ret.inbound_deliveries.delivery_number}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(ret.return_date), "MMM dd, yyyy")}</TableCell>
                      <TableCell className="capitalize">{ret.return_reason.replace("_", " ")}</TableCell>
                      <TableCell>{formatCurrency(Number(ret.total_amount) || 0)}</TableCell>
                      <TableCell>
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(ret.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <PurchaseReturnFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
      />

      {/* Details Panel */}
      <Sheet open={detailsPanelOpen} onOpenChange={setDetailsPanelOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Purchase Return Details</SheetTitle>
            <SheetDescription>View and manage purchase return</SheetDescription>
          </SheetHeader>
          {selectedReturnId && (
            <PurchaseReturnDetailsPanel
              returnId={selectedReturnId}
              onClose={() => setDetailsPanelOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
