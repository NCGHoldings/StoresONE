import { useState, useEffect } from "react";
import { Bell, Mail, AlertTriangle, Clock, CheckCircle2, Save, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KPICard } from "../KPICard";
import { useSystemConfigByCategory, useBulkUpdateConfig } from "@/hooks/useSystemConfig";
import { toast } from "sonner";

interface NotificationSetting {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
}

export function NotificationSettingsTab() {
  const { data: configByCategory, isLoading } = useSystemConfigByCategory();
  const bulkUpdate = useBulkUpdateConfig();

  const [settings, setSettings] = useState({
    // Approval Notifications
    notify_approval_pending: true,
    notify_approval_completed: true,
    notify_approval_rejected: true,
    notify_approval_escalated: true,
    
    // Payment Notifications
    notify_payment_due: true,
    notify_payment_overdue: true,
    payment_reminder_days: 7,
    
    // Budget Notifications
    notify_budget_threshold: true,
    budget_threshold_percentage: 80,
    
    // General
    email_frequency: "immediate",
    digest_time: "09:00",
  });

  // Load settings from config
  useEffect(() => {
    if (configByCategory?.finance) {
      const financeConfig = configByCategory.finance;
      const getVal = (key: string, defaultVal: unknown) => {
        const item = financeConfig.find((c) => c.key === key);
        return item?.value !== undefined ? item.value : defaultVal;
      };

      setSettings({
        notify_approval_pending: getVal("notify_approval_pending", true) as boolean,
        notify_approval_completed: getVal("notify_approval_completed", true) as boolean,
        notify_approval_rejected: getVal("notify_approval_rejected", true) as boolean,
        notify_approval_escalated: getVal("notify_approval_escalated", true) as boolean,
        notify_payment_due: getVal("notify_payment_due", true) as boolean,
        notify_payment_overdue: getVal("notify_payment_overdue", true) as boolean,
        payment_reminder_days: getVal("payment_reminder_days", 7) as number,
        notify_budget_threshold: getVal("notify_budget_threshold", true) as boolean,
        budget_threshold_percentage: getVal("budget_threshold_percentage", 80) as number,
        email_frequency: getVal("email_frequency", "immediate") as string,
        digest_time: getVal("digest_time", "09:00") as string,
      });
    }
  }, [configByCategory]);

  const handleSave = async () => {
    try {
      await bulkUpdate.mutateAsync([
        { key: "notify_approval_pending", value: settings.notify_approval_pending },
        { key: "notify_approval_completed", value: settings.notify_approval_completed },
        { key: "notify_approval_rejected", value: settings.notify_approval_rejected },
        { key: "notify_approval_escalated", value: settings.notify_approval_escalated },
        { key: "notify_payment_due", value: settings.notify_payment_due },
        { key: "notify_payment_overdue", value: settings.notify_payment_overdue },
        { key: "payment_reminder_days", value: settings.payment_reminder_days },
        { key: "notify_budget_threshold", value: settings.notify_budget_threshold },
        { key: "budget_threshold_percentage", value: settings.budget_threshold_percentage },
        { key: "email_frequency", value: settings.email_frequency },
        { key: "digest_time", value: settings.digest_time },
      ]);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const enabledCount = Object.entries(settings)
    .filter(([key, val]) => key.startsWith("notify_") && val === true)
    .length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                <div className="h-8 bg-muted rounded w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <KPICard
          icon={Bell}
          label="Active Notifications"
          value={enabledCount}
          subtitle="Enabled types"
          variant="primary"
        />
        <KPICard
          icon={Mail}
          label="Delivery"
          value={settings.email_frequency === "immediate" ? "Instant" : "Daily"}
          subtitle="Email frequency"
          variant="default"
        />
        <KPICard
          icon={Clock}
          label="Payment Reminder"
          value={`${settings.payment_reminder_days}d`}
          subtitle="Before due date"
          variant="warning"
        />
        <KPICard
          icon={DollarSign}
          label="Budget Alert"
          value={`${settings.budget_threshold_percentage}%`}
          subtitle="Threshold"
          variant="success"
        />
      </div>

      {/* Approval Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Approval Notifications
              </CardTitle>
              <CardDescription>
                Get notified about approval workflow events
              </CardDescription>
            </div>
            <Button onClick={handleSave} disabled={bulkUpdate.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {bulkUpdate.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label>Approval Pending</Label>
              <p className="text-sm text-muted-foreground">
                Notify when a document is waiting for your approval
              </p>
            </div>
            <Switch
              checked={settings.notify_approval_pending}
              onCheckedChange={(checked) => setSettings({ ...settings, notify_approval_pending: checked })}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label>Approval Completed</Label>
              <p className="text-sm text-muted-foreground">
                Notify when your submitted documents are fully approved
              </p>
            </div>
            <Switch
              checked={settings.notify_approval_completed}
              onCheckedChange={(checked) => setSettings({ ...settings, notify_approval_completed: checked })}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label>Approval Rejected</Label>
              <p className="text-sm text-muted-foreground">
                Notify when your submitted documents are rejected
              </p>
            </div>
            <Switch
              checked={settings.notify_approval_rejected}
              onCheckedChange={(checked) => setSettings({ ...settings, notify_approval_rejected: checked })}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label>Escalation Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Notify when approvals are escalated due to timeout
              </p>
            </div>
            <Switch
              checked={settings.notify_approval_escalated}
              onCheckedChange={(checked) => setSettings({ ...settings, notify_approval_escalated: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Payment Reminders
          </CardTitle>
          <CardDescription>
            Configure reminders for upcoming and overdue payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label>Payment Due Reminder</Label>
              <p className="text-sm text-muted-foreground">
                Notify before invoices become due
              </p>
            </div>
            <Switch
              checked={settings.notify_payment_due}
              onCheckedChange={(checked) => setSettings({ ...settings, notify_payment_due: checked })}
            />
          </div>

          {settings.notify_payment_due && (
            <div className="ml-4 pl-4 border-l-2 space-y-2">
              <Label>Reminder Days Before Due Date</Label>
              <Input
                type="number"
                min="1"
                max="30"
                value={settings.payment_reminder_days}
                onChange={(e) => setSettings({ ...settings, payment_reminder_days: parseInt(e.target.value) || 7 })}
                className="w-24"
              />
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label>Overdue Payment Alert</Label>
              <p className="text-sm text-muted-foreground">
                Notify when payments are past due date
              </p>
            </div>
            <Switch
              checked={settings.notify_payment_overdue}
              onCheckedChange={(checked) => setSettings({ ...settings, notify_payment_overdue: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Budget Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Budget Alerts
          </CardTitle>
          <CardDescription>
            Get alerted when budgets approach their limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label>Budget Threshold Alert</Label>
              <p className="text-sm text-muted-foreground">
                Notify when cost center spending exceeds threshold
              </p>
            </div>
            <Switch
              checked={settings.notify_budget_threshold}
              onCheckedChange={(checked) => setSettings({ ...settings, notify_budget_threshold: checked })}
            />
          </div>

          {settings.notify_budget_threshold && (
            <div className="ml-4 pl-4 border-l-2 space-y-2">
              <Label>Alert at % of Budget</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="50"
                  max="100"
                  value={settings.budget_threshold_percentage}
                  onChange={(e) => setSettings({ ...settings, budget_threshold_percentage: parseInt(e.target.value) || 80 })}
                  className="w-24"
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivery Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Delivery Settings
          </CardTitle>
          <CardDescription>
            Configure how and when notifications are delivered
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Email Frequency</Label>
              <Select
                value={settings.email_frequency}
                onValueChange={(v) => setSettings({ ...settings, email_frequency: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="daily">Daily Digest</SelectItem>
                  <SelectItem value="weekly">Weekly Summary</SelectItem>
                  <SelectItem value="none">In-App Only</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How often to send email notifications
              </p>
            </div>

            {(settings.email_frequency === "daily" || settings.email_frequency === "weekly") && (
              <div className="space-y-2">
                <Label>Digest Time</Label>
                <Input
                  type="time"
                  value={settings.digest_time}
                  onChange={(e) => setSettings({ ...settings, digest_time: e.target.value })}
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">
                  Time to send daily/weekly digest
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
