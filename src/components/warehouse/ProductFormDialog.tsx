import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useWarehouse";
import { useProductCategories } from "@/hooks/useProductCategories";

const formSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category_id: z.string().optional(),
  unit_of_measure: z.string().default("EA"),
  is_active: z.boolean().default(true),
  batch_tracked: z.boolean().default(false),
  serial_tracked: z.boolean().default(false),
  weight: z.coerce.number().optional(),
  length: z.coerce.number().optional(),
  width: z.coerce.number().optional(),
  height: z.coerce.number().optional(),
  min_stock_level: z.coerce.number().optional(),
  max_stock_level: z.coerce.number().optional(),
  reorder_point: z.coerce.number().optional(),
  lead_time_days: z.coerce.number().optional(),
  unit_cost: z.coerce.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: any;
}

const UOM_OPTIONS = [
  { value: "EA", label: "Each" },
  { value: "KG", label: "Kilogram" },
  { value: "LB", label: "Pound" },
  { value: "L", label: "Liter" },
  { value: "GAL", label: "Gallon" },
  { value: "M", label: "Meter" },
  { value: "FT", label: "Foot" },
  { value: "BOX", label: "Box" },
  { value: "CASE", label: "Case" },
  { value: "PALLET", label: "Pallet" },
];

export function ProductFormDialog({ open, onOpenChange, product }: ProductFormDialogProps) {
  const { data: categories = [] } = useProductCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  
  const isEdit = !!product;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sku: "",
      name: "",
      description: "",
      category_id: "",
      unit_of_measure: "EA",
      is_active: true,
      batch_tracked: false,
      serial_tracked: false,
      weight: undefined,
      length: undefined,
      width: undefined,
      height: undefined,
      min_stock_level: undefined,
      max_stock_level: undefined,
      reorder_point: undefined,
      lead_time_days: undefined,
      unit_cost: undefined,
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        sku: product.sku || "",
        name: product.name || "",
        description: product.description || "",
        category_id: product.category_id || "",
        unit_of_measure: product.unit_of_measure || "EA",
        is_active: product.is_active ?? true,
        batch_tracked: product.batch_tracked ?? false,
        serial_tracked: product.serial_tracked ?? false,
        weight: product.weight || undefined,
        length: product.length || undefined,
        width: product.width || undefined,
        height: product.height || undefined,
        min_stock_level: product.min_stock_level || undefined,
        max_stock_level: product.max_stock_level || undefined,
        reorder_point: product.reorder_point || undefined,
        lead_time_days: product.lead_time_days || undefined,
        unit_cost: product.unit_cost || undefined,
      });
    } else {
      form.reset({
        sku: "",
        name: "",
        description: "",
        category_id: "",
        unit_of_measure: "EA",
        is_active: true,
        batch_tracked: false,
        serial_tracked: false,
      });
    }
  }, [product, form]);

  // Build category path for hierarchical display
  const getCategoryPath = (categoryId: string): string => {
    const cat = categories?.find((c) => c.id === categoryId);
    if (!cat) return "";
    if (!cat.parent_id) return cat.name;
    return `${getCategoryPath(cat.parent_id)} > ${cat.name}`;
  };

  const onSubmit = async (data: FormData) => {
    const payload = {
      sku: data.sku,
      name: data.name,
      description: data.description || null,
      category_id: data.category_id || null,
      unit_of_measure: data.unit_of_measure,
      is_active: data.is_active,
      batch_tracked: data.batch_tracked,
      serial_tracked: data.serial_tracked,
      weight: data.weight || null,
      length: data.length || null,
      width: data.width || null,
      height: data.height || null,
      min_stock_level: data.min_stock_level || null,
      max_stock_level: data.max_stock_level || null,
      reorder_point: data.reorder_point || null,
      lead_time_days: data.lead_time_days || null,
      unit_cost: data.unit_cost || null,
    };

    if (isEdit) {
      await updateProduct.mutateAsync({ id: product.id, ...payload });
    } else {
      await createProduct.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Product" : "Add Product"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="PRD-001" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Product name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Product description..." rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === "none" ? "" : value)} 
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No Category</SelectItem>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unit_of_measure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit of Measure</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select UoM" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {UOM_OPTIONS.map((uom) => (
                            <SelectItem key={uom.value} value={uom.value}>
                              {uom.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Active</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Tracking Settings */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Tracking Settings</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="batch_tracked"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Batch Tracked</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Require batch/lot numbers during goods receipt
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="serial_tracked"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Serial Tracked</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Require unique serial numbers per unit
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Dimensions & Weight */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Dimensions & Weight</h4>
              <div className="grid grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} placeholder="0.00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="length"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Length</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} placeholder="0.00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="width"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Width</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} placeholder="0.00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} placeholder="0.00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Stock Settings */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Stock Settings</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="min_stock_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Stock Level</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} placeholder="0" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="max_stock_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Stock Level</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} placeholder="0" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reorder_point"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reorder Point</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} placeholder="0" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lead_time_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead Time (Days)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} placeholder="7" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Pricing */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Pricing</h4>
              <FormField
                control={form.control}
                name="unit_cost"
                render={({ field }) => (
                  <FormItem className="max-w-[200px]">
                    <FormLabel>Unit Cost</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} placeholder="0.00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
                {isEdit ? "Update" : "Create"} Product
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
