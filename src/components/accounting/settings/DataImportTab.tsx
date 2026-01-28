import { useState } from "react";
import { Upload, Download, FileSpreadsheet, History, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KPICard } from "../KPICard";
import { toast } from "sonner";

interface ImportType {
  id: string;
  name: string;
  description: string;
  templateUrl: string;
  fields: string[];
}

interface ImportHistory {
  id: string;
  type: string;
  filename: string;
  status: "completed" | "failed" | "processing" | "pending";
  recordsTotal: number;
  recordsImported: number;
  recordsFailed: number;
  importedAt: string;
  importedBy: string;
}

const IMPORT_TYPES: ImportType[] = [
  {
    id: "chart_of_accounts",
    name: "Chart of Accounts",
    description: "Import GL account codes and hierarchy",
    templateUrl: "#",
    fields: ["Account Code", "Account Name", "Type", "Parent Account", "Is Active"],
  },
  {
    id: "opening_balances",
    name: "Opening Balances",
    description: "Import initial account balances for a new period",
    templateUrl: "#",
    fields: ["Account Code", "Debit", "Credit", "Currency", "Date"],
  },
  {
    id: "vendors",
    name: "Vendor Master",
    description: "Bulk import vendor/supplier records",
    templateUrl: "#",
    fields: ["Vendor Code", "Name", "Tax ID", "Address", "Payment Terms", "Email"],
  },
  {
    id: "customers",
    name: "Customer Master",
    description: "Bulk import customer records",
    templateUrl: "#",
    fields: ["Customer Code", "Name", "Tax ID", "Address", "Credit Limit", "Email"],
  },
  {
    id: "cost_centers",
    name: "Cost Centers",
    description: "Import cost center hierarchy and budgets",
    templateUrl: "#",
    fields: ["Code", "Name", "Manager", "Budget", "Is Active"],
  },
  {
    id: "products",
    name: "Product Master",
    description: "Import product catalog with pricing",
    templateUrl: "#",
    fields: ["SKU", "Name", "Category", "Unit Price", "Cost", "UOM"],
  },
];

// Mock import history - in production, this would come from a hook
const MOCK_HISTORY: ImportHistory[] = [
  {
    id: "1",
    type: "vendors",
    filename: "vendors_2024.xlsx",
    status: "completed",
    recordsTotal: 150,
    recordsImported: 148,
    recordsFailed: 2,
    importedAt: "2024-01-20T14:30:00Z",
    importedBy: "admin@company.com",
  },
  {
    id: "2",
    type: "chart_of_accounts",
    filename: "coa_update.csv",
    status: "completed",
    recordsTotal: 85,
    recordsImported: 85,
    recordsFailed: 0,
    importedAt: "2024-01-18T09:15:00Z",
    importedBy: "finance@company.com",
  },
  {
    id: "3",
    type: "products",
    filename: "new_products.xlsx",
    status: "failed",
    recordsTotal: 200,
    recordsImported: 0,
    recordsFailed: 200,
    importedAt: "2024-01-15T16:45:00Z",
    importedBy: "admin@company.com",
  },
];

export function DataImportTab() {
  const [selectedType, setSelectedType] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!selectedType) {
      toast.error("Please select an import type first");
      return;
    }

    // Validate file type
    const validTypes = [".csv", ".xlsx", ".xls"];
    const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validTypes.includes(fileExt)) {
      toast.error("Please upload a CSV or Excel file");
      return;
    }

    // Simulate upload process
    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          toast.success("File uploaded successfully. Import processing started.");
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Reset file input
    event.target.value = "";
  };

  const handleDownloadTemplate = (type: ImportType) => {
    toast.info(`Downloading ${type.name} template...`);
    // In production, this would download an actual template file
  };

  const getStatusBadge = (status: ImportHistory["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            Processing
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const completedImports = MOCK_HISTORY.filter((h) => h.status === "completed").length;
  const totalRecordsImported = MOCK_HISTORY.reduce((sum, h) => sum + h.recordsImported, 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <KPICard
          icon={Upload}
          label="Total Imports"
          value={MOCK_HISTORY.length}
          subtitle="All time"
          variant="primary"
        />
        <KPICard
          icon={CheckCircle2}
          label="Successful"
          value={completedImports}
          subtitle="Completed imports"
          variant="success"
        />
        <KPICard
          icon={FileSpreadsheet}
          label="Records Imported"
          value={totalRecordsImported.toLocaleString()}
          subtitle="Total records"
          variant="default"
        />
        <KPICard
          icon={AlertTriangle}
          label="Failed"
          value={MOCK_HISTORY.filter((h) => h.status === "failed").length}
          subtitle="Requires attention"
          variant="warning"
        />
      </div>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Data
          </CardTitle>
          <CardDescription>
            Upload CSV or Excel files to import data into the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Select Import Type */}
          <div className="space-y-2">
            <h4 className="font-medium">Step 1: Select Import Type</h4>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-96">
                <SelectValue placeholder="Choose what to import..." />
              </SelectTrigger>
              <SelectContent>
                {IMPORT_TYPES.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <div>
                      <p className="font-medium">{type.name}</p>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Type Details */}
          {selectedType && (
            <div className="rounded-lg border p-4 bg-muted/30">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">
                    {IMPORT_TYPES.find((t) => t.id === selectedType)?.name}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Required fields: {IMPORT_TYPES.find((t) => t.id === selectedType)?.fields.join(", ")}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const type = IMPORT_TYPES.find((t) => t.id === selectedType);
                    if (type) handleDownloadTemplate(type);
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Upload File */}
          <div className="space-y-2">
            <h4 className="font-medium">Step 2: Upload File</h4>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                selectedType ? "border-primary/50 hover:border-primary" : "border-muted opacity-50"
              }`}
            >
              {isUploading ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="w-5 h-5 animate-spin" />
                    <span>Uploading...</span>
                  </div>
                  <Progress value={uploadProgress} className="w-64 mx-auto" />
                  <p className="text-sm text-muted-foreground">{uploadProgress}% complete</p>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
                  <p className="mb-2">
                    Drag and drop your file here, or{" "}
                    <label className="text-primary underline cursor-pointer">
                      browse
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={!selectedType}
                      />
                    </label>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supports CSV, XLS, XLSX (max 10MB)
                  </p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Download Templates
          </CardTitle>
          <CardDescription>
            Download blank templates with correct column headers for each import type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {IMPORT_TYPES.map((type) => (
              <div
                key={type.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">{type.name}</p>
                    <p className="text-xs text-muted-foreground">{type.fields.length} columns</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDownloadTemplate(type)}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Import History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Import History
          </CardTitle>
          <CardDescription>
            View past imports and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {MOCK_HISTORY.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No import history yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Records</TableHead>
                  <TableHead>Imported By</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_HISTORY.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {IMPORT_TYPES.find((t) => t.id === item.type)?.name || item.type}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.filename}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-right">
                      <span className="text-green-600">{item.recordsImported}</span>
                      {item.recordsFailed > 0 && (
                        <span className="text-red-600 ml-1">/ {item.recordsFailed} failed</span>
                      )}
                      <span className="text-muted-foreground ml-1">of {item.recordsTotal}</span>
                    </TableCell>
                    <TableCell className="text-sm">{item.importedBy}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(item.importedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
