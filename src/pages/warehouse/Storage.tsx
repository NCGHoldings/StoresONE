import { useState } from "react";
import { Plus, Warehouse, Thermometer, Package, Info } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useStorageZones, useStorageBins, useBinInventory, StorageBin, StorageZone } from "@/hooks/useStorageZones";
import { ZoneFormDialog } from "@/components/warehouse/ZoneFormDialog";
import { BinFormDialog } from "@/components/warehouse/BinFormDialog";
import { ZoneDetailsPanel } from "@/components/warehouse/ZoneDetailsPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function getBinStatusColor(status: StorageBin["status"]) {
  switch (status) {
    case "available":
      return "bg-green-500";
    case "occupied":
      return "bg-blue-500";
    case "reserved":
      return "bg-yellow-500";
    case "blocked":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
}

function getBinStatusBadge(status: StorageBin["status"]) {
  switch (status) {
    case "available":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Available</Badge>;
    case "occupied":
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Occupied</Badge>;
    case "reserved":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Reserved</Badge>;
    case "blocked":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Blocked</Badge>;
  }
}

export default function Storage() {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedBin, setSelectedBin] = useState<StorageBin | null>(null);
  const [isZoneDialogOpen, setIsZoneDialogOpen] = useState(false);
  const [isBinDialogOpen, setIsBinDialogOpen] = useState(false);
  const [isBinDetailsOpen, setIsBinDetailsOpen] = useState(false);
  const [isZoneDetailsOpen, setIsZoneDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("zones");

  const { data: zones, isLoading: zonesLoading } = useStorageZones();
  const { data: bins, isLoading: binsLoading } = useStorageBins(selectedZoneId || undefined);
  const { data: binInventory } = useBinInventory(selectedBin?.id || "");

  const selectedZone = zones?.find((z) => z.id === selectedZoneId) || null;

  const handleZoneClick = (zone: StorageZone) => {
    setSelectedZoneId(zone.id);
    setIsZoneDetailsOpen(true);
  };

  const handleViewAllBins = () => {
    setIsZoneDetailsOpen(false);
    setActiveTab("bins");
  };

  const handleBinClick = (bin: StorageBin) => {
    setSelectedBin(bin);
    setIsBinDetailsOpen(true);
  };

  const getUtilizationPercentage = (current: number | null, max: number | null) => {
    if (!max || max === 0) return 0;
    return Math.min(100, Math.round(((current || 0) / max) * 100));
  };

  const getBinCapacityPercentage = (bin: StorageBin) => {
    if (!bin.capacity || bin.capacity === 0) return 0;
    return Math.min(100, Math.round(((bin.current_quantity || 0) / bin.capacity) * 100));
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Storage Management"
          subtitle="Manage warehouse zones and storage bin locations"
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="zones">Zones Overview</TabsTrigger>
              <TabsTrigger value="bins">Bin Grid</TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsZoneDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Zone
              </Button>
              <Button onClick={() => setIsBinDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Bin
              </Button>
            </div>
          </div>

          {/* Zones Overview Tab */}
          <TabsContent value="zones" className="space-y-4">
            {zonesLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-2 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : zones?.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Warehouse className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Storage Zones</h3>
                  <p className="text-muted-foreground mb-4">Create your first storage zone to get started</p>
                  <Button onClick={() => setIsZoneDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Zone
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {zones?.map((zone) => {
                  const utilization = getUtilizationPercentage(zone.current_utilization, zone.max_capacity);
                  return (
                    <Card
                      key={zone.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        selectedZoneId === zone.id && "ring-2 ring-primary"
                      )}
                      onClick={() => handleZoneClick(zone)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{zone.name}</CardTitle>
                            <CardDescription>{zone.zone_code}</CardDescription>
                          </div>
                          {zone.temperature_controlled && (
                            <div className="flex items-center text-blue-600">
                              <Thermometer className="h-4 w-4 mr-1" />
                              <span className="text-xs">
                                {zone.min_temperature}°C - {zone.max_temperature}°C
                              </span>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Utilization</span>
                            <span className="font-medium">{utilization}%</span>
                          </div>
                          <Progress value={utilization} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{zone.current_utilization || 0} used</span>
                            <span>{zone.max_capacity || 0} capacity</span>
                          </div>
                          {zone.zone_type && (
                            <Badge variant="secondary" className="mt-2">
                              {zone.zone_type}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Bin Grid Tab */}
          <TabsContent value="bins" className="space-y-4">
            {/* Zone Selector */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Select Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedZoneId === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedZoneId(null)}
                  >
                    All Zones
                  </Button>
                  {zones?.map((zone) => (
                    <Button
                      key={zone.id}
                      variant={selectedZoneId === zone.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedZoneId(zone.id)}
                    >
                      {zone.zone_code}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Bin Status Legend */}
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span>Occupied</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-yellow-500" />
                <span>Reserved</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span>Blocked</span>
              </div>
            </div>

            {/* Bin Grid */}
            <Card>
              <CardContent className="p-6">
                {binsLoading ? (
                  <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-square rounded" />
                    ))}
                  </div>
                ) : bins?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Storage Bins</h3>
                    <p className="text-muted-foreground mb-4">
                      {selectedZoneId ? "No bins in this zone" : "Create storage bins to manage inventory locations"}
                    </p>
                    <Button onClick={() => setIsBinDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" /> Add Bin
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                    {bins?.map((bin) => {
                      const capacityPct = getBinCapacityPercentage(bin);
                      return (
                        <div
                          key={bin.id}
                          className={cn(
                            "aspect-square rounded cursor-pointer transition-all hover:scale-105 hover:shadow-lg relative group",
                            getBinStatusColor(bin.status)
                          )}
                          onClick={() => handleBinClick(bin)}
                          title={`${bin.bin_code} - ${bin.status}`}
                        >
                          {/* Capacity indicator overlay */}
                          <div
                            className="absolute bottom-0 left-0 right-0 bg-black/30 transition-all"
                            style={{ height: `${100 - capacityPct}%` }}
                          />
                          {/* Bin code tooltip on hover */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-[10px] font-bold drop-shadow-md">
                              {bin.bin_code.split("-").pop()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <ZoneFormDialog open={isZoneDialogOpen} onOpenChange={setIsZoneDialogOpen} />
      <BinFormDialog
        open={isBinDialogOpen}
        onOpenChange={setIsBinDialogOpen}
        defaultZoneId={selectedZoneId || undefined}
      />
      <ZoneDetailsPanel
        open={isZoneDetailsOpen}
        onOpenChange={setIsZoneDetailsOpen}
        zone={selectedZone}
        onEditZone={() => {
          setIsZoneDetailsOpen(false);
          setIsZoneDialogOpen(true);
        }}
        onViewAllBins={handleViewAllBins}
      />

      {/* Bin Details Sheet */}
      <Sheet open={isBinDetailsOpen} onOpenChange={setIsBinDetailsOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Bin {selectedBin?.bin_code}
            </SheetTitle>
            <SheetDescription>
              {selectedBin?.storage_zones?.name || "Unassigned Zone"}
            </SheetDescription>
          </SheetHeader>

          {selectedBin && (
            <div className="mt-6 space-y-6">
              {/* Bin Info */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getBinStatusBadge(selectedBin.status)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <span className="text-sm font-medium">{selectedBin.bin_type || "Standard"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Location</span>
                  <span className="text-sm font-mono">
                    Row {selectedBin.row_number}, Col {selectedBin.column_number}, Lvl {selectedBin.level_number}
                  </span>
                </div>
              </div>

              {/* Capacity */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Capacity Usage</span>
                  <span className="font-medium">
                    {selectedBin.current_quantity || 0} / {selectedBin.capacity || 100}
                  </span>
                </div>
                <Progress value={getBinCapacityPercentage(selectedBin)} className="h-2" />
              </div>

              {/* Inventory in Bin */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Items in Bin
                </h4>
                {binInventory?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No items stored in this bin</p>
                ) : (
                  <div className="space-y-2">
                    {binInventory?.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center p-2 bg-muted rounded"
                      >
                        <div>
                          <p className="text-sm font-medium">{item.products?.name}</p>
                          <p className="text-xs text-muted-foreground">{item.products?.sku}</p>
                        </div>
                        <Badge variant="outline">{item.quantity} units</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </MainLayout>
  );
}
