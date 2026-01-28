import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Camera, Trash2, User, Mail, Shield, Calendar, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateProfile, useUploadAvatar, useDeleteAvatar } from '@/hooks/useProfile';

const profileSchema = z.object({
  full_name: z.string().min(1, 'Name is required').max(100),
  department: z.string().optional(),
  phone: z.string().optional(),
  employee_id: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const departments = [
  'Warehouse Operations',
  'Procurement',
  'Finance',
  'IT/Technology',
  'Human Resources',
  'Sales',
  'Marketing',
  'Executive',
  'Other',
];

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  warehouse_manager: 'Warehouse Manager',
  procurement: 'Procurement',
  finance: 'Finance',
  viewer: 'Viewer',
};

const roleColors: Record<string, string> = {
  admin: 'bg-destructive/10 text-destructive border-destructive/20',
  warehouse_manager: 'bg-primary/10 text-primary border-primary/20',
  procurement: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  finance: 'bg-success/10 text-success border-success/20',
  viewer: 'bg-muted text-muted-foreground border-border',
};

export default function Profile() {
  const { user, profile, roles, refreshProfile } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      department: profile?.department || '',
      phone: profile?.phone || '',
      employee_id: profile?.employee_id || '',
    },
  });

  const displayName = profile?.full_name || profile?.email || 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      return;
    }

    setIsUploading(true);
    try {
      await uploadAvatar.mutateAsync({ userId: user.id, file });
      await refreshProfile();
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!user) return;
    await deleteAvatar.mutateAsync(user.id);
    await refreshProfile();
  };

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return;
    await updateProfile.mutateAsync({
      userId: user.id,
      updates: {
        full_name: values.full_name,
        department: values.department || null,
        phone: values.phone || null,
        employee_id: values.employee_id || null,
      },
    });
    await refreshProfile();
  };

  return (
    <MainLayout>
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal information and account settings"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>
              Upload a photo to personalize your account
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-32 w-32">
                <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Camera className="h-4 w-4 mr-2" />
                Upload
              </Button>
              {profile?.avatar_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteAvatar}
                  disabled={deleteAvatar.isPending}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              JPG, PNG or GIF. Max 2MB.
            </p>
          </CardContent>
        </Card>

        {/* Account Info Section */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your account details and access level
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Mail className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Email Address</Label>
                <p className="text-sm font-medium">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Role(s)</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {roles.map((role) => (
                    <Badge
                      key={role}
                      variant="outline"
                      className={roleColors[role] || roleColors.viewer}
                    >
                      {roleLabels[role] || role}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Member Since</Label>
                <p className="text-sm font-medium">
                  {profile?.created_at
                    ? format(new Date(profile.created_at), 'MMMM d, yyyy')
                    : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+1 (555) 000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employee_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee ID</FormLabel>
                      <FormControl>
                        <Input placeholder="EMP-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                    disabled={!form.formState.isDirty}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateProfile.isPending || !form.formState.isDirty}
                  >
                    {updateProfile.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
