import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { useCreateSupplier } from "@/hooks/useSuppliers";
import { useNavigate } from "react-router-dom";
import { Building2, User, FileText, CheckCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { hasActiveWorkflow } from "@/hooks/useDocumentStatusSync";

const steps = [
  { id: 1, title: "Company Info", icon: Building2 },
  { id: 2, title: "Contact Details", icon: User },
  { id: 3, title: "Business Details", icon: FileText },
  { id: 4, title: "Review & Submit", icon: CheckCircle },
];

export default function SupplierRegistration() {
  const navigate = useNavigate();
  const createSupplier = useCreateSupplier();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    company_name: "",
    supplier_code: `SUP-${Date.now().toString().slice(-6)}`,
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    tax_id: "",
    website: "",
    category: "",
    industry: "",
    payment_terms: 30,
    notes: "",
    compliance_agreed: false,
  });

  const updateField = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      // Exclude compliance_agreed as it's not a database field
      const { compliance_agreed, ...supplierData } = formData;
      const result = await createSupplier.mutateAsync({
        ...supplierData,
        status: "pending",
        registration_date: new Date().toISOString().split("T")[0],
      });

      // Check if there's an active workflow for supplier registration
      const hasWorkflow = await hasActiveWorkflow("supplier_registration");
      if (hasWorkflow && result?.id) {
        // Find active workflow
        const { data: workflow } = await supabase
          .from("approval_workflows")
          .select(`*, steps:approval_steps(*)`)
          .eq("entity_type", "supplier_registration")
          .eq("is_active", true)
          .order("version", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (workflow && workflow.steps && (workflow.steps as unknown[]).length > 0) {
          const sortedSteps = (workflow.steps as Array<{ id: string; step_order: number }>)
            .sort((a, b) => a.step_order - b.step_order);
          const firstStep = sortedSteps[0];

          const { data: userData } = await supabase.auth.getUser();

          // Create approval request
          const { data: request } = await supabase
            .from("approval_requests")
            .insert([{
              workflow_id: workflow.id,
              entity_type: "supplier_registration",
              entity_id: result.id,
              entity_number: formData.supplier_code,
              status: 'pending',
              current_step_id: firstStep.id,
              current_step_order: firstStep.step_order,
              submitted_by: userData?.user?.id,
            }])
            .select()
            .single();

          // Log submit action
          if (request) {
            await supabase.from("approval_actions").insert([{
              request_id: request.id,
              step_id: firstStep.id,
              user_id: userData?.user?.id,
              action: 'submit',
              comment: `New supplier registration: ${formData.company_name}`,
            }]);
          }
        }
      }

      toast.success("Registration submitted successfully!");
      navigate("/sourcing/suppliers");
    } catch (error) {
      console.error("Error submitting registration:", error);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.company_name && formData.supplier_code;
      case 2:
        return formData.contact_person && formData.email;
      case 3:
        return formData.category;
      case 4:
        return formData.compliance_agreed;
      default:
        return true;
    }
  };

  return (
    <MainLayout>
      <PageHeader
        title="Supplier Registration"
        subtitle="Register a new supplier in the system"
      />

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  currentStep >= step.id
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-muted-foreground text-muted-foreground"
                }`}
              >
                <step.icon className="h-5 w-5" />
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-16 md:w-24 h-0.5 mx-2 transition-colors ${
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between max-w-2xl mx-auto mt-2 px-2">
          {steps.map((step) => (
            <span
              key={step.id}
              className={`text-xs ${
                currentStep >= step.id ? "text-primary font-medium" : "text-muted-foreground"
              }`}
            >
              {step.title}
            </span>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Company Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => updateField("company_name", e.target.value)}
                  placeholder="Enter company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier_code">Supplier Code</Label>
                <Input id="supplier_code" value={formData.supplier_code} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => updateField("website", e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          )}

          {/* Step 2: Contact Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact_person">Contact Person *</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => updateField("contact_person", e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="email@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="+1 234 567 890"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="Street address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => updateField("city", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => updateField("country", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Business Details */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={formData.category} onValueChange={(v) => updateField("category", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Raw Materials">Raw Materials</SelectItem>
                      <SelectItem value="Packaging">Packaging</SelectItem>
                      <SelectItem value="Equipment">Equipment</SelectItem>
                      <SelectItem value="Services">Services</SelectItem>
                      <SelectItem value="Logistics">Logistics</SelectItem>
                      <SelectItem value="IT/Software">IT/Software</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Select value={formData.industry} onValueChange={(v) => updateField("industry", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="Retail">Retail</SelectItem>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Logistics">Logistics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tax_id">Tax ID / VAT Number</Label>
                  <Input
                    id="tax_id"
                    value={formData.tax_id}
                    onChange={(e) => updateField("tax_id", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_terms">Payment Terms (days)</Label>
                  <Input
                    id="payment_terms"
                    type="number"
                    value={formData.payment_terms}
                    onChange={(e) => updateField("payment_terms", parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Company:</span>
                    <p className="font-medium">{formData.company_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Code:</span>
                    <p className="font-medium">{formData.supplier_code}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Contact:</span>
                    <p className="font-medium">{formData.contact_person}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">{formData.email}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <p className="font-medium">{formData.category}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Location:</span>
                    <p className="font-medium">{formData.city}, {formData.country}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <Checkbox
                  id="compliance"
                  checked={formData.compliance_agreed}
                  onCheckedChange={(checked) => updateField("compliance_agreed", checked as boolean)}
                />
                <div className="text-sm">
                  <Label htmlFor="compliance" className="cursor-pointer">
                    I confirm that all information provided is accurate and agree to the supplier terms and conditions.
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {currentStep < 4 ? (
              <Button onClick={() => setCurrentStep((prev) => prev + 1)} disabled={!canProceed()}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!canProceed() || createSupplier.isPending}>
                Submit Registration
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
