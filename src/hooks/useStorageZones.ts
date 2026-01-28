import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StorageZone {
  id: string;
  zone_code: string;
  name: string;
  zone_type: string | null;
  warehouse_id: string | null;
  max_capacity: number | null;
  current_utilization: number | null;
  temperature_controlled: boolean | null;
  min_temperature: number | null;
  max_temperature: number | null;
  is_active: boolean | null;
  created_at: string;
}

export interface StorageBin {
  id: string;
  bin_code: string;
  zone_id: string | null;
  row_number: string | null;
  column_number: string | null;
  level_number: string | null;
  capacity: number | null;
  current_quantity: number | null;
  status: "available" | "occupied" | "reserved" | "blocked";
  bin_type: string | null;
  is_active: boolean | null;
  created_at: string;
  storage_zones?: {
    zone_code: string;
    name: string;
  } | null;
}

export interface ZoneInsert {
  zone_code: string;
  name: string;
  zone_type?: string | null;
  warehouse_id?: string | null;
  max_capacity?: number | null;
  temperature_controlled?: boolean;
  min_temperature?: number | null;
  max_temperature?: number | null;
}

export interface BinInsert {
  bin_code: string;
  zone_id?: string | null;
  row_number?: string | null;
  column_number?: string | null;
  level_number?: string | null;
  capacity?: number;
  bin_type?: string | null;
  status?: "available" | "occupied" | "reserved" | "blocked";
}

export function useStorageZones() {
  return useQuery({
    queryKey: ["storage-zones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("storage_zones")
        .select("*")
        .order("zone_code");

      if (error) throw error;
      return data as StorageZone[];
    },
  });
}

export function useStorageBins(zoneId?: string) {
  return useQuery({
    queryKey: ["storage-bins", zoneId],
    queryFn: async () => {
      let query = supabase
        .from("storage_bins")
        .select(`
          *,
          storage_zones(zone_code, name)
        `)
        .order("bin_code");

      if (zoneId) {
        query = query.eq("zone_id", zoneId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as StorageBin[];
    },
  });
}

export function useCreateZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (zone: ZoneInsert) => {
      const { data, error } = await supabase
        .from("storage_zones")
        .insert(zone)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage-zones"] });
      toast.success("Storage zone created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create zone: " + error.message);
    },
  });
}

export function useUpdateZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StorageZone> & { id: string }) => {
      const { data, error } = await supabase
        .from("storage_zones")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage-zones"] });
      toast.success("Storage zone updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update zone: " + error.message);
    },
  });
}

export function useCreateBin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bin: BinInsert) => {
      const { data, error } = await supabase
        .from("storage_bins")
        .insert(bin)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage-bins"] });
      toast.success("Storage bin created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create bin: " + error.message);
    },
  });
}

export function useUpdateBin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StorageBin> & { id: string }) => {
      const { data, error } = await supabase
        .from("storage_bins")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage-bins"] });
      toast.success("Storage bin updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update bin: " + error.message);
    },
  });
}

export function useBinInventory(binId: string) {
  return useQuery({
    queryKey: ["bin-inventory", binId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select(`
          *,
          products(sku, name, category, unit_of_measure)
        `)
        .eq("bin_id", binId);

      if (error) throw error;
      return data;
    },
    enabled: !!binId,
  });
}
