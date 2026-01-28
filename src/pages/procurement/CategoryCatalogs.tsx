import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  Filter,
  Download,
  FolderTree,
  Folder,
  Package,
  Loader2,
  List,
  GitBranch,
} from "lucide-react";
import {
  useProductCategories,
  useCategoryTree,
  useCategoryStats,
  useCategoryProductCounts,
  useReorderCategories,
  useDeleteCategory,
  ProductCategory,
} from "@/hooks/useProductCategories";
import { CategoryFormDialog } from "@/components/procurement/CategoryFormDialog";
import { CategoryTree } from "@/components/procurement/CategoryTree";

type ViewMode = "tree" | "table";

export default function CategoryCatalogs() {
  const { data: categories, isLoading } = useProductCategories();
  const { data: treeData, flatData } = useCategoryTree();
  const { data: stats } = useCategoryStats();
  const { data: productCounts } = useCategoryProductCounts();
  const reorderCategories = useReorderCategories();
  const deleteCategory = useDeleteCategory();

  const [viewMode, setViewMode] = useState<ViewMode>("tree");
  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<ProductCategory | null>(null);

  const filteredCategories = categories?.filter((cat) => {
    return (
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const columns = [
    {
      key: "code" as const,
      label: "Code",
      sortable: true,
      render: (cat: ProductCategory) => (
        <span className="font-mono font-medium text-primary">{cat.code}</span>
      ),
    },
    {
      key: "name" as const,
      label: "Category Name",
      sortable: true,
      render: (cat: ProductCategory) => (
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-muted-foreground" />
          <span>{cat.name}</span>
        </div>
      ),
    },
    {
      key: "description" as const,
      label: "Description",
      render: (cat: ProductCategory) => (
        <span className="text-muted-foreground truncate max-w-[300px] block">
          {cat.description || "—"}
        </span>
      ),
    },
    {
      key: "parent_id" as const,
      label: "Parent",
      render: (cat: ProductCategory) => {
        if (!cat.parent_id) return <span className="text-muted-foreground">Root</span>;
        const parent = categories?.find((c) => c.id === cat.parent_id);
        return parent?.name || "—";
      },
    },
    {
      key: "is_active" as const,
      label: "Status",
      sortable: true,
      render: (cat: ProductCategory) => (
        <StatusBadge status={cat.is_active ? "active" : "inactive"} />
      ),
    },
  ];

  const handleRowClick = (cat: ProductCategory) => {
    setEditingCategory(cat);
    setDefaultParentId(null);
    setFormOpen(true);
  };

  const handleEdit = (category: ProductCategory) => {
    setEditingCategory(category);
    setDefaultParentId(null);
    setFormOpen(true);
  };

  const handleAddChild = (parentId: string | null) => {
    setEditingCategory(null);
    setDefaultParentId(parentId);
    setFormOpen(true);
  };

  const handleDelete = (category: ProductCategory) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategory.mutateAsync(categoryToDelete.id);
    } catch (error) {
      // Error handled by mutation
    } finally {
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleReorder = (
    updates: { id: string; parent_id: string | null; sort_order: number }[]
  ) => {
    reorderCategories.mutate(updates);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Category Catalog"
          subtitle="Organize products into hierarchical categories"
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FolderTree className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Categories</p>
                  <p className="text-2xl font-bold">{stats?.totalCategories || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <Folder className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{stats?.activeCategories || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <GitBranch className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Root Categories</p>
                  <p className="text-2xl font-bold">{stats?.rootCategories || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Categorized Products</p>
                  <p className="text-2xl font-bold">{stats?.categorizedProducts || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-3 w-full sm:w-auto items-center">
            {/* View Mode Toggle */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList>
                <TabsTrigger value="tree" className="gap-2">
                  <FolderTree className="h-4 w-4" />
                  Tree
                </TabsTrigger>
                <TabsTrigger value="table" className="gap-2">
                  <List className="h-4 w-4" />
                  Table
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {viewMode === "table" && (
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or code..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
            <Button onClick={() => handleAddChild(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : viewMode === "tree" ? (
          <CategoryTree
            categories={treeData}
            flatCategories={flatData}
            onEdit={handleEdit}
            onAddChild={handleAddChild}
            onDelete={handleDelete}
            onReorder={handleReorder}
            productCounts={productCounts || {}}
          />
        ) : (
          <DataTable
            data={filteredCategories || []}
            columns={columns}
            searchable={false}
            onRowClick={handleRowClick}
          />
        )}
      </div>

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editingCategory={editingCategory}
        categories={categories || []}
        defaultParentId={defaultParentId}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{categoryToDelete?.name}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
