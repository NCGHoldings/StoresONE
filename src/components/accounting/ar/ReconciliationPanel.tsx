import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useCustomers } from '@/hooks/useCustomers';
import { useARReconciliation } from '@/hooks/useARReconciliation';
import { useFormatCurrency } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { FileDown, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';

export default function ReconciliationPanel() {
  const { data: customers } = useCustomers();
  const formatCurrency = useFormatCurrency();
  const [customerId, setCustomerId] = useState<string>('');
  const [periodStart, setPeriodStart] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [periodEnd, setPeriodEnd] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const { data: reconciliation, isLoading } = useARReconciliation(
    customerId || null,
    periodStart,
    periodEnd
  );

  const typeColors: Record<string, string> = {
    invoice: 'bg-blue-100 text-blue-800',
    receipt: 'bg-green-100 text-green-800',
    credit_note: 'bg-orange-100 text-orange-800',
    advance: 'bg-purple-100 text-purple-800',
  };

  const setQuickDates = (type: 'thisMonth' | 'lastMonth' | 'last3Months' | 'ytd') => {
    const today = new Date();
    switch (type) {
      case 'thisMonth':
        setPeriodStart(format(startOfMonth(today), 'yyyy-MM-dd'));
        setPeriodEnd(format(endOfMonth(today), 'yyyy-MM-dd'));
        break;
      case 'lastMonth':
        setPeriodStart(format(startOfMonth(subMonths(today, 1)), 'yyyy-MM-dd'));
        setPeriodEnd(format(endOfMonth(subMonths(today, 1)), 'yyyy-MM-dd'));
        break;
      case 'last3Months':
        setPeriodStart(format(subMonths(today, 3), 'yyyy-MM-dd'));
        setPeriodEnd(format(today, 'yyyy-MM-dd'));
        break;
      case 'ytd':
        setPeriodStart(format(new Date(today.getFullYear(), 0, 1), 'yyyy-MM-dd'));
        setPeriodEnd(format(today, 'yyyy-MM-dd'));
        break;
    }
  };

  const handleExport = () => {
    if (!reconciliation) return;
    
    const lines = [
      `Customer Statement: ${reconciliation.customerName}`,
      `Period: ${reconciliation.periodStart} to ${reconciliation.periodEnd}`,
      '',
      `Opening Balance: ${formatCurrency(reconciliation.openingBalance)}`,
      '',
      'Date,Type,Reference,Description,Debit,Credit,Balance',
      ...reconciliation.transactions.map(t => 
        `${t.date},${t.type},${t.reference},${t.description},${t.debit || ''},${t.credit || ''},${t.balance}`
      ),
      '',
      `Closing Balance: ${formatCurrency(reconciliation.closingBalance)}`,
    ];
    
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statement-${reconciliation.customerName}-${reconciliation.periodEnd}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Statement Reconciliation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={customerId || "none"} onValueChange={(val) => setCustomerId(val === "none" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select customer</SelectItem>
                  {customers?.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Period Start</Label>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Period End</Label>
              <Input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={!reconciliation}
                className="w-full"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Export Statement
              </Button>
            </div>
          </div>
          
          {/* Quick Date Selection */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Quick Select:</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickDates('thisMonth')}
              >
                This Month
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickDates('lastMonth')}
              >
                Last Month
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickDates('last3Months')}
              >
                Last 3 Months
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickDates('ytd')}
              >
                YTD
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {!customerId && (
        <div className="text-center text-muted-foreground py-12">
          Select a customer to view their statement reconciliation
        </div>
      )}

      {customerId && isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {reconciliation && (
        <>
          {/* Discrepancies Alert */}
          {reconciliation.discrepancies.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Discrepancies Found</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside mt-2">
                  {reconciliation.discrepancies.map((d, i) => (
                    <li key={i}>{d.message} ({formatCurrency(d.amount)})</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {reconciliation.discrepancies.length === 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Reconciled</AlertTitle>
              <AlertDescription>
                No discrepancies found. Statement balances correctly.
              </AlertDescription>
            </Alert>
          )}

          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">Opening Balance</div>
                <div className="text-xl font-bold mt-1">
                  {formatCurrency(reconciliation.openingBalance)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">Total Debits (Invoices)</div>
                <div className="text-xl font-bold mt-1 text-blue-600">
                  {formatCurrency(reconciliation.totalDebits)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">Total Credits</div>
                <div className="text-xl font-bold mt-1 text-green-600">
                  {formatCurrency(reconciliation.totalCredits)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">Closing Balance</div>
                <div className="text-xl font-bold mt-1">
                  {formatCurrency(reconciliation.closingBalance)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Statement for {reconciliation.customerName}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({reconciliation.periodStart} to {reconciliation.periodEnd})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Opening balance row */}
                  <TableRow className="bg-muted/50">
                    <TableCell>{reconciliation.periodStart}</TableCell>
                    <TableCell colSpan={3}><em>Opening Balance</em></TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(reconciliation.openingBalance)}
                    </TableCell>
                  </TableRow>
                  
                  {reconciliation.transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell>{txn.date}</TableCell>
                      <TableCell>
                        <Badge className={typeColors[txn.type]} variant="secondary">
                          {txn.type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">{txn.reference}</TableCell>
                      <TableCell>{txn.description}</TableCell>
                      <TableCell className="text-right">
                        {txn.debit > 0 ? formatCurrency(txn.debit) : ''}
                      </TableCell>
                      <TableCell className="text-right">
                        {txn.credit > 0 ? formatCurrency(txn.credit) : ''}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(txn.balance)}
                      </TableCell>
                    </TableRow>
                  ))}

                  {reconciliation.transactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        <div className="space-y-2">
                          <p>No transactions found for this period</p>
                          <p className="text-sm">
                            ({periodStart} to {periodEnd})
                          </p>
                          <p className="text-xs">
                            Try selecting a different date range using the quick select buttons above
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Closing balance row */}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>{reconciliation.periodEnd}</TableCell>
                    <TableCell colSpan={3}><em>Closing Balance</em></TableCell>
                    <TableCell className="text-right">{formatCurrency(reconciliation.totalDebits)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(reconciliation.totalCredits)}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(reconciliation.closingBalance)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
