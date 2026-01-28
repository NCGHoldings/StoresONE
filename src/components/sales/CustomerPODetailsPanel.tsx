import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCustomerPODetails, useConvertToSalesOrder, useUpdateCustomerPO, useUpdateCustomerPOLine } from "@/hooks/useCustomerPOs";
import { useProducts } from "@/hooks/useWarehouse";
import { useFormatCurrency, useFormatDate } from "@/lib/formatters";
import { ArrowRightLeft, FileText, Package, AlertTriangle } from "lucide-react";

interface CustomerPODetailsPanelProps {
  cpoId: string;
  onClose: () => void;
}

export function CustomerPODetailsPanel({ cpoId, onClose }: CustomerPODetailsPanelProps) {
  const { data, isLoading } = useCustomerPODetails(cpoId);
  const convertToSO = useConvertToSalesOrder();
  const updateCPO = useUpdateCustomerPO();
  const updateLine = useUpdateCustomerPOLine();
  const { data: products = [] } = useProducts();
  const formatCurrency = useFormatCurrency();
  const formatDate = useFormatDate();

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { cpo, lines } = data;
  const hasUnmappedLines = lines.some(line => !line.product_id);

  const handleConvert = async () => {
    await convertToSO.mutateAsync(cpoId);
    onClose();
  };

  const handleMarkReviewed = async () => {
    await updateCPO.mutateAsync({ id: cpoId, updates: { status: "reviewed" } });
  };

  const handleProductAssign = (lineId: string, productId: string) => {
    updateLine.mutate({ lineId, updates: { product_id: productId } });
  };

  return (
    <div className="space-y-6">
      <SheetHeader>
        <div className="flex items-center justify-between">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {cpo.internal_ref}
          </SheetTitle>
          <StatusBadge status={cpo.status} />
        </div>
      </SheetHeader>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Customer PO#</p>
            <p className="font-medium">{cpo.cpo_number}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Customer</p>
            <p className="font-medium">{(cpo.customers as any)?.company_name || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Order Date</p>
            <p className="font-medium">{formatDate(cpo.order_date)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Required Date</p>
            <p className="font-medium">{cpo.required_date ? formatDate(cpo.required_date) : "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="font-medium text-lg">{formatCurrency(cpo.total_amount)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Currency</p>
            <p className="font-medium">{cpo.currency || "USD"}</p>
          </div>
        </div>

        {cpo.shipping_address && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Shipping Address</p>
            <p className="text-sm">{cpo.shipping_address}</p>
          </div>
        )}

        <Separator />

        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Line Items ({lines.length})
            {hasUnmappedLines && (
              <Badge variant="outline" className="border-destructive/50 text-destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Unmapped products
              </Badge>
            )}
          </h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Product</th>
                  <th className="px-3 py-2 text-left">Qty</th>
                  <th className="px-3 py-2 text-right">Unit Price</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.id} className="border-t">
                    <td className="px-3 py-2">{line.line_number}</td>
                    <td className="px-3 py-2">
                      {!line.product_id ? (
                        <div className="space-y-1">
                          <Select 
                            onValueChange={(productId) => handleProductAssign(line.id, productId)}
                            disabled={updateLine.isPending}
                          >
                            <SelectTrigger className="h-8 text-sm border-destructive/50 bg-destructive/5">
                              <SelectValue placeholder="Assign product..." />
                            </SelectTrigger>
                            <SelectContent>
                              {products.filter(p => p.is_active).map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.sku} - {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Product required for conversion
                          </p>
                          {line.description && (
                            <p className="text-xs text-muted-foreground">Description: {line.description}</p>
                          )}
                        </div>
                      ) : (
                        <>
                          <p className="font-medium">{line.products?.name || line.description || "-"}</p>
                          {line.products?.sku && (
                            <p className="text-xs text-muted-foreground">{line.products.sku}</p>
                          )}
                        </>
                      )}
                      {line.customer_sku && (
                        <Badge variant="outline" className="text-xs mt-1">
                          Cust: {line.customer_sku}
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-2">{line.quantity}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(line.unit_price)}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(line.total_price)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/50">
                <tr>
                  <td colSpan={4} className="px-3 py-2 text-right font-medium">Total:</td>
                  <td className="px-3 py-2 text-right font-bold">{formatCurrency(cpo.total_amount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {cpo.notes && (
          <>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground mb-1">Notes</p>
              <p className="text-sm">{cpo.notes}</p>
            </div>
          </>
        )}

        <Separator />

        <div className="space-y-3">
          {hasUnmappedLines && (cpo.status === "received" || cpo.status === "reviewed") && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Assign products to all lines before converting
            </p>
          )}
          <div className="flex gap-3">
            {cpo.status === "received" && (
              <Button
                variant="outline"
                onClick={handleMarkReviewed}
                disabled={updateCPO.isPending}
              >
                Mark as Reviewed
              </Button>
            )}
            {(cpo.status === "received" || cpo.status === "reviewed") && (
              <Button
                onClick={handleConvert}
                disabled={convertToSO.isPending || hasUnmappedLines}
                title={hasUnmappedLines ? "Assign products to all lines first" : ""}
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Convert to Sales Order
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
