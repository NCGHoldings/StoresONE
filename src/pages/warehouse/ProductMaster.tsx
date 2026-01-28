import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Package, PackageCheck, AlertTriangle, Layers, Search } from "lucide-react";
import { useProducts, Product } from "@/hooks/useWarehouse";
import { useProductCategories } from "@/hooks/useProductCategories";
import { useFormatCurrency } from "@/lib/formatters";
import { ProductFormDialog } from "@/components/warehouse/ProductFormDialog";

export default function ProductMaster() {
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useProductCategories();
  const formatCurrency = useFormatCurrency();
  
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Build category path for display
  const getCategoryPath = (categoryId: string): string => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return "";
    if (!cat.parent_id) return cat.name;
    return `${getCategoryPath(cat.parent_id)} > ${cat.name}`;
  };

  // Calculate stats
  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter(p => p.is_active).length;
    const lowStock = products.filter(p => {
      const reorderPoint = p.reorder_point || 0;
      const minStock = p.min_stock_level || 0;
      return reorderPoint > 0 || minStock > 0;
    }).length;
    const categorized = products.filter(p => p.category_id).length;
    return { total, active, lowStock, categorized };
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || product.category_id === categoryFilter;
      const matchesStatus = statusFilter === "all" ||
        (statusFilter === "active" ? product.is_active : !product.is_active);
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchQuery, categoryFilter, statusFilter]);

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setShowForm(true);
  };

  const handleCreate = () => {
    setSelectedProduct(null);
    setShowForm(true);
  };

  const columns = [
    { key: "sku", label: "SKU", sortable: true },
    { key: "name", label: "Name", sortable: true },
    { 
      key: "category", 
      label: "Category",
      render: (item: Product) => {
        if (!item.product_category) return "-";
        const cat = item.product_category;
        const parent = categories.find((c) => c.id === cat.parent_id);
        return (
          <div className="flex items-center gap-1">
            {parent && (
              <span className="text-xs text-muted-foreground">
                {parent.name} /
              </span>
            )}
            <span>{cat.name}</span>
          </div>
        );
      }
    },
    { key: "unit_of_measure", label: "UoM", sortable: true },
    { 
      key: "min_stock_level", 
      label: "Min Stock",
      render: (item: Product) => item.min_stock_level ?? "-"
    },
    { 
      key: "reorder_point", 
      label: "Reorder Point",
      render: (item: Product) => item.reorder_point ?? "-"
    },
    { 
      key: "unit_cost", 
      label: "Unit Cost",
      render: (item: Product) => item.unit_cost ? formatCurrency(item.unit_cost) : "-"
    },
    {
      key: "is_active",
      label: "Status",
      render: (item: Product) => (
        <StatusBadge status={item.is_active ? "active" : "inactive"} />
      ),
    },
  ];

  const statsCards = [
    { label: "Total Products", value: stats.total, icon: Package, color: "text-primary" },
    { label: "Active", value: stats.active, icon: PackageCheck, color: "text-success" },
    { label: "With Stock Rules", value: stats.lowStock, icon: AlertTriangle, color: "text-warning" },
    { label: "Categorized", value: stats.categorized, icon: Layers, color: "text-info" },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Product Master"
          subtitle="Manage product catalog and material attributes"
          actions={
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {statsCards.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by SKU or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories
                    .filter((c) => c.is_active)
                    .sort((a, b) => {
                      const pathA = getCategoryPath(a.id);
                      const pathB = getCategoryPath(b.id);
                      return pathA.localeCompare(pathB);
                    })
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {getCategoryPath(cat.id)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardContent className="p-0">
            <DataTable
              data={filteredProducts}
              columns={columns}
              searchable={false}
              onRowClick={handleEdit}
            />
          </CardContent>
        </Card>

        <ProductFormDialog
          open={showForm}
          onOpenChange={setShowForm}
          product={selectedProduct}
        />
      </div>
    </MainLayout>
  );
}
