import { useState } from "react";
import { FileText, Receipt, Truck, ClipboardList, Download, Eye, Settings, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { KPICard } from "../KPICard";
import { toast } from "@/hooks/use-toast";

interface DocumentTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  icon: React.ElementType;
  status: "active" | "draft" | "inactive";
  lastModified: string;
}

const templates: DocumentTemplate[] = [
  {
    id: "1",
    name: "Standard Invoice",
    type: "Invoice",
    description: "Default invoice template with company branding and tax details",
    icon: Receipt,
    status: "active",
    lastModified: "2024-01-15",
  },
  {
    id: "2",
    name: "Purchase Order",
    type: "PO",
    description: "Standard purchase order template with terms and conditions",
    icon: ClipboardList,
    status: "active",
    lastModified: "2024-01-12",
  },
  {
    id: "3",
    name: "Delivery Note",
    type: "Delivery",
    description: "Goods delivery note with item details and signatures",
    icon: Truck,
    status: "active",
    lastModified: "2024-01-10",
  },
  {
    id: "4",
    name: "Receipt Voucher",
    type: "Receipt",
    description: "Payment receipt template for customer payments",
    icon: FileText,
    status: "active",
    lastModified: "2024-01-08",
  },
  {
    id: "5",
    name: "Credit Note",
    type: "Credit Note",
    description: "Credit memo template for returns and adjustments",
    icon: FileText,
    status: "draft",
    lastModified: "2024-01-05",
  },
  {
    id: "6",
    name: "Debit Note",
    type: "Debit Note",
    description: "Debit memo template for vendor adjustments",
    icon: FileText,
    status: "inactive",
    lastModified: "2023-12-20",
  },
];

export function DocumentTemplatesTab() {
  const [previewTemplate, setPreviewTemplate] = useState<DocumentTemplate | null>(null);
  const [editTemplate, setEditTemplate] = useState<DocumentTemplate | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    status: "active" as "active" | "draft" | "inactive",
  });

  const activeCount = templates.filter((t) => t.status === "active").length;
  const draftCount = templates.filter((t) => t.status === "draft").length;

  const handlePreview = (template: DocumentTemplate) => {
    setPreviewTemplate(template);
  };

  const handleEdit = (template: DocumentTemplate) => {
    setEditFormData({
      name: template.name,
      description: template.description,
      status: template.status,
    });
    setEditTemplate(template);
  };

  const handleDownload = (template: DocumentTemplate) => {
    toast({
      title: "Download Started",
      description: `Downloading ${template.name} template...`,
    });
  };

  const handleSaveEdit = () => {
    toast({
      title: "Template Updated",
      description: `${editFormData.name} has been saved successfully.`,
    });
    setEditTemplate(null);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <KPICard
          icon={FileText}
          label="Total Templates"
          value={templates.length}
          subtitle="Document types"
          variant="primary"
        />
        <KPICard
          icon={FileText}
          label="Active"
          value={activeCount}
          subtitle="In use"
          variant="success"
        />
        <KPICard
          icon={FileText}
          label="Drafts"
          value={draftCount}
          subtitle="Pending review"
          variant="warning"
        />
        <KPICard
          icon={FileText}
          label="Custom Fields"
          value={12}
          subtitle="Configured"
          variant="default"
        />
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((docTemplate) => {
          const TemplateIcon = docTemplate.icon;
          return (
            <Card key={docTemplate.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <TemplateIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{docTemplate.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{docTemplate.type}</p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      docTemplate.status === "active"
                        ? "default"
                        : docTemplate.status === "draft"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {docTemplate.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="text-sm">
                  {docTemplate.description}
                </CardDescription>
                <div className="text-xs text-muted-foreground">
                  Last modified: {docTemplate.lastModified}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handlePreview(docTemplate)}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Preview
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEdit(docTemplate)}
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => handleDownload(docTemplate)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Placeholder Fields Section */}
      <Card>
        <CardHeader>
          <CardTitle>Available Placeholder Fields</CardTitle>
          <CardDescription>
            Use these placeholders in your document templates. They will be replaced with actual values when generating documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h4 className="font-medium mb-2 text-sm">Company Fields</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p><code className="bg-muted px-1 rounded">{"{{company_name}}"}</code></p>
                <p><code className="bg-muted px-1 rounded">{"{{company_address}}"}</code></p>
                <p><code className="bg-muted px-1 rounded">{"{{company_tax_id}}"}</code></p>
                <p><code className="bg-muted px-1 rounded">{"{{company_phone}}"}</code></p>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-sm">Document Fields</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p><code className="bg-muted px-1 rounded">{"{{document_number}}"}</code></p>
                <p><code className="bg-muted px-1 rounded">{"{{document_date}}"}</code></p>
                <p><code className="bg-muted px-1 rounded">{"{{due_date}}"}</code></p>
                <p><code className="bg-muted px-1 rounded">{"{{total_amount}}"}</code></p>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-sm">Customer/Vendor Fields</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p><code className="bg-muted px-1 rounded">{"{{party_name}}"}</code></p>
                <p><code className="bg-muted px-1 rounded">{"{{party_address}}"}</code></p>
                <p><code className="bg-muted px-1 rounded">{"{{party_email}}"}</code></p>
                <p><code className="bg-muted px-1 rounded">{"{{contact_person}}"}</code></p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {(() => {
                if (!previewTemplate) return null;
                const PreviewIcon = previewTemplate.icon;
                return <PreviewIcon className="w-5 h-5" />;
              })()}
              {previewTemplate?.name} Preview
            </DialogTitle>
            <DialogDescription>
              Visual preview of the document template layout
            </DialogDescription>
          </DialogHeader>
          
          {previewTemplate && (
            <div className="border rounded-lg p-6 bg-white dark:bg-background space-y-6">
              {/* Company Header */}
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <div className="text-lg font-bold text-primary">{"{{company_name}}"}</div>
                  <div className="text-sm text-muted-foreground">{"{{company_address}}"}</div>
                  <div className="text-sm text-muted-foreground">Tel: {"{{company_phone}}"}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{previewTemplate.type.toUpperCase()}</div>
                  <div className="text-sm">No: {"{{document_number}}"}</div>
                  <div className="text-sm">Date: {"{{document_date}}"}</div>
                </div>
              </div>

              {/* Party Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium mb-1">Bill To:</div>
                  <div className="text-sm">{"{{party_name}}"}</div>
                  <div className="text-sm text-muted-foreground">{"{{party_address}}"}</div>
                  <div className="text-sm text-muted-foreground">{"{{party_email}}"}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm">Due Date: {"{{due_date}}"}</div>
                  <div className="text-sm">Reference: {"{{reference}}"}</div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2 font-medium">Description</th>
                      <th className="text-right p-2 font-medium">Qty</th>
                      <th className="text-right p-2 font-medium">Unit Price</th>
                      <th className="text-right p-2 font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="p-2">{"{{line_description}}"}</td>
                      <td className="text-right p-2">{"{{line_qty}}"}</td>
                      <td className="text-right p-2">{"{{line_price}}"}</td>
                      <td className="text-right p-2">{"{{line_amount}}"}</td>
                    </tr>
                    <tr className="border-t bg-muted/50">
                      <td colSpan={3} className="text-right p-2 font-medium">Total:</td>
                      <td className="text-right p-2 font-bold">{"{{total_amount}}"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="border-t pt-4">
                <div className="text-xs text-muted-foreground">
                  {"{{terms_and_conditions}}"}
                </div>
                <div className="mt-4 flex justify-end">
                  <div className="text-center">
                    <div className="border-t border-dashed w-40 mb-1"></div>
                    <div className="text-xs text-muted-foreground">Authorized Signature</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTemplate} onOpenChange={() => setEditTemplate(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Edit Template
            </DialogTitle>
            <DialogDescription>
              Modify template settings and configuration
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-status">Status</Label>
              <Select 
                value={editFormData.status} 
                onValueChange={(value) => setEditFormData({ ...editFormData, status: value as typeof editFormData.status })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-medium">Configured Placeholders</Label>
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge variant="secondary">{"{{company_name}}"}</Badge>
                <Badge variant="secondary">{"{{document_number}}"}</Badge>
                <Badge variant="secondary">{"{{party_name}}"}</Badge>
                <Badge variant="secondary">{"{{total_amount}}"}</Badge>
                <Badge variant="outline">+ 8 more</Badge>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTemplate(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}