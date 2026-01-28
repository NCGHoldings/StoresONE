import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateBin, useStorageZones } from "@/hooks/useStorageZones";

interface BinFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultZoneId?: string;
}

const BIN_TYPES = [
  "Standard",
  "Pallet",
  "Bulk",
  "Small Parts",
  "Flow Rack",
  "Cantilever",
];

export function BinFormDialog({ open, onOpenChange, defaultZoneId }: BinFormDialogProps) {
  const [binCode, setBinCode] = useState("");
  const [zoneId, setZoneId] = useState(defaultZoneId || "");
  const [rowNumber, setRowNumber] = useState("");
  const [columnNumber, setColumnNumber] = useState("");
  const [levelNumber, setLevelNumber] = useState("");
  const [capacity, setCapacity] = useState("100");
  const [binType, setBinType] = useState("");

  const { data: zones } = useStorageZones();
  const createBin = useCreateBin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createBin.mutateAsync({
      bin_code: binCode,
      zone_id: zoneId || null,
      row_number: rowNumber || null,
      column_number: columnNumber || null,
      level_number: levelNumber || null,
      capacity: parseInt(capacity) || 100,
      bin_type: binType || null,
      status: "available",
    });

    // Reset form
    setBinCode("");
    setZoneId(defaultZoneId || "");
    setRowNumber("");
    setColumnNumber("");
    setLevelNumber("");
    setCapacity("100");
    setBinType("");
    onOpenChange(false);
  };

  // Auto-generate bin code based on zone, row, column, level
  const generateBinCode = () => {
    const zone = zones?.find((z) => z.id === zoneId);
    if (zone && rowNumber && columnNumber && levelNumber) {
      const code = `${zone.zone_code.charAt(0)}-${rowNumber.padStart(2, "0")}-${columnNumber.padStart(2, "0")}-${levelNumber}`;
      setBinCode(code);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Storage Bin</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="zone">Storage Zone</Label>
            <Select value={zoneId} onValueChange={setZoneId}>
              <SelectTrigger>
                <SelectValue placeholder="Select zone" />
              </SelectTrigger>
              <SelectContent>
                {zones?.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {zone.zone_code} - {zone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2">
              <Label htmlFor="row">Row</Label>
              <Input
                id="row"
                value={rowNumber}
                onChange={(e) => setRowNumber(e.target.value)}
                placeholder="01"
                onBlur={generateBinCode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="column">Column</Label>
              <Input
                id="column"
                value={columnNumber}
                onChange={(e) => setColumnNumber(e.target.value)}
                placeholder="01"
                onBlur={generateBinCode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Input
                id="level"
                value={levelNumber}
                onChange={(e) => setLevelNumber(e.target.value)}
                placeholder="1"
                onBlur={generateBinCode}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="binCode">Bin Code *</Label>
            <Input
              id="binCode"
              value={binCode}
              onChange={(e) => setBinCode(e.target.value.toUpperCase())}
              placeholder="e.g., A-01-01-1"
              required
            />
            <p className="text-xs text-muted-foreground">
              Auto-generated from zone + location, or enter manually
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="binType">Bin Type</Label>
              <Select value={binType} onValueChange={setBinType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {BIN_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                min="1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createBin.isPending}>
              {createBin.isPending ? "Creating..." : "Create Bin"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
