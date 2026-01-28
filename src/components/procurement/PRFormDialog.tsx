import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import {
  PurchaseRequisition,
  useNextPRNumber,
  useCreatePR,
  useUpdatePR,
  usePRLines,
  useAddPRLine,
  useUpdatePRLine,
  useRemovePRLine,
} from "@/hooks/usePurchaseRequisitions";
import { useUsers } from "@/hooks/useUsers";
import { useCostCenters } from "@/hooks/useCostCenters";
import { useAuth } from "@/contexts/AuthContext";
import { PRLineItemsEditor, PRLineItem } from "./PRLineItemsEditor";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const prFormSchema = z.object({
  pr_number: z.string().min(1, "PR number is required"),
  cost_center_id: z.string().optional(),
  requestor_id: z.string().optional(),
  urgency: z.enum(["low", "normal", "high", "critical"]).default("normal"),
  required_date: z.date({ required_error: "Required date is required" }),
  notes: z.string().optional(),
  justification: z.string().optional(),
});

type PRFormValues = z.infer<typeof prFormSchema>;

interface PRFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPR: PurchaseRequisition | null | undefined;
}

export function PRFormDialog({
  open,
  onOpenChange,
  editingPR,
}: PRFormDialogProps) {
  const { user } = useAuth();
  const [lineItems, setLineItems] = useState<PRLineItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: nextPRNumber } = useNextPRNumber();
  const { data: users = [] } = useUsers();
  const { data: costCenters = [] } = useCostCenters();
  const { data: existingLines = [] } = usePRLines(editingPR?.id);

  const createPR = useCreatePR();
  const updatePR = useUpdatePR();
  const addPRLine = useAddPRLine();
  const updatePRLine = useUpdatePRLine();
  const removePRLine = useRemovePRLine();

  const form = useForm<PRFormValues>({
    resolver: zodResolver(prFormSchema),
    defaultValues: {
      pr_number: "",
      cost_center_id: undefined,
      requestor_id: undefined,
      urgency: "normal",
      notes: "",
      justification: "",
    },
  });

  // Reset form when dialog opens/closes or editingPR changes
  useEffect(() => {
    if (open) {
      if (editingPR) {
        form.reset({
          pr_number: editingPR.pr_number,
          cost_center_id: editingPR.cost_center_id || undefined,
          requestor_id: editingPR.requestor_id || undefined,
          urgency: (editingPR.urgency as PRFormValues["urgency"]) || "normal",
          required_date: editingPR.required_date
            ? new Date(editingPR.required_date)
            : undefined,
          notes: editingPR.notes || "",
          justification: editingPR.justification || "",
        });
      } else {
        form.reset({
          pr_number: nextPRNumber || "",
          cost_center_id: undefined,
          requestor_id: user?.id || undefined,
          urgency: "normal",
          required_date: undefined,
          notes: "",
          justification: "",
        });
        setLineItems([]);
      }
    }
  }, [open, editingPR, nextPRNumber, user?.id, form]);

  // Load existing line items when editing
  useEffect(() => {
    if (editingPR && existingLines.length > 0) {
      const mappedLines: PRLineItem[] = existingLines.map((line) => ({
        id: line.id,
        product_id: line.product_id,
        product_code: line.products?.sku || "",
        product_name: line.product_name || "",
        description: line.specifications || "",
        quantity: line.quantity,
        unit_of_measure: line.unit_of_measure || "pcs",
        estimated_price: line.estimated_price || 0,
        total_price: line.total_price || 0,
        notes: line.notes || "",
      }));
      setLineItems(mappedLines);
    }
  }, [editingPR, existingLines]);

  // Update PR number when nextPRNumber loads (for new PRs)
  useEffect(() => {
    if (!editingPR && nextPRNumber && open) {
      form.setValue("pr_number", nextPRNumber);
    }
  }, [nextPRNumber, editingPR, open, form]);

  const handleSubmit = async (values: PRFormValues) => {
    if (lineItems.length === 0) {
      toast.error("Please add at least one item to the requisition");
      return;
    }

    // Validate line items
    const invalidItems = lineItems.filter(
      (item) => !item.product_name || item.quantity < 1
    );
    if (invalidItems.length > 0) {
      toast.error("All items must have a name and quantity greater than 0");
      return;
    }

    setIsSubmitting(true);

    try {
      const totalValue = lineItems.reduce(
        (sum, item) => sum + item.total_price,
        0
      );

      const prData = {
        pr_number: values.pr_number,
        cost_center_id: values.cost_center_id || null,
        requestor_id: values.requestor_id || null,
        urgency: values.urgency,
        required_date: format(values.required_date, "yyyy-MM-dd"),
        notes: values.notes || null,
        justification: values.justification || null,
        total_estimated_value: totalValue,
      };

      if (editingPR) {
        // Update existing PR
        await updatePR.mutateAsync({ 
          id: editingPR.id, 
          updates: prData 
        });

        // Handle line items: delete removed, update existing, add new
        const existingIds = new Set(existingLines.map((l) => l.id));
        const currentIds = new Set(lineItems.filter((l) => l.id).map((l) => l.id!));

        // Delete removed lines
        for (const line of existingLines) {
          if (!currentIds.has(line.id)) {
            await removePRLine.mutateAsync({ id: line.id, prId: editingPR.id });
          }
        }

        // Update or add lines
        for (const item of lineItems) {
          const lineData = {
            pr_id: editingPR.id,
            product_id: item.product_id,
            product_name: item.product_name,
            specifications: item.description || null,
            quantity: item.quantity,
            unit_of_measure: item.unit_of_measure,
            estimated_price: item.estimated_price,
            notes: item.notes || null,
          };

          if (item.id && existingIds.has(item.id)) {
            await updatePRLine.mutateAsync({ 
              id: item.id, 
              prId: editingPR.id,
              updates: lineData 
            });
          } else {
            await addPRLine.mutateAsync(lineData);
          }
        }

        toast.success("Purchase requisition updated successfully");
      } else {
        // Create new PR
        const newPR = await createPR.mutateAsync(prData);

        // Add all line items
        for (const item of lineItems) {
          await addPRLine.mutateAsync({
            pr_id: newPR.id,
            product_id: item.product_id,
            product_name: item.product_name,
            specifications: item.description || null,
            quantity: item.quantity,
            unit_of_measure: item.unit_of_measure,
            estimated_price: item.estimated_price,
            notes: item.notes || null,
          });
        }

        toast.success("Purchase requisition created successfully");
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error saving PR:", error);
      toast.error("Failed to save purchase requisition");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[95vw] h-[95vh] max-h-[95vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {editingPR ? "Edit Purchase Requisition" : "Create Purchase Requisition"}
          </DialogTitle>
          <DialogDescription>
            {editingPR
              ? "Update the purchase requisition details below."
              : "Create a new purchase requisition for approval."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1 flex flex-col gap-6 overflow-y-auto">
            {/* Basic Information Section */}
            <div className="rounded-lg border p-4 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <FormField
                  control={form.control}
                  name="pr_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PR Number</FormLabel>
                      <FormControl>
                        <Input {...field} disabled className="bg-muted" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cost_center_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value === "none" ? undefined : value)
                        }
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select company" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">-- Select --</SelectItem>
                          {costCenters
                            .filter((cc) => cc.is_active)
                            .map((cc) => (
                              <SelectItem key={cc.id} value={cc.id}>
                                {cc.name}
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
                  name="requestor_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requester</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value === "none" ? undefined : value)
                        }
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select requester" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">-- Select --</SelectItem>
                          {users
                            .filter((u) => u.is_active !== false)
                            .map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.full_name || u.email || "Unknown User"}
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
                  name="urgency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority*</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PRIORITY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
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
                  name="required_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Required Date*</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Enter description..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="justification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Justification</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Enter business justification..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Items Section */}
            <div className="rounded-lg border p-4 flex-1 min-h-[300px] flex flex-col">
              <PRLineItemsEditor
                lineItems={lineItems}
                onLineItemsChange={setLineItems}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t flex-shrink-0 bg-background">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : editingPR
                  ? "Update PR"
                  : "Create PR"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
