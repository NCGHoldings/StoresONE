import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePOSSale, usePOSSaleItems, POSSaleItem } from "@/hooks/usePOSSales";
import { useFormatCurrency, useFormatDate } from "@/lib/formatters";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable } from "@/components/shared/DataTable";
import { FileText, Receipt, AlertCircle, Code } from "lucide-react";

interface POSSaleDetailsPanelProps {
  saleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function POSSaleDetailsPanel({
  saleId,
  open,
  onOpenChange,
}: POSSaleDetailsPanelProps) {
  const formatCurrency = useFormatCurrency();
  const formatDate = useFormatDate();
  const { data: sale, isLoading: saleLoading } = usePOSSale(saleId);
  const { data: items } = usePOSSaleItems(saleId);

  const itemColumns = [
    { key: "sku", label: "SKU" },
    { key: "products", label: "Product", render: (item: POSSaleItem) => 
      item.products?.name || item.sku 
    },
    { key: "quantity", label: "Qty" },
    { key: "unit_price", label: "Unit Price", render: (item: POSSaleItem) => formatCurrency(item.unit_price) },
    { key: "discount", label: "Discount", render: (item: POSSaleItem) => formatCurrency(item.discount || 0) },
    { key: "tax_rate", label: "Tax %", render: (item: POSSaleItem) => `${item.tax_rate}%` },
    { key: "line_total", label: "Total", render: (item: POSSaleItem) => formatCurrency(item.line_total) },
  ];

  if (!open) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden p-0">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle className="flex items-center gap-2">
            POS Sale Details
            {sale?.status && <StatusBadge status={sale.status} />}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)] p-6">
          {saleLoading ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-muted-foreground">Loading...</span>
            </div>
          ) : sale ? (
            <div className="space-y-6">
              {/* Transaction Info */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Transaction Info</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Terminal ID:</span>
                    <p className="font-medium">{sale.pos_terminal_id}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Transaction ID:</span>
                    <p className="font-medium font-mono text-xs">{sale.pos_transaction_id}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date/Time:</span>
                    <p className="font-medium">{formatDate(sale.transaction_datetime)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payment Method:</span>
                    <p className="font-medium capitalize">{sale.payment_method || "—"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Info */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Customer</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  {sale.customers ? (
                    <div className="flex justify-between">
                      <span>{sale.customers.company_name}</span>
                      <Badge variant="outline">{sale.customers.customer_code}</Badge>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Walk-in Customer</span>
                  )}
                </CardContent>
              </Card>

              {/* Amount Summary */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Amount Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>{formatCurrency(sale.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax:</span>
                    <span>{formatCurrency(sale.tax_amount)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>{formatCurrency(sale.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-primary">
                    <span>Amount Paid:</span>
                    <span>{formatCurrency(sale.amount_paid)}</span>
                  </div>
                  {(sale.change_given ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Change Given:</span>
                      <span>{formatCurrency(sale.change_given || 0)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Linked Documents */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Linked Documents</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {sale.customer_invoices ? (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>Invoice:</span>
                      <Badge variant="secondary">{sale.customer_invoices.invoice_number}</Badge>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>No invoice linked</span>
                    </div>
                  )}
                  {sale.customer_receipts ? (
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      <span>Receipt:</span>
                      <Badge variant="secondary">{sale.customer_receipts.receipt_number}</Badge>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Receipt className="h-4 w-4" />
                      <span>No receipt linked</span>
                    </div>
                  )}
                  {sale.bank_accounts && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Bank Account:</span>
                      <span>{sale.bank_accounts.account_name}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Error Message */}
              {sale.error_message && (
                <Card className="border-destructive">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium text-destructive flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Error Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-destructive/10 p-3 rounded-md overflow-x-auto whitespace-pre-wrap">
                      {sale.error_message}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {/* Line Items */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Line Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable data={items || []} columns={itemColumns} />
                </CardContent>
              </Card>

              {/* Raw Payload */}
              {sale.raw_payload && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Raw Payload (Debug)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto max-h-48">
                      {JSON.stringify(sale.raw_payload, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <span className="text-muted-foreground">Sale not found</span>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
