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

interface POSCreditNotePayload {
  pos_terminal_id: string;
  transaction_id: string;
  customer_code: string;
  invoice_number?: string;
  amount: number;
  reason: string;
  apply_immediately?: boolean;
  notes?: string;
}

function generateCreditNoteNumber(date: Date): string {
  const year = date.getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `CN-${year}-${random}`;
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
        console.log("Unauthorized POS credit note access attempt");
        return new Response(
          JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Invalid or missing API key" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const payload: POSCreditNotePayload = await req.json();
    console.log("Received POS credit note payload:", JSON.stringify(payload, null, 2));

    // Rate limiting
    if (!checkRateLimit(payload.pos_terminal_id || "unknown")) {
      return new Response(
        JSON.stringify({ success: false, error: "RATE_LIMIT_EXCEEDED", message: "Too many requests" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate required fields
    if (!payload.pos_terminal_id || !payload.transaction_id || !payload.customer_code || !payload.amount || !payload.reason) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "INVALID_PAYLOAD", 
          details: "Missing required fields: pos_terminal_id, transaction_id, customer_code, amount, reason" 
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

    // Check idempotency - look for existing credit note with same transaction_id
    const { data: existingNote } = await supabase
      .from("credit_notes")
      .select("id, credit_note_number, amount, status")
      .eq("notes", `POS Credit Note - TXN: ${payload.transaction_id}`)
      .single();

    if (existingNote) {
      console.log("Duplicate credit note transaction:", payload.transaction_id);
      return new Response(
        JSON.stringify({
          success: true,
          credit_note_number: existingNote.credit_note_number,
          credit_note_id: existingNote.id,
          amount: existingNote.amount,
          message: "Credit note already processed",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch system config for currency
    const { data: currencyConfig } = await supabase
      .from("system_config")
      .select("value")
      .eq("key", "default_currency")
      .single();
    const defaultCurrency = (currencyConfig?.value as string)?.replace(/"/g, "") || "USD";

    // Validate customer
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id, company_name")
      .eq("customer_code", payload.customer_code)
      .eq("status", "active")
      .single();

    if (customerError || !customer) {
      return new Response(
        JSON.stringify({ success: false, error: "CUSTOMER_NOT_FOUND", details: `Customer not found: ${payload.customer_code}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate invoice if provided
    let invoiceId: string | null = null;
    let invoiceBalance: number = 0;
    
    if (payload.invoice_number) {
      const { data: invoice, error: invoiceError } = await supabase
        .from("customer_invoices")
        .select("id, total_amount, amount_paid, customer_id, status")
        .eq("invoice_number", payload.invoice_number)
        .single();

      if (invoiceError || !invoice) {
        return new Response(
          JSON.stringify({ success: false, error: "INVOICE_NOT_FOUND", details: `Invoice not found: ${payload.invoice_number}` }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (invoice.customer_id !== customer.id) {
        return new Response(
          JSON.stringify({ success: false, error: "CUSTOMER_MISMATCH", details: "Invoice does not belong to this customer" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      invoiceId = invoice.id;
      invoiceBalance = invoice.total_amount - (invoice.amount_paid || 0);
    }

    // Generate credit note number
    const creditNoteNumber = generateCreditNoteNumber(new Date());

    // Create credit note
    const applyImmediately = payload.apply_immediately !== false; // Default to true
    const initialStatus = applyImmediately && invoiceId ? "applied" : "pending";
    const amountToApply = invoiceId ? Math.min(payload.amount, invoiceBalance) : 0;

    const { data: creditNote, error: cnError } = await supabase
      .from("credit_notes")
      .insert({
        credit_note_number: creditNoteNumber,
        customer_id: customer.id,
        invoice_id: invoiceId,
        credit_date: new Date().toISOString().split("T")[0],
        amount: payload.amount,
        amount_applied: applyImmediately && invoiceId ? amountToApply : 0,
        reason: payload.reason,
        notes: `POS Credit Note - TXN: ${payload.transaction_id}${payload.notes ? ` | ${payload.notes}` : ""}`,
        status: initialStatus,
        currency: defaultCurrency,
        applied_to_invoice_id: applyImmediately && invoiceId ? invoiceId : null,
      })
      .select("id, credit_note_number")
      .single();

    if (cnError || !creditNote) {
      console.error("Error creating credit note:", cnError);
      throw new Error("Failed to create credit note");
    }

    console.log("Created credit note:", creditNote.credit_note_number);

    let invoiceNewBalance: number | null = null;

    // Apply to invoice if requested
    if (applyImmediately && invoiceId && amountToApply > 0) {
      // Create application record
      await supabase.from("credit_note_applications").insert({
        credit_note_id: creditNote.id,
        invoice_id: invoiceId,
        amount: amountToApply,
      });

      // Update invoice
      const { data: updatedInvoice } = await supabase
        .from("customer_invoices")
        .select("total_amount, amount_paid")
        .eq("id", invoiceId)
        .single();

      const currentPaid = updatedInvoice?.amount_paid || 0;
      const newAmountPaid = currentPaid + amountToApply;
      const newStatus = newAmountPaid >= (updatedInvoice?.total_amount || 0) ? "paid" : "partial";

      await supabase
        .from("customer_invoices")
        .update({ amount_paid: newAmountPaid, status: newStatus })
        .eq("id", invoiceId);

      invoiceNewBalance = (updatedInvoice?.total_amount || 0) - newAmountPaid;

      // Post GL entries - Dr: Sales Returns, Cr: Accounts Receivable
      await supabase.from("general_ledger").insert([
        {
          entry_date: new Date().toISOString().split("T")[0],
          account_code: "4100",
          account_name: "Sales Returns & Allowances",
          debit: amountToApply,
          credit: null,
          description: `POS Credit Note ${creditNoteNumber}`,
          reference_type: "credit_note",
          reference_id: creditNote.id,
        },
        {
          entry_date: new Date().toISOString().split("T")[0],
          account_code: "1200",
          account_name: "Accounts Receivable",
          debit: null,
          credit: amountToApply,
          description: `POS Credit Note ${creditNoteNumber}`,
          reference_type: "credit_note",
          reference_id: creditNote.id,
        },
      ]);

      console.log("GL entries posted for credit note");
    }

    return new Response(
      JSON.stringify({
        success: true,
        credit_note_number: creditNote.credit_note_number,
        credit_note_id: creditNote.id,
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
    console.error("POS Credit Note error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "INTERNAL_ERROR", message: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
