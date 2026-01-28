import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, UserPlus, Mail, Lock } from "lucide-react";
import { useCreateUser, AppRole, ROLE_LABELS } from "@/hooks/useUsers";
import { Constants } from "@/integrations/supabase/types";

const ALL_ROLES = Constants.public.Enums.app_role;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserFormDialog({ open, onOpenChange }: UserFormDialogProps) {
  const createUser = useCreateUser();
  
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>(["viewer"]);
  const [sendInvite, setSendInvite] = useState(true);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (selectedRoles.length === 0) {
      newErrors.roles = "At least one role is required";
    }

    if (!sendInvite && !temporaryPassword.trim()) {
      newErrors.password = "Password is required when not sending invite";
    } else if (!sendInvite && temporaryPassword.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await createUser.mutateAsync({
        email: email.trim(),
        fullName: fullName.trim(),
        department: department.trim() || undefined,
        phone: phone.trim() || undefined,
        roles: selectedRoles,
        sendInvite,
        temporaryPassword: sendInvite ? undefined : temporaryPassword,
      });

      // Reset form and close dialog
      resetForm();
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const resetForm = () => {
    setEmail("");
    setFullName("");
    setDepartment("");
    setPhone("");
    setSelectedRoles(["viewer"]);
    setSendInvite(true);
    setTemporaryPassword("");
    setErrors({});
  };

  const toggleRole = (role: AppRole) => {
    setSelectedRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create New User
          </DialogTitle>
          <DialogDescription>
            Add a new user to the system. They will receive an email to set up their account.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={errors.fullName ? "border-destructive" : ""}
            />
            {errors.fullName && (
              <p className="text-sm text-destructive">{errors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="john.doe@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              placeholder="e.g., Procurement, Finance"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* Roles */}
          <div className="space-y-3">
            <Label>Assign Roles *</Label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_ROLES.map((role) => (
                <div
                  key={role}
                  className="flex items-center space-x-2 p-2 rounded-md border hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleRole(role)}
                >
                  <Checkbox
                    id={`role-${role}`}
                    checked={selectedRoles.includes(role)}
                    onCheckedChange={() => toggleRole(role)}
                  />
                  <Label
                    htmlFor={`role-${role}`}
                    className="cursor-pointer font-normal"
                  >
                    {ROLE_LABELS[role]}
                  </Label>
                </div>
              ))}
            </div>
            {errors.roles && (
              <p className="text-sm text-destructive">{errors.roles}</p>
            )}
          </div>

          {/* Invite Option */}
          <div className="space-y-3 pt-2 border-t">
            <div
              className="flex items-center space-x-2 p-2 rounded-md border hover:bg-muted/50 cursor-pointer"
              onClick={() => setSendInvite(!sendInvite)}
            >
              <Checkbox
                id="sendInvite"
                checked={sendInvite}
                onCheckedChange={(checked) => setSendInvite(checked === true)}
              />
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="sendInvite" className="cursor-pointer font-normal">
                  Send invitation email (user sets their own password)
                </Label>
              </div>
            </div>

            {!sendInvite && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Temporary Password *
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter temporary password"
                  value={temporaryPassword}
                  onChange={(e) => setTemporaryPassword(e.target.value)}
                  className={errors.password ? "border-destructive" : ""}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  User will need to change this password on first login.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createUser.isPending}>
            {createUser.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
