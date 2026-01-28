import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Search, Building2, DollarSign, TrendingUp, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCostCenters, useCostCenterStats, useDeleteCostCenter, CostCenter } from "@/hooks/useCostCenters";
import { CostCenterFormDialog } from "@/components/finance/CostCenterFormDialog";
import { SpendingChart } from "@/components/finance/SpendingChart";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useFormatCurrency } from "@/lib/formatters";

export default function CostCenters() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenter | null>(null);

  const { data: costCenters = [], isLoading } = useCostCenters();
  const { data: stats } = useCostCenterStats();
  const deleteCostCenter = useDeleteCostCenter();
  const formatCurrency = useFormatCurrency();

  const filteredCostCenters = costCenters.filter((cc) => {
    return (
      cc.code.toLowerCase().includes(search.toLowerCase()) ||
      cc.name.toLowerCase().includes(search.toLowerCase()) ||
      cc.manager?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleEdit = (costCenter: CostCenter) => {
    setSelectedCostCenter(costCenter);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this cost center?")) {
      await deleteCostCenter.mutateAsync(id);
    }
  };

  const getUtilizationColor = (spent: number, budget: number) => {
    if (!budget) return "bg-muted";
    const pct = (spent / budget) * 100;
    if (pct >= 90) return "bg-destructive";
    if (pct >= 75) return "bg-warning";
    return "bg-success";
  };

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Cost Centers</h1>
            <p className="text-muted-foreground">Manage cost centers and track budget utilization</p>
          </div>
          <Button onClick={() => { setSelectedCostCenter(null); setFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            New Cost Center
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Centers</p>
                  <p className="text-2xl font-bold">{stats?.activeCount || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-info/10 p-2">
                  <DollarSign className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.totalBudget)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-warning/10 p-2">
                  <TrendingUp className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.totalSpent)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-success/10 p-2">
                  <DollarSign className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.remaining)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Spending Chart */}
        <SpendingChart />

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search cost centers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Cost Centers Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="text-right">Spent</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredCostCenters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No cost centers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCostCenters.map((cc) => {
                  const budget = Number(cc.budget) || 0;
                  const spent = Number(cc.spent) || 0;
                  const utilization = budget > 0 ? Math.round((spent / budget) * 100) : 0;

                  return (
                    <TableRow key={cc.id}>
                      <TableCell className="font-medium">{cc.code}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{cc.name}</p>
                          {cc.description && (
                            <p className="text-xs text-muted-foreground">{cc.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{cc.manager || "-"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(budget)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(spent)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={Math.min(utilization, 100)} 
                            className={cn("h-2 w-16", getUtilizationColor(spent, budget))}
                          />
                          <span className="text-sm text-muted-foreground">{utilization}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={cc.is_active ? "default" : "secondary"}>
                          {cc.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(cc)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(cc.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <CostCenterFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        costCenter={selectedCostCenter}
      />
    </MainLayout>
  );
}
