import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateZone } from "@/hooks/useStorageZones";

interface ZoneFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ZONE_TYPES = [
  "General Storage",
  "Cold Storage",
  "Bulk Storage",
  "Hazmat Storage",
  "Picking Area",
  "Receiving Area",
  "Shipping Area",
];

export function ZoneFormDialog({ open, onOpenChange }: ZoneFormDialogProps) {
  const [zoneCode, setZoneCode] = useState("");
  const [name, setName] = useState("");
  const [zoneType, setZoneType] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("");
  const [temperatureControlled, setTemperatureControlled] = useState(false);
  const [minTemp, setMinTemp] = useState("");
  const [maxTemp, setMaxTemp] = useState("");

  const createZone = useCreateZone();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createZone.mutateAsync({
      zone_code: zoneCode,
      name,
      zone_type: zoneType || null,
      max_capacity: maxCapacity ? parseInt(maxCapacity) : null,
      temperature_controlled: temperatureControlled,
      min_temperature: temperatureControlled && minTemp ? parseFloat(minTemp) : null,
      max_temperature: temperatureControlled && maxTemp ? parseFloat(maxTemp) : null,
    });

    // Reset form
    setZoneCode("");
    setName("");
    setZoneType("");
    setMaxCapacity("");
    setTemperatureControlled(false);
    setMinTemp("");
    setMaxTemp("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Storage Zone</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zoneCode">Zone Code *</Label>
              <Input
                id="zoneCode"
                value={zoneCode}
                onChange={(e) => setZoneCode(e.target.value.toUpperCase())}
                placeholder="e.g., ZONE-F"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Zone Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Overflow Area"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="zoneType">Zone Type</Label>
            <Select value={zoneType} onValueChange={setZoneType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {ZONE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Max Capacity (units)</Label>
            <Input
              id="capacity"
              type="number"
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(e.target.value)}
              min="0"
              placeholder="e.g., 5000"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <Label htmlFor="tempControlled">Temperature Controlled</Label>
            <Switch
              id="tempControlled"
              checked={temperatureControlled}
              onCheckedChange={setTemperatureControlled}
            />
          </div>

          {temperatureControlled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minTemp">Min Temp (°C)</Label>
                <Input
                  id="minTemp"
                  type="number"
                  value={minTemp}
                  onChange={(e) => setMinTemp(e.target.value)}
                  placeholder="e.g., 2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxTemp">Max Temp (°C)</Label>
                <Input
                  id="maxTemp"
                  type="number"
                  value={maxTemp}
                  onChange={(e) => setMaxTemp(e.target.value)}
                  placeholder="e.g., 8"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createZone.isPending}>
              {createZone.isPending ? "Creating..." : "Create Zone"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
