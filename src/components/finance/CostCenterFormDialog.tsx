import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useCreateCostCenter, useUpdateCostCenter, CostCenter, CostCenterFormData } from "@/hooks/useCostCenters";

interface CostCenterFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  costCenter?: CostCenter | null;
}

export function CostCenterFormDialog({ open, onOpenChange, costCenter }: CostCenterFormDialogProps) {
  const createCostCenter = useCreateCostCenter();
  const updateCostCenter = useUpdateCostCenter();

  const [formData, setFormData] = useState<CostCenterFormData>({
    code: "",
    name: "",
    description: "",
    manager: "",
    budget: 0,
    is_active: true,
  });

  useEffect(() => {
    if (costCenter) {
      setFormData({
        code: costCenter.code,
        name: costCenter.name,
        description: costCenter.description || "",
        manager: costCenter.manager || "",
        budget: costCenter.budget || 0,
        is_active: costCenter.is_active,
      });
    } else {
      setFormData({
        code: "",
        name: "",
        description: "",
        manager: "",
        budget: 0,
        is_active: true,
      });
    }
  }, [costCenter, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (costCenter) {
        await updateCostCenter.mutateAsync({ id: costCenter.id, ...formData });
      } else {
        await createCostCenter.mutateAsync(formData);
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{costCenter ? "Edit Cost Center" : "Create New Cost Center"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Cost Center Code</Label>
              <Input
                id="code"
                placeholder="e.g., CC001"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                disabled={!!costCenter}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g., Operations"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe this cost center..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manager">Manager</Label>
              <Input
                id="manager"
                placeholder="Manager name"
                value={formData.manager}
                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                min="0"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="is_active">Active Status</Label>
              <p className="text-sm text-muted-foreground">Enable this cost center for allocations</p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCostCenter.isPending || updateCostCenter.isPending}>
              {costCenter ? "Update" : "Create"} Cost Center
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
