import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { useSuppliers } from "@/hooks/useSuppliers";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { useCreateInvoice, useUpdateInvoice, Invoice, InvoiceFormData } from "@/hooks/useInvoices";
import { useDefaultCurrency, useDefaultPaymentTerms } from "@/lib/formatters";
import { CURRENCIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface InvoiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: Invoice | null;
}

export function InvoiceFormDialog({ open, onOpenChange, invoice }: InvoiceFormDialogProps) {
  const { data: suppliers = [] } = useSuppliers();
  const { data: purchaseOrders = [] } = usePurchaseOrders();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const defaultCurrency = useDefaultCurrency();
  const defaultPaymentTerms = useDefaultPaymentTerms();
  const [currencyOpen, setCurrencyOpen] = useState(false);

  const getDefaultFormData = (): InvoiceFormData => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9000) + 1000;
    return {
      invoice_number: `INV-${year}-${random}`,
      supplier_id: null,
      po_id: null,
      invoice_date: new Date().toISOString().split("T")[0],
      due_date: new Date(Date.now() + defaultPaymentTerms * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      amount: 0,
      currency: defaultCurrency,
      notes: "",
    };
  };

  const [formData, setFormData] = useState<InvoiceFormData>(getDefaultFormData());

  useEffect(() => {
    if (invoice) {
      setFormData({
        invoice_number: invoice.invoice_number,
        supplier_id: invoice.supplier_id,
        po_id: invoice.po_id,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        amount: invoice.amount,
        currency: invoice.currency,
        notes: invoice.notes || "",
      });
    } else {
      setFormData(getDefaultFormData());
    }
  }, [invoice, open, defaultCurrency, defaultPaymentTerms]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (invoice) {
        await updateInvoice.mutateAsync({ id: invoice.id, ...formData });
      } else {
        await createInvoice.mutateAsync(formData);
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handlePOSelect = (poId: string) => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (po) {
      setFormData(prev => ({
        ...prev,
        po_id: poId,
        supplier_id: po.supplier_id,
        amount: Number(po.total_amount) || 0,
      }));
    }
  };

  const selectedCurrency = CURRENCIES.find(c => c.code === formData.currency);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{invoice ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_number">Invoice Number</Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={currencyOpen}
                    className="w-full justify-between font-normal"
                  >
                    {selectedCurrency 
                      ? `${selectedCurrency.code} - ${selectedCurrency.name}`
                      : "Select currency..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search currency..." />
                    <CommandList>
                      <CommandEmpty>No currency found.</CommandEmpty>
                      <CommandGroup>
                        {CURRENCIES.map((currency) => (
                          <CommandItem
                            key={currency.code}
                            value={`${currency.code} ${currency.name}`}
                            onSelect={() => {
                              setFormData({ ...formData, currency: currency.code });
                              setCurrencyOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.currency === currency.code ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className="font-mono mr-2">{currency.code}</span>
                            <span className="text-muted-foreground">{currency.name}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="po_id">Linked Purchase Order (Optional)</Label>
            <Select
              value={formData.po_id || "none"}
              onValueChange={(value) => value === "none" ? setFormData({ ...formData, po_id: null }) : handlePOSelect(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select PO..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No PO</SelectItem>
                {purchaseOrders.map((po) => (
                  <SelectItem key={po.id} value={po.id}>
                    {po.po_number} - ${Number(po.total_amount).toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier_id">Supplier</Label>
            <Select
              value={formData.supplier_id || "none"}
              onValueChange={(value) => setFormData({ ...formData, supplier_id: value === "none" ? null : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select supplier..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No supplier</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.company_name} ({supplier.supplier_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_date">Invoice Date</Label>
              <Input
                id="invoice_date"
                type="date"
                value={formData.invoice_date}
                onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createInvoice.isPending || updateInvoice.isPending}>
              {invoice ? "Update Invoice" : "Create Invoice"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
