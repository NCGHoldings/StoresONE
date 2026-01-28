import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Users,
  UserCheck,
  UserX,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
  UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  useUsers,
  useUserStats,
  useToggleUserStatus,
  UserWithRoles,
  AppRole,
  ROLE_LABELS,
  ROLE_COLORS,
} from '@/hooks/useUsers';
import { RoleManagementDialog } from '@/components/admin/RoleManagementDialog';
import { UserFormDialog } from '@/components/admin/UserFormDialog';
import { Constants } from '@/integrations/supabase/types';

const ALL_ROLES = Constants.public.Enums.app_role;
const PAGE_SIZE = 10;

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: users, isLoading, error } = useUsers();
  const { totalUsers, activeUsers, inactiveUsers, roleCounts } = useUserStats(users);
  const toggleStatus = useToggleUserStatus();

  // Filter users by search and role
  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      !searchQuery ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      roleFilter === 'all' || user.roles.includes(roleFilter as AppRole);

    return matchesSearch && matchesRole;
  }) || [];

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.charAt(0).toUpperCase() || '?';
  };

  const handleManageRoles = (user: UserWithRoles) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleToggleStatus = async (user: UserWithRoles) => {
    try {
      await toggleStatus.mutateAsync({
        userId: user.id,
        isActive: !user.is_active,
      });
      toast.success(
        `User ${user.is_active ? 'deactivated' : 'activated'} successfully`
      );
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user status');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="text-center">
            <p className="text-destructive font-medium">Failed to load users</p>
            <p className="text-sm text-muted-foreground mt-1">
              {error.message}
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="User Management"
      subtitle="Manage user accounts and role assignments"
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(value) => {
            setRoleFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {ALL_ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {ROLE_LABELS[role as AppRole]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Users}
          label="Total Users"
          value={isLoading ? null : totalUsers}
          iconColor="text-primary"
        />
        <StatCard
          icon={UserCheck}
          label="Active Users"
          value={isLoading ? null : activeUsers}
          iconColor="text-emerald-500"
        />
        <StatCard
          icon={UserX}
          label="Inactive Users"
          value={isLoading ? null : inactiveUsers}
          iconColor="text-muted-foreground"
        />
        <StatCard
          icon={Shield}
          label="Admins"
          value={isLoading ? null : (roleCounts['admin' as AppRole] || 0)}
          iconColor="text-red-500"
        />
      </div>

      {/* Users Table */}
      <div className="rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground">
                  User
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground">
                  Roles
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">
                  Department
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">
                  Joined
                </th>
                <th className="text-center p-4 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-right p-4 font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Loading skeletons
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-5 w-20" />
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="p-4 text-center">
                      <Skeleton className="h-5 w-10 mx-auto" />
                    </td>
                    <td className="p-4 text-right">
                      <Skeleton className="h-8 w-24 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    {searchQuery || roleFilter !== 'all'
                      ? 'No users match your filters'
                      : 'No users found'}
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                            {getInitials(user.full_name, user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {user.full_name || 'Unnamed User'}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length === 0 ? (
                          <span className="text-sm text-muted-foreground">
                            No roles
                          </span>
                        ) : (
                          user.roles.slice(0, 2).map((role) => (
                            <Badge
                              key={role}
                              variant="secondary"
                              className={cn('text-xs', ROLE_COLORS[role])}
                            >
                              {ROLE_LABELS[role]}
                            </Badge>
                          ))
                        )}
                        {user.roles.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{user.roles.length - 2}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="text-sm">
                        {user.department || '—'}
                      </span>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(user.created_at)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Switch
                        checked={user.is_active !== false}
                        onCheckedChange={() => handleToggleStatus(user)}
                        disabled={toggleStatus.isPending}
                      />
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleManageRoles(user)}
                      >
                        <Settings className="h-4 w-4 mr-1.5" />
                        Roles
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * PAGE_SIZE + 1} to{' '}
              {Math.min(currentPage * PAGE_SIZE, filteredUsers.length)} of{' '}
              {filteredUsers.length} users
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Role Management Dialog */}
      <RoleManagementDialog
        user={selectedUser}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
      <UserFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </MainLayout>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number | null;
  iconColor?: string;
}

function StatCard({ icon: Icon, label, value, iconColor }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className={cn('p-2 rounded-lg bg-muted', iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          {value === null ? (
            <Skeleton className="h-7 w-12" />
          ) : (
            <p className="text-2xl font-bold">{value}</p>
          )}
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}
