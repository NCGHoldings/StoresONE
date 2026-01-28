import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface PriceListDetailsPanelProps {
  priceListId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}

export function PriceListDetailsPanel({ priceListId, open, onOpenChange }: PriceListDetailsPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Price List Details</SheetTitle>
        </SheetHeader>
        <p className="text-muted-foreground mt-4">Price List Details coming soon...</p>
      </SheetContent>
    </Sheet>
  );
}
