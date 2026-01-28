import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS configuration
const allowedOrigins = Deno.env.get("ALLOWED_POS_ORIGINS")?.split(",") || ["*"];
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigins[0] || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-pos-api-key",
};

// Rate limiting map (in-memory, per terminal)
const rateLimitMap = new Map<string, number[]>();
const MAX_REQUESTS_PER_MINUTE = 60;

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

// Types
interface POSPaymentPayload {
  pos_terminal_id: string;
  transaction_id: string;             // For idempotency
  invoice_id?: string;                // UUID of invoice
  invoice_number?: string;            // OR invoice number
  customer_code?: string;             // Optional validation
  amount: number;
  payment_method: string;
  bank_account_id?: string;           // Optional for bank transactions
  reference?: string;                 // Check number, reference, etc.
  notes?: string;
}

// Helper to generate sequential receipt numbers
function generateReceiptNumber(date: Date): string {
  const year = date.getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `RCP-${year}-${random}`;
}

// Helper to generate transaction numbers
function generateTransactionNumber(date: Date): string {
  const year = date.getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `TXN-${year}-${random}`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
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
        console.log("Unauthorized POS payment attempt");
        return new Response(
          JSON.stringify({
            success: false,
            error: "UNAUTHORIZED",
            message: "Invalid or missing API key",
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Parse request body
    const payload: POSPaymentPayload = await req.json();
    console.log("Received POS payment payload:", JSON.stringify(payload, null, 2));

    // Security: Rate limiting per terminal
    if (!checkRateLimit(payload.pos_terminal_id || "unknown")) {
      console.log("Rate limit exceeded for terminal:", payload.pos_terminal_id);
      return new Response(
        JSON.stringify({
          success: false,
          error: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Please try again later.",
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate required fields
    if (!payload.pos_terminal_id || !payload.transaction_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_PAYLOAD",
          details: "Missing required fields: pos_terminal_id, transaction_id",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!payload.invoice_id && !payload.invoice_number) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_PAYLOAD",
          details: "Must provide either invoice_id or invoice_number",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!payload.amount || payload.amount <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_PAYLOAD",
          details: "Amount must be greater than 0",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!payload.payment_method) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_PAYLOAD",
          details: "Payment method is required",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Input sanitization
    if (payload.pos_terminal_id.length > 50 || payload.transaction_id.length > 100) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_PAYLOAD",
          details: "Field length exceeds maximum allowed",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Idempotency check - look for existing receipt with this transaction_id
    const { data: existingReceipt } = await supabase
      .from("customer_receipts")
      .select("id, receipt_number, amount")
      .eq("reference_number", payload.transaction_id)
      .single();

    if (existingReceipt) {
      console.log("Duplicate payment transaction detected:", payload.transaction_id);
      return new Response(
        JSON.stringify({
          success: true,
          message: "Payment already processed",
          receipt_number: existingReceipt.receipt_number,
          receipt_id: existingReceipt.id,
          amount: existingReceipt.amount,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the invoice
    let invoiceQuery = supabase
      .from("customer_invoices")
      .select("id, invoice_number, customer_id, total_amount, amount_paid, status, due_date");

    if (payload.invoice_id) {
      invoiceQuery = invoiceQuery.eq("id", payload.invoice_id);
    } else if (payload.invoice_number) {
      invoiceQuery = invoiceQuery.eq("invoice_number", payload.invoice_number);
    }

    const { data: invoice, error: invoiceError } = await invoiceQuery.single();

    if (invoiceError || !invoice) {
      console.log("Invoice not found:", payload.invoice_id || payload.invoice_number);
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVOICE_NOT_FOUND",
          details: `Invoice not found: ${payload.invoice_id || payload.invoice_number}`,
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate customer if provided
    if (payload.customer_code) {
      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("customer_code", payload.customer_code)
        .eq("id", invoice.customer_id)
        .single();

      if (!customer) {
        console.log("Customer mismatch:", payload.customer_code, invoice.customer_id);
        return new Response(
          JSON.stringify({
            success: false,
            error: "CUSTOMER_MISMATCH",
            details: "Customer code does not match the invoice customer",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Calculate current balance and payment amount
    const currentBalance = invoice.total_amount - (invoice.amount_paid || 0);
    
    if (currentBalance <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVOICE_ALREADY_PAID",
          details: "This invoice has already been fully paid",
          invoice_number: invoice.invoice_number,
          total_amount: invoice.total_amount,
          amount_paid: invoice.amount_paid,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cap payment amount at the remaining balance
    const paymentAmount = Math.min(payload.amount, currentBalance);
    const overpayment = payload.amount > currentBalance ? payload.amount - currentBalance : 0;

    const today = new Date();
    const receiptNumber = generateReceiptNumber(today);
    const todayStr = today.toISOString().split("T")[0];

    console.log("Processing payment:", {
      invoice_number: invoice.invoice_number,
      current_balance: currentBalance,
      payment_amount: paymentAmount,
      overpayment: overpayment,
    });

    // Create customer receipt
    const { data: receipt, error: receiptError } = await supabase
      .from("customer_receipts")
      .insert({
        receipt_number: receiptNumber,
        customer_id: invoice.customer_id,
        receipt_date: todayStr,
        amount: paymentAmount,
        payment_method: payload.payment_method,
        reference_number: payload.transaction_id, // For idempotency
        bank_account: payload.bank_account_id || null,
        status: "allocated",
        notes: payload.notes || `POS Collection - ${invoice.invoice_number} - Terminal: ${payload.pos_terminal_id}`,
      })
      .select("id, receipt_number")
      .single();

    if (receiptError || !receipt) {
      console.error("Error creating receipt:", receiptError);
      throw new Error("Failed to create receipt");
    }

    console.log("Created receipt:", receipt.receipt_number);

    // Create receipt allocation
    const { error: allocError } = await supabase
      .from("receipt_allocations")
      .insert({
        receipt_id: receipt.id,
        invoice_id: invoice.id,
        amount: paymentAmount,
      });

    if (allocError) {
      console.error("Error creating allocation:", allocError);
      throw new Error("Failed to create receipt allocation");
    }

    console.log("Created receipt allocation");

    // Update invoice
    const newAmountPaid = (invoice.amount_paid || 0) + paymentAmount;
    const newStatus = newAmountPaid >= invoice.total_amount ? "paid" : "partial";

    const { error: updateError } = await supabase
      .from("customer_invoices")
      .update({
        amount_paid: newAmountPaid,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoice.id);

    if (updateError) {
      console.error("Error updating invoice:", updateError);
      throw new Error("Failed to update invoice");
    }

    console.log("Updated invoice:", invoice.invoice_number, "New status:", newStatus);

    // Post GL entries (Debit Cash/Bank, Credit AR)
    const glEntries = [
      {
        entry_date: todayStr,
        account_code: "1100",
        account_name: "Cash/Bank",
        debit: paymentAmount,
        credit: 0,
        description: `AR Collection - ${invoice.invoice_number}`,
        reference_type: "customer_receipt",
        reference_id: receipt.id,
      },
      {
        entry_date: todayStr,
        account_code: "1200",
        account_name: "Accounts Receivable",
        debit: 0,
        credit: paymentAmount,
        description: `AR Collection - ${invoice.invoice_number}`,
        reference_type: "customer_receipt",
        reference_id: receipt.id,
      },
    ];

    const { error: glError } = await supabase.from("general_ledger").insert(glEntries);

    if (glError) {
      console.error("Error posting GL entries:", glError);
      // Don't fail the transaction for GL posting errors, but log it
    } else {
      console.log("Posted GL entries for receipt:", receipt.receipt_number);
    }

    // Create bank transaction if bank_account_id provided
    if (payload.bank_account_id) {
      const transactionNumber = generateTransactionNumber(today);
      
      // Get customer name
      const { data: customer } = await supabase
        .from("customers")
        .select("company_name")
        .eq("id", invoice.customer_id)
        .single();

      const { error: bankTxnError } = await supabase
        .from("bank_transactions")
        .insert({
          transaction_number: transactionNumber,
          bank_account_id: payload.bank_account_id,
          transaction_date: todayStr,
          amount: paymentAmount,
          transaction_type: "deposit",
          description: `AR Collection - ${invoice.invoice_number}`,
          payee_payer: customer?.company_name || "Customer",
          reference_number: receipt.receipt_number,
          source_type: "customer_receipt",
          source_id: receipt.id,
        });

      if (bankTxnError) {
        console.error("Error creating bank transaction:", bankTxnError);
        // Don't fail for bank transaction errors
      } else {
        console.log("Created bank transaction:", transactionNumber);

        // Update bank account balance
        const { data: bankAccount } = await supabase
          .from("bank_accounts")
          .select("current_balance")
          .eq("id", payload.bank_account_id)
          .single();

        if (bankAccount) {
          const newBalance = (bankAccount.current_balance || 0) + paymentAmount;
          await supabase
            .from("bank_accounts")
            .update({ current_balance: newBalance, updated_at: new Date().toISOString() })
            .eq("id", payload.bank_account_id);
          
          console.log("Updated bank account balance:", newBalance);
        }
      }
    }

    // Calculate new invoice balance
    const newInvoiceBalance = invoice.total_amount - newAmountPaid;

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        receipt_number: receipt.receipt_number,
        receipt_id: receipt.id,
        invoice_number: invoice.invoice_number,
        invoice_id: invoice.id,
        amount_applied: paymentAmount,
        overpayment: overpayment,
        new_invoice_balance: newInvoiceBalance,
        invoice_status: newStatus,
        previous_amount_paid: invoice.amount_paid || 0,
        new_amount_paid: newAmountPaid,
        gl_posted: !glError,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("POS Payment error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "An unexpected error occurred",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
