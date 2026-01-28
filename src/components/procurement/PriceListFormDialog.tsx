import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PriceList } from "@/hooks/usePriceLists";

interface PriceListFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPriceList: PriceList | null | undefined;
}

export function PriceListFormDialog({ open, onOpenChange, editingPriceList }: PriceListFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingPriceList ? "Edit Price List" : "Create Price List"}</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">Price List Form coming soon...</p>
      </DialogContent>
    </Dialog>
  );
}
