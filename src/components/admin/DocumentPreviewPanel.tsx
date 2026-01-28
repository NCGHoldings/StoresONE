import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Package,
  DollarSign,
  User,
  Calendar,
  Building2,
  Hash,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ApprovalRequest } from "@/hooks/useApprovalWorkflow";
import { formatCurrencyStatic } from "@/lib/formatters";

interface DocumentPreviewPanelProps {
  request: ApprovalRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DocumentData {
  loading: boolean;
  header: Record<string, unknown> | null;
  lines: Array<Record<string, unknown>>;
}

export function DocumentPreviewPanel({
  request,
  open,
  onOpenChange,
}: DocumentPreviewPanelProps) {
  const [docData, setDocData] = useState<DocumentData>({
    loading: false,
    header: null,
    lines: [],
  });

  useEffect(() => {
    if (!open || !request) {
      setDocData({ loading: false, header: null, lines: [] });
      return;
    }

    const fetchDocumentData = async () => {
      setDocData({ loading: true, header: null, lines: [] });

      try {
        let headerData = null;
        let linesData: Array<Record<string, unknown>> = [];

        switch (request.entity_type) {
          case "purchase_requisition": {
            const { data: pr } = await supabase
              .from("purchase_requisitions")
              .select(`
                *,
                cost_centers (id, name, code),
                profiles:requestor_id (id, full_name, email)
              `)
              .eq("id", request.entity_id)
              .single();
            
            const { data: lines } = await supabase
              .from("purchase_requisition_lines")
              .select(`*, products (id, sku, name)`)
              .eq("pr_id", request.entity_id);
            
            headerData = pr;
            linesData = lines || [];
            break;
          }

          case "purchase_order": {
            const { data: po } = await supabase
              .from("purchase_orders")
              .select(`
                *,
                suppliers (id, company_name, supplier_code)
              `)
              .eq("id", request.entity_id)
              .single();
            
            const { data: lines } = await supabase
              .from("purchase_order_lines")
              .select(`*, products (id, sku, name)`)
              .eq("po_id", request.entity_id);
            
            headerData = po;
            linesData = lines || [];
            break;
          }

          case "supplier_registration": {
            const { data: supplier } = await supabase
              .from("suppliers")
              .select("*")
              .eq("id", request.entity_id)
              .single();
            
            headerData = supplier;
            break;
          }

          case "goods_receipt": {
            const { data: grn } = await supabase
              .from("inbound_deliveries")
              .select(`
                *,
                purchase_orders (id, po_number, suppliers (company_name))
              `)
              .eq("id", request.entity_id)
              .single();
            
            const { data: lines } = await supabase
              .from("grn_lines")
              .select(`*, products (id, sku, name)`)
              .eq("grn_id", request.entity_id);
            
            headerData = grn;
            linesData = lines || [];
            break;
          }
        }

        setDocData({ loading: false, header: headerData, lines: linesData });
      } catch (error) {
        console.error("Error fetching document data:", error);
        setDocData({ loading: false, header: null, lines: [] });
      }
    };

    fetchDocumentData();
  }, [open, request]);

  if (!request) return null;

  const renderPRDetails = () => {
    const pr = docData.header as Record<string, unknown> | null;
    if (!pr) return null;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
      <InfoItem icon={Hash} label="PR Number" value={String(pr.pr_number)} />
          <InfoItem icon={Calendar} label="Required Date" value={pr.required_date ? format(new Date(pr.required_date as string), "MMM d, yyyy") : "N/A"} />
          <InfoItem icon={DollarSign} label="Total Value" value={formatCurrencyStatic(pr.total_estimated_value as number || 0)} />
          <InfoItem icon={Building2} label="Department" value={String(pr.department || "N/A")} />
        </div>
        
        <Separator />
        
        <div>
          <h4 className="font-medium mb-2">Justification</h4>
          <p className="text-sm text-muted-foreground">{(pr.justification as string) || "No justification provided"}</p>
        </div>

        {docData.lines.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-2">Line Items ({docData.lines.length})</h4>
              <div className="space-y-2">
                {docData.lines.map((line, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-muted/50 rounded-md text-sm">
                    <div>
                      <span className="font-medium">{String((line.products as Record<string, unknown>)?.name || line.product_name || "Unknown")}</span>
                      <span className="text-muted-foreground ml-2">x{String(line.quantity)}</span>
                    </div>
                    <span>{formatCurrencyStatic((line.total_price as number) || 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderPODetails = () => {
    const po = docData.header as Record<string, unknown> | null;
    if (!po) return null;

    const supplier = po.suppliers as Record<string, unknown> | null;

    return (
      <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
          <InfoItem icon={Hash} label="PO Number" value={String(po.po_number)} />
          <InfoItem icon={Building2} label="Supplier" value={String(supplier?.company_name || "N/A")} />
          <InfoItem icon={DollarSign} label="Total Amount" value={formatCurrencyStatic(po.total_amount as number || 0)} />
          <InfoItem icon={Calendar} label="Expected Delivery" value={po.expected_delivery ? format(new Date(po.expected_delivery as string), "MMM d, yyyy") : "N/A"} />
        </div>

        {docData.lines.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-2">Line Items ({docData.lines.length})</h4>
              <div className="space-y-2">
                {docData.lines.map((line, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-muted/50 rounded-md text-sm">
                    <div>
                      <span className="font-medium">{String((line.products as Record<string, unknown>)?.name || "Unknown")}</span>
                      <span className="text-muted-foreground ml-2">x{String(line.quantity)} @ {formatCurrencyStatic((line.unit_price as number) || 0)}</span>
                    </div>
                    <span>{formatCurrencyStatic((line.total_price as number) || 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderSupplierDetails = () => {
    const supplier = docData.header as Record<string, unknown> | null;
    if (!supplier) return null;

    return (
      <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
          <InfoItem icon={Building2} label="Company Name" value={String(supplier.company_name)} />
          <InfoItem icon={Hash} label="Supplier Code" value={String(supplier.supplier_code)} />
          <InfoItem icon={User} label="Contact Person" value={String(supplier.contact_person || "N/A")} />
          <InfoItem icon={FileText} label="Category" value={String(supplier.category || "N/A")} />
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
            <p className="text-sm">{(supplier.email as string) || "N/A"}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Phone</h4>
            <p className="text-sm">{(supplier.phone as string) || "N/A"}</p>
          </div>
          <div className="col-span-2">
            <h4 className="text-sm font-medium text-muted-foreground">Address</h4>
            <p className="text-sm">
              {[supplier.address, supplier.city, supplier.country].filter(Boolean).join(", ") || "N/A"}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderGRNDetails = () => {
    const grn = docData.header as Record<string, unknown> | null;
    if (!grn) return null;

    const po = grn.purchase_orders as Record<string, unknown> | null;

    return (
      <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
          <InfoItem icon={Hash} label="GRN Number" value={String(grn.delivery_number)} />
          <InfoItem icon={FileText} label="Reference PO" value={String(po?.po_number || "N/A")} />
          <InfoItem icon={Calendar} label="Received Date" value={grn.received_date ? format(new Date(grn.received_date as string), "MMM d, yyyy") : "N/A"} />
          <InfoItem icon={Package} label="Status" value={String(grn.status)} />
        </div>

        {docData.lines.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-2">Received Items ({docData.lines.length})</h4>
              <div className="space-y-2">
                {docData.lines.map((line, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-muted/50 rounded-md text-sm">
                    <span className="font-medium">{String((line.products as Record<string, unknown>)?.name || "Unknown")}</span>
                    <span>Qty: {String(line.received_quantity || line.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (docData.loading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      );
    }

    if (!docData.header) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>Unable to load document details</p>
        </div>
      );
    }

    switch (request.entity_type) {
      case "purchase_requisition":
        return renderPRDetails();
      case "purchase_order":
        return renderPODetails();
      case "supplier_registration":
        return renderSupplierDetails();
      case "goods_receipt":
        return renderGRNDetails();
      default:
        return <p className="text-muted-foreground">Preview not available for this document type</p>;
    }
  };

  const getEntityLabel = () => {
    const labels: Record<string, string> = {
      purchase_requisition: "Purchase Requisition",
      purchase_order: "Purchase Order",
      supplier_registration: "Supplier Registration",
      goods_receipt: "Goods Receipt",
    };
    return labels[request.entity_type] || request.entity_type;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[450px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {request.entity_number}
          </SheetTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{getEntityLabel()}</Badge>
            <Badge variant={request.status === "pending" ? "secondary" : request.status === "approved" ? "default" : "destructive"}>
              {request.status}
            </Badge>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6 pr-4">
          {renderContent()}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
