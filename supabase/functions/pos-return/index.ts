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
interface ReturnItem {
  sku: string;
  quantity: number;
  unit_price: number;
  condition?: string; // good | damaged | defective
}

interface POSReturnPayload {
  pos_terminal_id: string;
  transaction_id: string;
  original_invoice_number: string;
  return_reason: string; // defective | wrong_item | customer_changed_mind | damaged | other
  items: ReturnItem[];
  refund_method: string; // cash | original_payment | store_credit
  refund_amount: number;
  restock?: boolean;
  bank_account_id?: string;
  notes?: string;
}

// Helper to generate return numbers
function generateReturnNumber(date: Date): string {
  const year = date.getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `RET-${year}-${random}`;
}

// Helper to generate credit note numbers
function generateCreditNoteNumber(date: Date): string {
  const year = date.getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `CN-${year}-${random}`;
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
        console.log("Unauthorized POS return attempt");
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
    const payload: POSReturnPayload = await req.json();
    console.log("Received POS return payload:", JSON.stringify(payload, null, 2));

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

    if (!payload.original_invoice_number) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_PAYLOAD",
          details: "original_invoice_number is required",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_PAYLOAD",
          details: "At least one item is required",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!payload.return_reason) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_PAYLOAD",
          details: "return_reason is required",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!payload.refund_method) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_PAYLOAD",
          details: "refund_method is required",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof payload.refund_amount !== "number" || payload.refund_amount <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_PAYLOAD",
          details: "refund_amount must be greater than 0",
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

    // Idempotency check - look for existing return with this transaction_id
    const { data: existingReturn } = await supabase
      .from("sales_returns")
      .select("id, return_number")
      .eq("notes", payload.transaction_id)
      .single();

    if (existingReturn) {
      console.log("Duplicate return transaction detected:", payload.transaction_id);
      return new Response(
        JSON.stringify({
          success: true,
          message: "Return already processed",
          return_number: existingReturn.return_number,
          return_id: existingReturn.id,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the original invoice - with dual-path lookup for POS orders
    let invoice: {
      id: string;
      invoice_number: string;
      customer_id: string;
      total_amount: number;
      amount_paid: number | null;
      sales_order_id: string | null;
    } | null = null;

    // Check if this is a POS order number (starts with ORD-)
    if (payload.original_invoice_number.startsWith("ORD-")) {
      console.log("Detected POS order number, looking up via pos_sales table");
      
      // Look up via pos_sales table
      const { data: posSale, error: posError } = await supabase
        .from("pos_sales")
        .select("invoice_id")
        .eq("pos_transaction_id", payload.original_invoice_number)
        .maybeSingle();

      if (posError) {
        console.error("Error looking up POS sale:", posError);
        return new Response(
          JSON.stringify({
            success: false,
            error: "POS_LOOKUP_ERROR",
            details: `Error looking up POS sale: ${posError.message}`,
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!posSale) {
        console.log("POS sale not found:", payload.original_invoice_number);
        return new Response(
          JSON.stringify({
            success: false,
            error: "POS_SALE_NOT_FOUND",
            details: `POS sale not found: ${payload.original_invoice_number}`,
          }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!posSale.invoice_id) {
        console.log("POS sale has no linked invoice:", payload.original_invoice_number);
        return new Response(
          JSON.stringify({
            success: false,
            error: "INVOICE_NOT_CREATED",
            details: "The original sale does not have a linked invoice. The sale may have failed to complete.",
            pos_transaction_id: payload.original_invoice_number,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Now get the actual invoice using the invoice_id from pos_sales
      const { data: inv, error: invError } = await supabase
        .from("customer_invoices")
        .select("id, invoice_number, customer_id, total_amount, amount_paid, sales_order_id")
        .eq("id", posSale.invoice_id)
        .single();

      if (invError || !inv) {
        console.error("Error fetching invoice for POS sale:", invError);
        return new Response(
          JSON.stringify({
            success: false,
            error: "INVOICE_NOT_FOUND",
            details: `Invoice linked to POS sale not found`,
          }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      invoice = inv;
      console.log("Found invoice via POS sale lookup:", invoice.invoice_number);
    } else {
      // Direct invoice number lookup (for non-POS returns or direct invoice references)
      const { data: inv, error: invoiceError } = await supabase
        .from("customer_invoices")
        .select("id, invoice_number, customer_id, total_amount, amount_paid, sales_order_id")
        .eq("invoice_number", payload.original_invoice_number)
        .single();

      if (invoiceError || !inv) {
        console.log("Original invoice not found:", payload.original_invoice_number);
        return new Response(
          JSON.stringify({
            success: false,
            error: "INVOICE_NOT_FOUND",
            details: `Original invoice not found: ${payload.original_invoice_number}`,
          }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      invoice = inv;
    }

    // Get invoice lines to validate return items
    const { data: invoiceLines } = await supabase
      .from("customer_invoice_lines")
      .select("id, product_id, quantity, unit_price, description")
      .eq("invoice_id", invoice.id);

    // Get product SKUs for invoice lines
    const productIds = invoiceLines?.map(l => l.product_id).filter(Boolean) || [];
    const { data: products } = await supabase
      .from("products")
      .select("id, sku, name")
      .in("id", productIds);

  const productMap = new Map(products?.map(p => [p.sku, p]) || []);
  const invoiceLineMap = new Map<string, { line: any; product: any }>();
  
  invoiceLines?.forEach(line => {
      const product = products?.find(p => p.id === line.product_id);
      if (product) {
        invoiceLineMap.set(product.sku, { line, product });
      }
    });

    // Validate return items
    const validationErrors: { sku: string; error: string }[] = [];
    
    for (const item of payload.items) {
      const invoiceItem = invoiceLineMap.get(item.sku);
      
      if (!invoiceItem) {
        validationErrors.push({
          sku: item.sku,
          error: "Item not found in original invoice",
        });
        continue;
      }

      if (item.quantity > invoiceItem.line.quantity) {
        validationErrors.push({
          sku: item.sku,
          error: `Return quantity (${item.quantity}) exceeds original quantity (${invoiceItem.line.quantity})`,
        });
      }
    }

    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "VALIDATION_FAILED",
          details: validationErrors,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const today = new Date();
    const returnNumber = generateReturnNumber(today);
    const creditNoteNumber = generateCreditNoteNumber(today);
    const todayStr = today.toISOString().split("T")[0];
    const shouldRestock = payload.restock !== false; // Default to true

    console.log("Processing return:", {
      return_number: returnNumber,
      original_invoice: invoice.invoice_number,
      refund_amount: payload.refund_amount,
      restock: shouldRestock,
    });

    // Create sales return
    const { data: salesReturn, error: returnError } = await supabase
      .from("sales_returns")
      .insert({
        return_number: returnNumber,
        sales_order_id: invoice.sales_order_id,
        customer_id: invoice.customer_id,
        return_date: todayStr,
        return_reason: payload.return_reason, // Fixed: use correct column name
        status: "completed",
        notes: payload.transaction_id, // Store for idempotency
        created_at: new Date().toISOString(),
      })
      .select("id, return_number")
      .single();

    if (returnError || !salesReturn) {
      console.error("Error creating sales return:", returnError);
      throw new Error("Failed to create sales return");
    }

    console.log("Created sales return:", salesReturn.return_number);

    // Create return lines with correct column names
    // Note: total_price is a generated column in PostgreSQL - do NOT include it
    const returnLines = payload.items.map((item, index) => {
      const invoiceItem = invoiceLineMap.get(item.sku);
      return {
        return_id: salesReturn.id,
        product_id: invoiceItem?.product.id,
        quantity_returned: item.quantity,
        unit_price: item.unit_price,
        // total_price is auto-calculated by PostgreSQL (quantity_returned * unit_price)
        disposition: shouldRestock && item.condition !== "defective" && item.condition !== "damaged" 
          ? "restock" 
          : "scrap",
        line_number: index + 1,
      };
    });

    const { error: linesError } = await supabase
      .from("sales_return_lines")
      .insert(returnLines);

    if (linesError) {
      console.error("Error creating return lines:", linesError);
      throw new Error("Failed to create return lines");
    }

    console.log("Created return lines:", returnLines.length);

    // Create credit note - automatically applied for POS returns
    const { data: creditNote, error: cnError } = await supabase
      .from("credit_notes")
      .insert({
        credit_note_number: creditNoteNumber,
        customer_id: invoice.customer_id,
        invoice_id: invoice.id,
        sales_return_id: salesReturn.id,
        credit_date: todayStr,
        amount: payload.refund_amount,
        amount_applied: payload.refund_amount, // Auto-apply for POS returns
        reason: 'return', // POS returns always use 'return' as credit note reason type
        status: "applied", // Mark as applied immediately
        notes: `POS Return - ${returnNumber} - Terminal: ${payload.pos_terminal_id}`,
      })
      .select("id, credit_note_number")
      .single();

    if (cnError || !creditNote) {
      console.error("Error creating credit note:", cnError);
      throw new Error("Failed to create credit note");
    }

    console.log("Created credit note:", creditNote.credit_note_number);

    // Create credit note application record
    const { error: appError } = await supabase
      .from("credit_note_applications")
      .insert({
        credit_note_id: creditNote.id,
        invoice_id: invoice.id,
        amount: payload.refund_amount,
        applied_at: new Date().toISOString(),
        notes: `Auto-applied from POS return ${returnNumber}`,
      });

    if (appError) {
      console.error("Error creating credit note application:", appError);
    } else {
      console.log("Created credit note application for invoice:", invoice.invoice_number);
    }

    // Update invoice amount_paid to reflect the credit
    const newAmountPaid = (invoice.amount_paid || 0) + payload.refund_amount;
    const invoiceNewStatus = newAmountPaid >= invoice.total_amount ? "paid" : "partial";
    
    const { error: invoiceUpdateError } = await supabase
      .from("customer_invoices")
      .update({
        amount_paid: newAmountPaid,
        status: invoiceNewStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoice.id);

    if (invoiceUpdateError) {
      console.error("Error updating invoice:", invoiceUpdateError);
    } else {
      console.log("Updated invoice balance:", {
        invoice: invoice.invoice_number,
        new_amount_paid: newAmountPaid,
        new_status: invoiceNewStatus,
      });
    }

    // Restock inventory if applicable
    let itemsRestocked = false;
    if (shouldRestock) {
      for (const item of payload.items) {
        if (item.condition === "defective" || item.condition === "damaged") {
          continue; // Skip restocking damaged/defective items
        }

        const invoiceItem = invoiceLineMap.get(item.sku);
        if (!invoiceItem) continue;

        // Find an existing batch for this product to add stock to
        const { data: batch } = await supabase
          .from("inventory_batches")
          .select("id, current_quantity")
          .eq("product_id", invoiceItem.product.id)
          .eq("status", "active")
          .order("received_date", { ascending: false })
          .limit(1)
          .single();

        if (batch) {
          // Update existing batch
          await supabase
            .from("inventory_batches")
            .update({
              current_quantity: batch.current_quantity + item.quantity,
              updated_at: new Date().toISOString(),
            })
            .eq("id", batch.id);

          // Create inventory transaction
          await supabase
            .from("inventory_transactions")
            .insert({
              product_id: invoiceItem.product.id,
              batch_id: batch.id,
              transaction_type: "receipt",
              quantity: item.quantity,
              reference_type: "sales_return",
              reference_id: salesReturn.id,
              notes: `Restocked from return ${returnNumber}`,
              transaction_date: new Date().toISOString(),
            });

          itemsRestocked = true;
          console.log(`Restocked ${item.quantity} of ${item.sku} to batch ${batch.id}`);
        }
      }
    }

    // Post GL entries (reverse the original sale)
    const glEntries = [
      // Reverse revenue: Debit Revenue, Credit Cash/AR
      {
        entry_date: todayStr,
        account_code: "4000",
        account_name: "Sales Revenue",
        debit: payload.refund_amount,
        credit: 0,
        description: `Sales Return - ${returnNumber}`,
        reference_type: "sales_return",
        reference_id: salesReturn.id,
      },
      {
        entry_date: todayStr,
        account_code: payload.refund_method === "cash" ? "1100" : "1200",
        account_name: payload.refund_method === "cash" ? "Cash/Bank" : "Accounts Receivable",
        debit: 0,
        credit: payload.refund_amount,
        description: `Sales Return - ${returnNumber}`,
        reference_type: "sales_return",
        reference_id: salesReturn.id,
      },
    ];

    // If items were restocked, reverse COGS
    if (itemsRestocked) {
      // Calculate approximate COGS (simplified - using unit prices from return)
      const cogsAmount = payload.items
        .filter(item => item.condition !== "defective" && item.condition !== "damaged")
        .reduce((sum, item) => sum + (item.quantity * item.unit_price * 0.6), 0); // Assuming 60% cost

      if (cogsAmount > 0) {
        glEntries.push(
          {
            entry_date: todayStr,
            account_code: "1300",
            account_name: "Inventory",
            debit: cogsAmount,
            credit: 0,
            description: `Inventory Restock - ${returnNumber}`,
            reference_type: "sales_return",
            reference_id: salesReturn.id,
          },
          {
            entry_date: todayStr,
            account_code: "5000",
            account_name: "Cost of Goods Sold",
            debit: 0,
            credit: cogsAmount,
            description: `COGS Reversal - ${returnNumber}`,
            reference_type: "sales_return",
            reference_id: salesReturn.id,
          }
        );
      }
    }

    const { error: glError } = await supabase.from("general_ledger").insert(glEntries);

    if (glError) {
      console.error("Error posting GL entries:", glError);
    } else {
      console.log("Posted GL entries for return:", returnNumber);
    }

    // Process cash refund if applicable
    if (payload.refund_method === "cash" && payload.bank_account_id) {
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
          amount: -payload.refund_amount, // Negative for withdrawal
          transaction_type: "withdrawal",
          description: `Refund - ${returnNumber}`,
          payee_payer: customer?.company_name || "Customer",
          reference_number: returnNumber,
          source_type: "sales_return",
          source_id: salesReturn.id,
        });

      if (bankTxnError) {
        console.error("Error creating bank transaction:", bankTxnError);
      } else {
        console.log("Created bank transaction for refund:", transactionNumber);

        // Update bank account balance
        const { data: bankAccount } = await supabase
          .from("bank_accounts")
          .select("current_balance")
          .eq("id", payload.bank_account_id)
          .single();

        if (bankAccount) {
          const newBalance = (bankAccount.current_balance || 0) - payload.refund_amount;
          await supabase
            .from("bank_accounts")
            .update({ current_balance: newBalance, updated_at: new Date().toISOString() })
            .eq("id", payload.bank_account_id);
          
          console.log("Updated bank account balance:", newBalance);
        }
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        return_number: salesReturn.return_number,
        return_id: salesReturn.id,
        credit_note_number: creditNote.credit_note_number,
        credit_note_id: creditNote.id,
        original_invoice_number: invoice.invoice_number,
        refund_amount: payload.refund_amount,
        refund_method: payload.refund_method,
        items_restocked: itemsRestocked,
        gl_posted: !glError,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("POS Return error:", error);
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
