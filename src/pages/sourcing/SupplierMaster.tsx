import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSuppliers, useCreateSupplier, Supplier } from "@/hooks/useSuppliers";
import { Plus, Building2, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useState } from "react";
import { SupplierFormDialog } from "@/components/sourcing/SupplierFormDialog";

export default function SupplierMaster() {
  const { data: suppliers, isLoading } = useSuppliers();
  const [showForm, setShowForm] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const stats = {
    total: suppliers?.length ?? 0,
    active: suppliers?.filter((s) => s.status === "active").length ?? 0,
    pending: suppliers?.filter((s) => s.status === "pending").length ?? 0,
    blacklisted: suppliers?.filter((s) => s.status === "blacklisted").length ?? 0,
  };

  const columns = [
    { key: "supplier_code", label: "Code", sortable: true },
    { key: "company_name", label: "Company Name", sortable: true },
    { key: "contact_person", label: "Contact", sortable: true },
    { key: "category", label: "Category", sortable: true },
    { key: "country", label: "Country", sortable: true },
    {
      key: "status",
      label: "Status",
      render: (supplier: Supplier) => <StatusBadge status={supplier.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (supplier: Supplier) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedSupplier(supplier);
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
        title="Supplier Master"
        subtitle="Manage all suppliers and vendor information"
        actions={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Blacklisted</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.blacklisted}</div>
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
          data={suppliers ?? []}
          columns={columns}
          searchable
          searchKeys={["company_name", "supplier_code", "contact_person", "category"]}
          onRowClick={(supplier) => {
            setSelectedSupplier(supplier);
            setShowForm(true);
          }}
        />
      )}

      <SupplierFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        supplier={selectedSupplier}
        onClose={() => {
          setShowForm(false);
          setSelectedSupplier(null);
        }}
      />
    </MainLayout>
  );
}
