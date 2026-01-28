import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-pos-api-key",
};

// Rate limiting
const rateLimitMap = new Map<string, number[]>();
const MAX_REQUESTS_PER_MINUTE = 30;

function checkRateLimit(terminalId: string): boolean {
  const now = Date.now();
  const windowStart = now - 60000;
  const requests = rateLimitMap.get(terminalId) || [];
  const recentRequests = requests.filter(t => t > windowStart);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitMap.set(terminalId, recentRequests);
  return true;
}

interface POSDebitNotePayload {
  pos_terminal_id: string;
  transaction_id: string;
  supplier_code: string;
  invoice_number?: string;
  grn_number?: string;
  amount: number;
  reason: string;
  apply_immediately?: boolean;
  notes?: string;
}

function generateDebitNoteNumber(date: Date): string {
  const year = date.getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `DN-${year}-${random}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Security: Validate API key if configured
    const posApiKey = Deno.env.get("POS_API_KEY");
    if (posApiKey) {
      const providedKey = req.headers.get("x-pos-api-key");
      if (!providedKey || providedKey !== posApiKey) {
        console.log("Unauthorized POS debit note access attempt");
        return new Response(
          JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Invalid or missing API key" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const payload: POSDebitNotePayload = await req.json();
    console.log("Received POS debit note payload:", JSON.stringify(payload, null, 2));

    // Rate limiting
    if (!checkRateLimit(payload.pos_terminal_id || "unknown")) {
      return new Response(
        JSON.stringify({ success: false, error: "RATE_LIMIT_EXCEEDED", message: "Too many requests" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate required fields
    if (!payload.pos_terminal_id || !payload.transaction_id || !payload.supplier_code || !payload.amount || !payload.reason) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "INVALID_PAYLOAD", 
          details: "Missing required fields: pos_terminal_id, transaction_id, supplier_code, amount, reason" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate amount
    if (payload.amount <= 0 || payload.amount > 999999999) {
      return new Response(
        JSON.stringify({ success: false, error: "INVALID_PAYLOAD", details: "Invalid amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check idempotency - look for existing debit note with same transaction_id
    const { data: existingNote } = await supabase
      .from("debit_notes")
      .select("id, debit_note_number, amount, status")
      .eq("notes", `POS Debit Note - TXN: ${payload.transaction_id}`)
      .single();

    if (existingNote) {
      console.log("Duplicate debit note transaction:", payload.transaction_id);
      return new Response(
        JSON.stringify({
          success: true,
          debit_note_number: existingNote.debit_note_number,
          debit_note_id: existingNote.id,
          amount: existingNote.amount,
          status: existingNote.status,
          message: "Debit note already processed",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate supplier
    const { data: supplier, error: supplierError } = await supabase
      .from("suppliers")
      .select("id, company_name")
      .eq("supplier_code", payload.supplier_code)
      .eq("status", "active")
      .single();

    if (supplierError || !supplier) {
      return new Response(
        JSON.stringify({ success: false, error: "SUPPLIER_NOT_FOUND", details: `Supplier not found: ${payload.supplier_code}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate invoice if provided
    let invoiceId: string | null = null;
    let invoiceBalance: number = 0;
    
    if (payload.invoice_number) {
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .select("id, amount, amount_paid, supplier_id, status")
        .eq("invoice_number", payload.invoice_number)
        .single();

      if (invoiceError || !invoice) {
        return new Response(
          JSON.stringify({ success: false, error: "INVOICE_NOT_FOUND", details: `Invoice not found: ${payload.invoice_number}` }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (invoice.supplier_id !== supplier.id) {
        return new Response(
          JSON.stringify({ success: false, error: "SUPPLIER_MISMATCH", details: "Invoice does not belong to this supplier" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      invoiceId = invoice.id;
      invoiceBalance = invoice.amount - (invoice.amount_paid || 0);
    }

    // Find GRN if provided
    let grnId: string | null = null;
    if (payload.grn_number) {
      const { data: grn } = await supabase
        .from("inbound_deliveries")
        .select("id")
        .eq("delivery_number", payload.grn_number)
        .single();
      
      grnId = grn?.id || null;
    }

    // Generate debit note number
    const debitNoteNumber = generateDebitNoteNumber(new Date());

    // Create debit note - debit notes default to pending (need approval)
    const applyImmediately = payload.apply_immediately === true; // Default to false for debit notes
    const initialStatus = applyImmediately && invoiceId ? "applied" : "pending";
    const amountToApply = invoiceId ? Math.min(payload.amount, invoiceBalance) : 0;

    const { data: debitNote, error: dnError } = await supabase
      .from("debit_notes")
      .insert({
        debit_note_number: debitNoteNumber,
        supplier_id: supplier.id,
        invoice_id: invoiceId,
        grn_id: grnId,
        debit_date: new Date().toISOString().split("T")[0],
        amount: payload.amount,
        amount_applied: applyImmediately && invoiceId ? amountToApply : 0,
        reason: payload.reason,
        notes: `POS Debit Note - TXN: ${payload.transaction_id}${payload.notes ? ` | ${payload.notes}` : ""}`,
        status: initialStatus,
        applied_to_invoice_id: applyImmediately && invoiceId ? invoiceId : null,
      })
      .select("id, debit_note_number")
      .single();

    if (dnError || !debitNote) {
      console.error("Error creating debit note:", dnError);
      throw new Error("Failed to create debit note");
    }

    console.log("Created debit note:", debitNote.debit_note_number);

    let invoiceNewBalance: number | null = null;

    // Apply to invoice if requested and approved immediately
    if (applyImmediately && invoiceId && amountToApply > 0) {
      // Create application record
      await supabase.from("debit_note_applications").insert({
        debit_note_id: debitNote.id,
        invoice_id: invoiceId,
        amount: amountToApply,
      });

      // Update invoice
      const { data: updatedInvoice } = await supabase
        .from("invoices")
        .select("amount, amount_paid")
        .eq("id", invoiceId)
        .single();

      const currentPaid = updatedInvoice?.amount_paid || 0;
      const newAmountPaid = currentPaid + amountToApply;
      const newStatus = newAmountPaid >= (updatedInvoice?.amount || 0) ? "paid" : "partial";

      await supabase
        .from("invoices")
        .update({ amount_paid: newAmountPaid, status: newStatus })
        .eq("id", invoiceId);

      invoiceNewBalance = (updatedInvoice?.amount || 0) - newAmountPaid;

      // Post GL entries - Dr: Accounts Payable, Cr: Purchase Returns
      await supabase.from("general_ledger").insert([
        {
          entry_date: new Date().toISOString().split("T")[0],
          account_code: "2100",
          account_name: "Accounts Payable",
          debit: amountToApply,
          credit: null,
          description: `POS Debit Note ${debitNoteNumber}`,
          reference_type: "debit_note",
          reference_id: debitNote.id,
        },
        {
          entry_date: new Date().toISOString().split("T")[0],
          account_code: "5100",
          account_name: "Purchase Returns & Allowances",
          debit: null,
          credit: amountToApply,
          description: `POS Debit Note ${debitNoteNumber}`,
          reference_type: "debit_note",
          reference_id: debitNote.id,
        },
      ]);

      console.log("GL entries posted for debit note");
    }

    return new Response(
      JSON.stringify({
        success: true,
        debit_note_number: debitNote.debit_note_number,
        debit_note_id: debitNote.id,
        amount: payload.amount,
        amount_applied: applyImmediately && invoiceId ? amountToApply : 0,
        applied_to_invoice: payload.invoice_number || null,
        invoice_new_balance: invoiceNewBalance,
        status: initialStatus,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("POS Debit Note error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "INTERNAL_ERROR", message: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
