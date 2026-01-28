import { useState } from "react";
import { Building2, DollarSign, TrendingUp, PiggyBank, Plus, Pencil, Trash2 } from "lucide-react";
import { useFormatCurrency } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { KPICard } from "../KPICard";
import { CostCenterFormDialog } from "@/components/finance/CostCenterFormDialog";
import {
  useCostCenters,
  useCostCenterStats,
  useDeleteCostCenter,
  CostCenter,
} from "@/hooks/useCostCenters";
import { useConfigValue, useUpdateConfig } from "@/hooks/useSystemConfig";

export function CostingBudgetTab() {
  const { data: costCenters = [], isLoading } = useCostCenters();
  const { data: stats } = useCostCenterStats();
  const deleteCostCenter = useDeleteCostCenter();
  const updateConfig = useUpdateConfig();
  const formatCurrency = useFormatCurrency();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenter | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [costCenterToDelete, setCostCenterToDelete] = useState<CostCenter | null>(null);

  // Get current costing method from config
  const currentCostingMethod = useConfigValue<string>("inventory_costing_method", "weighted_average");

  const handleCostingMethodChange = async (value: string) => {
    await updateConfig.mutateAsync({ key: "inventory_costing_method", value });
  };

  const handleEdit = (costCenter: CostCenter) => {
    setSelectedCostCenter(costCenter);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (costCenterToDelete) {
      await deleteCostCenter.mutateAsync(costCenterToDelete.id);
      setDeleteDialogOpen(false);
      setCostCenterToDelete(null);
    }
  };

  const openDeleteDialog = (costCenter: CostCenter) => {
    setCostCenterToDelete(costCenter);
    setDeleteDialogOpen(true);
  };

  const getBudgetUtilization = (spent: number | null, budget: number | null) => {
    if (!budget || budget === 0) return 0;
    return Math.min(((spent || 0) / budget) * 100, 100);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <KPICard
          icon={Building2}
          label="Cost Centers"
          value={stats?.activeCount || 0}
          subtitle="Active centers"
          variant="primary"
        />
        <KPICard
          icon={DollarSign}
          label="Total Budget"
          value={formatCurrency(stats?.totalBudget || 0)}
          variant="default"
        />
        <KPICard
          icon={TrendingUp}
          label="Total Spent"
          value={formatCurrency(stats?.totalSpent || 0)}
          variant="warning"
        />
        <KPICard
          icon={PiggyBank}
          label="Remaining"
          value={formatCurrency(stats?.remaining || 0)}
          variant="success"
        />
      </div>

      {/* Costing Method Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Costing Method</CardTitle>
          <CardDescription>
            Select the method used for calculating inventory valuation and cost of goods sold
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Costing Method</Label>
              <Select 
                value={currentCostingMethod} 
                onValueChange={handleCostingMethodChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fifo">FIFO (First In, First Out)</SelectItem>
                  <SelectItem value="lifo">LIFO (Last In, First Out)</SelectItem>
                  <SelectItem value="weighted_average">Weighted Average</SelectItem>
                  <SelectItem value="standard">Standard Costing</SelectItem>
                  <SelectItem value="specific">Specific Identification</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <p className="text-sm text-muted-foreground">
                {currentCostingMethod === "fifo" && 
                  "Oldest inventory costs are assigned to COGS first. Best for perishable goods."}
                {currentCostingMethod === "lifo" && 
                  "Most recent inventory costs are assigned to COGS first. May reduce taxes in inflationary periods."}
                {currentCostingMethod === "weighted_average" && 
                  "Average cost of all inventory items is used. Smooths out cost fluctuations."}
                {currentCostingMethod === "standard" && 
                  "Predetermined standard costs are used. Variances are tracked separately."}
                {currentCostingMethod === "specific" && 
                  "Each item's actual cost is tracked individually. Best for unique, high-value items."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Centers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cost Centers</CardTitle>
              <CardDescription>
                Manage organizational cost centers and budget allocations
              </CardDescription>
            </div>
            <Button onClick={() => {
              setSelectedCostCenter(null);
              setDialogOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Cost Center
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : costCenters.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No cost centers configured yet.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSelectedCostCenter(null);
                  setDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Cost Center
              </Button>
            </div>
          ) : (
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costCenters.map((cc) => {
                  const utilization = getBudgetUtilization(cc.spent, cc.budget);
                  return (
                    <TableRow key={cc.id}>
                      <TableCell className="font-mono font-medium">{cc.code}</TableCell>
                      <TableCell>{cc.name}</TableCell>
                      <TableCell>{cc.manager || "-"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(cc.budget)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(cc.spent)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={utilization} 
                            className="h-2 w-20"
                          />
                          <span className="text-xs text-muted-foreground w-10">
                            {utilization.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={cc.is_active ? "default" : "secondary"}>
                          {cc.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(cc)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => openDeleteDialog(cc)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <CostCenterFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        costCenter={selectedCostCenter}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cost Center</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{costCenterToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
