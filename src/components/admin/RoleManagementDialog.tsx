import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  UserWithRoles,
  AppRole,
  useAssignRole,
  useRemoveRole,
  ROLE_LABELS,
  ROLE_COLORS,
} from '@/hooks/useUsers';
import { Constants } from '@/integrations/supabase/types';

const ALL_ROLES = Constants.public.Enums.app_role;

interface RoleManagementDialogProps {
  user: UserWithRoles | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleManagementDialog({
  user,
  open,
  onOpenChange,
}: RoleManagementDialogProps) {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();

  if (!user) return null;

  const availableRoles = ALL_ROLES.filter(
    (role) => !user.roles.includes(role as AppRole)
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

  const handleAddRole = async () => {
    if (!selectedRole) return;

    try {
      await assignRole.mutateAsync({
        userId: user.id,
        role: selectedRole as AppRole,
      });
      toast.success(`Added ${ROLE_LABELS[selectedRole as AppRole]} role`);
      setSelectedRole('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add role');
    }
  };

  const handleRemoveRole = async (role: AppRole) => {
    // Prevent removing the last role
    if (user.roles.length <= 1) {
      toast.error('User must have at least one role');
      return;
    }

    try {
      await removeRole.mutateAsync({ userId: user.id, role });
      toast.success(`Removed ${ROLE_LABELS[role]} role`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove role');
    }
  };

  const isLoading = assignRole.isPending || removeRole.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage User Roles</DialogTitle>
          <DialogDescription>
            Add or remove roles for this user. Changes take effect immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User Info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {getInitials(user.full_name, user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {user.full_name || 'Unnamed User'}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>

          {/* Current Roles */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Roles</label>
            <div className="flex flex-wrap gap-2">
              {user.roles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No roles assigned</p>
              ) : (
                user.roles.map((role) => (
                  <Badge
                    key={role}
                    variant="secondary"
                    className={`${ROLE_COLORS[role]} pr-1.5 gap-1`}
                  >
                    {ROLE_LABELS[role]}
                    <button
                      type="button"
                      onClick={() => handleRemoveRole(role)}
                      disabled={isLoading}
                      className="ml-1 hover:bg-black/10 rounded p-0.5 transition-colors disabled:opacity-50"
                      aria-label={`Remove ${ROLE_LABELS[role]} role`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* Add Role */}
          {availableRoles.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Add Role</label>
              <div className="flex gap-2">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a role to add..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABELS[role as AppRole]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAddRole}
                  disabled={!selectedRole || isLoading}
                  size="icon"
                >
                  {assignRole.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
