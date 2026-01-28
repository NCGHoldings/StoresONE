import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KPICard } from "@/components/dashboard/KPICard";
import { CustomerFormDialog } from "@/components/sales/CustomerFormDialog";
import { CustomerARSummary } from "@/components/sales/CustomerARSummary";
import { useCustomers, useCustomerStats, Customer } from "@/hooks/useCustomers";
import { useCustomerBalances, useTotalReceivables } from "@/hooks/useCustomerBalances";
import { Plus, Search, Users, UserCheck, UserX, UserMinus, DollarSign, ChevronRight, X } from "lucide-react";
import { useFormatCurrency } from "@/lib/formatters";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);

  const { data: customers = [], isLoading } = useCustomers();
  const { data: stats } = useCustomerStats();
  const { data: balanceMap } = useCustomerBalances();
  const { data: totalReceivables = 0 } = useTotalReceivables();
  const formatCurrency = useFormatCurrency();

  const filteredCustomers = customers.filter(
    (c) =>
      c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customer_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRowClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormOpen(true);
  };

  const handleNewCustomer = () => {
    setSelectedCustomer(null);
    setFormOpen(true);
  };

  const handleViewDetails = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    setDetailCustomer(customer);
    setDetailsOpen(true);
  };

  const getBalanceStatus = (balance: number, creditLimit: number) => {
    if (balance === 0) return "clear";
    if (creditLimit === 0) return "normal";
    const usage = (balance / creditLimit) * 100;
    if (usage >= 90) return "critical";
    if (usage >= 70) return "warning";
    return "normal";
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Customer Master" subtitle="Manage customer accounts and receivables" />

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <KPICard title="Total Customers" value={stats?.total || 0} icon={<Users className="h-5 w-5" />} />
          <KPICard title="Active" value={stats?.active || 0} icon={<UserCheck className="h-5 w-5" />} trend="up" />
          <KPICard title="On Hold" value={stats?.on_hold || 0} icon={<UserMinus className="h-5 w-5" />} />
          <KPICard title="Inactive" value={stats?.inactive || 0} icon={<UserX className="h-5 w-5" />} />
          <KPICard 
            title="Total Receivables" 
            value={formatCurrency(totalReceivables)} 
            icon={<DollarSign className="h-5 w-5" />}
            trend={totalReceivables > 0 ? "up" : undefined}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search customers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          <Button onClick={handleNewCustomer}>
            <Plus className="h-4 w-4 mr-2" />
            New Customer
          </Button>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Company Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Credit Limit</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Payment Terms</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No customers found</TableCell></TableRow>
              ) : (
                filteredCustomers.map((c) => {
                  const outstanding = balanceMap?.get(c.id) || 0;
                  const balanceStatus = getBalanceStatus(outstanding, c.credit_limit || 0);
                  
                  return (
                    <TableRow key={c.id} className="cursor-pointer" onClick={() => handleRowClick(c)}>
                      <TableCell className="font-medium">{c.customer_code}</TableCell>
                      <TableCell>{c.company_name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{c.contact_person || "-"}</p>
                          <p className="text-muted-foreground">{c.email || "-"}</p>
                        </div>
                      </TableCell>
                      <TableCell>{c.phone || "-"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(c.credit_limit || 0)}</TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          "font-medium",
                          balanceStatus === "critical" && "text-destructive",
                          balanceStatus === "warning" && "text-secondary-foreground",
                          balanceStatus === "clear" && "text-muted-foreground"
                        )}>
                          {formatCurrency(outstanding)}
                        </span>
                        {balanceStatus === "critical" && (
                          <Badge variant="destructive" className="ml-2 text-xs">High</Badge>
                        )}
                      </TableCell>
                      <TableCell>{c.payment_terms ? `${c.payment_terms} days` : "-"}</TableCell>
                      <TableCell><StatusBadge status={c.status} /></TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleViewDetails(e, c)}
                          className="h-8 w-8"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <CustomerFormDialog 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        customer={selectedCustomer} 
        onClose={() => { setFormOpen(false); setSelectedCustomer(null); }} 
      />

      {/* Customer AR Details Sheet */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <span>{detailCustomer?.company_name}</span>
                <Badge variant="outline">{detailCustomer?.customer_code}</Badge>
              </SheetTitle>
            </div>
          </SheetHeader>
          {detailCustomer && <CustomerARSummary customer={detailCustomer} />}
        </SheetContent>
      </Sheet>
    </MainLayout>
  );
}
