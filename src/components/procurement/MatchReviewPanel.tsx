import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  ShoppingCart, 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Link as LinkIcon,
  Loader2,
  ArrowRight,
  Info
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { usePurchaseOrder } from "@/hooks/usePurchaseOrders";
import { useInboundDeliveries } from "@/hooks/useInboundDeliveries";
import { 
  useMatchTolerance, 
  useLinkInvoiceToGR, 
  useApproveForPayment, 
  useFlagForInvestigation 
} from "@/hooks/useThreeWayMatch";
import { useFormatCurrency, useFormatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface MatchReviewPanelProps {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type MatchStatus = "pending" | "full_match" | "partial_match" | "mismatch";

// Extended invoice type with goods_receipt_id
interface InvoiceWithGR {
  id: string;
  invoice_number: string;
  supplier_id: string | null;
  po_id: string | null;
  invoice_date: string;
  due_date: string;
  amount: number;
  currency: string;
  status: string;
  goods_receipt_id: string | null;
  notes: string | null;
  suppliers?: {
    company_name: string;
    supplier_code: string;
  };
  purchase_orders?: {
    po_number: string;
    total_amount: number;
  };
}

// Custom hook to fetch invoice with goods_receipt_id
function useInvoiceWithGR(id: string | null) {
  return useQuery({
    queryKey: ["invoice-with-gr", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          suppliers (company_name, supplier_code),
          purchase_orders (po_number, total_amount)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as InvoiceWithGR;
    },
    enabled: !!id,
  });
}

export function MatchReviewPanel({ invoiceId, open, onOpenChange }: MatchReviewPanelProps) {
  const [notes, setNotes] = useState("");
  const [selectedGrId, setSelectedGrId] = useState<string>("");
  
  const formatCurrency = useFormatCurrency();
  const formatDate = useFormatDate();
  
  const { data: invoice, isLoading: invoiceLoading } = useInvoiceWithGR(invoiceId);
  const { data: purchaseOrder, isLoading: poLoading } = usePurchaseOrder(invoice?.po_id ?? null);
  const { data: allDeliveries } = useInboundDeliveries();
  const { percentTolerance, amountTolerance } = useMatchTolerance();
  
  const linkToGR = useLinkInvoiceToGR();
  const approveForPayment = useApproveForPayment();
  const flagForInvestigation = useFlagForInvestigation();

  // Find deliveries for this PO
  const poDeliveries = allDeliveries?.filter(d => d.po_id === invoice?.po_id) ?? [];
  const linkedGR = invoice?.goods_receipt_id 
    ? poDeliveries.find(d => d.id === invoice.goods_receipt_id)
    : poDeliveries.find(d => d.status === "completed");

  // Calculate variance
  const invoiceAmount = invoice?.amount ?? 0;
  const poAmount = purchaseOrder?.total_amount ?? 0;
  const variance = invoiceAmount - poAmount;
  const variancePercent = poAmount > 0 ? (variance / poAmount) * 100 : 0;

  // Determine match status
  const getMatchStatus = (): MatchStatus => {
    if (!invoice?.po_id) return "pending";
    if (!linkedGR) return "pending";
    
    const withinAmountTolerance = Math.abs(variance) <= amountTolerance;
    const withinPercentTolerance = Math.abs(variancePercent) <= percentTolerance;
    
    if (withinAmountTolerance || withinPercentTolerance) return "full_match";
    if (Math.abs(variancePercent) <= percentTolerance * 2) return "partial_match";
    return "mismatch";
  };

  const matchStatus = getMatchStatus();

  const getStatusBadge = (status: MatchStatus) => {
    switch (status) {
      case "full_match":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400">Full Match</Badge>;
      case "partial_match":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400">Partial Match</Badge>;
      case "mismatch":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Mismatch</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const handleLinkGR = async () => {
    if (!invoiceId || !selectedGrId) return;
    await linkToGR.mutateAsync({ invoiceId, grId: selectedGrId });
    setSelectedGrId("");
  };

  const handleApprove = async () => {
    if (!invoiceId) return;
    await approveForPayment.mutateAsync(invoiceId);
    onOpenChange(false);
  };

  const handleFlag = async () => {
    if (!invoiceId) return;
    await flagForInvestigation.mutateAsync({ invoiceId, reason: notes || "Flagged for investigation" });
    setNotes("");
    onOpenChange(false);
  };

  const isLoading = invoiceLoading || poLoading;
  const isActionLoading = linkToGR.isPending || approveForPayment.isPending || flagForInvestigation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[700px] sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl">{invoice?.invoice_number ?? "Loading..."}</SheetTitle>
            {!isLoading && getStatusBadge(matchStatus)}
          </div>
          {invoice?.suppliers && (
            <p className="text-sm text-muted-foreground">
              {invoice.suppliers.company_name} • Invoice Date: {formatDate(invoice.invoice_date)}
            </p>
          )}
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Document Comparison Cards */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">DOCUMENT COMPARISON</h3>
              <div className="grid grid-cols-3 gap-3">
                {/* Invoice Card */}
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Invoice
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-1">
                    <p className="font-semibold text-sm">{invoice?.invoice_number}</p>
                    <p className="text-lg font-bold">{formatCurrency(invoiceAmount)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(invoice?.invoice_date)}</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {invoice?.status ?? "pending"}
                    </Badge>
                  </CardContent>
                </Card>

                {/* PO Card */}
                <Card className={cn(
                  "border-muted",
                  purchaseOrder ? "bg-muted/30" : "bg-muted/10"
                )}>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      Purchase Order
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-1">
                    {purchaseOrder ? (
                      <>
                        <p className="font-semibold text-sm">{purchaseOrder.po_number}</p>
                        <p className="text-lg font-bold">{formatCurrency(poAmount)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(purchaseOrder.order_date)}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {purchaseOrder.status ?? "draft"}
                        </Badge>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No PO linked</p>
                    )}
                  </CardContent>
                </Card>

                {/* GR Card */}
                <Card className={cn(
                  "border-muted",
                  linkedGR ? "bg-muted/30" : "bg-muted/10"
                )}>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      Goods Receipt
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-1">
                    {linkedGR ? (
                      <>
                        <p className="font-semibold text-sm">{linkedGR.delivery_number}</p>
                        <p className="text-lg font-bold">{linkedGR.received_items ?? 0} items</p>
                        <p className="text-xs text-muted-foreground">{formatDate(linkedGR.actual_date)}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {linkedGR.status ?? "pending"}
                        </Badge>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No receipt found</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Link GR Section (if needed) */}
            {!linkedGR && poDeliveries.length > 0 && (
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <LinkIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="font-medium text-sm">Link Goods Receipt</p>
                        <p className="text-xs text-muted-foreground">
                          Select a goods receipt to complete the 3-way match
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Select value={selectedGrId} onValueChange={setSelectedGrId}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select a GRN..." />
                          </SelectTrigger>
                          <SelectContent>
                            {poDeliveries.map(gr => (
                              <SelectItem key={gr.id} value={gr.id}>
                                {gr.delivery_number} - {gr.received_items ?? 0} items
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          size="sm" 
                          onClick={handleLinkGR}
                          disabled={!selectedGrId || linkToGR.isPending}
                        >
                          {linkToGR.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>Link <ArrowRight className="h-3 w-3 ml-1" /></>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Variance Analysis */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">VARIANCE ANALYSIS</h3>
              <div className="space-y-3">
                {/* Amount Variance */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    {Math.abs(variancePercent) <= percentTolerance ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    ) : Math.abs(variancePercent) <= percentTolerance * 2 ? (
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <div>
                      <p className="font-medium text-sm">Amount Variance</p>
                      <p className="text-xs text-muted-foreground">
                        Invoice vs Purchase Order
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "font-semibold",
                      variance === 0 ? "text-foreground" :
                      variance > 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
                    )}>
                      {variance >= 0 ? "+" : ""}{formatCurrency(variance)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {variancePercent >= 0 ? "+" : ""}{variancePercent.toFixed(2)}%
                    </p>
                  </div>
                </div>

                {/* Quantity Match */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    {linkedGR ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    )}
                    <div>
                      <p className="font-medium text-sm">Goods Receipt</p>
                      <p className="text-xs text-muted-foreground">
                        Items received confirmation
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {linkedGR ? `${linkedGR.received_items ?? 0} items` : "Not received"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {linkedGR?.status ?? "Pending"}
                    </p>
                  </div>
                </div>

                {/* Tolerance Info */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <Info className="h-4 w-4 text-primary" />
                  <p className="text-xs text-muted-foreground">
                    Configured tolerance: <span className="font-medium">{percentTolerance}%</span> or{" "}
                    <span className="font-medium">{formatCurrency(amountTolerance)}</span>
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Notes Section */}
            <div>
              <Label htmlFor="match-notes" className="text-sm font-medium text-muted-foreground">
                MATCH NOTES
              </Label>
              <Textarea
                id="match-notes"
                placeholder="Add notes about this match review..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2 min-h-[80px]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              {matchStatus === "full_match" && (
                <Button 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleApprove}
                  disabled={isActionLoading}
                >
                  {approveForPayment.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Approve for Payment
                </Button>
              )}
              
              {matchStatus === "partial_match" && (
                <>
                  <Button 
                    variant="outline"
                    className="flex-1"
                    onClick={handleApprove}
                    disabled={isActionLoading}
                  >
                    {approveForPayment.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Approve Anyway
                  </Button>
                  <Button 
                    variant="destructive"
                    className="flex-1"
                    onClick={handleFlag}
                    disabled={isActionLoading}
                  >
                    {flagForInvestigation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 mr-2" />
                    )}
                    Flag for Review
                  </Button>
                </>
              )}
              
              {matchStatus === "mismatch" && (
                <Button 
                  variant="destructive"
                  className="flex-1"
                  onClick={handleFlag}
                  disabled={isActionLoading || !notes}
                >
                  {flagForInvestigation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Flag for Investigation
                </Button>
              )}

              {matchStatus === "pending" && !linkedGR && poDeliveries.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  No goods receipts available for this PO. Complete the receipt process first.
                </p>
              )}

              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
