import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package } from "lucide-react";

interface ReceiveReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnNumber: string;
  onConfirm: (receivedDate: string) => Promise<void>;
  isPending: boolean;
}

export function ReceiveReturnDialog({
  open,
  onOpenChange,
  returnNumber,
  onConfirm,
  isPending,
}: ReceiveReturnDialogProps) {
  const [receivedDate, setReceivedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const handleSubmit = async () => {
    await onConfirm(receivedDate);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Receive Return: {returnNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Confirm that the returned goods have been physically received at the warehouse.
          </p>

          <div className="space-y-2">
            <Label htmlFor="receivedDate">Received Date</Label>
            <Input
              id="receivedDate"
              type="date"
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Processing..." : "Confirm Receipt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
