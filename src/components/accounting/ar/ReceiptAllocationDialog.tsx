import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useCustomerReceipt, useAllocateReceipt } from "@/hooks/useCustomerReceipts";
import { useOpenCustomerInvoices } from "@/hooks/useCustomerInvoices";
import { format } from "date-fns";

interface ReceiptAllocationDialogProps {
  receiptId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AllocationLine {
  invoiceId: string;
  invoiceNumber: string;
  balance: number;
  dueDate: string;
  selected: boolean;
  amount: number;
}

export function ReceiptAllocationDialog({
  receiptId,
  open,
  onOpenChange,
}: ReceiptAllocationDialogProps) {
  const { data: receipt } = useCustomerReceipt(receiptId);
  const { data: openInvoices } = useOpenCustomerInvoices(receipt?.customer_id || null);
  const allocateReceipt = useAllocateReceipt();

  const [allocations, setAllocations] = useState<AllocationLine[]>([]);

  useEffect(() => {
    if (openInvoices) {
      setAllocations(
        openInvoices.map((inv) => ({
          invoiceId: inv.id,
          invoiceNumber: inv.invoice_number,
          balance: inv.total_amount - (inv.amount_paid || 0),
          dueDate: inv.due_date,
          selected: false,
          amount: 0,
        }))
      );
    }
  }, [openInvoices]);

  const toggleInvoice = (index: number) => {
    const newAllocations = [...allocations];
    newAllocations[index].selected = !newAllocations[index].selected;
    if (!newAllocations[index].selected) {
      newAllocations[index].amount = 0;
    }
    setAllocations(newAllocations);
  };

  const updateAmount = (index: number, value: number) => {
    const newAllocations = [...allocations];
    newAllocations[index].amount = Math.min(value, newAllocations[index].balance);
    setAllocations(newAllocations);
  };

  const totalAllocated = allocations.reduce((sum, a) => sum + (a.selected ? a.amount : 0), 0);
  const remainingToAllocate = (receipt?.amount || 0) - totalAllocated;

  const autoAllocate = () => {
    if (!receipt) return;

    let remaining = receipt.amount;
    const newAllocations = allocations.map((alloc) => {
      if (remaining <= 0) return { ...alloc, selected: false, amount: 0 };
      
      const allocAmount = Math.min(remaining, alloc.balance);
      remaining -= allocAmount;
      
      return {
        ...alloc,
        selected: allocAmount > 0,
        amount: allocAmount,
      };
    });

    setAllocations(newAllocations);
  };

  const handleSubmit = async () => {
    if (!receiptId) return;

    const selectedAllocations = allocations
      .filter((a) => a.selected && a.amount > 0)
      .map((a) => ({
        invoiceId: a.invoiceId,
        amount: a.amount,
      }));

    if (selectedAllocations.length === 0) return;

    await allocateReceipt.mutateAsync({
      receiptId,
      allocations: selectedAllocations,
    });

    onOpenChange(false);
  };

  if (!open || !receipt) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Allocate Receipt {receipt.receipt_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Receipt Amount</p>
              <p className="text-xl font-bold">${receipt.amount.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Remaining to Allocate</p>
              <p className={`text-xl font-bold ${remainingToAllocate < 0 ? "text-destructive" : ""}`}>
                ${remainingToAllocate.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={autoAllocate}>
              Auto-Allocate
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left w-10"></th>
                  <th className="px-3 py-2 text-left">Invoice</th>
                  <th className="px-3 py-2 text-left">Due Date</th>
                  <th className="px-3 py-2 text-right">Balance</th>
                  <th className="px-3 py-2 text-right">Allocate</th>
                </tr>
              </thead>
              <tbody>
                {allocations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                      No open invoices for this customer
                    </td>
                  </tr>
                ) : (
                  allocations.map((alloc, index) => (
                    <tr key={alloc.invoiceId} className="border-t">
                      <td className="px-3 py-2">
                        <Checkbox
                          checked={alloc.selected}
                          onCheckedChange={() => toggleInvoice(index)}
                        />
                      </td>
                      <td className="px-3 py-2 font-medium">{alloc.invoiceNumber}</td>
                      <td className="px-3 py-2">
                        {format(new Date(alloc.dueDate), "MMM dd, yyyy")}
                      </td>
                      <td className="px-3 py-2 text-right">${alloc.balance.toFixed(2)}</td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          value={alloc.amount || ""}
                          onChange={(e) => updateAmount(index, parseFloat(e.target.value) || 0)}
                          disabled={!alloc.selected}
                          className="h-8 w-28 text-right"
                          step="0.01"
                          min={0}
                          max={alloc.balance}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={totalAllocated === 0 || remainingToAllocate < 0 || allocateReceipt.isPending}
            >
              {allocateReceipt.isPending ? "Allocating..." : "Allocate Receipt"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
