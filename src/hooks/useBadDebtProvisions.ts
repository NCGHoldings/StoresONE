import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BadDebtProvision {
  id: string;
  provision_number: string;
  customer_id: string;
  invoice_id: string | null;
  provision_date: string;
  amount: number;
  provision_type: string | null;
  reason: string | null;
  notes: string | null;
  status: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_by: string | null;
  created_at: string;
  customers?: {
    company_name: string;
    customer_code: string;
  };
  customer_invoices?: {
    invoice_number: string;
    total_amount: number;
  };
}

export interface BadDebtFormData {
  customer_id: string;
  invoice_id?: string | null;
  provision_date: string;
  amount: number;
  provision_type: string;
  reason?: string;
  notes?: string;
}

export function useBadDebtProvisions(status?: string) {
  return useQuery({
    queryKey: ["bad-debt-provisions", status],
    queryFn: async () => {
      let query = supabase
        .from("bad_debt_provisions")
        .select(`
          *,
          customers(company_name, customer_code),
          customer_invoices(invoice_number, total_amount)
        `)
        .order("created_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BadDebtProvision[];
    },
  });
}

export function useBadDebtProvision(id: string | null) {
  return useQuery({
    queryKey: ["bad-debt-provisions", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("bad_debt_provisions")
        .select(`
          *,
          customers(company_name, customer_code),
          customer_invoices(invoice_number, total_amount)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as BadDebtProvision;
    },
    enabled: !!id,
  });
}

export function useBadDebtStats() {
  return useQuery({
    queryKey: ["bad-debt-provisions", "stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bad_debt_provisions")
        .select("id, amount, provision_type, status, created_at");

      if (error) throw error;

      const yearStart = new Date();
      yearStart.setMonth(0, 1);
      yearStart.setHours(0, 0, 0, 0);

      const stats = {
        totalProvisioned: data
          .filter(p => p.provision_type === "provision")
          .reduce((sum, p) => sum + p.amount, 0),
        writtenOffYTD: data
          .filter(p => p.provision_type === "write_off" && new Date(p.created_at) >= yearStart)
          .reduce((sum, p) => sum + p.amount, 0),
        pendingApproval: data.filter(p => p.status === "pending").length,
        recovered: data
          .filter(p => p.provision_type === "recovery")
          .reduce((sum, p) => sum + p.amount, 0),
      };

      return stats;
    },
  });
}

async function generateProvisionNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const { data } = await supabase
    .from("bad_debt_provisions")
    .select("provision_number")
    .like("provision_number", `BDP-${year}-%`)
    .order("created_at", { ascending: false })
    .limit(1);

  let nextNumber = 1;
  if (data?.[0]?.provision_number) {
    const match = data[0].provision_number.match(/BDP-\d+-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `BDP-${year}-${nextNumber.toString().padStart(4, "0")}`;
}

export function useCreateBadDebtProvision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: BadDebtFormData) => {
      const provisionNumber = await generateProvisionNumber();
      const { data: user } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("bad_debt_provisions")
        .insert({
          provision_number: provisionNumber,
          customer_id: formData.customer_id,
          invoice_id: formData.invoice_id || null,
          provision_date: formData.provision_date,
          amount: formData.amount,
          provision_type: formData.provision_type,
          reason: formData.reason,
          notes: formData.notes,
          status: "pending",
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bad-debt-provisions"] });
      toast.success("Bad debt provision created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create provision: " + error.message);
    },
  });
}

export function useApproveBadDebtProvision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: user } = await supabase.auth.getUser();

      // Get provision details
      const { data: provision } = await supabase
        .from("bad_debt_provisions")
        .select("invoice_id, provision_type")
        .eq("id", id)
        .single();

      // Update provision status
      const { data, error } = await supabase
        .from("bad_debt_provisions")
        .update({
          status: "approved",
          approved_by: user.user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // If write-off, update invoice status
      if (provision?.provision_type === "write_off" && provision.invoice_id) {
        await supabase
          .from("customer_invoices")
          .update({ status: "written_off" })
          .eq("id", provision.invoice_id);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bad-debt-provisions"] });
      queryClient.invalidateQueries({ queryKey: ["customer-invoices"] });
      toast.success("Provision approved");
    },
    onError: (error) => {
      toast.error("Failed to approve provision: " + error.message);
    },
  });
}

export function useReverseBadDebtProvision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("bad_debt_provisions")
        .update({ status: "reversed" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bad-debt-provisions"] });
      toast.success("Provision reversed");
    },
    onError: (error) => {
      toast.error("Failed to reverse provision: " + error.message);
    },
  });
}
