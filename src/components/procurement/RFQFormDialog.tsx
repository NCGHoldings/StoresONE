import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RFQRequest } from "@/hooks/useRFQ";

interface RFQFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRFQ: RFQRequest | null | undefined;
}

export function RFQFormDialog({ open, onOpenChange, editingRFQ }: RFQFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingRFQ ? "Edit RFQ" : "Create RFQ"}</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">RFQ Form coming soon...</p>
      </DialogContent>
    </Dialog>
  );
}
