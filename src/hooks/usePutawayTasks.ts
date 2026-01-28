import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PutawayTask {
  id: string;
  task_number: string;
  grn_id: string | null;
  grn_line_id: string | null;
  product_id: string;
  quantity: number;
  source_location: string | null;
  suggested_bin_id: string | null;
  assigned_bin_id: string | null;
  batch_id: string | null;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "normal" | "high" | "urgent";
  assigned_to: string | null;
  started_at: string | null;
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  products?: { sku: string; name: string; unit_of_measure: string | null };
  suggested_bin?: { bin_code: string };
  assigned_bin?: { bin_code: string };
  inbound_deliveries?: { delivery_number: string };
  profiles?: { full_name: string | null };
}

export interface PutawayTaskInsert {
  task_number: string;
  grn_id?: string | null;
  grn_line_id?: string | null;
  product_id: string;
  quantity: number;
  source_location?: string | null;
  suggested_bin_id?: string | null;
  batch_id?: string | null;
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  priority?: "low" | "normal" | "high" | "urgent";
  assigned_to?: string | null;
  notes?: string | null;
}

export interface PutawayTaskUpdate {
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  priority?: "low" | "normal" | "high" | "urgent";
  assigned_bin_id?: string | null;
  assigned_to?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  completed_by?: string | null;
  notes?: string | null;
}

// Generate next task number
async function generateTaskNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PA-${year}-`;

  const { data } = await supabase
    .from("putaway_tasks")
    .select("task_number")
    .ilike("task_number", `${prefix}%`)
    .order("task_number", { ascending: false })
    .limit(1);

  let nextNumber = 1;
  if (data && data.length > 0) {
    const lastNumber = parseInt(data[0].task_number.replace(prefix, ""), 10);
    nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
}

// Fetch all putaway tasks
export function usePutawayTasks(status?: string) {
  return useQuery({
    queryKey: ["putaway-tasks", status],
    queryFn: async () => {
      let query = supabase
        .from("putaway_tasks")
        .select(`
          *,
          products (sku, name, unit_of_measure),
          suggested_bin:storage_bins!putaway_tasks_suggested_bin_id_fkey (bin_code),
          assigned_bin:storage_bins!putaway_tasks_assigned_bin_id_fkey (bin_code),
          inbound_deliveries (delivery_number),
          profiles!putaway_tasks_assigned_to_fkey (full_name)
        `)
        .order("created_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PutawayTask[];
    },
  });
}

// Fetch putaway tasks for a specific GRN
export function usePutawayTasksByGRN(grnId: string | undefined) {
  return useQuery({
    queryKey: ["putaway-tasks", "grn", grnId],
    queryFn: async () => {
      if (!grnId) return [];
      const { data, error } = await supabase
        .from("putaway_tasks")
        .select(`
          *,
          products (sku, name, unit_of_measure),
          suggested_bin:storage_bins!putaway_tasks_suggested_bin_id_fkey (bin_code),
          assigned_bin:storage_bins!putaway_tasks_assigned_bin_id_fkey (bin_code)
        `)
        .eq("grn_id", grnId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as PutawayTask[];
    },
    enabled: !!grnId,
  });
}

// Fetch pending putaway tasks count
export function usePutawayStats() {
  return useQuery({
    queryKey: ["putaway-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("putaway_tasks")
        .select("id, status, created_at, completed_at");

      if (error) throw error;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const stats = {
        pending: data.filter((t) => t.status === "pending").length,
        inProgress: data.filter((t) => t.status === "in_progress").length,
        completedToday: data.filter(
          (t) =>
            t.status === "completed" &&
            t.completed_at &&
            new Date(t.completed_at) >= today
        ).length,
        total: data.length,
      };

      return stats;
    },
  });
}

// Create putaway task
export function useCreatePutawayTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: Omit<PutawayTaskInsert, "task_number">) => {
      const taskNumber = await generateTaskNumber();
      const { data, error } = await supabase
        .from("putaway_tasks")
        .insert({ ...task, task_number: taskNumber })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["putaway-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["putaway-stats"] });
      toast.success("Putaway task created");
    },
    onError: (error) => {
      toast.error(`Failed to create putaway task: ${error.message}`);
    },
  });
}

// Create multiple putaway tasks from GRN
export function useCreatePutawayTasksFromGRN() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      grnId,
      lines,
    }: {
      grnId: string;
      lines: { grnLineId: string; productId: string; quantity: number; batchId?: string | null }[];
    }) => {
      const tasks = await Promise.all(
        lines.map(async (line) => {
          const taskNumber = await generateTaskNumber();
          return {
            task_number: taskNumber,
            grn_id: grnId,
            grn_line_id: line.grnLineId,
            product_id: line.productId,
            quantity: line.quantity,
            batch_id: line.batchId || null,
            status: "pending" as const,
            priority: "normal" as const,
            source_location: "Receiving Dock",
          };
        })
      );

      const { data, error } = await supabase
        .from("putaway_tasks")
        .insert(tasks)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["putaway-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["putaway-stats"] });
      toast.success("Putaway tasks created from GRN");
    },
    onError: (error) => {
      toast.error(`Failed to create putaway tasks: ${error.message}`);
    },
  });
}

// Update putaway task
export function useUpdatePutawayTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: PutawayTaskUpdate }) => {
      const { data, error } = await supabase
        .from("putaway_tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["putaway-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["putaway-stats"] });
      toast.success("Putaway task updated");
    },
    onError: (error) => {
      toast.error(`Failed to update putaway task: ${error.message}`);
    },
  });
}

// Start putaway task
export function useStartPutaway() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await supabase
        .from("putaway_tasks")
        .update({
          status: "in_progress",
          started_at: new Date().toISOString(),
        })
        .eq("id", taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["putaway-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["putaway-stats"] });
      toast.success("Putaway task started");
    },
    onError: (error) => {
      toast.error(`Failed to start putaway: ${error.message}`);
    },
  });
}

// Complete putaway task
export function useCompletePutaway() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      binId,
      notes,
    }: {
      taskId: string;
      binId: string;
      notes?: string;
    }) => {
      // Get task details
      const { data: task, error: taskError } = await supabase
        .from("putaway_tasks")
        .select("product_id, quantity, batch_id, grn_line_id")
        .eq("id", taskId)
        .single();

      if (taskError) throw taskError;

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Update the task
      const { data: updatedTask, error: updateError } = await supabase
        .from("putaway_tasks")
        .update({
          status: "completed",
          assigned_bin_id: binId,
          completed_at: new Date().toISOString(),
          completed_by: user?.id || null,
          notes: notes || null,
        })
        .eq("id", taskId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update or create inventory record
      const { data: existingInventory } = await supabase
        .from("inventory")
        .select("id, quantity")
        .eq("product_id", task.product_id)
        .eq("bin_id", binId)
        .maybeSingle();

      if (existingInventory) {
        // Update existing inventory
        await supabase
          .from("inventory")
          .update({
            quantity: (existingInventory.quantity || 0) + task.quantity,
            available_quantity: (existingInventory.quantity || 0) + task.quantity,
          })
          .eq("id", existingInventory.id);
      } else {
        // Create new inventory record
        await supabase.from("inventory").insert({
          product_id: task.product_id,
          bin_id: binId,
          quantity: task.quantity,
          available_quantity: task.quantity,
        });
      }

      // Update GRN line with bin assignment if exists
      if (task.grn_line_id) {
        await supabase
          .from("grn_lines")
          .update({ bin_id: binId })
          .eq("id", task.grn_line_id);
      }

      // Update storage bin status
      const { data: bin } = await supabase
        .from("storage_bins")
        .select("current_quantity")
        .eq("id", binId)
        .single();

      await supabase
        .from("storage_bins")
        .update({
          current_quantity: (bin?.current_quantity || 0) + task.quantity,
          status: "occupied",
        })
        .eq("id", binId);

      // Log inventory transaction
      await supabase.from("inventory_transactions").insert({
        product_id: task.product_id,
        bin_id: binId,
        batch_id: task.batch_id,
        transaction_type: "adjustment" as const,
        quantity: task.quantity,
        reference_type: "putaway_task",
        reference_id: taskId,
        created_by: user?.id || null,
        notes: `Putaway completed`,
      });

      return updatedTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["putaway-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["putaway-stats"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["storage-bins"] });
      queryClient.invalidateQueries({ queryKey: ["grn_lines"] });
      toast.success("Putaway completed successfully");
    },
    onError: (error) => {
      toast.error(`Failed to complete putaway: ${error.message}`);
    },
  });
}

// Cancel putaway task
export function useCancelPutaway() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, reason }: { taskId: string; reason?: string }) => {
      const { data, error } = await supabase
        .from("putaway_tasks")
        .update({
          status: "cancelled",
          notes: reason || null,
        })
        .eq("id", taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["putaway-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["putaway-stats"] });
      toast.success("Putaway task cancelled");
    },
    onError: (error) => {
      toast.error(`Failed to cancel putaway: ${error.message}`);
    },
  });
}

// Suggest a bin for putaway based on product and available space
export function useSuggestedBin(productId: string | undefined) {
  return useQuery({
    queryKey: ["suggested-bin", productId],
    queryFn: async () => {
      if (!productId) return null;

      // First, check if this product already exists in any bin
      const { data: existingInventory } = await supabase
        .from("inventory")
        .select("bin_id, storage_bins!inner(id, bin_code, capacity, current_quantity, status)")
        .eq("product_id", productId)
        .limit(1);

      if (existingInventory && existingInventory.length > 0) {
        const bin = existingInventory[0].storage_bins as any;
        if (bin && bin.status === "available" || bin.status === "occupied") {
          return { id: bin.id, bin_code: bin.bin_code, reason: "Same product already stored here" };
        }
      }

      // Find available bins with capacity
      const { data: availableBins, error } = await supabase
        .from("storage_bins")
        .select("id, bin_code, capacity, current_quantity")
        .in("status", ["available", "occupied"])
        .eq("is_active", true)
        .order("current_quantity", { ascending: true })
        .limit(5);

      if (error || !availableBins || availableBins.length === 0) return null;

      // Return the bin with most available space
      const bestBin = availableBins[0];
      return {
        id: bestBin.id,
        bin_code: bestBin.bin_code,
        reason: "Bin has available capacity",
      };
    },
    enabled: !!productId,
  });
}
