import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import {
  PackageMinus,
  Search,
  Download,
  Calendar,
  Package,
  TrendingDown,
  FileText,
} from "lucide-react";
import { useInventoryIssues, useIssueStats, IssueFilters } from "@/hooks/useInventoryIssues";
import { format } from "date-fns";

export default function IssuesInquiry() {
  const [filters, setFilters] = useState<IssueFilters>({});
  const [productSearch, setProductSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [referenceType, setReferenceType] = useState<string>("");

  const { data: issues, isLoading } = useInventoryIssues({
    ...filters,
    productSearch: productSearch || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    referenceType: referenceType || undefined,
  });

  const { data: stats } = useIssueStats();

  const handleSearch = () => {
    setFilters({
      productSearch: productSearch || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      referenceType: referenceType || undefined,
    });
  };

  const handleExport = () => {
    if (!issues || issues.length === 0) return;

    const csvContent = [
      ["Date", "Product SKU", "Product Name", "Qty Issued", "Bin", "Batch", "Ref Type", "SO#", "CPO#", "Customer", "Notes"],
      ...issues.map((issue) => [
        issue.transaction_date ? format(new Date(issue.transaction_date), "yyyy-MM-dd HH:mm") : "",
        issue.products?.sku || "",
        issue.products?.name || "",
        issue.quantity.toString(),
        issue.storage_bins?.bin_code || "",
        issue.inventory_batches?.batch_number || "",
        issue.reference_type || "",
        issue.sales_order?.so_number || "",
        issue.sales_order?.customer_pos?.cpo_number || "",
        issue.sales_order?.customer_pos?.customers?.company_name || "",
        issue.notes || "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-issues-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <MainLayout>
      <PageHeader
        title="Issues Inquiry"
        subtitle="Track all inventory issues including Sales Order and CPO fulfillment"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayCount || 0}</div>
            <p className="text-xs text-muted-foreground">issues</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.weekCount || 0}</div>
            <p className="text-xs text-muted-foreground">issues</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Product</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {stats?.topProduct?.sku || "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.topProduct ? `${stats.topProduct.count} issues` : "No data"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Month Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.monthTotal?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">units issued</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-1 block">Product Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by SKU or name..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-[150px]">
              <label className="text-sm font-medium mb-1 block">Date From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="w-[150px]">
              <label className="text-sm font-medium mb-1 block">Date To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="w-[180px]">
              <label className="text-sm font-medium mb-1 block">Reference Type</label>
              <Select value={referenceType || "all"} onValueChange={(val) => setReferenceType(val === "all" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="sales_order">Sales Order</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={!issues?.length}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty Issued</TableHead>
                  <TableHead>Bin</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Ref Type</TableHead>
                  <TableHead>SO#</TableHead>
                  <TableHead>CPO#</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : !issues || issues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No issues found
                    </TableCell>
                  </TableRow>
                ) : (
                  issues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell className="whitespace-nowrap">
                        {issue.transaction_date
                          ? format(new Date(issue.transaction_date), "yyyy-MM-dd HH:mm")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{issue.products?.sku || "-"}</div>
                        <div className="text-xs text-muted-foreground">
                          {issue.products?.name || ""}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-destructive">
                        {issue.quantity}
                      </TableCell>
                      <TableCell>{issue.storage_bins?.bin_code || "-"}</TableCell>
                      <TableCell>{issue.inventory_batches?.batch_number || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {issue.reference_type?.replace("_", " ") || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {issue.sales_order?.so_number || "-"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {issue.sales_order?.customer_pos?.cpo_number || "-"}
                      </TableCell>
                      <TableCell>
                        {issue.sales_order?.customer_pos?.customers?.company_name || "-"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {issue.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
