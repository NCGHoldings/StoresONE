import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface BlanketOrderDetailsPanelProps {
  boId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}

export function BlanketOrderDetailsPanel({ boId, open, onOpenChange }: BlanketOrderDetailsPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Blanket Order Details</SheetTitle>
        </SheetHeader>
        <p className="text-muted-foreground mt-4">Blanket Order Details coming soon...</p>
      </SheetContent>
    </Sheet>
  );
}
