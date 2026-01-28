import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MaterialDemand } from "@/hooks/useMaterialDemand";

interface DemandFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingDemand: MaterialDemand | null;
}

export function DemandFormDialog({ open, onOpenChange, editingDemand }: DemandFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingDemand ? "Edit Demand" : "Add Demand"}</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">Demand Form coming soon...</p>
      </DialogContent>
    </Dialog>
  );
}
