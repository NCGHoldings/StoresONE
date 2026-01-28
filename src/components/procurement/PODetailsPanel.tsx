import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  usePurchaseOrder, 
  usePurchaseOrderLines, 
  useApprovePO, 
  useCancelPO, 
  useUpdatePurchaseOrder 
} from "@/hooks/usePurchaseOrders";
import { usePOApprovalAmendments } from "@/hooks/usePOApprovalAmendments";
import { useApprovalRequestByEntity } from "@/hooks/useApprovalWorkflow";
import { useInboundDeliveriesByPO } from "@/hooks/useInboundDeliveries";
import { ApprovalProgress } from "@/components/approval/ApprovalProgress";
import { 
  CheckCircle, 
  XCircle, 
  Truck, 
  Package, 
  Edit, 
  FileText, 
  Building2, 
  Calendar, 
  DollarSign,
  Loader2,
  Lock,
  Edit2
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { GoodsReceiptDialog } from "./GoodsReceiptDialog";
import { POAmendmentEditor } from "./POAmendmentEditor";
import { AmendmentHistoryPanel } from "./AmendmentHistoryPanel";
import { ReceiptHistoryPanel } from "./ReceiptHistoryPanel";
import { useFormatCurrency } from "@/lib/formatters";

interface PODetailsPanelProps {
  poId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}

export function PODetailsPanel({ poId, open, onOpenChange, onEdit }: PODetailsPanelProps) {
  const { data: po, isLoading: poLoading } = usePurchaseOrder(poId || undefined);
  const { data: lines, isLoading: linesLoading } = usePurchaseOrderLines(poId || undefined);
  const { data: amendments } = usePOApprovalAmendments(poId || undefined);
  const { data: grns } = useInboundDeliveriesByPO(poId);
  const { data: approvalRequest } = useApprovalRequestByEntity("purchase_order", poId);
  const approvePO = useApprovePO();
  const cancelPO = useCancelPO();
  const updatePO = useUpdatePurchaseOrder();
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [showAmendEditor, setShowAmendEditor] = useState(false);

  const isLoading = poLoading || linesLoading;

  // Calculate totals for receipt tracking
  const totalOrdered = lines?.reduce((sum, line) => sum + line.quantity, 0) || 0;
  const totalReceived = lines?.reduce((sum, line) => sum + line.received_quantity, 0) || 0;

  const formatCurrencyHook = useFormatCurrency();

  const formatCurrency = (amount: number) => {
    return formatCurrencyHook(amount, po?.currency || undefined);
  };

  const getReceiptProgress = () => {
    if (!lines || lines.length === 0) return 0;
    const totalOrdered = lines.reduce((sum, line) => sum + line.quantity, 0);
    const totalReceived = lines.reduce((sum, line) => sum + line.received_quantity, 0);
    return Math.round((totalReceived / totalOrdered) * 100);
  };

  const handleApprove = async () => {
    if (poId) {
      await approvePO.mutateAsync(poId);
    }
  };

  const handleCancel = async () => {
    if (poId) {
      await cancelPO.mutateAsync({ id: poId });
    }
  };

  const handleMarkInTransit = async () => {
    if (poId) {
      await updatePO.mutateAsync({ id: poId, updates: { status: "in_transit" } });
    }
  };

  const handleSubmitForApproval = async () => {
    if (poId) {
      await updatePO.mutateAsync({ id: poId, updates: { status: "pending_approval" } });
    }
  };

  const isLocked = po?.is_locked === true;
  const isInApproval = po?.status === "pending_approval" || po?.status === "pending";
  const hasAmendments = amendments && amendments.length > 0;
  
  // Check if workflow-based approval exists - if so, don't show legacy approve button
  const hasWorkflowApproval = !!approvalRequest;

  const canEdit = po?.status === "draft" && !isLocked;
  const canSubmit = po?.status === "draft" && !isLocked;
  // Legacy approve button only shown if NO workflow exists - ApprovalProgress handles this when workflow exists
  const canApprove = isInApproval && !isLocked && !hasWorkflowApproval;
  const canAmend = isInApproval && !isLocked;
  const canMarkInTransit = po?.status === "approved";
  const canReceive = po?.status === "in_transit" || po?.status === "approved";
  const canCancel = ["draft", "pending_approval", "pending", "approved"].includes(po?.status || "") && !isLocked;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[700px] sm:max-w-[700px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : po ? (
            <>
              <SheetHeader className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <SheetTitle className="text-xl">{po.po_number}</SheetTitle>
                      {isLocked && (
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="h-3 w-3" />
                          Locked
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Created {format(new Date(po.created_at), "MMM d, yyyy")}
                      {isLocked && po.locked_at && (
                        <span className="ml-2">
                          • Locked {format(new Date(po.locked_at), "MMM d, yyyy")}
                        </span>
                      )}
                    </p>
                  </div>
                  <StatusBadge status={po.status} />
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Source PR Reference */}
                {po.pr_id && po.purchase_requisitions && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Source Requisition</span>
                    </div>
                    <p className="text-sm text-primary font-medium">
                      {po.purchase_requisitions.pr_number}
                    </p>
                  </div>
                )}

                {/* Supplier Info */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Supplier</span>
                  </div>
                  {po.suppliers ? (
                    <div className="space-y-1">
                      <p className="font-medium">{po.suppliers.company_name}</p>
                      <p className="text-sm text-muted-foreground">{po.suppliers.supplier_code}</p>
                      {po.suppliers.contact_person && (
                        <p className="text-sm">{po.suppliers.contact_person}</p>
                      )}
                      {po.suppliers.email && (
                        <p className="text-sm text-muted-foreground">{po.suppliers.email}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No supplier assigned</p>
                  )}
                </div>

                {/* Order Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Order Date</p>
                      <p className="font-medium">{format(new Date(po.order_date), "MMM d, yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Expected Delivery</p>
                      <p className="font-medium">
                        {po.expected_delivery 
                          ? format(new Date(po.expected_delivery), "MMM d, yyyy")
                          : "Not set"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Total Value</p>
                      <p className="font-medium">{formatCurrency(po.total_amount)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Receipt Progress</p>
                      <div className="flex items-center gap-2">
                        <Progress value={getReceiptProgress()} className="w-20 h-2" />
                        <span className="text-sm font-medium">{getReceiptProgress()}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Approval Progress - Show workflow-based approval status */}
                {hasWorkflowApproval && (
                  <>
                    <ApprovalProgress
                      entityType="purchase_order"
                      entityId={poId}
                      entityNumber={po.po_number}
                      showActions={po.status !== "approved" && po.status !== "rejected" && po.status !== "cancelled"}
                    />
                    <Separator />
                  </>
                )}
                {canAmend && showAmendEditor && lines && lines.length > 0 && (
                  <>
                    <POAmendmentEditor
                      poId={poId!}
                      lines={lines}
                      currency={po.currency}
                      approvalRequestId={approvalRequest?.id}
                      approvalStepId={approvalRequest?.current_step_id || undefined}
                      onAmendmentMade={() => {}}
                    />
                    <Separator />
                  </>
                )}

                {/* Amendment History */}
                {hasAmendments && (
                  <>
                    <AmendmentHistoryPanel poId={poId!} />
                    <Separator />
                  </>
                )}

                {/* Line Items */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Line Items</span>
                      <span className="text-sm text-muted-foreground">({lines?.length || 0})</span>
                    </div>
                    {canAmend && !showAmendEditor && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAmendEditor(true)}
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Amend Items
                      </Button>
                    )}
                    {showAmendEditor && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAmendEditor(false)}
                      >
                        Done Amending
                      </Button>
                    )}
                  </div>

                {lines && lines.length > 0 ? (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right">Ordered</TableHead>
                            <TableHead className="text-right">Received</TableHead>
                            <TableHead className="text-right">Remaining</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lines.map((line) => {
                            const remaining = line.quantity - line.received_quantity;
                            const isFullyReceived = remaining === 0;
                            const isPartiallyReceived = line.received_quantity > 0 && remaining > 0;
                            
                            return (
                              <TableRow key={line.id}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{line.products?.name || "Unknown"}</p>
                                    <p className="text-xs text-muted-foreground">{line.products?.sku}</p>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">{line.quantity}</TableCell>
                                <TableCell className="text-right">
                                  <span className={isFullyReceived ? "text-green-600 font-medium" : ""}>
                                    {line.received_quantity}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className={
                                    isFullyReceived 
                                      ? "text-green-600" 
                                      : isPartiallyReceived 
                                        ? "text-amber-600 font-medium" 
                                        : ""
                                  }>
                                    {remaining}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(line.total_price)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                      No line items
                    </div>
                  )}
                </div>

                {/* Receipt History */}
                {(grns && grns.length > 0) || (po.status === "in_transit" || po.status === "approved" || po.status === "received") ? (
                  <>
                    <Separator />
                    <ReceiptHistoryPanel 
                      grns={grns || []} 
                      totalOrdered={totalOrdered} 
                      totalReceived={totalReceived} 
                    />
                  </>
                ) : null}

                {/* Notes */}
                {po.notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">Notes</p>
                      <p className="text-sm text-muted-foreground">{po.notes}</p>
                    </div>
                  </>
                )}

                <Separator />

                {/* Actions */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Actions</p>
                  {isLocked ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      <Lock className="h-4 w-4" />
                      This PO is locked and cannot be modified.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {canEdit && (
                        <Button variant="outline" size="sm" onClick={onEdit}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      )}
                      {canSubmit && (
                        <Button size="sm" onClick={handleSubmitForApproval}>
                          Submit for Approval
                        </Button>
                      )}
                      {canApprove && (
                        <Button size="sm" onClick={handleApprove} disabled={approvePO.isPending}>
                          {approvePO.isPending ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          )}
                          Approve
                        </Button>
                      )}
                      {canMarkInTransit && (
                        <Button size="sm" onClick={handleMarkInTransit} disabled={updatePO.isPending}>
                          <Truck className="h-4 w-4 mr-1" />
                          Mark In Transit
                        </Button>
                      )}
                      {canReceive && (
                        <Button size="sm" variant="outline" onClick={() => setReceiptOpen(true)}>
                          <Package className="h-4 w-4 mr-1" />
                          Receive Goods
                        </Button>
                      )}
                      {canCancel && (
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={handleCancel}
                          disabled={cancelPO.isPending}
                        >
                          {cancelPO.isPending ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-1" />
                          )}
                          Cancel
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Purchase order not found
            </div>
          )}
        </SheetContent>
      </Sheet>

      {poId && (
        <GoodsReceiptDialog
          poId={poId}
          open={receiptOpen}
          onOpenChange={setReceiptOpen}
        />
      )}
    </>
  );
}
