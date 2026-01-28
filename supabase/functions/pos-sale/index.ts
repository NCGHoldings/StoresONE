import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Security: Configure CORS with allowed origins
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
interface POSItem {
  sku: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax_rate: number;
}

interface POSPayload {
  pos_terminal_id: string;
  transaction_id: string;
  transaction_datetime: string;
  customer_code?: string;
  payment_method: string;
  amount_paid: number;
  bank_account_id?: string;
  items: POSItem[];
  notes?: string;
}

interface ValidationError {
  sku: string;
  error: string;
}

interface BatchUsed {
  batch_id: string;
  batch_number: string;
  quantity: number;
  unit_cost: number;
}

// Helper to generate sequential numbers
function generateNumber(prefix: string, date: Date): string {
  const year = date.getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `${prefix}-${year}-${random}`;
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
        console.log("Unauthorized POS access attempt");
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
    const payload: POSPayload = await req.json();
    console.log("Received POS payload:", JSON.stringify(payload, null, 2));

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
    if (!payload.pos_terminal_id || !payload.transaction_id || !payload.items?.length) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_PAYLOAD",
          details: "Missing required fields: pos_terminal_id, transaction_id, or items",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Input sanitization: Validate field lengths and types
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

    // Validate items array
    if (payload.items.length > 100) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_PAYLOAD",
          details: "Maximum 100 items per transaction",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    for (const item of payload.items) {
      if (!item.sku || item.sku.length > 50) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "INVALID_PAYLOAD",
            details: "Invalid SKU format",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (item.quantity <= 0 || item.quantity > 10000) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "INVALID_PAYLOAD",
            details: `Invalid quantity for SKU ${item.sku}`,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (item.unit_price < 0 || item.unit_price > 999999999) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "INVALID_PAYLOAD",
            details: `Invalid price for SKU ${item.sku}`,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Check for duplicate transaction (idempotency)
    const { data: existingSale } = await supabase
      .from("pos_sales")
      .select("id, invoice_id, receipt_id")
      .eq("pos_transaction_id", payload.transaction_id)
      .single();

    if (existingSale) {
      console.log("Duplicate transaction detected:", payload.transaction_id);
      return new Response(
        JSON.stringify({
          success: true,
          erp_invoice_number: existingSale.invoice_id,
          invoice_id: existingSale.invoice_id,
          message: "Transaction already processed",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch system config
    const { data: configData } = await supabase
      .from("system_config")
      .select("key, value")
      .in("key", ["pos_price_tolerance", "pos_require_stock", "walk_in_customer_code", "default_tax_rate", "pos_validate_credit_limit", "default_currency"]);

    const config: Record<string, string> = {};
    configData?.forEach((c) => {
      config[c.key] = typeof c.value === "string" ? c.value.replace(/"/g, "") : String(c.value);
    });

    const priceTolerance = parseFloat(config.pos_price_tolerance || "10");
    const requireStock = config.pos_require_stock !== "false";
    const walkInCustomerCode = config.walk_in_customer_code || "WALK-IN";
    const validateCreditLimit = config.pos_validate_credit_limit === "true";
    const defaultCurrency = config.default_currency || "USD";

    // Step 1: Validate all items against master data
    const skus = payload.items.map((item) => item.sku);
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, sku, name, unit_cost, is_active, batch_tracked")
      .in("sku", skus);

    if (productsError) {
      console.error("Error fetching products:", productsError);
      throw new Error("Failed to validate products");
    }

    const productMap = new Map(products?.map((p) => [p.sku, p]) || []);
    const validationErrors: ValidationError[] = [];

    // Validate each item
    for (const item of payload.items) {
      const product = productMap.get(item.sku);

      if (!product) {
        validationErrors.push({ sku: item.sku, error: "Product not found" });
        continue;
      }

      if (!product.is_active) {
        validationErrors.push({ sku: item.sku, error: "Product is inactive" });
        continue;
      }

      // Price validation with tolerance
      if (product.unit_cost) {
        const priceDiff = Math.abs(item.unit_price - product.unit_cost) / product.unit_cost * 100;
        if (priceDiff > priceTolerance) {
          validationErrors.push({
            sku: item.sku,
            error: `Price mismatch: expected ${product.unit_cost}, received ${item.unit_price} (${priceDiff.toFixed(1)}% difference)`,
          });
        }
      }
    }

    // Check inventory availability
    if (requireStock) {
      for (const item of payload.items) {
        const product = productMap.get(item.sku);
        if (!product) continue;

        const { data: inventory } = await supabase
          .from("inventory")
          .select("quantity, available_quantity")
          .eq("product_id", product.id);

        const totalAvailable = inventory?.reduce((sum, inv) => sum + (inv.available_quantity || inv.quantity || 0), 0) || 0;

        if (totalAvailable < item.quantity) {
          validationErrors.push({
            sku: item.sku,
            error: `Insufficient stock (available: ${totalAvailable}, requested: ${item.quantity})`,
          });
        }
      }
    }

    // Return validation errors if any
    if (validationErrors.length > 0) {
      // Log failed sale attempt
      await supabase.from("pos_sales").insert({
        pos_terminal_id: payload.pos_terminal_id,
        pos_transaction_id: payload.transaction_id,
        transaction_datetime: payload.transaction_datetime || new Date().toISOString(),
        subtotal: 0,
        tax_amount: 0,
        total_amount: 0,
        amount_paid: payload.amount_paid || 0,
        payment_method: payload.payment_method,
        status: "failed",
        error_message: JSON.stringify(validationErrors),
        raw_payload: payload as unknown as Record<string, unknown>,
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: "VALIDATION_FAILED",
          details: validationErrors,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Get or create customer
    let customerId: string | null = null;
    let customerCreditLimit: number = 0;
    let customerCode: string = walkInCustomerCode;
    
    if (payload.customer_code) {
      const { data: customer } = await supabase
        .from("customers")
        .select("id, credit_limit, customer_code")
        .eq("customer_code", payload.customer_code)
        .single();

      if (customer) {
        customerId = customer.id;
        customerCreditLimit = customer.credit_limit || 0;
        customerCode = customer.customer_code;
      }
    }

    // If no customer found, use walk-in customer
    if (!customerId) {
      const { data: walkInCustomer } = await supabase
        .from("customers")
        .select("id, credit_limit")
        .eq("customer_code", walkInCustomerCode)
        .single();

      if (!walkInCustomer) {
        // Create walk-in customer if it doesn't exist
        const { data: newWalkIn } = await supabase
          .from("customers")
          .insert({
            customer_code: walkInCustomerCode,
            company_name: "Walk-In Customer",
            status: "active",
          })
          .select("id")
          .single();

        customerId = newWalkIn?.id || null;
      } else {
        customerId = walkInCustomer.id;
        customerCreditLimit = walkInCustomer.credit_limit || 0;
      }
      customerCode = walkInCustomerCode;
    }

    if (!customerId) {
      throw new Error("Failed to resolve customer");
    }

    // Calculate sale total for credit validation
    let preliminarySubtotal = 0;
    let preliminaryTaxAmount = 0;
    for (const item of payload.items) {
      const lineSubtotal = item.unit_price * item.quantity - (item.discount || 0);
      const lineTax = lineSubtotal * (item.tax_rate / 100);
      preliminarySubtotal += lineSubtotal;
      preliminaryTaxAmount += lineTax;
    }
    const preliminaryTotal = preliminarySubtotal + preliminaryTaxAmount;

    // Credit limit validation (if enabled and customer has a credit limit)
    if (validateCreditLimit && customerCreditLimit > 0 && customerCode !== walkInCustomerCode) {
      // Calculate current outstanding balance
      const { data: outstandingInvoices } = await supabase
        .from("customer_invoices")
        .select("total_amount, amount_paid, status")
        .eq("customer_id", customerId)
        .not("status", "in", '("paid","cancelled")');

      const outstandingBalance = (outstandingInvoices || []).reduce(
        (sum, inv) => sum + ((inv.total_amount || 0) - (inv.amount_paid || 0)),
        0
      );

      const availableCredit = customerCreditLimit - outstandingBalance;
      const amountRequiringCredit = Math.max(0, preliminaryTotal - (payload.amount_paid || 0));

      if (amountRequiringCredit > availableCredit) {
        console.log("Credit limit exceeded:", {
          customer_code: customerCode,
          credit_limit: customerCreditLimit,
          outstanding_balance: outstandingBalance,
          sale_total: preliminaryTotal,
          amount_paid: payload.amount_paid || 0,
          available_credit: availableCredit,
        });

        return new Response(
          JSON.stringify({
            success: false,
            error: "CREDIT_LIMIT_EXCEEDED",
            details: {
              customer_code: customerCode,
              credit_limit: customerCreditLimit,
              outstanding_balance: outstandingBalance,
              sale_total: preliminaryTotal,
              amount_paid: payload.amount_paid || 0,
              available_credit: availableCredit,
            },
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;
    const lineItems: Array<{
      product_id: string;
      sku: string;
      quantity: number;
      unit_price: number;
      discount: number;
      tax_rate: number;
      line_total: number;
      cost_at_sale: number;
      batches_used: BatchUsed[];
    }> = [];

    for (const item of payload.items) {
      const product = productMap.get(item.sku)!;
      const lineSubtotal = item.unit_price * item.quantity - (item.discount || 0);
      const lineTax = lineSubtotal * (item.tax_rate / 100);
      const lineTotal = lineSubtotal + lineTax;

      subtotal += lineSubtotal;
      taxAmount += lineTax;

      lineItems.push({
        product_id: product.id,
        sku: item.sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount || 0,
        tax_rate: item.tax_rate,
        line_total: lineTotal,
        cost_at_sale: product.unit_cost || 0,
        batches_used: [],
      });
    }

    const totalAmount = subtotal + taxAmount;
    const amountPaid = payload.amount_paid || 0;
    const changeGiven = Math.max(0, amountPaid - totalAmount);
    const balanceDue = Math.max(0, totalAmount - amountPaid);

    // Determine invoice status
    let invoiceStatus = "sent";
    if (amountPaid >= totalAmount) {
      invoiceStatus = "paid";
    } else if (amountPaid > 0) {
      invoiceStatus = "partial";
    }

    const transactionDate = new Date(payload.transaction_datetime || new Date());
    const invoiceNumber = generateNumber("POS", transactionDate);
    const receiptNumber = generateNumber("RCP", transactionDate);

    // Step 3: Create AR Invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("customer_invoices")
      .insert({
        invoice_number: invoiceNumber,
        customer_id: customerId,
        invoice_date: transactionDate.toISOString().split("T")[0],
        due_date: transactionDate.toISOString().split("T")[0], // POS sales due immediately
        subtotal: subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        amount_paid: Math.min(amountPaid, totalAmount),
        status: invoiceStatus,
        notes: payload.notes || `POS Sale - Terminal: ${payload.pos_terminal_id}`,
        currency: defaultCurrency,
        payment_terms: 0,
      })
      .select("id, invoice_number")
      .single();

    if (invoiceError || !invoice) {
      console.error("Error creating invoice:", invoiceError);
      throw new Error("Failed to create invoice");
    }

    console.log("Created invoice:", invoice.invoice_number);

    // Create invoice lines
    const invoiceLines = lineItems.map((item, index) => ({
      invoice_id: invoice.id,
      line_number: index + 1,
      product_id: item.product_id,
      description: item.sku,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate,
      line_total: item.line_total,
    }));

    const { error: linesError } = await supabase
      .from("customer_invoice_lines")
      .insert(invoiceLines);

    if (linesError) {
      console.error("Error creating invoice lines:", linesError);
    }

    // Step 4: Post General Ledger Entries
    const glEntries = [];
    const glEntryDate = transactionDate.toISOString().split("T")[0];

    // Credit Sales Revenue
    glEntries.push({
      entry_date: glEntryDate,
      account_code: "4100",
      account_name: "Sales Revenue",
      description: `POS Sale ${invoiceNumber}`,
      credit: subtotal,
      debit: 0,
      reference_type: "customer_invoice",
      reference_id: invoice.id,
    });

    // Credit Tax Payable
    if (taxAmount > 0) {
      glEntries.push({
        entry_date: glEntryDate,
        account_code: "2300",
        account_name: "Sales Tax Payable",
        description: `Tax on POS Sale ${invoiceNumber}`,
        credit: taxAmount,
        debit: 0,
        reference_type: "customer_invoice",
        reference_id: invoice.id,
      });
    }

    // Debit Cash/Bank for amount paid
    if (amountPaid > 0) {
      const actualReceived = Math.min(amountPaid, totalAmount);
      glEntries.push({
        entry_date: glEntryDate,
        account_code: "1100",
        account_name: "Cash/Bank",
        description: `Payment received - ${invoiceNumber}`,
        debit: actualReceived,
        credit: 0,
        reference_type: "customer_invoice",
        reference_id: invoice.id,
      });
    }

    // Debit Accounts Receivable for balance
    if (balanceDue > 0) {
      glEntries.push({
        entry_date: glEntryDate,
        account_code: "1200",
        account_name: "Accounts Receivable",
        description: `AR Balance - ${invoiceNumber}`,
        debit: balanceDue,
        credit: 0,
        reference_type: "customer_invoice",
        reference_id: invoice.id,
      });
    }

    const { error: glError } = await supabase.from("general_ledger").insert(glEntries);
    if (glError) {
      console.error("Error posting GL entries:", glError);
    }

    // Step 5: Reduce Inventory with FIFO
    let totalCOGS = 0;

    for (const item of lineItems) {
      let remainingQty = item.quantity;
      const batchesUsed: BatchUsed[] = [];

      // Get batches ordered by received_date (FIFO)
      const { data: batches } = await supabase
        .from("inventory_batches")
        .select("id, batch_number, current_quantity, product_id")
        .eq("product_id", item.product_id)
        .gt("current_quantity", 0)
        .eq("status", "active")
        .order("received_date", { ascending: true });

      if (batches && batches.length > 0) {
        for (const batch of batches) {
          if (remainingQty <= 0) break;

          const deductQty = Math.min(remainingQty, batch.current_quantity);
          const newQty = batch.current_quantity - deductQty;

          // Update batch quantity
          await supabase
            .from("inventory_batches")
            .update({
              current_quantity: newQty,
              status: newQty === 0 ? "consumed" : "active",
            })
            .eq("id", batch.id);

          // Log inventory transaction
          await supabase.from("inventory_transactions").insert({
            product_id: item.product_id,
            batch_id: batch.id,
            quantity: -deductQty,
            transaction_type: "issue",
            reference_type: "pos_sale",
            reference_id: invoice.id,
            notes: `POS Sale ${invoiceNumber}`,
            transaction_date: transactionDate.toISOString(),
          });

          batchesUsed.push({
            batch_id: batch.id,
            batch_number: batch.batch_number,
            quantity: deductQty,
            unit_cost: item.cost_at_sale,
          });

          totalCOGS += deductQty * item.cost_at_sale;
          remainingQty -= deductQty;
        }
      }

      // Update aggregate inventory
      const { data: inventoryRecords } = await supabase
        .from("inventory")
        .select("id, quantity")
        .eq("product_id", item.product_id);

      if (inventoryRecords && inventoryRecords.length > 0) {
        const invRecord = inventoryRecords[0];
        await supabase
          .from("inventory")
          .update({
            quantity: Math.max(0, (invRecord.quantity || 0) - item.quantity),
          })
          .eq("id", invRecord.id);
      }

      // If no batches, just log the issue transaction
      if (!batches || batches.length === 0) {
        await supabase.from("inventory_transactions").insert({
          product_id: item.product_id,
          quantity: -item.quantity,
          transaction_type: "issue",
          reference_type: "pos_sale",
          reference_id: invoice.id,
          notes: `POS Sale ${invoiceNumber} (no batch)`,
          transaction_date: transactionDate.toISOString(),
        });

        totalCOGS += item.quantity * item.cost_at_sale;
      }

      // Update line item with batches used
      item.batches_used = batchesUsed;
    }

    // Step 6: Post COGS entries
    if (totalCOGS > 0) {
      const cogsEntries = [
        {
          entry_date: glEntryDate,
          account_code: "5100",
          account_name: "Cost of Goods Sold",
          description: `COGS - ${invoiceNumber}`,
          debit: totalCOGS,
          credit: 0,
          reference_type: "customer_invoice",
          reference_id: invoice.id,
        },
        {
          entry_date: glEntryDate,
          account_code: "1300",
          account_name: "Inventory",
          description: `Inventory reduction - ${invoiceNumber}`,
          debit: 0,
          credit: totalCOGS,
          reference_type: "customer_invoice",
          reference_id: invoice.id,
        },
      ];

      await supabase.from("general_ledger").insert(cogsEntries);
    }

    // Step 7: Create Receipt and Allocate
    let receiptId: string | null = null;

    if (amountPaid > 0) {
      const actualReceived = Math.min(amountPaid, totalAmount);

      const { data: receipt, error: receiptError } = await supabase
        .from("customer_receipts")
        .insert({
          receipt_number: receiptNumber,
          customer_id: customerId,
          receipt_date: transactionDate.toISOString().split("T")[0],
          amount: actualReceived,
          payment_method: payload.payment_method || "cash",
          bank_account: payload.bank_account_id,
          reference_number: payload.transaction_id,
          status: "allocated",
          notes: `POS Receipt - ${invoiceNumber}`,
        })
        .select("id, receipt_number")
        .single();

      if (receiptError) {
        console.error("Error creating receipt:", receiptError);
      } else if (receipt) {
        receiptId = receipt.id;

        // Create receipt allocation
        await supabase.from("receipt_allocations").insert({
          receipt_id: receipt.id,
          invoice_id: invoice.id,
          amount: actualReceived,
        });

        console.log("Created receipt:", receipt.receipt_number);
      }

      // Step 8: Record bank transaction
      if (payload.bank_account_id) {
        const bankTxnNumber = generateNumber("BTX", transactionDate);

        await supabase.from("bank_transactions").insert({
          transaction_number: bankTxnNumber,
          bank_account_id: payload.bank_account_id,
          transaction_date: transactionDate.toISOString().split("T")[0],
          transaction_type: "deposit",
          amount: actualReceived,
          payee_payer: payload.customer_code || "Walk-In Customer",
          description: `POS Sale ${invoiceNumber}`,
          reference_number: receiptNumber,
          source_type: "customer_receipt",
          source_id: receiptId,
        });

        // Update bank balance directly
        const { data: bankData } = await supabase
          .from("bank_accounts")
          .select("current_balance")
          .eq("id", payload.bank_account_id)
          .single();

        if (bankData) {
          await supabase
            .from("bank_accounts")
            .update({ current_balance: (bankData.current_balance || 0) + actualReceived })
            .eq("id", payload.bank_account_id);
        }
      }
    }

    // Step 9: Create POS Sale Log
    const { data: posSale } = await supabase
      .from("pos_sales")
      .insert({
        pos_terminal_id: payload.pos_terminal_id,
        pos_transaction_id: payload.transaction_id,
        transaction_datetime: transactionDate.toISOString(),
        customer_id: customerId,
        invoice_id: invoice.id,
        receipt_id: receiptId,
        subtotal: subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        amount_paid: amountPaid,
        change_given: changeGiven,
        payment_method: payload.payment_method,
        bank_account_id: payload.bank_account_id,
        status: "completed",
        raw_payload: payload as unknown as Record<string, unknown>,
      })
      .select("id")
      .single();

    // Create POS sale items
    if (posSale) {
      const saleItems = lineItems.map((item) => ({
        pos_sale_id: posSale.id,
        product_id: item.product_id,
        sku: item.sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        tax_rate: item.tax_rate,
        line_total: item.line_total,
        cost_at_sale: item.cost_at_sale,
        batches_used: item.batches_used,
      }));

      await supabase.from("pos_sale_items").insert(saleItems);
    }

    console.log("POS Sale completed successfully:", invoiceNumber);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        erp_invoice_number: invoice.invoice_number,
        invoice_id: invoice.id,
        receipt_number: receiptId ? receiptNumber : null,
        receipt_id: receiptId,
        subtotal: subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        amount_paid: amountPaid,
        change_due: changeGiven,
        balance_due: balanceDue,
        inventory_updated: true,
        gl_posted: true,
        cogs_amount: totalCOGS,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("POS Sale Error:", error);

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
