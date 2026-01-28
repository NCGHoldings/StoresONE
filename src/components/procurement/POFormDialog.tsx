import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useUpdatePurchaseOrder, PurchaseOrder, POUpdate } from "@/hooks/usePurchaseOrders";
import { Loader2 } from "lucide-react";
import { POLineItemsEditor } from "./POLineItemsEditor";
import { toast } from "sonner";
import { useDefaultCurrency } from "@/lib/formatters";

interface POFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPO?: PurchaseOrder | null;
}

interface LineItem {
  id?: string;
  product_id: string;
  product_name?: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export function POFormDialog({ open, onOpenChange, editingPO }: POFormDialogProps) {
  const { data: suppliers } = useSuppliers();
  const updatePO = useUpdatePurchaseOrder();
  const defaultCurrency = useDefaultCurrency();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    po_number: "",
    supplier_id: "",
    order_date: new Date().toISOString().split("T")[0],
    expected_delivery: "",
    currency: defaultCurrency,
    notes: "",
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // This dialog now only supports editing existing POs
  // New POs are created through the PR → PO conversion flow
  const isEditing = !!editingPO;

  // Show error and close if opened without an existing PO
  useEffect(() => {
    if (open && !editingPO) {
      toast.error("Purchase Orders can only be created from approved Requisitions");
      onOpenChange(false);
    }
  }, [open, editingPO, onOpenChange]);

  useEffect(() => {
    if (open && editingPO) {
      setFormData({
        po_number: editingPO.po_number,
        supplier_id: editingPO.supplier_id || "",
        order_date: editingPO.order_date,
        expected_delivery: editingPO.expected_delivery || "",
        currency: editingPO.currency || defaultCurrency,
        notes: editingPO.notes || "",
      });
      setStep(1);
    }
  }, [open, editingPO, defaultCurrency]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + item.total_price, 0);
  };

  const handleSubmit = async () => {
    if (!editingPO) return;

    const poData: POUpdate = {
      supplier_id: formData.supplier_id || null,
      order_date: formData.order_date,
      expected_delivery: formData.expected_delivery || null,
      currency: formData.currency,
      notes: formData.notes || null,
      total_amount: calculateTotal(),
    };

    try {
      await updatePO.mutateAsync({ id: editingPO.id, updates: poData });
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isStep1Valid = formData.po_number && formData.supplier_id && formData.order_date;
  const isSubmitDisabled = !isStep1Valid || updatePO.isPending;

  // Don't render if no PO to edit
  if (!editingPO) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Purchase Order</DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center gap-4 mb-6">
          <div className={`flex items-center gap-2 ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              1
            </div>
            <span className="text-sm font-medium">Order Details</span>
          </div>
          <div className="flex-1 h-px bg-border" />
          <div className={`flex items-center gap-2 ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              2
            </div>
            <span className="text-sm font-medium">Line Items</span>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="po_number">PO Number *</Label>
                <Input
                  id="po_number"
                  value={formData.po_number}
                  onChange={(e) => handleInputChange("po_number", e.target.value)}
                  placeholder="PO-2024-0001"
                  disabled={isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier *</Label>
                <Select
                  value={formData.supplier_id}
                  onValueChange={(value) => handleInputChange("supplier_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="order_date">Order Date *</Label>
                <Input
                  id="order_date"
                  type="date"
                  value={formData.order_date}
                  onChange={(e) => handleInputChange("order_date", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expected_delivery">Expected Delivery</Label>
                <Input
                  id="expected_delivery"
                  type="date"
                  value={formData.expected_delivery}
                  onChange={(e) => handleInputChange("expected_delivery", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => handleInputChange("currency", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <POLineItemsEditor
            lineItems={lineItems}
            onLineItemsChange={setLineItems}
            currency={formData.currency}
          />
        )}

        <DialogFooter className="flex justify-between">
          <div>
            {step > 1 && (
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {step === 1 ? (
              <Button onClick={handleNext} disabled={!isStep1Valid}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
                {updatePO.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
