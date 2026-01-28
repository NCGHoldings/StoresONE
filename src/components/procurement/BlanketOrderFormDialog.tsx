import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BlanketOrder } from "@/hooks/useBlanketOrders";

interface BlanketOrderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingBO: BlanketOrder | null | undefined;
}

export function BlanketOrderFormDialog({ open, onOpenChange, editingBO }: BlanketOrderFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingBO ? "Edit Blanket Order" : "Create Blanket Order"}</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">Blanket Order Form coming soon...</p>
      </DialogContent>
    </Dialog>
  );
}
