import { useState, useEffect } from "react";
import { Building2, MapPin, Phone, Mail, FileText, Globe, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { KPICard } from "../KPICard";
import { useSystemConfigByCategory, useBulkUpdateConfig } from "@/hooks/useSystemConfig";

export function CompanySetup() {
  const { data: configByCategory, isLoading } = useSystemConfigByCategory();
  const bulkUpdate = useBulkUpdateConfig();

  const orgConfig = configByCategory?.organization || [];
  const getConfigValue = (key: string, defaultValue: string = "") => {
    const item = orgConfig.find((c) => c.key === key);
    return item?.value !== undefined ? String(item.value) : defaultValue;
  };

  const [formData, setFormData] = useState({
    company_name: "",
    tax_id: "",
    address: "",
    city: "",
    country: "",
    phone: "",
    email: "",
    website: "",
  });

  // Initialize form when config loads
  useEffect(() => {
    if (orgConfig.length > 0) {
      setFormData({
        company_name: getConfigValue("company_name", "My Company"),
        tax_id: getConfigValue("tax_id", ""),
        address: getConfigValue("company_address", ""),
        city: getConfigValue("company_city", ""),
        country: getConfigValue("company_country", ""),
        phone: getConfigValue("company_phone", ""),
        email: getConfigValue("company_email", ""),
        website: getConfigValue("company_website", ""),
      });
    }
  }, [orgConfig]);

  const handleSave = async () => {
    await bulkUpdate.mutateAsync([
      { key: "company_name", value: formData.company_name },
      { key: "tax_id", value: formData.tax_id },
      { key: "company_address", value: formData.address },
      { key: "company_city", value: formData.city },
      { key: "company_country", value: formData.country },
      { key: "company_phone", value: formData.phone },
      { key: "company_email", value: formData.email },
      { key: "company_website", value: formData.website },
    ]);
  };

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
          icon={Building2}
          label="Legal Entities"
          value={1}
          subtitle="Active companies"
          variant="primary"
        />
        <KPICard
          icon={MapPin}
          label="Locations"
          value={1}
          subtitle="Registered addresses"
          variant="default"
        />
        <KPICard
          icon={FileText}
          label="Tax Registrations"
          value={formData.tax_id ? 1 : 0}
          variant={formData.tax_id ? "success" : "warning"}
        />
        <KPICard
          icon={Globe}
          label="Currencies"
          value={1}
          subtitle="Active currencies"
          variant="default"
        />
      </div>

      {/* Company Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Company Profile
              </CardTitle>
              <CardDescription>
                Configure your organization's legal and contact information
              </CardDescription>
            </div>
            <Button onClick={handleSave} disabled={bulkUpdate.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {bulkUpdate.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div>
            <h4 className="font-medium mb-4">Basic Information</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  placeholder="Enter company name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_id">Tax ID / Registration Number</Label>
                <Input
                  id="tax_id"
                  placeholder="e.g., VAT123456789"
                  value={formData.tax_id}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Address */}
          <div>
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Address
            </h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Textarea
                  id="address"
                  placeholder="Enter street address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Enter city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    placeholder="Enter country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Info */}
          <div>
            <h4 className="font-medium mb-4">Contact Information</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="company@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="website" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Website
                </Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://www.company.com"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
