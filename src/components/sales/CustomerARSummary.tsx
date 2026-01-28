import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFormatCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { FileText, Receipt, AlertTriangle, TrendingUp } from "lucide-react";
import { Customer } from "@/hooks/useCustomers";

interface CustomerARSummaryProps {
  customer: Customer;
}

export function CustomerARSummary({ customer }: CustomerARSummaryProps) {
  const formatCurrency = useFormatCurrency();
  const [activeTab, setActiveTab] = useState("invoices");

  // Fetch outstanding invoices
  const { data: invoices = [] } = useQuery({
    queryKey: ["customer-invoices", customer.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_invoices")
        .select("*")
        .eq("customer_id", customer.id)
        .order("invoice_date", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  // Fetch receipts
  const { data: receipts = [] } = useQuery({
    queryKey: ["customer-receipts", customer.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_receipts")
        .select("*")
        .eq("customer_id", customer.id)
        .order("receipt_date", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  // Calculate summary metrics
  const outstandingInvoices = invoices.filter((i) => i.status !== "paid" && i.status !== "cancelled");
  const outstandingBalance = outstandingInvoices.reduce(
    (sum, inv) => sum + ((inv.total_amount || 0) - (inv.amount_paid || 0)),
    0
  );
  const creditLimit = customer.credit_limit || 0;
  const availableCredit = Math.max(0, creditLimit - outstandingBalance);
  const creditUsagePercent = creditLimit > 0 ? (outstandingBalance / creditLimit) * 100 : 0;

  // Calculate DSO (Days Sales Outstanding)
  const calculateDSO = () => {
    const now = new Date();
    let totalDays = 0;
    let totalAmount = 0;
    
    for (const inv of outstandingInvoices) {
      const invoiceDate = new Date(inv.invoice_date);
      const daysDiff = Math.floor((now.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
      const outstanding = (inv.total_amount || 0) - (inv.amount_paid || 0);
      totalDays += daysDiff * outstanding;
      totalAmount += outstanding;
    }
    
    return totalAmount > 0 ? Math.round(totalDays / totalAmount) : 0;
  };

  const dso = calculateDSO();

  // Ageing buckets
  const calculateAgeing = () => {
    const now = new Date();
    const buckets = { current: 0, days30: 0, days60: 0, days90: 0, over90: 0 };
    
    for (const inv of outstandingInvoices) {
      const dueDate = new Date(inv.due_date);
      const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const outstanding = (inv.total_amount || 0) - (inv.amount_paid || 0);
      
      if (daysPastDue <= 0) buckets.current += outstanding;
      else if (daysPastDue <= 30) buckets.days30 += outstanding;
      else if (daysPastDue <= 60) buckets.days60 += outstanding;
      else if (daysPastDue <= 90) buckets.days90 += outstanding;
      else buckets.over90 += outstanding;
    }
    
    return buckets;
  };

  const ageing = calculateAgeing();

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "paid": return "default";
      case "partial": return "secondary";
      case "overdue": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(outstandingBalance)}</div>
            <p className="text-xs text-muted-foreground">
              {outstandingInvoices.length} unpaid invoice{outstandingInvoices.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Credit Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Used: {formatCurrency(outstandingBalance)}</span>
                <span>Limit: {formatCurrency(creditLimit)}</span>
              </div>
              <Progress 
                value={Math.min(creditUsagePercent, 100)} 
                className={creditUsagePercent > 90 ? "[&>div]:bg-destructive" : creditUsagePercent > 70 ? "[&>div]:bg-warning" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Available: {formatCurrency(availableCredit)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              DSO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dso} days</div>
            <p className="text-xs text-muted-foreground">Days Sales Outstanding</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(ageing.days30 + ageing.days60 + ageing.days90 + ageing.over90)}
            </div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
      </div>

      {/* Ageing Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Ageing Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4 text-center">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Current</p>
              <p className="text-lg font-semibold text-primary">{formatCurrency(ageing.current)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">1-30 Days</p>
              <p className="text-lg font-semibold text-accent-foreground">{formatCurrency(ageing.days30)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">31-60 Days</p>
              <p className="text-lg font-semibold text-secondary-foreground">{formatCurrency(ageing.days60)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">61-90 Days</p>
              <p className="text-lg font-semibold text-destructive">{formatCurrency(ageing.days90)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">90+ Days</p>
              <p className="text-lg font-semibold text-destructive">{formatCurrency(ageing.over90)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices and Receipts Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Invoices ({invoices.length})
          </TabsTrigger>
          <TabsTrigger value="receipts" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Receipts ({receipts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                      <TableCell>{format(new Date(inv.invoice_date), "MMM d, yyyy")}</TableCell>
                      <TableCell>{format(new Date(inv.due_date), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right">{formatCurrency(inv.total_amount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(inv.amount_paid || 0)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency((inv.total_amount || 0) - (inv.amount_paid || 0))}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(inv.status || "sent")}>
                          {inv.status || "sent"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="receipts" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No receipts found
                    </TableCell>
                  </TableRow>
                ) : (
                  receipts.map((rcp) => (
                    <TableRow key={rcp.id}>
                      <TableCell className="font-medium">{rcp.receipt_number}</TableCell>
                      <TableCell>{format(new Date(rcp.receipt_date), "MMM d, yyyy")}</TableCell>
                      <TableCell className="capitalize">{rcp.payment_method || "-"}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(rcp.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={rcp.status === "allocated" ? "default" : "secondary"}>
                          {rcp.status || "pending"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
