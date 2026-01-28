import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  usePurchaseRequisition,
  usePRLines,
  useSubmitPR,
  useConvertPRToPO,
} from "@/hooks/usePurchaseRequisitions";
import { useSuppliers } from "@/hooks/useSuppliers";
import { ApprovalProgress } from "@/components/approval/ApprovalProgress";
import { useApprovalRequestByEntity } from "@/hooks/useApprovalWorkflow";
import {
  CheckCircle,
  Edit,
  FileText,
  Building2,
  Calendar,
  DollarSign,
  Loader2,
  Send,
  User,
  AlertTriangle,
  ClipboardList,
  ShoppingCart,
} from "lucide-react";
import { format } from "date-fns";
import { useFormatCurrency } from "@/lib/formatters";

interface PRDetailsPanelProps {
  prId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}

export function PRDetailsPanel({ prId, open, onOpenChange, onEdit }: PRDetailsPanelProps) {
  const { data: pr, isLoading: prLoading } = usePurchaseRequisition(prId || undefined);
  const { data: lines, isLoading: linesLoading } = usePRLines(prId || undefined);
  const { data: suppliers } = useSuppliers();
  const { data: approvalRequest } = useApprovalRequestByEntity("purchase_requisition", prId);
  const submitPR = useSubmitPR();
  const convertToPO = useConvertPRToPO();

  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");

  const isLoading = prLoading || linesLoading;
  const formatCurrency = useFormatCurrency();
  
  // Check if workflow-based approval exists - if so, don't show legacy buttons
  const hasWorkflowApproval = !!approvalRequest;

  const handleSubmit = async () => {
    if (prId) {
      await submitPR.mutateAsync(prId);
    }
  };

  const handleConvertToPO = async () => {
    if (prId && selectedSupplierId) {
      await convertToPO.mutateAsync({ prId, supplierId: selectedSupplierId });
      setConvertDialogOpen(false);
      setSelectedSupplierId("");
      onOpenChange(false);
    }
  };

  const canEdit = pr?.status === "draft";
  const canSubmit = pr?.status === "draft";
  // Legacy approval buttons only shown if NO workflow-based approval exists
  // When workflow exists, ApprovalProgress handles approve/reject actions
  const canConvert = pr?.status === "approved";

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "text-destructive";
      case "high":
        return "text-orange-500";
      case "normal":
        return "text-foreground";
      case "low":
        return "text-muted-foreground";
      default:
        return "text-foreground";
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pr ? (
            <>
              <SheetHeader className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <SheetTitle className="text-xl">{pr.pr_number}</SheetTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Created {format(new Date(pr.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <StatusBadge status={pr.status || "draft"} />
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Requester & Cost Center */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Requester</span>
                    </div>
                    <p className="text-sm">
                      {pr.profiles?.full_name || pr.profiles?.email || "Not assigned"}
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Cost Center</span>
                    </div>
                    <p className="text-sm">
                      {pr.cost_centers ? `${pr.cost_centers.name} (${pr.cost_centers.code})` : "Not assigned"}
                    </p>
                  </div>
                </div>

                {/* Key Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Required Date</p>
                      <p className="font-medium">
                        {pr.required_date
                          ? format(new Date(pr.required_date), "MMM d, yyyy")
                          : "Not set"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-4 w-4 ${getUrgencyColor(pr.urgency)}`} />
                    <div>
                      <p className="text-xs text-muted-foreground">Priority</p>
                      <p className={`font-medium capitalize ${getUrgencyColor(pr.urgency)}`}>
                        {pr.urgency || "Normal"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Estimated Value</p>
                      <p className="font-medium">
                        {formatCurrency(pr.total_estimated_value, pr.currency)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Line Items</p>
                      <p className="font-medium">{lines?.length || 0} items</p>
                    </div>
                  </div>
                </div>

                {/* Approval Progress - Show workflow-based approval status */}
                {pr.status !== "draft" && (
                  <>
                    <ApprovalProgress
                      entityType="purchase_requisition"
                      entityId={prId}
                      entityNumber={pr.pr_number}
                      showActions={pr.status !== "approved" && pr.status !== "rejected"}
                    />
                    <Separator />
                  </>
                )}

                {/* Legacy Approval Info - Only show if no workflow-based approval */}
                {pr.approved_date && !pr.status?.includes("pending") && (
                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        Approved on {format(new Date(pr.approved_date), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Line Items */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Line Items</span>
                    <span className="text-sm text-muted-foreground">({lines?.length || 0})</span>
                  </div>

                  {lines && lines.length > 0 ? (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lines.map((line) => (
                            <TableRow key={line.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">
                                    {line.product_name || line.products?.name || "Unknown"}
                                  </p>
                                  {line.products?.sku && (
                                    <p className="text-xs text-muted-foreground">
                                      {line.products.sku}
                                    </p>
                                  )}
                                  {line.specifications && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {line.specifications}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {line.quantity} {line.unit_of_measure}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(line.estimated_price, pr.currency)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(line.total_price, pr.currency)}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/50">
                            <TableCell colSpan={3} className="text-right font-medium">
                              Total Estimated Value
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              {formatCurrency(pr.total_estimated_value, pr.currency)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                      No line items
                    </div>
                  )}
                </div>

                {/* Justification */}
                {pr.justification && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">Justification</p>
                      <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                        {pr.justification}
                      </p>
                    </div>
                  </>
                )}

                {/* Notes */}
                {pr.notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">Notes</p>
                      <p className="text-sm text-muted-foreground">{pr.notes}</p>
                    </div>
                  </>
                )}

                <Separator />

                {/* Actions */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Actions</p>
                  <div className="flex flex-wrap gap-2">
                    {canEdit && (
                      <Button variant="outline" size="sm" onClick={onEdit}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                    {canSubmit && (
                      <Button size="sm" onClick={handleSubmit} disabled={submitPR.isPending}>
                        {submitPR.isPending ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-1" />
                        )}
                        Submit for Approval
                      </Button>
                    )}
                    {canConvert && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => setConvertDialogOpen(true)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Convert to PO
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Purchase requisition not found
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Convert to PO Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Purchase Order</DialogTitle>
            <DialogDescription>
              Select a supplier to create a Purchase Order from this requisition.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Supplier *</Label>
              <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-1">
              <p><span className="font-medium">PR:</span> {pr?.pr_number}</p>
              <p><span className="font-medium">Items:</span> {lines?.length || 0}</p>
              <p><span className="font-medium">Estimated Value:</span> {formatCurrency(pr?.total_estimated_value, pr?.currency)}</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConvertToPO}
              disabled={!selectedSupplierId || convertToPO.isPending}
            >
              {convertToPO.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Purchase Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
