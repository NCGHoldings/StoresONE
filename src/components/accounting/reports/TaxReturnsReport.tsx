import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, FileText, Plus, CheckCircle } from "lucide-react";
import { format, startOfQuarter, endOfQuarter, startOfMonth, endOfMonth } from "date-fns";
import { useTaxSummary, getDateRange } from "@/hooks/useFinancialReports";
import { ReportHeader } from "./shared/ReportHeader";
import { formatCurrencyStatic as formatCurrency } from "@/lib/formatters";

interface TaxReturn {
  id: string;
  period: string;
  type: "monthly" | "quarterly";
  dueDate: string;
  status: "draft" | "ready" | "filed" | "acknowledged";
  vatPayable: number;
  whtPayable: number;
}

// Mock tax returns data - in production this would come from a database
const mockTaxReturns: TaxReturn[] = [
  {
    id: "1",
    period: "Q4 2025",
    type: "quarterly",
    dueDate: "2026-01-31",
    status: "filed",
    vatPayable: 12500,
    whtPayable: 3200,
  },
  {
    id: "2",
    period: "Q1 2026",
    type: "quarterly",
    dueDate: "2026-04-30",
    status: "draft",
    vatPayable: 0,
    whtPayable: 0,
  },
];

export function TaxReturnsReport() {
  const [periodType, setPeriodType] = useState<"monthly" | "quarterly">("quarterly");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [taxReturns] = useState<TaxReturn[]>(mockTaxReturns);

  // Get current period for tax calculation
  const now = new Date();
  const currentPeriodStart = periodType === "quarterly" 
    ? format(startOfQuarter(now), "yyyy-MM-dd")
    : format(startOfMonth(now), "yyyy-MM-dd");
  const currentPeriodEnd = periodType === "quarterly"
    ? format(endOfQuarter(now), "yyyy-MM-dd")
    : format(endOfMonth(now), "yyyy-MM-dd");

  const { data: taxData } = useTaxSummary({ start: currentPeriodStart, end: currentPeriodEnd });

  const getStatusBadge = (status: TaxReturn["status"]) => {
    const variants: Record<TaxReturn["status"], { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      draft: { variant: "secondary", label: "Draft" },
      ready: { variant: "outline", label: "Ready to File" },
      filed: { variant: "default", label: "Filed" },
      acknowledged: { variant: "default", label: "Acknowledged" },
    };
    return <Badge variant={variants[status].variant}>{variants[status].label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <ReportHeader title="Tax Returns" subtitle="Prepare and track tax return filings">
        <div className="flex items-center gap-2">
          <Select value={periodType} onValueChange={(v) => setPeriodType(v as "monthly" | "quarterly")}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </ReportHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Tax Return Filings</CardTitle>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Return
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Period</TableHead>
                  <TableHead className="font-semibold">Due Date</TableHead>
                  <TableHead className="text-right font-semibold">VAT Payable</TableHead>
                  <TableHead className="text-right font-semibold">WHT Payable</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taxReturns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No tax returns found for the selected period
                    </TableCell>
                  </TableRow>
                ) : (
                  taxReturns.map((taxReturn) => (
                    <TableRow key={taxReturn.id}>
                      <TableCell className="font-medium">{taxReturn.period}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(taxReturn.dueDate), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(taxReturn.vatPayable)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(taxReturn.whtPayable)}
                      </TableCell>
                      <TableCell>{getStatusBadge(taxReturn.status)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Period Preview</CardTitle>
            <p className="text-sm text-muted-foreground">
              {periodType === "quarterly" ? "Q" + Math.ceil((now.getMonth() + 1) / 3) : format(now, "MMMM")} {selectedYear}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Net VAT</span>
              <span className={`font-mono font-semibold ${(taxData?.netVAT || 0) >= 0 ? "text-red-600" : "text-green-600"}`}>
                {formatCurrency(Math.abs(taxData?.netVAT || 0))}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">WHT Deducted</span>
              <span className="font-mono font-semibold">
                {formatCurrency(taxData?.whtTotalDeducted || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">WHT Certificates</span>
              <span className="font-semibold">{taxData?.whtCertificatesIssued || 0}</span>
            </div>

            <div className="pt-4 space-y-2">
              <Button className="w-full" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Generate Return
              </Button>
              <Button className="w-full" disabled>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Filed
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
