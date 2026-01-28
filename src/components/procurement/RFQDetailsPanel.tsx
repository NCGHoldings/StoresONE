import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface RFQDetailsPanelProps {
  rfqId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}

export function RFQDetailsPanel({ rfqId, open, onOpenChange }: RFQDetailsPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>RFQ Details</SheetTitle>
        </SheetHeader>
        <p className="text-muted-foreground mt-4">RFQ Details coming soon...</p>
      </SheetContent>
    </Sheet>
  );
}
