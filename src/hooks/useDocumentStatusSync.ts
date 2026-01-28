import { supabase } from "@/integrations/supabase/client";
import { logAudit, AuditActions } from "@/lib/auditLog";

/**
 * Synchronizes the source document status when an approval workflow completes
 */
export async function syncDocumentStatus({
  entityType,
  entityId,
  status,
  userId,
  comment,
}: {
  entityType: string;
  entityId: string;
  status: "approved" | "rejected";
  userId?: string;
  comment?: string;
}): Promise<void> {
  const now = new Date().toISOString();
  const dateOnly = now.split("T")[0];

  try {
    switch (entityType) {
      case "purchase_requisition":
        await supabase
          .from("purchase_requisitions")
          .update({
            status: status === "approved" ? "approved" : "rejected",
            approved_by: status === "approved" ? userId : null,
            approved_date: status === "approved" ? dateOnly : null,
            notes: status === "rejected" && comment ? comment : undefined,
          })
          .eq("id", entityId);
        break;

      case "purchase_order":
        await supabase
          .from("purchase_orders")
          .update({
            status: status === "approved" ? "approved" : "rejected",
            approved_by: status === "approved" ? userId : null,
            approved_date: status === "approved" ? now : null,
            notes: status === "rejected" && comment ? comment : undefined,
          })
          .eq("id", entityId);
        break;

      case "supplier_registration":
        await supabase
          .from("suppliers")
          .update({
            status: status === "approved" ? "active" : "inactive",
          })
          .eq("id", entityId);
        break;

      case "goods_receipt":
        // GRN status is typically handled differently - update inbound delivery
        await supabase
          .from("inbound_deliveries")
          .update({
            status: status === "approved" ? "completed" : "cancelled",
          })
          .eq("id", entityId);
        break;

      default:
        console.warn(`Unknown entity type for status sync: ${entityType}`);
    }

    await logAudit({
      action: status === "approved" ? AuditActions.APPROVAL : "REJECT",
      entityType,
      entityId,
      newValues: { status, synced_from_workflow: true },
    });
  } catch (error) {
    console.error(`Failed to sync document status for ${entityType}:${entityId}`, error);
    throw error;
  }
}

/**
 * Checks if a workflow exists for the given entity type
 */
export async function hasActiveWorkflow(entityType: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("approval_workflows")
    .select("id")
    .eq("entity_type", entityType)
    .eq("is_active", true)
    .limit(1);

  if (error) {
    console.error("Error checking workflow:", error);
    return false;
  }

  return data && data.length > 0;
}
