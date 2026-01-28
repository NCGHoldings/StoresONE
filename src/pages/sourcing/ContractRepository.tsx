import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useContracts, Contract } from "@/hooks/useContracts";
import { Plus, FileText, AlertTriangle, Calendar, DollarSign } from "lucide-react";
import { useState } from "react";
import { ContractFormDialog } from "@/components/sourcing/ContractFormDialog";
import { differenceInDays } from "date-fns";
import { useFormatCurrency, useFormatDate } from "@/lib/formatters";

export default function ContractRepository() {
  const { data: contracts, isLoading } = useContracts();
  const [showForm, setShowForm] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const formatCurrency = useFormatCurrency();
  const formatDate = useFormatDate();

  const today = new Date();
  const stats = {
    total: contracts?.length ?? 0,
    active: contracts?.filter((c) => c.status === "active").length ?? 0,
    expiringSoon: contracts?.filter((c) => {
      const daysToExpiry = differenceInDays(new Date(c.end_date), today);
      return c.status === "active" && daysToExpiry <= 30 && daysToExpiry > 0;
    }).length ?? 0,
    totalValue: contracts?.reduce((sum, c) => sum + (c.value ?? 0), 0) ?? 0,
  };

  const columns = [
    { key: "contract_number", label: "Contract #", sortable: true },
    {
      key: "supplier",
      label: "Supplier",
      render: (contract: Contract) => contract.suppliers?.company_name ?? "-",
      sortable: true,
    },
    { key: "title", label: "Title", sortable: true },
    {
      key: "value",
      label: "Value",
      render: (contract: Contract) =>
        contract.value
          ? formatCurrency(contract.value)
          : "-",
      sortable: true,
    },
    {
      key: "end_date",
      label: "Expiry Date",
      render: (contract: Contract) => {
        const daysToExpiry = differenceInDays(new Date(contract.end_date), today);
        const isExpiringSoon = daysToExpiry <= 30 && daysToExpiry > 0;
        const isExpired = daysToExpiry <= 0;
        
        return (
          <span className={isExpired ? "text-destructive" : isExpiringSoon ? "text-warning" : ""}>
            {formatDate(contract.end_date)}
            {isExpiringSoon && ` (${daysToExpiry}d)`}
          </span>
        );
      },
      sortable: true,
    },
    {
      key: "status",
      label: "Status",
      render: (contract: Contract) => <StatusBadge status={contract.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (contract: Contract) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedContract(contract);
            setShowForm(true);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <MainLayout>
      <PageHeader
        title="Contract Repository"
        subtitle="Manage supplier contracts and agreements"
        actions={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Contract
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Calendar className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.expiringSoon}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(stats.totalValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <DataTable
          data={contracts ?? []}
          columns={columns}
          searchable
          searchKeys={["contract_number", "title"]}
          onRowClick={(contract) => {
            setSelectedContract(contract);
            setShowForm(true);
          }}
        />
      )}

      <ContractFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        contract={selectedContract}
        onClose={() => {
          setShowForm(false);
          setSelectedContract(null);
        }}
      />
    </MainLayout>
  );
}
