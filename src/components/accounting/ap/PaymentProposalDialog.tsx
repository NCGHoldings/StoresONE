import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lightbulb, Calendar, AlertTriangle } from "lucide-react";
import { format, addDays } from "date-fns";
import { useInvoices } from "@/hooks/useInvoices";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useFormatCurrency } from "@/lib/formatters";
import { useCreateScheduledPayment } from "@/hooks/useScheduledPayments";

interface PaymentProposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function PaymentProposalDialog({
  open,
  onOpenChange,
  onSuccess,
}: PaymentProposalDialogProps) {
  const [daysThreshold, setDaysThreshold] = useState(7);
  const [includeOverdue, setIncludeOverdue] = useState(true);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [scheduledDate, setScheduledDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));

  const { data: invoices } = useInvoices();
  const { data: suppliers } = useSuppliers();
  const createScheduledPayment = useCreateScheduledPayment();
  const formatCurrency = useFormatCurrency();

  // Generate payment proposals
  const proposals = useMemo(() => {
    if (!invoices) return [];

    const today = new Date();
    const thresholdDate = addDays(today, daysThreshold);

    return invoices
      .filter((inv) => {
        if (inv.status === "paid" || inv.status === "cancelled") return false;
        const dueDate = new Date(inv.due_date);
        const isOverdue = dueDate < today;
        const isDueSoon = dueDate <= thresholdDate;
        
        if (isOverdue && includeOverdue) return true;
        if (isDueSoon) return true;
        return false;
      })
      .map((inv) => {
        const dueDate = new Date(inv.due_date);
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const supplier = suppliers?.find((s) => s.id === inv.supplier_id);
        const balance = Number(inv.amount) - Number((inv as any).amount_paid || 0);

        return {
          id: inv.id,
          invoice_number: inv.invoice_number,
          supplier_id: inv.supplier_id,
          supplier_name: supplier?.company_name || "Unknown",
          supplier_code: supplier?.supplier_code || "",
          due_date: inv.due_date,
          amount: Number(inv.amount),
          balance,
          days_until_due: daysUntilDue,
          is_overdue: daysUntilDue < 0,
          priority: daysUntilDue < 0 ? "high" : daysUntilDue <= 3 ? "medium" : "low",
        };
      })
      .sort((a, b) => a.days_until_due - b.days_until_due);
  }, [invoices, suppliers, daysThreshold, includeOverdue]);

  // Group by supplier
  const groupedProposals = useMemo(() => {
    const groups: Record<string, typeof proposals> = {};
    proposals.forEach((p) => {
      if (!groups[p.supplier_id]) {
        groups[p.supplier_id] = [];
      }
      groups[p.supplier_id].push(p);
    });
    return groups;
  }, [proposals]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(new Set(proposals.map((p) => p.id)));
    } else {
      setSelectedInvoices(new Set());
    }
  };

  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    const newSelection = new Set(selectedInvoices);
    if (checked) {
      newSelection.add(invoiceId);
    } else {
      newSelection.delete(invoiceId);
    }
    setSelectedInvoices(newSelection);
  };

  const selectedTotal = useMemo(() => {
    return proposals
      .filter((p) => selectedInvoices.has(p.id))
      .reduce((sum, p) => sum + p.balance, 0);
  }, [proposals, selectedInvoices]);

  const handleCreateSchedule = async () => {
    if (selectedInvoices.size === 0) return;

    // Group selected invoices by supplier
    const selectedBySupplier: Record<string, { invoice_id: string; amount: number }[]> = {};
    proposals
      .filter((p) => selectedInvoices.has(p.id))
      .forEach((p) => {
        if (!selectedBySupplier[p.supplier_id]) {
          selectedBySupplier[p.supplier_id] = [];
        }
        selectedBySupplier[p.supplier_id].push({
          invoice_id: p.id,
          amount: p.balance,
        });
      });

    // Create scheduled payments for each supplier
    for (const [supplierId, items] of Object.entries(selectedBySupplier)) {
      await createScheduledPayment.mutateAsync({
        supplier_id: supplierId,
        scheduled_date: scheduledDate,
        items,
      });
    }

    onSuccess();
    setSelectedInvoices(new Set());
  };

  const priorityStyles: Record<string, string> = {
    high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Payment Proposal
          </DialogTitle>
          <DialogDescription>
            Automatically suggest invoices for payment based on due dates
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filters */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Due Within (Days)</Label>
              <Input
                type="number"
                min={1}
                max={90}
                value={daysThreshold}
                onChange={(e) => setDaysThreshold(parseInt(e.target.value) || 7)}
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Date</Label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>

            <div className="flex items-end pb-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeOverdue"
                  checked={includeOverdue}
                  onCheckedChange={(checked) => setIncludeOverdue(checked as boolean)}
                />
                <Label htmlFor="includeOverdue" className="cursor-pointer">
                  Include overdue invoices
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Summary Alert */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Found {proposals.length} invoice(s) due within {daysThreshold} days totaling{" "}
              {formatCurrency(proposals.reduce((sum, p) => sum + p.balance, 0))}
              {proposals.filter((p) => p.is_overdue).length > 0 &&
                ` (${proposals.filter((p) => p.is_overdue).length} overdue)`}
            </AlertDescription>
          </Alert>

          {/* Proposals Table */}
          {proposals.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No invoices match the criteria
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedInvoices.size === proposals.length && proposals.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label>Select All</Label>
                </div>
                <span className="text-sm text-muted-foreground">
                  {selectedInvoices.size} selected • {formatCurrency(selectedTotal)}
                </span>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposals.map((proposal) => (
                    <TableRow
                      key={proposal.id}
                      className={proposal.is_overdue ? "bg-red-50/50 dark:bg-red-900/10" : ""}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedInvoices.has(proposal.id)}
                          onCheckedChange={(checked) =>
                            handleSelectInvoice(proposal.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-mono">{proposal.invoice_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{proposal.supplier_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {proposal.supplier_code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {format(new Date(proposal.due_date), "MMM dd, yyyy")}
                          <div
                            className={`text-xs ${proposal.is_overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}
                          >
                            {proposal.is_overdue
                              ? `${Math.abs(proposal.days_until_due)} days overdue`
                              : `${proposal.days_until_due} days`}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(proposal.balance)}
                      </TableCell>
                      <TableCell>
                        <Badge className={priorityStyles[proposal.priority]}>
                          {proposal.priority}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Schedule Summary */}
          {selectedInvoices.size > 0 && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Schedule {selectedInvoices.size} invoice(s) for{" "}
                    {format(new Date(scheduledDate), "MMMM dd, yyyy")}
                  </span>
                </div>
                <span className="text-lg font-bold">{formatCurrency(selectedTotal)}</span>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                This will create {Object.keys(groupedProposals).filter((suppId) =>
                  proposals.filter((p) => p.supplier_id === suppId && selectedInvoices.has(p.id)).length > 0
                ).length}{" "}
                scheduled payment(s) grouped by vendor
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateSchedule}
            disabled={createScheduledPayment.isPending || selectedInvoices.size === 0}
          >
            {createScheduledPayment.isPending
              ? "Creating..."
              : `Schedule ${selectedInvoices.size} Payment(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
