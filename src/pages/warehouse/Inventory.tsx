import { useState } from "react";
import { Search, Plus, Package, DollarSign, AlertTriangle, AlertCircle, ArrowUpDown } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInventory, useInventoryStats, InventoryItem } from "@/hooks/useInventory";
import { InventoryFormDialog } from "@/components/warehouse/InventoryFormDialog";
import { StockAdjustmentDialog } from "@/components/warehouse/StockAdjustmentDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useFormatCurrency } from "@/lib/formatters";

type StockStatus = "in-stock" | "low-stock" | "critical";

function getStockStatus(item: InventoryItem): StockStatus {
  const quantity = item.quantity || 0;
  const reorderPoint = item.products?.reorder_point || 0;
  const minStock = item.products?.min_stock_level || 0;

  if (reorderPoint > 0 && quantity <= reorderPoint) return "critical";
  if (minStock > 0 && quantity <= minStock) return "low-stock";
  return "in-stock";
}

function getStatusBadge(status: StockStatus) {
  switch (status) {
    case "in-stock":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">In Stock</Badge>;
    case "low-stock":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Low Stock</Badge>;
    case "critical":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Critical</Badge>;
  }
}

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const { data: inventory, isLoading } = useInventory();
  const { data: stats } = useInventoryStats();

  // Get unique categories
  const categories = [...new Set(inventory?.map((item) => item.products?.category).filter(Boolean))];

  // Filter inventory
  const filteredInventory = inventory?.filter((item) => {
    const matchesSearch =
      item.products?.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.products?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.storage_bins?.bin_code?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || item.products?.category === categoryFilter;

    const status = getStockStatus(item);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "in-stock" && status === "in-stock") ||
      (statusFilter === "low-stock" && status === "low-stock") ||
      (statusFilter === "critical" && status === "critical");

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleAdjustStock = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsAdjustDialogOpen(true);
  };

  const formatCurrency = useFormatCurrency();

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Inventory Management"
          subtitle="Track stock levels, manage inventory, and monitor reorder points"
        />

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {stats ? (
                <div className="text-2xl font-bold">{stats.totalItems}</div>
              ) : (
                <Skeleton className="h-8 w-16" />
              )}
              <p className="text-xs text-muted-foreground">Unique inventory records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {stats ? (
                <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
              ) : (
                <Skeleton className="h-8 w-24" />
              )}
              <p className="text-xs text-muted-foreground">At current unit costs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              {stats ? (
                <div className="text-2xl font-bold text-yellow-600">{stats.lowStockItems}</div>
              ) : (
                <Skeleton className="h-8 w-12" />
              )}
              <p className="text-xs text-muted-foreground">Below minimum level</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              {stats ? (
                <div className="text-2xl font-bold text-red-600">{stats.criticalItems}</div>
              ) : (
                <Skeleton className="h-8 w-12" />
              )}
              <p className="text-xs text-muted-foreground">Below reorder point</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by SKU, name, or bin..."
                className="pl-8 w-full sm:w-[280px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat!}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in-stock">In Stock</SelectItem>
                <SelectItem value="low-stock">Low Stock</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>

        {/* Inventory Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Bin Location</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Reserved</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredInventory?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No inventory items found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">{item.products?.sku}</TableCell>
                      <TableCell className="font-medium">{item.products?.name}</TableCell>
                      <TableCell>{item.products?.category || "-"}</TableCell>
                      <TableCell>
                        {item.storage_bins ? (
                          <span className="font-mono text-sm">
                            {item.storage_bins.bin_code}
                            {item.storage_bins.storage_zones && (
                              <span className="text-muted-foreground ml-1">
                                ({item.storage_bins.storage_zones.zone_code})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {item.reserved_quantity || 0}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.available_quantity || item.quantity}
                      </TableCell>
                      <TableCell>{getStatusBadge(getStockStatus(item))}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAdjustStock(item)}
                        >
                          <ArrowUpDown className="h-4 w-4 mr-1" />
                          Adjust
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <InventoryFormDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
      <StockAdjustmentDialog
        open={isAdjustDialogOpen}
        onOpenChange={setIsAdjustDialogOpen}
        inventoryItem={selectedItem}
      />
    </MainLayout>
  );
}
