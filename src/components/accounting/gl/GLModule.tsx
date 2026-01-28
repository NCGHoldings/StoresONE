import { useState } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { ModuleSubTabs } from "../ModuleSubTabs";
import { KPICard } from "../KPICard";
import { QuickActions } from "../QuickActions";
import { PlaceholderContent } from "../PlaceholderContent";
import { ApprovalConsoleContent } from "../shared/ApprovalConsoleContent";
import { 
  BookOpen, 
  FileText, 
  DollarSign, 
  TrendingUp,
  Plus,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { useGeneralLedger, useLedgerTotals, useLedgerSummary } from "@/hooks/useGeneralLedger";
import { LedgerEntryDialog } from "@/components/finance/LedgerEntryDialog";
import { useFormatCurrency } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const subTabs = [
  { id: "dashboard", label: "Dashboard" },
  { id: "chart-of-accounts", label: "Chart of Accounts" },
  { id: "journal-entries", label: "Journal Entries" },
  { id: "recurring", label: "Recurring Entries" },
  { id: "periods", label: "Financial Periods" },
  { id: "currencies", label: "Currencies" },
  { id: "closing", label: "Period Closing" },
  { id: "approvals", label: "Approvals" },
];

interface GLModuleProps {
  activeSubTab: string;
  onSubTabChange: (tab: string) => void;
}

export default function GLModule({ activeSubTab, onSubTabChange }: GLModuleProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: entries, isLoading: entriesLoading } = useGeneralLedger();
  const { data: totals, isLoading: totalsLoading } = useLedgerTotals();
  const { data: summary } = useLedgerSummary();
  const formatCurrency = useFormatCurrency();

  const quickActions = [
    { label: "New Journal Entry", icon: Plus, onClick: () => setDialogOpen(true) },
    { label: "New Account", icon: Plus, onClick: () => {} },
    { label: "Run Depreciation", icon: RefreshCw, onClick: () => {} },
    { label: "Period Closing", icon: Calendar, onClick: () => {} },
  ];

  return (
    <>
      <ModuleSubTabs tabs={subTabs} activeTab={activeSubTab || "dashboard"} onTabChange={onSubTabChange}>
        <TabsContent value="dashboard" className="mt-4 space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              icon={BookOpen}
              label="Total Accounts"
              value={summary?.length || 0}
              subtitle="Chart of Accounts"
              variant="primary"
            />
            <KPICard
              icon={DollarSign}
              label="Total Debits"
              value={totalsLoading ? "..." : formatCurrency(totals?.totalDebit || 0)}
              variant="success"
            />
            <KPICard
              icon={DollarSign}
              label="Total Credits"
              value={totalsLoading ? "..." : formatCurrency(totals?.totalCredit || 0)}
              variant="warning"
            />
            <KPICard
              icon={TrendingUp}
              label="Net Balance"
              value={totalsLoading ? "..." : formatCurrency(totals?.balance || 0)}
              variant={(totals?.balance || 0) >= 0 ? "success" : "destructive"}
            />
          </div>

          {/* Quick Actions */}
          <QuickActions actions={quickActions} />

          {/* Account Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {summary?.slice(0, 8).map((acc) => (
                  <div
                    key={acc.code}
                    className="p-3 border rounded-lg bg-muted/30"
                  >
                    <p className="text-xs text-muted-foreground">{acc.code}</p>
                    <p className="font-medium truncate">{acc.name}</p>
                    <p className={`text-sm font-semibold ${acc.balance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {formatCurrency(acc.balance)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Entries */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Journal Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entriesLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : entries?.slice(0, 10).map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{format(new Date(entry.entry_date), "MMM dd, yyyy")}</TableCell>
                      <TableCell className="font-medium">{entry.account_code} - {entry.account_name}</TableCell>
                      <TableCell className="text-muted-foreground">{entry.description || "-"}</TableCell>
                      <TableCell className="text-right">{entry.debit ? formatCurrency(entry.debit) : "-"}</TableCell>
                      <TableCell className="text-right">{entry.credit ? formatCurrency(entry.credit) : "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chart-of-accounts" className="mt-4">
          <PlaceholderContent
            title="Chart of Accounts"
            description="Define and manage your organization's complete chart of accounts structure."
            actionLabel="Create Account"
          />
        </TabsContent>

        <TabsContent value="journal-entries" className="mt-4 space-y-6">
          <QuickActions actions={[quickActions[0]]} />
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">All Journal Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Cost Center</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entriesLoading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : entries?.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{format(new Date(entry.entry_date), "MMM dd, yyyy")}</TableCell>
                      <TableCell className="font-medium">{entry.account_code} - {entry.account_name}</TableCell>
                      <TableCell className="text-muted-foreground">{entry.description || "-"}</TableCell>
                      <TableCell>{entry.cost_centers?.name || "-"}</TableCell>
                      <TableCell className="text-right">{entry.debit ? formatCurrency(entry.debit) : "-"}</TableCell>
                      <TableCell className="text-right">{entry.credit ? formatCurrency(entry.credit) : "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recurring" className="mt-4">
          <PlaceholderContent
            title="Recurring Entries"
            description="Set up and manage recurring journal entries that post automatically on schedule."
          />
        </TabsContent>

        <TabsContent value="periods" className="mt-4">
          <PlaceholderContent
            title="Financial Periods"
            description="Configure fiscal years and periods for proper accounting segregation."
          />
        </TabsContent>

        <TabsContent value="currencies" className="mt-4">
          <PlaceholderContent
            title="Multi-Currency Management"
            description="Manage exchange rates and multi-currency transactions."
          />
        </TabsContent>

        <TabsContent value="closing" className="mt-4">
          <PlaceholderContent
            title="Period Closing"
            description="Process period-end closing entries and generate financial statements."
          />
        </TabsContent>

        <TabsContent value="approvals" className="mt-4">
          <ApprovalConsoleContent />
        </TabsContent>
      </ModuleSubTabs>

      <LedgerEntryDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
