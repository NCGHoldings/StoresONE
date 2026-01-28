import { useState, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Users, Package, ShoppingCart, DollarSign, Save, RotateCcw, History, Check, ChevronsUpDown } from "lucide-react";
import { useSystemConfigByCategory, useBulkUpdateConfig, CONFIG_LABELS, SystemConfigItem } from "@/hooks/useSystemConfig";
import { Constants } from "@/integrations/supabase/types";
import { ConfigChangeHistory } from "@/components/admin/ConfigChangeHistory";
import { CURRENCIES, TIMEZONES, TIMEZONE_REGIONS, DATE_FORMATS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const UOM_OPTIONS = ["EA", "PCS", "KG", "LB", "M", "FT", "L", "GAL"];

export default function SystemConfig() {
  const { data: configByCategory, isLoading } = useSystemConfigByCategory();
  const bulkUpdate = useBulkUpdateConfig();

  const [activeTab, setActiveTab] = useState("organization");
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  // Popover states for searchable selects
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [timezoneOpen, setTimezoneOpen] = useState(false);

  // Initialize form values from config data (only once per load)
  useEffect(() => {
    if (!configByCategory || initialized) return;

    const values: Record<string, unknown> = {};
    Object.values(configByCategory).flat().forEach((item) => {
      values[item.key] = item.value;
    });
    setFormValues(values);
    setIsDirty(false);
    setInitialized(true);
  }, [configByCategory, initialized]);

  // Reset initialized when refetching
  useEffect(() => {
    if (isLoading) {
      setInitialized(false);
    }
  }, [isLoading]);

  const handleValueChange = (key: string, value: unknown) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    const updates = Object.entries(formValues).map(([key, value]) => ({
      key,
      value,
    }));
    await bulkUpdate.mutateAsync(updates);
    setIsDirty(false);
  };

  const handleReset = () => {
    if (!configByCategory) return;

    const values: Record<string, unknown> = {};
    Object.values(configByCategory).flat().forEach((item) => {
      values[item.key] = item.value;
    });
    setFormValues(values);
    setIsDirty(false);
  };

  const renderConfigField = (item: SystemConfigItem) => {
    const value = formValues[item.key];
    const label = CONFIG_LABELS[item.key] || item.key;

    // Handle boolean switches
    if (typeof item.value === "boolean" || item.key.includes("require") || item.key.includes("enabled")) {
      return (
        <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border">
          <div>
            <Label htmlFor={item.key}>{label}</Label>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.description}
              </p>
            )}
          </div>
          <Switch
            id={item.key}
            checked={value === true || value === "true"}
            onCheckedChange={(checked) => handleValueChange(item.key, checked)}
          />
        </div>
      );
    }

    // Searchable currency dropdown
    if (item.key === "default_currency") {
      const currentValue = String(value).replace(/"/g, "");
      const selectedCurrency = CURRENCIES.find(c => c.code === currentValue);
      
      return (
        <div key={item.key} className="space-y-2">
          <Label htmlFor={item.key}>{label}</Label>
          <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={currencyOpen}
                className="w-full justify-between font-normal"
              >
                {selectedCurrency 
                  ? `${selectedCurrency.code} - ${selectedCurrency.name}`
                  : "Select currency..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[350px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search currency..." />
                <CommandList>
                  <CommandEmpty>No currency found.</CommandEmpty>
                  <CommandGroup>
                    {CURRENCIES.map((currency) => (
                      <CommandItem
                        key={currency.code}
                        value={`${currency.code} ${currency.name}`}
                        onSelect={() => {
                          handleValueChange(item.key, currency.code);
                          setCurrencyOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            currentValue === currency.code ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="font-mono mr-2">{currency.code}</span>
                        <span className="text-muted-foreground truncate">{currency.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      );
    }

    if (item.key === "date_format") {
      return (
        <div key={item.key} className="space-y-2">
          <Label htmlFor={item.key}>{label}</Label>
          <Select
            value={String(value).replace(/"/g, "")}
            onValueChange={(v) => handleValueChange(item.key, v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_FORMATS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    // Searchable timezone dropdown
    if (item.key === "timezone") {
      const currentValue = String(value).replace(/"/g, "");
      const selectedTimezone = TIMEZONES.find(tz => tz.value === currentValue);
      
      return (
        <div key={item.key} className="space-y-2">
          <Label htmlFor={item.key}>{label}</Label>
          <Popover open={timezoneOpen} onOpenChange={setTimezoneOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={timezoneOpen}
                className="w-full justify-between font-normal"
              >
                {selectedTimezone 
                  ? `${selectedTimezone.label} (${selectedTimezone.offset})`
                  : "Select timezone..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[350px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search timezone..." />
                <CommandList>
                  <CommandEmpty>No timezone found.</CommandEmpty>
                  {TIMEZONE_REGIONS.map((region) => (
                    <CommandGroup key={region} heading={region}>
                      {TIMEZONES.filter(tz => tz.region === region).map((tz) => (
                        <CommandItem
                          key={tz.value}
                          value={`${tz.label} ${tz.value} ${tz.region}`}
                          onSelect={() => {
                            handleValueChange(item.key, tz.value);
                            setTimezoneOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              currentValue === tz.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span>{tz.label}</span>
                          <span className="ml-auto text-xs text-muted-foreground">{tz.offset}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      );
    }

    if (item.key === "default_user_role") {
      return (
        <div key={item.key} className="space-y-2">
          <Label htmlFor={item.key}>{label}</Label>
          <Select
            value={String(value).replace(/"/g, "")}
            onValueChange={(v) => handleValueChange(item.key, v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Constants.public.Enums.app_role.map((role) => (
                <SelectItem key={role} value={role}>
                  {role.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (item.key === "default_uom") {
      return (
        <div key={item.key} className="space-y-2">
          <Label htmlFor={item.key}>{label}</Label>
          <Select
            value={String(value).replace(/"/g, "")}
            onValueChange={(v) => handleValueChange(item.key, v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UOM_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    // Handle number inputs
    if (typeof item.value === "number" || !isNaN(Number(value))) {
      return (
        <div key={item.key} className="space-y-2">
          <Label htmlFor={item.key}>{label}</Label>
          <Input
            id={item.key}
            type="number"
            value={String(value)}
            onChange={(e) => handleValueChange(item.key, Number(e.target.value))}
          />
          {item.description && (
            <p className="text-xs text-muted-foreground">{item.description}</p>
          )}
        </div>
      );
    }

    // Default text input
    return (
      <div key={item.key} className="space-y-2">
        <Label htmlFor={item.key}>{label}</Label>
        <Input
          id={item.key}
          value={String(value).replace(/"/g, "")}
          onChange={(e) => handleValueChange(item.key, e.target.value)}
        />
        {item.description && (
          <p className="text-xs text-muted-foreground">{item.description}</p>
        )}
      </div>
    );
  };

  const categories = [
    { id: "organization", label: "Organization", icon: Building2 },
    { id: "users", label: "Users & Security", icon: Users },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "procurement", label: "Procurement", icon: ShoppingCart },
    { id: "finance", label: "Finance", icon: DollarSign },
    { id: "history", label: "History", icon: History },
  ];

  return (
    <MainLayout>
      <PageHeader
        title="System Configuration"
        subtitle="Manage application settings and defaults"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Configuration Settings</CardTitle>
              <CardDescription>
                Configure system-wide settings for all modules
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!isDirty}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={handleSave}
                disabled={!isDirty || bulkUpdate.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {bulkUpdate.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 flex-wrap h-auto gap-1">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {cat.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            ) : (
            <>
                {categories.filter(cat => cat.id !== "history").map((cat) => (
                  <TabsContent key={cat.id} value={cat.id}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {configByCategory?.[cat.id as keyof typeof configByCategory]?.map(
                        (item) => renderConfigField(item)
                      )}
                    </div>
                    {(!configByCategory?.[cat.id as keyof typeof configByCategory] ||
                      configByCategory[cat.id as keyof typeof configByCategory]?.length === 0) && (
                      <div className="text-center py-8 text-muted-foreground">
                        No configuration items in this category
                      </div>
                    )}
                  </TabsContent>
                ))}
                <TabsContent value="history">
                  <ConfigChangeHistory />
                </TabsContent>
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
