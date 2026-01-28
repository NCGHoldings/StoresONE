import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Download, BookOpen, ArrowUpRight, ArrowDownRight, Scale } from "lucide-react";
import { useGeneralLedger, useLedgerTotals, useLedgerSummary } from "@/hooks/useGeneralLedger";
import { LedgerEntryDialog } from "@/components/finance/LedgerEntryDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useFormatCurrency, useFormatDate } from "@/lib/formatters";

export default function GeneralLedger() {
  const [search, setSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: entries = [], isLoading } = useGeneralLedger();
  const { data: totals } = useLedgerTotals();
  const { data: summary = [] } = useLedgerSummary();
  const formatCurrency = useFormatCurrency();
  const formatDate = useFormatDate();

  const uniqueAccounts = [...new Set(entries.map((e) => e.account_code))].sort();

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.account_name.toLowerCase().includes(search.toLowerCase()) ||
      entry.description?.toLowerCase().includes(search.toLowerCase()) ||
      entry.account_code.includes(search);
    const matchesAccount = accountFilter === "all" || entry.account_code === accountFilter;
    return matchesSearch && matchesAccount;
  });

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">General Ledger</h1>
            <p className="text-muted-foreground">View and manage journal entries</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Entry
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Entries</p>
                  <p className="text-2xl font-bold">{totals?.entryCount || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-success/10 p-2">
                  <ArrowUpRight className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Debits</p>
                  <p className="text-2xl font-bold">{formatCurrency(totals?.totalDebit)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-destructive/10 p-2">
                  <ArrowDownRight className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Credits</p>
                  <p className="text-2xl font-bold">{formatCurrency(totals?.totalCredit)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-info/10 p-2">
                  <Scale className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Net Balance</p>
                  <p className={cn("text-2xl font-bold", totals?.balance && totals.balance < 0 ? "text-destructive" : "")}>
                    {formatCurrency(Math.abs(totals?.balance || 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Summary */}
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-4 font-semibold">Account Summary</h3>
            <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-4">
              {summary.slice(0, 8).map((account) => (
                <div key={account.code} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{account.code}</p>
                    <p className="text-sm font-medium">{account.name}</p>
                  </div>
                  <p className={cn("text-sm font-semibold", account.balance < 0 ? "text-destructive" : "text-success")}>
                    {formatCurrency(Math.abs(account.balance))}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search entries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {uniqueAccounts.map((code) => (
                <SelectItem key={code} value={code}>
                  {code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {/* Ledger Table */}
        <Card>
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
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No entries found
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{formatDate(entry.entry_date)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{entry.account_code}</p>
                        <p className="text-xs text-muted-foreground">{entry.account_name}</p>
                      </div>
                    </TableCell>
                    <TableCell>{entry.description || "-"}</TableCell>
                    <TableCell>{entry.cost_centers?.code || "-"}</TableCell>
                    <TableCell className="text-right">
                      {Number(entry.debit) > 0 ? formatCurrency(Number(entry.debit)) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(entry.credit) > 0 ? formatCurrency(Number(entry.credit)) : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <LedgerEntryDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </MainLayout>
  );
}
