import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApprovalRequest {
  id: string;
  entity_type: string;
  entity_id: string;
  entity_number: string | null;
  status: string;
  current_step_id: string;
  current_step_order: number;
  submitted_at: string;
  submitted_by: string | null;
  workflow_id: string;
  escalation_count: number;
}

interface ApprovalStep {
  id: string;
  step_name: string;
  timeout_hours: number | null;
  escalation_action: string | null;
  step_order: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[approval-escalation] Starting escalation check...");

    // Get all pending approval requests with their current step info
    const { data: pendingRequests, error: reqError } = await supabase
      .from("approval_requests")
      .select(`
        id,
        entity_type,
        entity_id,
        entity_number,
        status,
        current_step_id,
        current_step_order,
        submitted_at,
        submitted_by,
        workflow_id,
        escalation_count
      `)
      .eq("status", "pending");

    if (reqError) {
      console.error("[approval-escalation] Error fetching requests:", reqError);
      throw reqError;
    }

    console.log(`[approval-escalation] Found ${pendingRequests?.length || 0} pending requests`);

    const escalatedRequests: string[] = [];
    const now = new Date();

    for (const request of (pendingRequests || []) as ApprovalRequest[]) {
      // Get current step details
      const { data: currentStep, error: stepError } = await supabase
        .from("approval_steps")
        .select("id, step_name, timeout_hours, escalation_action, step_order")
        .eq("id", request.current_step_id)
        .single();

      if (stepError || !currentStep) {
        console.log(`[approval-escalation] Could not find step for request ${request.id}`);
        continue;
      }

      const step = currentStep as ApprovalStep;

      // Check if step has timeout configured
      if (!step.timeout_hours || step.timeout_hours <= 0) {
        continue;
      }

      // Calculate if request is overdue
      const submittedAt = new Date(request.submitted_at);
      const timeoutMs = step.timeout_hours * 60 * 60 * 1000;
      const deadlineTime = submittedAt.getTime() + timeoutMs;

      if (now.getTime() <= deadlineTime) {
        continue; // Not overdue yet
      }

      console.log(`[approval-escalation] Request ${request.id} is overdue. Action: ${step.escalation_action}`);

      const escalationAction = step.escalation_action || "notify";
      const entityLabel = getEntityLabel(request.entity_type);

      switch (escalationAction) {
        case "auto_approve": {
          // Auto-approve the current step
          console.log(`[approval-escalation] Auto-approving request ${request.id}`);

          // Log the auto-approval action
          await supabase.from("approval_actions").insert({
            request_id: request.id,
            step_id: step.id,
            user_id: null,
            action: "approve",
            comment: `Auto-approved due to timeout (${step.timeout_hours}h SLA exceeded)`,
          });

          // Get all workflow steps to find next step
          const { data: allSteps } = await supabase
            .from("approval_steps")
            .select("id, step_order")
            .eq("workflow_id", request.workflow_id)
            .order("step_order", { ascending: true });

          const sortedSteps = (allSteps || []) as { id: string; step_order: number }[];
          const currentIndex = sortedSteps.findIndex((s) => s.id === step.id);
          const nextStep = sortedSteps[currentIndex + 1];

          if (nextStep) {
            // Move to next step
            await supabase
              .from("approval_requests")
              .update({
                current_step_id: nextStep.id,
                current_step_order: nextStep.step_order,
                escalated_at: now.toISOString(),
                escalation_count: (request.escalation_count || 0) + 1,
              })
              .eq("id", request.id);

            // Notify next step approvers via trigger (handled by DB)
          } else {
            // Final step - complete the approval
            await supabase
              .from("approval_requests")
              .update({
                status: "approved",
                completed_at: now.toISOString(),
                escalated_at: now.toISOString(),
                escalation_count: (request.escalation_count || 0) + 1,
              })
              .eq("id", request.id);

            // Sync document status
            await syncDocumentStatus(supabase, request.entity_type, request.entity_id, "approved");
          }

          escalatedRequests.push(request.id);
          break;
        }

        case "auto_reject": {
          console.log(`[approval-escalation] Auto-rejecting request ${request.id}`);

          // Log the auto-rejection action
          await supabase.from("approval_actions").insert({
            request_id: request.id,
            step_id: step.id,
            user_id: null,
            action: "reject",
            comment: `Auto-rejected due to timeout (${step.timeout_hours}h SLA exceeded)`,
          });

          // Reject the request
          await supabase
            .from("approval_requests")
            .update({
              status: "rejected",
              completed_at: now.toISOString(),
              escalated_at: now.toISOString(),
              escalation_count: (request.escalation_count || 0) + 1,
            })
            .eq("id", request.id);

          // Sync document status
          await syncDocumentStatus(supabase, request.entity_type, request.entity_id, "rejected");

          escalatedRequests.push(request.id);
          break;
        }

        case "notify":
        default: {
          // Send escalation notification
          console.log(`[approval-escalation] Sending escalation notification for request ${request.id}`);

          // Log escalation action
          await supabase.from("approval_actions").insert({
            request_id: request.id,
            step_id: step.id,
            user_id: null,
            action: "escalate",
            comment: `Escalated due to timeout (${step.timeout_hours}h SLA exceeded)`,
          });

          // Update escalation count
          await supabase
            .from("approval_requests")
            .update({
              escalated_at: now.toISOString(),
              escalation_count: (request.escalation_count || 0) + 1,
            })
            .eq("id", request.id);

          // Notify the submitter about escalation
          if (request.submitted_by) {
            await supabase.from("notifications").insert({
              user_id: request.submitted_by,
              type: "escalation",
              title: "Approval Delayed",
              message: `${entityLabel} ${request.entity_number || "N/A"} has been pending for over ${step.timeout_hours} hours`,
              entity_type: request.entity_type,
              entity_id: request.entity_id,
              request_id: request.id,
            });
          }

          // Get step approvers and notify them about escalation
          const { data: approvers } = await supabase
            .from("step_approvers")
            .select("approver_type, approver_value")
            .eq("step_id", step.id);

          for (const approver of approvers || []) {
            if (approver.approver_type === "user" && approver.approver_value) {
              await supabase.from("notifications").insert({
                user_id: approver.approver_value,
                type: "escalation",
                title: "Overdue Approval Reminder",
                message: `${entityLabel} ${request.entity_number || "N/A"} requires your urgent attention (SLA exceeded)`,
                entity_type: request.entity_type,
                entity_id: request.entity_id,
                request_id: request.id,
              });
            } else if (approver.approver_type === "role" && approver.approver_value) {
              // Get all users with this role
              const { data: roleUsers } = await supabase
                .from("user_roles")
                .select("user_id")
                .eq("role", approver.approver_value);

              for (const roleUser of roleUsers || []) {
                await supabase.from("notifications").insert({
                  user_id: roleUser.user_id,
                  type: "escalation",
                  title: "Overdue Approval Reminder",
                  message: `${entityLabel} ${request.entity_number || "N/A"} requires your urgent attention (SLA exceeded)`,
                  entity_type: request.entity_type,
                  entity_id: request.entity_id,
                  request_id: request.id,
                });
              }
            }
          }

          escalatedRequests.push(request.id);
          break;
        }
      }
    }

    console.log(`[approval-escalation] Processed ${escalatedRequests.length} escalations`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: escalatedRequests.length,
        escalated_requests: escalatedRequests,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[approval-escalation] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

function getEntityLabel(entityType: string): string {
  const labels: Record<string, string> = {
    purchase_requisition: "Purchase Requisition",
    purchase_order: "Purchase Order",
    supplier_registration: "Supplier Registration",
    goods_receipt: "Goods Receipt",
  };
  return labels[entityType] || entityType;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncDocumentStatus(
  supabase: any,
  entityType: string,
  entityId: string,
  status: "approved" | "rejected"
) {
  const now = new Date().toISOString();
  const dateOnly = now.split("T")[0];

  try {
    switch (entityType) {
      case "purchase_requisition":
        await supabase
          .from("purchase_requisitions")
          .update({
            status: status === "approved" ? "approved" : "rejected",
            approved_date: status === "approved" ? dateOnly : null,
          } as Record<string, unknown>)
          .eq("id", entityId);
        break;

      case "purchase_order":
        await supabase
          .from("purchase_orders")
          .update({
            status: status === "approved" ? "approved" : "rejected",
            approved_date: status === "approved" ? now : null,
          } as Record<string, unknown>)
          .eq("id", entityId);
        break;

      case "supplier_registration":
        await supabase
          .from("suppliers")
          .update({
            status: status === "approved" ? "active" : "inactive",
          } as Record<string, unknown>)
          .eq("id", entityId);
        break;

      case "goods_receipt":
        await supabase
          .from("inbound_deliveries")
          .update({
            status: status === "approved" ? "completed" : "cancelled",
          } as Record<string, unknown>)
          .eq("id", entityId);
        break;
    }
  } catch (err) {
    console.error(`[approval-escalation] Failed to sync status for ${entityType}:${entityId}`, err);
  }
}
