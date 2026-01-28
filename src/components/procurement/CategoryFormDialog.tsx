import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import {
  ProductCategory,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useProductsByCategory,
} from "@/hooks/useProductCategories";

const categorySchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(20, "Code must be 20 characters or less")
    .regex(/^[A-Z0-9_-]+$/i, "Code must be alphanumeric with dashes/underscores"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  description: z.string().max(500).optional().nullable(),
  parent_id: z.string().nullable(),
  sort_order: z.coerce.number().min(0).default(0),
  is_active: z.boolean().default(true),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCategory: ProductCategory | null;
  categories: ProductCategory[];
  defaultParentId?: string | null;
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  editingCategory,
  categories,
  defaultParentId = null,
}: CategoryFormDialogProps) {
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  
  // Fetch products for this category if editing
  const { data: assignedProducts } = useProductsByCategory(
    editingCategory?.id
  );

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      parent_id: null,
      sort_order: 0,
      is_active: true,
    },
  });

  // Reset form when dialog opens/closes or editing category changes
  useEffect(() => {
    if (open) {
      if (editingCategory) {
        form.reset({
          code: editingCategory.code,
          name: editingCategory.name,
          description: editingCategory.description || "",
          parent_id: editingCategory.parent_id,
          sort_order: editingCategory.sort_order,
          is_active: editingCategory.is_active,
        });
      } else {
        // Calculate next sort order for new category
        const siblings = categories.filter(
          (c) => c.parent_id === defaultParentId
        );
        const maxSortOrder = Math.max(
          0,
          ...siblings.map((c) => c.sort_order)
        );
        
        form.reset({
          code: "",
          name: "",
          description: "",
          parent_id: defaultParentId,
          sort_order: maxSortOrder + 1,
          is_active: true,
        });
      }
    }
  }, [open, editingCategory, defaultParentId, categories, form]);

  // Build path for parent display
  const getCategoryPath = (categoryId: string): string => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return "";
    if (!cat.parent_id) return cat.name;
    return `${getCategoryPath(cat.parent_id)} > ${cat.name}`;
  };

  // Get descendants of a category (to prevent circular references)
  const getDescendantIds = (categoryId: string): Set<string> => {
    const ids = new Set<string>();
    const addDescendants = (parentId: string) => {
      categories
        .filter((c) => c.parent_id === parentId)
        .forEach((c) => {
          ids.add(c.id);
          addDescendants(c.id);
        });
    };
    addDescendants(categoryId);
    return ids;
  };

  // Filter available parents (exclude self and descendants)
  const availableParents = editingCategory
    ? categories.filter((c) => {
        const descendantIds = getDescendantIds(editingCategory.id);
        return c.id !== editingCategory.id && !descendantIds.has(c.id);
      })
    : categories;

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          updates: {
            code: data.code.toUpperCase(),
            name: data.name,
            description: data.description || null,
            parent_id: data.parent_id,
            sort_order: data.sort_order,
            is_active: data.is_active,
          },
        });
      } else {
        await createCategory.mutateAsync({
          code: data.code.toUpperCase(),
          name: data.name,
          description: data.description || null,
          parent_id: data.parent_id,
          sort_order: data.sort_order,
          is_active: data.is_active,
        });
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!editingCategory) return;
    try {
      await deleteCategory.mutateAsync(editingCategory.id);
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const hasChildren = editingCategory
    ? categories.some((c) => c.parent_id === editingCategory.id)
    : false;

  const isSubmitting =
    createCategory.isPending ||
    updateCategory.isPending ||
    deleteCategory.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingCategory ? "Edit Category" : "Add Category"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., ELEC-COMP"
                        className="uppercase"
                        onChange={(e) =>
                          field.onChange(e.target.value.toUpperCase())
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sort_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort Order</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min={0} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Category name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parent_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Category</FormLabel>
                  <Select
                    value={field.value || "none"}
                    onValueChange={(value) =>
                      field.onChange(value === "none" ? null : value)
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-muted-foreground">
                          No parent (root category)
                        </span>
                      </SelectItem>
                      {availableParents.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {getCategoryPath(cat.id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Optional description..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Inactive categories won't appear in selection dropdowns
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Show assigned products info when editing */}
            {editingCategory && assignedProducts && assignedProducts.length > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    {assignedProducts.length} product{assignedProducts.length !== 1 ? "s" : ""} assigned
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    {assignedProducts.slice(0, 3).map((p) => p.name).join(", ")}
                    {assignedProducts.length > 3 && ` and ${assignedProducts.length - 3} more`}
                  </p>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              {editingCategory && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={hasChildren || isSubmitting}
                      className="mr-auto"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Category</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{editingCategory.name}"?
                        {assignedProducts && assignedProducts.length > 0 && (
                          <span className="block mt-2 font-medium text-amber-600">
                            {assignedProducts.length} product{assignedProducts.length !== 1 ? "s" : ""} will be unassigned from this category.
                          </span>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {hasChildren && editingCategory && (
                <Badge variant="secondary" className="mr-2">
                  Has subcategories
                </Badge>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingCategory ? "Save Changes" : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
