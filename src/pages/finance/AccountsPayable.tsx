import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Filter, Download, Search, Receipt, MoreVertical, DollarSign, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFormatCurrency } from "@/lib/formatters";

const invoices = [
  {
    id: "INV-2024-0892",
    vendor: "Steel Corp International",
    poNumber: "PO-2024-0154",
    invoiceDate: "2024-01-18",
    dueDate: "2024-02-17",
    amount: 45600,
    status: "Pending",
  },
  {
    id: "INV-2024-0891",
    vendor: "Electronic Components Ltd",
    poNumber: "PO-2024-0150",
    invoiceDate: "2024-01-15",
    dueDate: "2024-02-14",
    amount: 23400,
    status: "Approved",
  },
  {
    id: "INV-2024-0890",
    vendor: "PackagePro Solutions",
    poNumber: "PO-2024-0148",
    invoiceDate: "2024-01-12",
    dueDate: "2024-01-27",
    amount: 8900,
    status: "Overdue",
  },
  {
    id: "INV-2024-0889",
    vendor: "Industrial Supplies Co",
    poNumber: "PO-2024-0145",
    invoiceDate: "2024-01-10",
    dueDate: "2024-02-09",
    amount: 12300,
    status: "Paid",
  },
  {
    id: "INV-2024-0888",
    vendor: "Safety First Equipment",
    poNumber: "PO-2024-0142",
    invoiceDate: "2024-01-08",
    dueDate: "2024-02-07",
    amount: 5600,
    status: "Paid",
  },
];

const statusStyles = {
  Pending: "warning",
  Approved: "info",
  Overdue: "error",
  Paid: "success",
} as const;

export default function AccountsPayable() {
  const formatCurrency = useFormatCurrency();
  
  return (
    <MainLayout
      title="Accounts Payable"
      subtitle="Manage vendor invoices and payments"
    >
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <Input placeholder="Search invoices..." className="pl-10" />
        </div>
        <div className="flex gap-3">
          <Select defaultValue="all">
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter size={18} />
          </Button>
          <Button variant="outline" size="icon">
            <Download size={18} />
          </Button>
          <Button className="gradient-primary border-0">
            <Plus size={18} className="mr-2" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Payables</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(485200)}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock size={20} className="text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Approval</p>
              <p className="text-2xl font-bold text-warning">{formatCurrency(124500)}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertCircle size={20} className="text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overdue</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(32800)}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle size={20} className="text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Paid This Month</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(892400)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="data-table">
          <thead className="bg-muted/50">
            <tr>
              <th>Invoice #</th>
              <th>Vendor</th>
              <th>PO Reference</th>
              <th>Invoice Date</th>
              <th>Due Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Receipt size={16} className="text-primary" />
                    </div>
                    <span className="font-mono font-medium">{invoice.id}</span>
                  </div>
                </td>
                <td className="font-medium">{invoice.vendor}</td>
                <td className="font-mono text-sm text-muted-foreground">
                  {invoice.poNumber}
                </td>
                <td className="text-muted-foreground">{invoice.invoiceDate}</td>
                <td className={cn(
                  invoice.status === "Overdue" && "text-destructive font-medium"
                )}>
                  {invoice.dueDate}
                </td>
                <td className="font-medium">{formatCurrency(invoice.amount)}</td>
                <td>
                  <span className={cn("status-badge", statusStyles[invoice.status])}>
                    {invoice.status}
                  </span>
                </td>
                <td>
                  <Button variant="ghost" size="icon">
                    <MoreVertical size={16} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">Showing 1-5 of 89 invoices</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
