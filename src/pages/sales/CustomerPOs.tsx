import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KPICard } from "@/components/dashboard/KPICard";
import { CustomerPOFormDialog } from "@/components/sales/CustomerPOFormDialog";
import { CustomerPODetailsPanel } from "@/components/sales/CustomerPODetailsPanel";
import { useCustomerPOs, useCustomerPOStats, useConvertToSalesOrder, CustomerPO } from "@/hooks/useCustomerPOs";
import { Plus, Search, FileText, ClipboardCheck, ArrowRightLeft, CheckCircle2 } from "lucide-react";
import { useFormatCurrency, useFormatDate } from "@/lib/formatters";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function CustomerPOs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedCPO, setSelectedCPO] = useState<CustomerPO | null>(null);

  const { data: cpos = [], isLoading } = useCustomerPOs();
  const { data: stats } = useCustomerPOStats();
  const convertToSO = useConvertToSalesOrder();
  const formatCurrency = useFormatCurrency();
  const formatDate = useFormatDate();

  const filteredCPOs = cpos.filter(
    (c) => c.cpo_number.toLowerCase().includes(searchTerm.toLowerCase()) || c.internal_ref.toLowerCase().includes(searchTerm.toLowerCase()) || c.customers?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConvert = async (e: React.MouseEvent, cpoId: string) => {
    e.stopPropagation();
    await convertToSO.mutateAsync(cpoId);
  };

  const handleRowClick = (cpo: CustomerPO) => { setSelectedCPO(cpo); setDetailsOpen(true); };
  const handleNewCPO = () => { setSelectedCPO(null); setFormOpen(true); };

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Customer Purchase Orders" subtitle="Receive and manage customer orders" />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard title="Received" value={stats?.received || 0} icon={<FileText className="h-5 w-5" />} />
          <KPICard title="Under Review" value={stats?.reviewed || 0} icon={<ClipboardCheck className="h-5 w-5" />} />
          <KPICard title="Converted" value={stats?.converted || 0} icon={<ArrowRightLeft className="h-5 w-5" />} trend="up" />
          <KPICard title="Fulfilled" value={stats?.fulfilled || 0} icon={<CheckCircle2 className="h-5 w-5" />} />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search customer POs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          <Button onClick={handleNewCPO}><Plus className="h-4 w-4 mr-2" />New Customer PO</Button>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Internal Ref</TableHead>
                <TableHead>Customer PO#</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Required Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : filteredCPOs.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No customer POs found</TableCell></TableRow>
              ) : (
                filteredCPOs.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => handleRowClick(c)}>
                    <TableCell className="font-medium">{c.internal_ref}</TableCell>
                    <TableCell>{c.cpo_number}</TableCell>
                    <TableCell>{c.customers?.company_name || "-"}</TableCell>
                    <TableCell>{formatDate(c.order_date)}</TableCell>
                    <TableCell>{c.required_date ? formatDate(c.required_date) : "-"}</TableCell>
                    <TableCell>{formatCurrency(c.total_amount || 0)}</TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
                    <TableCell>
                      {(c.status === "received" || c.status === "reviewed") && (
                        <Button size="sm" variant="outline" onClick={(e) => handleConvert(e, c.id)} disabled={convertToSO.isPending}>
                          <ArrowRightLeft className="h-4 w-4 mr-1" />Convert
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <CustomerPOFormDialog open={formOpen} onOpenChange={setFormOpen} onClose={() => setFormOpen(false)} />
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedCPO && <CustomerPODetailsPanel cpoId={selectedCPO.id} onClose={() => setDetailsOpen(false)} />}
        </SheetContent>
      </Sheet>
    </MainLayout>
  );
}
