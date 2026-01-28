import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Users, Settings, Eye, Warehouse, ShoppingCart, DollarSign, LayoutDashboard, Edit2, Check, UserCheck, PieChart } from "lucide-react";
import { useRolesWithStats, useUsersByRole, useUpdateRoleDescription, ROLE_LABELS, ROLE_COLORS, MODULE_LABELS, RoleWithStats } from "@/hooks/useRoles";
import { Database, Constants } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const ALL_MODULES = ["dashboard", "warehouse", "procurement", "sourcing", "finance", "sales", "admin"];

const ROLE_ICONS: Record<AppRole, typeof Shield> = {
  admin: Shield,
  warehouse_manager: Warehouse,
  procurement: ShoppingCart,
  finance: DollarSign,
  viewer: Eye,
  sales: UserCheck,
  controller: PieChart,
};

const MODULE_ICONS: Record<string, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  warehouse: Warehouse,
  procurement: ShoppingCart,
  sourcing: Users,
  finance: DollarSign,
  admin: Settings,
};

export default function RoleManagement() {
  const { data: roles, isLoading } = useRolesWithStats();
  const updateRole = useUpdateRoleDescription();

  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [usersDialogOpen, setUsersDialogOpen] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [editModules, setEditModules] = useState<string[]>([]);

  const handleViewUsers = (role: AppRole) => {
    setSelectedRole(role);
    setUsersDialogOpen(true);
  };

  const handleEditRole = (role: RoleWithStats) => {
    setSelectedRole(role.role);
    setEditDescription(role.description || "");
    setEditModules(role.module_access || []);
    setEditDialogOpen(true);
  };

  const handleSaveRole = async () => {
    if (!selectedRole) return;
    await updateRole.mutateAsync({
      role: selectedRole,
      description: editDescription,
      moduleAccess: editModules,
    });
    setEditDialogOpen(false);
  };

  const toggleModule = (module: string) => {
    setEditModules((prev) =>
      prev.includes(module)
        ? prev.filter((m) => m !== module)
        : [...prev, module]
    );
  };

  return (
    <MainLayout>
      <PageHeader
        title="Role Management"
        subtitle="Manage system roles, permissions, and module access"
      />

      <div className="space-y-6">
        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="relative">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-full mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))
            : roles?.map((role) => {
                const Icon = ROLE_ICONS[role.role];
                return (
                  <Card
                    key={role.role}
                    className="relative hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <CardTitle className="text-base">
                            {ROLE_LABELS[role.role]}
                          </CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEditRole(role)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <CardDescription className="text-xs line-clamp-2">
                        {role.description || "No description"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-2xl font-bold">
                            {role.userCount}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            users
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewUsers(role.role)}
                        >
                          View
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {role.module_access?.slice(0, 3).map((module) => (
                          <Badge
                            key={module}
                            variant="secondary"
                            className="text-[10px] px-1.5"
                          >
                            {MODULE_LABELS[module] || module}
                          </Badge>
                        ))}
                        {(role.module_access?.length || 0) > 3 && (
                          <Badge variant="secondary" className="text-[10px] px-1.5">
                            +{(role.module_access?.length || 0) - 3}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
        </div>

        {/* Permission Matrix */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Permission Matrix
            </CardTitle>
            <CardDescription>
              Overview of module access per role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-48">Role</TableHead>
                    {ALL_MODULES.map((module) => {
                      const ModuleIcon = MODULE_ICONS[module] || LayoutDashboard;
                      return (
                        <TableHead key={module} className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <ModuleIcon className="h-4 w-4" />
                            <span className="text-xs">
                              {MODULE_LABELS[module]}
                            </span>
                          </div>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          {ALL_MODULES.map((m) => (
                            <TableCell key={m} className="text-center">
                              <Skeleton className="h-4 w-4 mx-auto rounded-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    : roles?.map((role) => (
                        <TableRow key={role.role}>
                          <TableCell>
                            <Badge className={ROLE_COLORS[role.role]}>
                              {ROLE_LABELS[role.role]}
                            </Badge>
                          </TableCell>
                          {ALL_MODULES.map((module) => {
                            const hasAccess = role.module_access?.includes(module);
                            return (
                              <TableCell key={module} className="text-center">
                                {hasAccess ? (
                                  <Check className="h-5 w-5 text-green-600 mx-auto" />
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Users Dialog */}
      <UsersDialog
        role={selectedRole}
        open={usersDialogOpen}
        onOpenChange={setUsersDialogOpen}
      />

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit Role: {selectedRole && ROLE_LABELS[selectedRole]}
            </DialogTitle>
            <DialogDescription>
              Update role description and module access
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Enter role description..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Module Access</Label>
              <div className="grid grid-cols-2 gap-3">
                {ALL_MODULES.map((module) => {
                  const ModuleIcon = MODULE_ICONS[module] || LayoutDashboard;
                  return (
                    <div
                      key={module}
                      className="flex items-center space-x-2 p-2 rounded border"
                    >
                      <Checkbox
                        id={`module-${module}`}
                        checked={editModules.includes(module)}
                        onCheckedChange={() => toggleModule(module)}
                      />
                      <label
                        htmlFor={`module-${module}`}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <ModuleIcon className="h-4 w-4" />
                        {MODULE_LABELS[module]}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRole} disabled={updateRole.isPending}>
              {updateRole.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

// Users Dialog Component
function UsersDialog({
  role,
  open,
  onOpenChange,
}: {
  role: AppRole | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: users, isLoading } = useUsersByRole(role);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {role && ROLE_LABELS[role]} Users
          </DialogTitle>
          <DialogDescription>
            Users assigned to this role
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : users && users.length > 0 ? (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted"
                >
                  <Avatar>
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback>
                      {user.full_name?.charAt(0) || user.email?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {user.full_name || "Unnamed User"}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  <Badge variant={user.is_active ? "default" : "secondary"}>
                    {user.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No users assigned to this role</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
