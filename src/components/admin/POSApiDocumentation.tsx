import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, AlertCircle, CheckCircle2, Zap, Shield, Settings, RefreshCw, Bug, Lightbulb, CreditCard, RotateCcw, ShoppingCart, Users } from "lucide-react";
import { toast } from "sonner";

const BASE_URL = "https://sofyrkhxmxqxvwkiznde.supabase.co/functions/v1";
const ENDPOINT_SALE = `${BASE_URL}/pos-sale`;
const ENDPOINT_PAYMENT = `${BASE_URL}/pos-payment`;
const ENDPOINT_RETURN = `${BASE_URL}/pos-return`;
const ENDPOINT_CUSTOMERS = `${BASE_URL}/pos-customers`;
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvZnlya2h4bXhxeHZ3a2l6bmRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwOTE3NDQsImV4cCI6MjA4NDY2Nzc0NH0.cAEX8jWiTa_3XormBXcJpZdSfo6SNsW8v-MpwTJ7wCw";

interface CopyButtonProps {
  text: string;
  className?: string;
}

function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className={className}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

interface CodeBlockProps {
  code: string;
  language?: string;
}

function CodeBlock({ code, language }: CodeBlockProps) {
  return (
    <div className="relative">
      <CopyButton text={code} className="absolute top-2 right-2" />
      <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ============== SALES DOCUMENTATION ==============
function SalesDocumentation() {
  const requestFields = [
    { field: "pos_terminal_id", type: "string", required: true, description: "Unique identifier for the POS terminal", validation: "Max 50 characters" },
    { field: "transaction_id", type: "string", required: true, description: "Unique transaction ID for idempotency", validation: "Must be unique per terminal" },
    { field: "transaction_datetime", type: "ISO 8601", required: false, description: "Transaction timestamp", validation: "Defaults to server time if omitted" },
    { field: "customer_code", type: "string", required: false, description: "Customer code from customers table", validation: "Falls back to walk-in customer" },
    { field: "payment_method", type: "enum", required: true, description: "Payment type", validation: "cash | card | split" },
    { field: "amount_paid", type: "number", required: true, description: "Amount received from customer", validation: "Must be >= 0" },
    { field: "bank_account_id", type: "UUID", required: false, description: "Bank account for deposit recording", validation: "Must exist if provided" },
    { field: "items", type: "array", required: true, description: "Line items for the sale", validation: "At least 1 item required" },
    { field: "notes", type: "string", required: false, description: "Additional notes for the transaction", validation: "Max 500 characters" },
  ];

  const lineItemFields = [
    { field: "sku", type: "string", required: true, description: "Product SKU from products table", validation: "Must exist and be active" },
    { field: "quantity", type: "integer", required: true, description: "Quantity sold", validation: "Must be > 0" },
    { field: "unit_price", type: "number", required: true, description: "Unit price charged", validation: "Within price tolerance of product cost" },
    { field: "discount", type: "number", required: false, description: "Line discount amount", validation: "Defaults to 0" },
    { field: "tax_rate", type: "number", required: true, description: "Tax rate percentage", validation: "0-100, uses system default if 0" },
  ];

  const statusCodes = [
    { status: "200", code: "-", description: "Success - Sale processed and recorded", color: "bg-green-500" },
    { status: "200", code: "DUPLICATE", description: "Idempotent duplicate - Original response returned", color: "bg-green-500" },
    { status: "400", code: "INVALID_PAYLOAD", description: "Missing required fields or malformed request", color: "bg-destructive" },
    { status: "400", code: "VALIDATION_FAILED", description: "Product, stock, or price validation errors", color: "bg-destructive" },
    { status: "500", code: "INTERNAL_ERROR", description: "Server-side processing error", color: "bg-destructive" },
  ];

  const configOptions = [
    { key: "pos_price_tolerance", type: "number", default: "0.1", description: "Price mismatch tolerance (10% = 0.1). If POS price differs from system cost by more than this percentage, validation fails." },
    { key: "pos_require_stock", type: "boolean", default: "true", description: "Whether to validate stock availability before processing. Set to false for backorder scenarios." },
    { key: "walk_in_customer_code", type: "string", default: "WALK-IN", description: "Customer code used when no customer_code is provided in the request." },
    { key: "default_tax_rate", type: "number", default: "7", description: "Default tax rate percentage applied when item tax_rate is 0." },
  ];

  const troubleshootingItems = [
    { issue: "Product not found", solution: "Verify the SKU exists in the Products table and the product is marked as active (is_active = true)." },
    { issue: "Insufficient stock", solution: "Check inventory levels in the Inventory module. Ensure the product has available quantity >= requested quantity." },
    { issue: "Price mismatch exceeds tolerance", solution: "The POS unit_price differs from the product's unit_cost by more than the configured tolerance. Adjust the price or update pos_price_tolerance in System Config." },
    { issue: "Customer not found", solution: "If using customer_code, ensure the customer exists in the Customers table with status = 'active'." },
    { issue: "Bank account not found", solution: "The provided bank_account_id must exist in the Bank Accounts table and be marked as active." },
    { issue: "Duplicate transaction", solution: "This transaction_id was already processed. The original response is returned. Use unique transaction IDs to avoid duplicates." },
  ];

  const jsExample = `// JavaScript/TypeScript Example
const response = await fetch('${ENDPOINT_SALE}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': '${ANON_KEY}'
  },
  body: JSON.stringify({
    pos_terminal_id: 'POS-001',
    transaction_id: \`TXN-\${Date.now()}\`,
    payment_method: 'cash',
    amount_paid: 107.00,
    items: [
      {
        sku: 'ELEC-LAP-001',
        quantity: 1,
        unit_price: 100.00,
        tax_rate: 7
      }
    ]
  })
});

const result = await response.json();
console.log(result);`;

  const pythonExample = `# Python Example
import requests
import time

url = '${ENDPOINT_SALE}'
headers = {
    'Content-Type': 'application/json',
    'apikey': '${ANON_KEY}'
}

payload = {
    'pos_terminal_id': 'POS-001',
    'transaction_id': f'TXN-{int(time.time())}',
    'payment_method': 'cash',
    'amount_paid': 107.00,
    'items': [
        {
            'sku': 'ELEC-LAP-001',
            'quantity': 1,
            'unit_price': 100.00,
            'tax_rate': 7
        }
    ]
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;

  const curlExample = `curl -X POST '${ENDPOINT_SALE}' \\
  -H 'Content-Type: application/json' \\
  -H 'apikey: ${ANON_KEY}' \\
  -d '{
    "pos_terminal_id": "POS-001",
    "transaction_id": "TXN-'$(date +%s)'",
    "payment_method": "cash",
    "amount_paid": 107.00,
    "items": [
      {
        "sku": "ELEC-LAP-001",
        "quantity": 1,
        "unit_price": 100.00,
        "tax_rate": 7
      }
    ]
  }'`;

  const successResponse = `{
  "success": true,
  "erp_invoice_number": "POS-2026-0001",
  "invoice_id": "550e8400-e29b-41d4-a716-446655440000",
  "receipt_number": "RCP-2026-0001",
  "total_amount": 107.00,
  "amount_paid": 107.00,
  "change_due": 0.00,
  "inventory_updated": true,
  "gl_posted": true,
  "timestamp": "2026-01-25T10:30:05Z"
}`;

  const errorValidationFailed = `{
  "success": false,
  "error": "VALIDATION_FAILED",
  "details": [
    {
      "sku": "PROD-999",
      "error": "Product not found"
    },
    {
      "sku": "ELEC-LAP-001",
      "error": "Insufficient stock (available: 3, requested: 5)"
    }
  ]
}`;

  return (
    <div className="space-y-6">
      {/* Quick Start */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle>Quick Start</CardTitle>
          </div>
          <CardDescription>
            Integrate your POS system with the ERP in minutes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">1</span>
                Prerequisites
              </h4>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Products created with SKUs</li>
                <li>Inventory stock available</li>
                <li>Bank account configured (optional)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">2</span>
                Make API Call
              </h4>
              <p className="text-sm text-muted-foreground">
                Send a POST request with your sale data to the endpoint below
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">3</span>
                Automatic Processing
              </h4>
              <p className="text-sm text-muted-foreground">
                Invoice, receipt, inventory, and GL entries are created automatically
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Endpoint</h4>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">POST</Badge>
              <code className="text-sm bg-muted px-2 py-1 rounded flex-1 overflow-x-auto">
                {ENDPOINT_SALE}
              </code>
              <CopyButton text={ENDPOINT_SALE} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Authentication</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>API Key Required</AlertTitle>
            <AlertDescription>
              All requests must include the <code className="bg-muted px-1 rounded">apikey</code> header with a valid Supabase anon key.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Required Headers</h4>
            <CodeBlock code={`Content-Type: application/json
apikey: ${ANON_KEY}`} />
          </div>
        </CardContent>
      </Card>

      {/* Request Schema */}
      <Card>
        <CardHeader>
          <CardTitle>Request Schema</CardTitle>
          <CardDescription>Complete field reference for the request payload</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium mb-3">Request Body Fields</h4>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requestFields.map((field) => (
                    <TableRow key={field.field}>
                      <TableCell className="font-mono text-sm">{field.field}</TableCell>
                      <TableCell><Badge variant="outline">{field.type}</Badge></TableCell>
                      <TableCell>
                        {field.required ? (
                          <Badge className="bg-primary">Yes</Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{field.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-3">Line Item Fields (items array)</h4>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItemFields.map((field) => (
                    <TableRow key={field.field}>
                      <TableCell className="font-mono text-sm">{field.field}</TableCell>
                      <TableCell><Badge variant="outline">{field.type}</Badge></TableCell>
                      <TableCell>
                        {field.required ? (
                          <Badge className="bg-primary">Yes</Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{field.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Response Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Response Reference</CardTitle>
          <CardDescription>All possible response formats</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="success" className="space-y-4">
            <TabsList>
              <TabsTrigger value="success" className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Success
              </TabsTrigger>
              <TabsTrigger value="error" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                Error
              </TabsTrigger>
            </TabsList>

            <TabsContent value="success" className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500">200 OK</Badge>
                <span className="text-sm text-muted-foreground">Sale processed successfully</span>
              </div>
              <CodeBlock code={successResponse} language="json" />
            </TabsContent>

            <TabsContent value="error" className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="destructive">400 Bad Request</Badge>
                <span className="text-sm text-muted-foreground">Validation failed</span>
              </div>
              <CodeBlock code={errorValidationFailed} language="json" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* HTTP Status Codes */}
      <Card>
        <CardHeader>
          <CardTitle>HTTP Status Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Error Code</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statusCodes.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Badge className={item.color}>{item.status}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.code}</TableCell>
                    <TableCell className="text-sm">{item.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Code Examples</CardTitle>
          <CardDescription>Ready-to-use examples in popular languages</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="javascript">
              <AccordionTrigger>JavaScript / TypeScript</AccordionTrigger>
              <AccordionContent>
                <CodeBlock code={jsExample} language="javascript" />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="python">
              <AccordionTrigger>Python</AccordionTrigger>
              <AccordionContent>
                <CodeBlock code={pythonExample} language="python" />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="curl">
              <AccordionTrigger>cURL</AccordionTrigger>
              <AccordionContent>
                <CodeBlock code={curlExample} language="bash" />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Processing Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Pipeline</CardTitle>
          <CardDescription>What happens when a sale is processed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {[
              { step: 1, title: "Validation", description: "Verify all SKUs exist, check stock availability, validate prices against tolerance" },
              { step: 2, title: "Create AR Invoice", description: "Generate customer invoice with line items, calculate subtotal, tax, and total" },
              { step: 3, title: "Post Revenue GL", description: "Debit Cash/AR account, Credit Revenue account, Credit Tax Payable" },
              { step: 4, title: "Reduce Inventory", description: "FIFO deduction from inventory batches, update available quantities" },
              { step: 5, title: "Post COGS", description: "Debit Cost of Goods Sold, Credit Inventory based on batch costs" },
              { step: 6, title: "Create Receipt", description: "Record payment receipt with payment method and amount" },
              { step: 7, title: "Allocate Receipt", description: "Automatically allocate receipt to the invoice, update amount_paid" },
              { step: 8, title: "Bank Transaction", description: "Record deposit to specified bank account (if bank_account_id provided)" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  {item.step}
                </span>
                <div>
                  <h4 className="font-medium">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <CardTitle>System Configuration</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configOptions.map((opt) => (
                  <TableRow key={opt.key}>
                    <TableCell className="font-mono text-sm">{opt.key}</TableCell>
                    <TableCell><Badge variant="outline">{opt.type}</Badge></TableCell>
                    <TableCell className="font-mono text-sm">{opt.default}</TableCell>
                    <TableCell className="text-sm">{opt.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-primary" />
            <CardTitle>Troubleshooting</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {troubleshootingItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  <span className="text-destructive">{item.issue}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.solution}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

// ============== PAYMENTS DOCUMENTATION ==============
function PaymentsDocumentation() {
  const requestFields = [
    { field: "pos_terminal_id", type: "string", required: true, description: "Unique identifier for the POS terminal" },
    { field: "transaction_id", type: "string", required: true, description: "Unique ID for idempotency - prevents duplicate payments" },
    { field: "invoice_id", type: "UUID", required: false, description: "UUID of the invoice to pay (or use invoice_number)" },
    { field: "invoice_number", type: "string", required: false, description: "Invoice number to pay (e.g., POS-2026-0001)" },
    { field: "customer_code", type: "string", required: false, description: "Customer code for validation (optional)" },
    { field: "amount", type: "number", required: true, description: "Payment amount to apply" },
    { field: "payment_method", type: "enum", required: true, description: "cash | card | mobile | check | bank_transfer" },
    { field: "bank_account_id", type: "UUID", required: false, description: "Bank account for deposit (optional)" },
    { field: "reference", type: "string", required: false, description: "Payment reference (check number, etc.)" },
    { field: "notes", type: "string", required: false, description: "Additional notes" },
  ];

  const statusCodes = [
    { status: "200", code: "-", description: "Payment processed successfully", color: "bg-green-500" },
    { status: "200", code: "DUPLICATE", description: "Idempotent duplicate - Original response returned", color: "bg-green-500" },
    { status: "400", code: "INVALID_PAYLOAD", description: "Missing required fields", color: "bg-destructive" },
    { status: "400", code: "INVOICE_ALREADY_PAID", description: "Invoice has no remaining balance", color: "bg-destructive" },
    { status: "400", code: "CUSTOMER_MISMATCH", description: "Customer code doesn't match invoice", color: "bg-destructive" },
    { status: "404", code: "INVOICE_NOT_FOUND", description: "Invoice not found", color: "bg-destructive" },
    { status: "429", code: "RATE_LIMIT_EXCEEDED", description: "Too many requests from terminal", color: "bg-destructive" },
    { status: "500", code: "INTERNAL_ERROR", description: "Server-side error", color: "bg-destructive" },
  ];

  const troubleshootingItems = [
    { issue: "Invoice not found", solution: "Verify the invoice_number or invoice_id exists in customer_invoices table. Check for typos in the invoice number." },
    { issue: "Invoice already paid", solution: "This invoice has been fully paid. Check the invoice status - if it's 'paid', no further payments can be applied." },
    { issue: "Customer mismatch", solution: "The customer_code provided doesn't match the invoice's customer. Either omit customer_code or use the correct one." },
    { issue: "Duplicate transaction", solution: "This transaction_id was already processed. The original response is returned. Use unique transaction IDs." },
    { issue: "Payment exceeds balance", solution: "The payment amount is capped at the remaining balance. Check the response for amount_applied vs overpayment." },
  ];

  const jsExample = `// JavaScript/TypeScript Example - Record Payment
const response = await fetch('${ENDPOINT_PAYMENT}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': '${ANON_KEY}'
  },
  body: JSON.stringify({
    pos_terminal_id: 'POS-001',
    transaction_id: \`PAY-\${Date.now()}\`,
    invoice_number: 'POS-2026-0001',
    amount: 500.00,
    payment_method: 'cash'
  })
});

const result = await response.json();
console.log(result);
// {
//   "success": true,
//   "receipt_number": "RCP-2026-1234",
//   "invoice_number": "POS-2026-0001",
//   "amount_applied": 500.00,
//   "new_invoice_balance": 607.00,
//   "invoice_status": "partial"
// }`;

  const pythonExample = `# Python Example - Record Payment
import requests
import time

url = '${ENDPOINT_PAYMENT}'
headers = {
    'Content-Type': 'application/json',
    'apikey': '${ANON_KEY}'
}

payload = {
    'pos_terminal_id': 'POS-001',
    'transaction_id': f'PAY-{int(time.time())}',
    'invoice_number': 'POS-2026-0001',
    'amount': 500.00,
    'payment_method': 'cash'
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;

  const curlExample = `curl -X POST '${ENDPOINT_PAYMENT}' \\
  -H 'Content-Type: application/json' \\
  -H 'apikey: ${ANON_KEY}' \\
  -d '{
    "pos_terminal_id": "POS-001",
    "transaction_id": "PAY-'$(date +%s)'",
    "invoice_number": "POS-2026-0001",
    "amount": 500.00,
    "payment_method": "cash"
  }'`;

  const successResponse = `{
  "success": true,
  "receipt_number": "RCP-2026-1234",
  "receipt_id": "550e8400-e29b-41d4-a716-446655440000",
  "invoice_number": "POS-2026-0001",
  "invoice_id": "660e8400-e29b-41d4-a716-446655440111",
  "amount_applied": 500.00,
  "overpayment": 0.00,
  "new_invoice_balance": 607.00,
  "invoice_status": "partial",
  "previous_amount_paid": 0.00,
  "new_amount_paid": 500.00,
  "gl_posted": true
}`;

  const errorResponse = `{
  "success": false,
  "error": "INVOICE_NOT_FOUND",
  "details": "Invoice not found: POS-2026-9999"
}`;

  return (
    <div className="space-y-6">
      {/* Quick Start */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle>Quick Start - Payment Collections</CardTitle>
          </div>
          <CardDescription>
            Record payments against existing invoices from your POS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">1</span>
                Find Invoice
              </h4>
              <p className="text-sm text-muted-foreground">
                Use invoice_number (e.g., POS-2026-0001) or invoice_id UUID
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">2</span>
                Record Payment
              </h4>
              <p className="text-sm text-muted-foreground">
                Send payment amount and method to the endpoint
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">3</span>
                Auto-Update
              </h4>
              <p className="text-sm text-muted-foreground">
                Invoice balance and status update automatically
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Endpoint</h4>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">POST</Badge>
              <code className="text-sm bg-muted px-2 py-1 rounded flex-1 overflow-x-auto">
                {ENDPOINT_PAYMENT}
              </code>
              <CopyButton text={ENDPOINT_PAYMENT} />
            </div>
          </div>

          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Multi-Payment Support</AlertTitle>
            <AlertDescription>
              Customers can make multiple partial payments. Each payment updates the invoice balance until fully paid.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Request Schema */}
      <Card>
        <CardHeader>
          <CardTitle>Request Schema</CardTitle>
          <CardDescription>Complete field reference for payment requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requestFields.map((field) => (
                  <TableRow key={field.field}>
                    <TableCell className="font-mono text-sm">{field.field}</TableCell>
                    <TableCell><Badge variant="outline">{field.type}</Badge></TableCell>
                    <TableCell>
                      {field.required ? (
                        <Badge className="bg-primary">Yes</Badge>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{field.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            <strong>Note:</strong> One of <code className="bg-muted px-1 rounded">invoice_id</code> or <code className="bg-muted px-1 rounded">invoice_number</code> is required.
          </p>
        </CardContent>
      </Card>

      {/* Response Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Response Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="success" className="space-y-4">
            <TabsList>
              <TabsTrigger value="success" className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Success
              </TabsTrigger>
              <TabsTrigger value="error" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                Error
              </TabsTrigger>
            </TabsList>

            <TabsContent value="success" className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500">200 OK</Badge>
                <span className="text-sm text-muted-foreground">Payment recorded successfully</span>
              </div>
              <CodeBlock code={successResponse} language="json" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>amount_applied:</strong> Actual amount applied (capped at invoice balance)</p>
                <p><strong>overpayment:</strong> Amount exceeding invoice balance (if any)</p>
                <p><strong>new_invoice_balance:</strong> Remaining balance after this payment</p>
                <p><strong>invoice_status:</strong> Updated to 'paid' when balance reaches 0</p>
              </div>
            </TabsContent>

            <TabsContent value="error" className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="destructive">404 Not Found</Badge>
                <span className="text-sm text-muted-foreground">Invoice not found</span>
              </div>
              <CodeBlock code={errorResponse} language="json" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* HTTP Status Codes */}
      <Card>
        <CardHeader>
          <CardTitle>HTTP Status Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Error Code</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statusCodes.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Badge className={item.color}>{item.status}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.code}</TableCell>
                    <TableCell className="text-sm">{item.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Code Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="javascript">
              <AccordionTrigger>JavaScript / TypeScript</AccordionTrigger>
              <AccordionContent>
                <CodeBlock code={jsExample} language="javascript" />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="python">
              <AccordionTrigger>Python</AccordionTrigger>
              <AccordionContent>
                <CodeBlock code={pythonExample} language="python" />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="curl">
              <AccordionTrigger>cURL</AccordionTrigger>
              <AccordionContent>
                <CodeBlock code={curlExample} language="bash" />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Processing Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Pipeline</CardTitle>
          <CardDescription>What happens when a payment is recorded</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {[
              { step: 1, title: "Validate Request", description: "Check required fields, API key, rate limiting" },
              { step: 2, title: "Idempotency Check", description: "Detect if this transaction_id was already processed" },
              { step: 3, title: "Find Invoice", description: "Look up invoice by ID or number, verify it exists" },
              { step: 4, title: "Validate Customer", description: "If customer_code provided, verify it matches invoice" },
              { step: 5, title: "Create Receipt", description: "Insert into customer_receipts with payment details" },
              { step: 6, title: "Allocate Payment", description: "Link receipt to invoice in receipt_allocations" },
              { step: 7, title: "Update Invoice", description: "Increment amount_paid, update status to 'paid' or 'partial'" },
              { step: 8, title: "Post GL Entries", description: "Debit Cash/Bank (1100), Credit Accounts Receivable (1200)" },
              { step: 9, title: "Bank Transaction", description: "Record deposit if bank_account_id provided" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  {item.step}
                </span>
                <div>
                  <h4 className="font-medium">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Idempotency */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            <CardTitle>Idempotency</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            The <code className="bg-muted px-1 rounded">transaction_id</code> ensures idempotency:
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
            <li>Duplicate requests return the original response</li>
            <li>No duplicate receipts or GL entries are created</li>
            <li>Safe to retry failed requests with the same ID</li>
          </ul>
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Best Practice</AlertTitle>
            <AlertDescription>
              Use format: <code className="bg-muted px-1 rounded">PAY-POS001-1706180400000</code> (prefix + terminal + timestamp)
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-primary" />
            <CardTitle>Troubleshooting</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {troubleshootingItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  <span className="text-destructive">{item.issue}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.solution}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

// ============== RETURNS DOCUMENTATION ==============
function ReturnsDocumentation() {
  const requestFields = [
    { field: "pos_terminal_id", type: "string", required: true, description: "Unique identifier for the POS terminal" },
    { field: "transaction_id", type: "string", required: true, description: "Unique return ID for idempotency" },
    { field: "original_invoice_number", type: "string", required: true, description: "Invoice number of the original sale" },
    { field: "return_reason", type: "enum", required: true, description: "defective | wrong_item | customer_changed_mind | damaged | other" },
    { field: "items", type: "array", required: true, description: "Items being returned" },
    { field: "refund_method", type: "enum", required: true, description: "cash | original_payment | store_credit" },
    { field: "refund_amount", type: "number", required: true, description: "Total refund amount" },
    { field: "restock", type: "boolean", required: false, description: "Whether to restock items (default: true)" },
    { field: "bank_account_id", type: "UUID", required: false, description: "Bank account for cash refund" },
    { field: "notes", type: "string", required: false, description: "Additional notes" },
  ];

  const lineItemFields = [
    { field: "sku", type: "string", required: true, description: "Product SKU being returned" },
    { field: "quantity", type: "integer", required: true, description: "Quantity being returned" },
    { field: "unit_price", type: "number", required: true, description: "Original unit price" },
    { field: "condition", type: "enum", required: false, description: "good | damaged | defective (default: good)" },
  ];

  const statusCodes = [
    { status: "200", code: "-", description: "Return processed successfully", color: "bg-green-500" },
    { status: "200", code: "DUPLICATE", description: "Idempotent duplicate - Original response returned", color: "bg-green-500" },
    { status: "400", code: "INVALID_PAYLOAD", description: "Missing required fields", color: "bg-destructive" },
    { status: "400", code: "QUANTITY_EXCEEDS_ORIGINAL", description: "Return quantity exceeds original sale", color: "bg-destructive" },
    { status: "400", code: "ITEM_NOT_IN_INVOICE", description: "SKU not found in original invoice", color: "bg-destructive" },
    { status: "404", code: "INVOICE_NOT_FOUND", description: "Original invoice not found", color: "bg-destructive" },
    { status: "500", code: "INTERNAL_ERROR", description: "Server-side error", color: "bg-destructive" },
  ];

  const jsExample = `// JavaScript/TypeScript Example - Process Return
const response = await fetch('${ENDPOINT_RETURN}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': '${ANON_KEY}'
  },
  body: JSON.stringify({
    pos_terminal_id: 'POS-001',
    transaction_id: \`RET-\${Date.now()}\`,
    original_invoice_number: 'POS-2026-0001',
    return_reason: 'defective',
    items: [
      {
        sku: 'ELEC-LAP-001',
        quantity: 1,
        unit_price: 100.00,
        condition: 'defective'
      }
    ],
    refund_method: 'cash',
    refund_amount: 107.00,
    restock: false  // Don't restock defective items
  })
});

const result = await response.json();
console.log(result);`;

  const pythonExample = `# Python Example - Process Return
import requests
import time

url = '${ENDPOINT_RETURN}'
headers = {
    'Content-Type': 'application/json',
    'apikey': '${ANON_KEY}'
}

payload = {
    'pos_terminal_id': 'POS-001',
    'transaction_id': f'RET-{int(time.time())}',
    'original_invoice_number': 'POS-2026-0001',
    'return_reason': 'defective',
    'items': [
        {
            'sku': 'ELEC-LAP-001',
            'quantity': 1,
            'unit_price': 100.00,
            'condition': 'defective'
        }
    ],
    'refund_method': 'cash',
    'refund_amount': 107.00,
    'restock': False
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;

  const curlExample = `curl -X POST '${ENDPOINT_RETURN}' \\
  -H 'Content-Type: application/json' \\
  -H 'apikey: ${ANON_KEY}' \\
  -d '{
    "pos_terminal_id": "POS-001",
    "transaction_id": "RET-'$(date +%s)'",
    "original_invoice_number": "POS-2026-0001",
    "return_reason": "defective",
    "items": [
      {
        "sku": "ELEC-LAP-001",
        "quantity": 1,
        "unit_price": 100.00,
        "condition": "defective"
      }
    ],
    "refund_method": "cash",
    "refund_amount": 107.00,
    "restock": false
  }'`;

  const successResponse = `{
  "success": true,
  "return_number": "RET-2026-0001",
  "return_id": "550e8400-e29b-41d4-a716-446655440000",
  "credit_note_number": "CN-2026-0001",
  "credit_note_id": "660e8400-e29b-41d4-a716-446655440111",
  "original_invoice_number": "POS-2026-0001",
  "refund_amount": 107.00,
  "refund_method": "cash",
  "items_restocked": false,
  "gl_posted": true,
  "timestamp": "2026-01-25T14:30:00Z"
}`;

  const troubleshootingItems = [
    { issue: "Invoice not found", solution: "Verify the original_invoice_number exists. The invoice must have been created via pos-sale endpoint." },
    { issue: "Item not in invoice", solution: "The SKU being returned was not in the original sale. Check the invoice details for correct SKUs." },
    { issue: "Quantity exceeds original", solution: "You cannot return more items than were sold. Check the original invoice line quantities." },
    { issue: "Already fully returned", solution: "All items from this invoice have already been returned. Check for existing returns against this invoice." },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Start */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle>Quick Start - Sales Returns</CardTitle>
          </div>
          <CardDescription>
            Process customer returns and refunds from your POS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">1</span>
                Find Original Sale
              </h4>
              <p className="text-sm text-muted-foreground">
                Use the original invoice number from the sale
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">2</span>
                Process Return
              </h4>
              <p className="text-sm text-muted-foreground">
                Submit return items, reason, and refund method
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">3</span>
                Auto Processing
              </h4>
              <p className="text-sm text-muted-foreground">
                Credit note, restock, and GL entries created automatically
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Endpoint</h4>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">POST</Badge>
              <code className="text-sm bg-muted px-2 py-1 rounded flex-1 overflow-x-auto">
                {ENDPOINT_RETURN}
              </code>
              <CopyButton text={ENDPOINT_RETURN} />
            </div>
          </div>

          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Automatic Inventory Handling</AlertTitle>
            <AlertDescription>
              Set <code className="bg-muted px-1 rounded">restock: true</code> to automatically add returned items back to inventory. Use <code className="bg-muted px-1 rounded">restock: false</code> for damaged/defective items.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Request Schema */}
      <Card>
        <CardHeader>
          <CardTitle>Request Schema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium mb-3">Request Body Fields</h4>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requestFields.map((field) => (
                    <TableRow key={field.field}>
                      <TableCell className="font-mono text-sm">{field.field}</TableCell>
                      <TableCell><Badge variant="outline">{field.type}</Badge></TableCell>
                      <TableCell>
                        {field.required ? (
                          <Badge className="bg-primary">Yes</Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{field.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-3">Return Item Fields (items array)</h4>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItemFields.map((field) => (
                    <TableRow key={field.field}>
                      <TableCell className="font-mono text-sm">{field.field}</TableCell>
                      <TableCell><Badge variant="outline">{field.type}</Badge></TableCell>
                      <TableCell>
                        {field.required ? (
                          <Badge className="bg-primary">Yes</Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{field.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Response Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Response Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500">200 OK</Badge>
              <span className="text-sm text-muted-foreground">Return processed successfully</span>
            </div>
            <CodeBlock code={successResponse} language="json" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>return_number:</strong> Unique return reference number</p>
              <p><strong>credit_note_number:</strong> Credit note issued for the return</p>
              <p><strong>items_restocked:</strong> Whether inventory was updated</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* HTTP Status Codes */}
      <Card>
        <CardHeader>
          <CardTitle>HTTP Status Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Error Code</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statusCodes.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Badge className={item.color}>{item.status}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.code}</TableCell>
                    <TableCell className="text-sm">{item.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Code Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="javascript">
              <AccordionTrigger>JavaScript / TypeScript</AccordionTrigger>
              <AccordionContent>
                <CodeBlock code={jsExample} language="javascript" />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="python">
              <AccordionTrigger>Python</AccordionTrigger>
              <AccordionContent>
                <CodeBlock code={pythonExample} language="python" />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="curl">
              <AccordionTrigger>cURL</AccordionTrigger>
              <AccordionContent>
                <CodeBlock code={curlExample} language="bash" />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Processing Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {[
              { step: 1, title: "Validate Request", description: "Check required fields, verify original invoice exists" },
              { step: 2, title: "Validate Items", description: "Ensure SKUs exist in original invoice, quantities don't exceed original" },
              { step: 3, title: "Create Sales Return", description: "Insert into sales_returns and sales_return_lines tables" },
              { step: 4, title: "Create Credit Note", description: "Generate credit note linked to original invoice" },
              { step: 5, title: "Restock Inventory", description: "If restock=true, add items back to inventory batches" },
              { step: 6, title: "Post GL Entries", description: "Reverse revenue: Debit Revenue, Credit Cash/AR. Reverse COGS if restocked." },
              { step: 7, title: "Process Refund", description: "Record cash refund or apply to customer credit" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  {item.step}
                </span>
                <div>
                  <h4 className="font-medium">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-primary" />
            <CardTitle>Troubleshooting</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {troubleshootingItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  <span className="text-destructive">{item.issue}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.solution}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

// ============== CUSTOMERS DOCUMENTATION ==============
function CustomersDocumentation() {
  const queryParams = [
    { field: "code", type: "string", required: false, description: "Fetch single customer by customer_code (e.g., CUST-0001)" },
    { field: "search", type: "string", required: false, description: "Search by company name or customer code (partial match)" },
    { field: "active_only", type: "boolean", required: false, description: "Filter to active customers only (default: true)" },
  ];

  const responseFields = [
    { field: "customer_code", type: "string", description: "Unique customer identifier (e.g., CUST-0001)" },
    { field: "company_name", type: "string", description: "Customer's company/business name" },
    { field: "credit_limit", type: "number", description: "Maximum credit amount allowed for this customer" },
    { field: "outstanding_balance", type: "number", description: "Current amount owed (sum of unpaid invoices)" },
    { field: "available_credit", type: "number", description: "Remaining credit (credit_limit - outstanding_balance)" },
    { field: "payment_terms", type: "number", description: "Payment terms in days (e.g., 30)" },
    { field: "status", type: "string", description: "Customer status: active or inactive" },
    { field: "contact_person", type: "string", description: "Primary contact name" },
    { field: "email", type: "string", description: "Customer email address" },
    { field: "phone", type: "string", description: "Customer phone number" },
    { field: "billing_address", type: "string", description: "Billing address" },
    { field: "shipping_address", type: "string", description: "Shipping/delivery address" },
    { field: "tax_id", type: "string", description: "Tax identification number" },
  ];

  const statusCodes = [
    { status: "200", code: "-", description: "Success - Customer(s) returned", color: "bg-green-500" },
    { status: "404", code: "CUSTOMER_NOT_FOUND", description: "No customer found with the given code", color: "bg-destructive" },
    { status: "500", code: "INTERNAL_ERROR", description: "Server-side error", color: "bg-destructive" },
  ];

  const jsExample = `// JavaScript/TypeScript Example - Fetch Customer by Code
const response = await fetch(
  '${ENDPOINT_CUSTOMERS}?code=CUST-0001',
  {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'apikey': '${ANON_KEY}'
    }
  }
);

const result = await response.json();
console.log(result);
// {
//   "success": true,
//   "customers": [{
//     "customer_code": "CUST-0001",
//     "company_name": "Lyceum Global Holdings",
//     "credit_limit": 10000.00,
//     "outstanding_balance": 1714.06,
//     "available_credit": 8285.94,
//     "payment_terms": 30,
//     "status": "active"
//   }]
// }`;

  const jsSearchExample = `// JavaScript Example - Search Customers
const response = await fetch(
  '${ENDPOINT_CUSTOMERS}?search=Lyceum&active_only=true',
  {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'apikey': '${ANON_KEY}'
    }
  }
);

const result = await response.json();
// Returns all active customers matching "Lyceum"`;

  const pythonExample = `# Python Example - Fetch Customer by Code
import requests

url = '${ENDPOINT_CUSTOMERS}'
headers = {
    'Content-Type': 'application/json',
    'apikey': '${ANON_KEY}'
}

# Fetch single customer
response = requests.get(url, headers=headers, params={'code': 'CUST-0001'})
customer = response.json()['customers'][0]

print(f"Credit Limit: {customer['credit_limit']}")
print(f"Outstanding Balance: {customer['outstanding_balance']}")
print(f"Available Credit: {customer['available_credit']}")`;

  const curlExample = `# Fetch single customer by code
curl -X GET '${ENDPOINT_CUSTOMERS}?code=CUST-0001' \\
  -H 'Content-Type: application/json' \\
  -H 'apikey: ${ANON_KEY}'

# Search customers
curl -X GET '${ENDPOINT_CUSTOMERS}?search=global&active_only=true' \\
  -H 'Content-Type: application/json' \\
  -H 'apikey: ${ANON_KEY}'

# List all active customers
curl -X GET '${ENDPOINT_CUSTOMERS}' \\
  -H 'Content-Type: application/json' \\
  -H 'apikey: ${ANON_KEY}'`;

  const successResponse = `{
  "success": true,
  "customers": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "customer_code": "CUST-0001",
      "company_name": "Lyceum Global Holdings",
      "credit_limit": 10000.00,
      "outstanding_balance": 1714.06,
      "available_credit": 8285.94,
      "payment_terms": 30,
      "status": "active",
      "contact_person": "John Smith",
      "email": "john@lyceum.com",
      "phone": "+1-555-0100",
      "billing_address": "123 Business Ave",
      "shipping_address": "456 Warehouse Blvd",
      "tax_id": "TAX-12345"
    }
  ],
  "count": 1
}`;

  const errorResponse = `{
  "success": false,
  "error": "CUSTOMER_NOT_FOUND",
  "details": "No customer found with code: CUST-9999"
}`;

  return (
    <div className="space-y-6">
      {/* Quick Start */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle>Quick Start - Customer Data</CardTitle>
          </div>
          <CardDescription>
            Fetch customer details including credit limits and outstanding balances
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">1</span>
                Fetch Customer
              </h4>
              <p className="text-sm text-muted-foreground">
                Call the endpoint with customer code or search query
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">2</span>
                Real-time Balances
              </h4>
              <p className="text-sm text-muted-foreground">
                Get calculated outstanding_balance and available_credit
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">3</span>
                Display in POS
              </h4>
              <p className="text-sm text-muted-foreground">
                Show credit limit, balance, and payment terms in your UI
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Endpoint</h4>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">GET</Badge>
              <code className="text-sm bg-muted px-2 py-1 rounded flex-1 overflow-x-auto">
                {ENDPOINT_CUSTOMERS}
              </code>
              <CopyButton text={ENDPOINT_CUSTOMERS} />
            </div>
          </div>

          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Balance Calculation</AlertTitle>
            <AlertDescription>
              The <code className="bg-muted px-1 rounded">outstanding_balance</code> is calculated in real-time from all unpaid invoices. Call this endpoint after recording payments to get updated balances.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Authentication</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Required Headers</h4>
            <CodeBlock code={`Content-Type: application/json
apikey: ${ANON_KEY}`} />
          </div>
        </CardContent>
      </Card>

      {/* Query Parameters */}
      <Card>
        <CardHeader>
          <CardTitle>Query Parameters</CardTitle>
          <CardDescription>Optional filters for the customer request</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parameter</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queryParams.map((field) => (
                  <TableRow key={field.field}>
                    <TableCell className="font-mono text-sm">{field.field}</TableCell>
                    <TableCell><Badge variant="outline">{field.type}</Badge></TableCell>
                    <TableCell>
                      {field.required ? (
                        <Badge className="bg-primary">Yes</Badge>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{field.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            <strong>Note:</strong> Without any parameters, returns all active customers.
          </p>
        </CardContent>
      </Card>

      {/* Response Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Response Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="success" className="space-y-4">
            <TabsList>
              <TabsTrigger value="success" className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Success
              </TabsTrigger>
              <TabsTrigger value="error" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                Error
              </TabsTrigger>
            </TabsList>

            <TabsContent value="success" className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500">200 OK</Badge>
                <span className="text-sm text-muted-foreground">Customer(s) returned successfully</span>
              </div>
              <CodeBlock code={successResponse} language="json" />
            </TabsContent>

            <TabsContent value="error" className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="destructive">404 Not Found</Badge>
                <span className="text-sm text-muted-foreground">Customer not found</span>
              </div>
              <CodeBlock code={errorResponse} language="json" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Response Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Response Fields</CardTitle>
          <CardDescription>Fields returned for each customer in the customers array</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {responseFields.map((field) => (
                  <TableRow key={field.field}>
                    <TableCell className="font-mono text-sm">{field.field}</TableCell>
                    <TableCell><Badge variant="outline">{field.type}</Badge></TableCell>
                    <TableCell className="text-sm">{field.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* HTTP Status Codes */}
      <Card>
        <CardHeader>
          <CardTitle>HTTP Status Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Error Code</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statusCodes.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Badge className={item.color}>{item.status}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.code}</TableCell>
                    <TableCell className="text-sm">{item.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Code Examples</CardTitle>
          <CardDescription>Ready-to-use examples for fetching customer data</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="javascript">
              <AccordionTrigger>JavaScript / TypeScript - Fetch by Code</AccordionTrigger>
              <AccordionContent>
                <CodeBlock code={jsExample} language="javascript" />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="javascript-search">
              <AccordionTrigger>JavaScript / TypeScript - Search Customers</AccordionTrigger>
              <AccordionContent>
                <CodeBlock code={jsSearchExample} language="javascript" />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="python">
              <AccordionTrigger>Python</AccordionTrigger>
              <AccordionContent>
                <CodeBlock code={pythonExample} language="python" />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="curl">
              <AccordionTrigger>cURL</AccordionTrigger>
              <AccordionContent>
                <CodeBlock code={curlExample} language="bash" />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* POS Integration Guide */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <CardTitle>POS Integration Guide</CardTitle>
          </div>
          <CardDescription>How to display customer data in your POS Collections page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {[
              { step: 1, title: "On Customer Select", description: "When a customer is selected in the POS, call GET /pos-customers?code={customer_code}" },
              { step: 2, title: "Display Credit Limit", description: "Use response.customers[0].credit_limit for the 'Credit Limit' field" },
              { step: 3, title: "Display Current Balance", description: "Use response.customers[0].outstanding_balance for the 'Current Balance' field" },
              { step: 4, title: "Display Available Credit", description: "Use response.customers[0].available_credit (= credit_limit - outstanding_balance)" },
              { step: 5, title: "Display Payment Terms", description: "Use response.customers[0].payment_terms for the payment terms (e.g., 30 days)" },
              { step: 6, title: "Refresh After Payment", description: "After recording a payment via /pos-payment, call /pos-customers again to refresh the balance" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  {item.step}
                </span>
                <div>
                  <h4 className="font-medium">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Credit Limit Validation</AlertTitle>
            <AlertDescription>
              If <code className="bg-muted px-1 rounded">pos_validate_credit_limit</code> is enabled in System Config, the <code className="bg-muted px-1 rounded">/pos-sale</code> endpoint will reject sales that exceed the customer's available credit.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-primary" />
            <CardTitle>Troubleshooting</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-0">
              <AccordionTrigger className="text-left">
                <span className="text-destructive">Balance showing $0.00</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Ensure your POS is calling /pos-customers to fetch the outstanding_balance. The balance is calculated from unpaid invoices in real-time. If not calling this endpoint, the balance won't be populated.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left">
                <span className="text-destructive">Credit limit is $0.00</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                The customer may not have a credit limit set. Update the customer's credit limit in the ERP: Sales → Customers → Edit → Credit Limit.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left">
                <span className="text-destructive">Customer not found</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Verify the customer_code is correct. Check that the customer exists and is active in the ERP's customer master.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left">
                <span className="text-destructive">Balance not updating after payment</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                After recording a payment via /pos-payment, you must call /pos-customers again to fetch the updated balance. The balance is calculated at query time.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

// ============== MAIN COMPONENT ==============
export function POSApiDocumentation() {
  return (
    <div className="space-y-6">
      {/* Top-level tabs for different endpoints */}
      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="returns" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Returns
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Customers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <SalesDocumentation />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentsDocumentation />
        </TabsContent>

        <TabsContent value="returns">
          <ReturnsDocumentation />
        </TabsContent>

        <TabsContent value="customers">
          <CustomersDocumentation />
        </TabsContent>
      </Tabs>
    </div>
  );
}
