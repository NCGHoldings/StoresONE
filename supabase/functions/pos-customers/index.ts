import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Security: Configure CORS with allowed origins
const allowedOrigins = Deno.env.get("ALLOWED_POS_ORIGINS")?.split(",") || ["*"];
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigins[0] || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-pos-api-key",
};

// Rate limiting map (in-memory)
const rateLimitMap = new Map<string, number[]>();
const MAX_REQUESTS_PER_MINUTE = 120;

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const windowStart = now - 60000;
  const requests = rateLimitMap.get(clientId) || [];
  const recentRequests = requests.filter(t => t > windowStart);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitMap.set(clientId, recentRequests);
  return true;
}

interface CustomerWithBalance {
  customer_code: string;
  company_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  credit_limit: number;
  outstanding_balance: number;
  available_credit: number;
  payment_terms: number | null;
  status: string;
  billing_address: string | null;
  shipping_address: string | null;
  tax_id: string | null;
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
        console.log("Unauthorized POS customers access attempt");
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

    // Get client identifier for rate limiting
    const clientId = req.headers.get("x-pos-api-key") || req.headers.get("x-forwarded-for") || "anonymous";
    
    // Security: Rate limiting
    if (!checkRateLimit(clientId)) {
      console.log("Rate limit exceeded for client:", clientId);
      return new Response(
        JSON.stringify({
          success: false,
          error: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Please try again later.",
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const search = url.searchParams.get("search");
    const code = url.searchParams.get("code");
    const activeOnly = url.searchParams.get("active_only") !== "false"; // Default true

    // Input sanitization
    if (search && search.length > 100) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_REQUEST",
          message: "Search query too long",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("POS Customers request:", { search, code, activeOnly });

    // Build customer query
    let query = supabase
      .from("customers")
      .select("id, customer_code, company_name, contact_person, email, phone, credit_limit, payment_terms, status, billing_address, shipping_address, tax_id");

    // Filter by status if activeOnly
    if (activeOnly) {
      query = query.eq("status", "active");
    }

    // Filter by specific code
    if (code) {
      query = query.eq("customer_code", code);
    }

    // Search by name or code
    if (search) {
      query = query.or(`company_name.ilike.%${search}%,customer_code.ilike.%${search}%,contact_person.ilike.%${search}%`);
    }

    const { data: customers, error: customersError } = await query.order("company_name", { ascending: true });

    if (customersError) {
      console.error("Error fetching customers:", customersError);
      throw new Error("Failed to fetch customers");
    }

    if (!customers || customers.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          customers: [],
          total: 0,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get customer IDs for balance calculation
    const customerIds = customers.map((c) => c.id);

    // Calculate outstanding balances from customer_invoices
    const { data: invoices, error: invoicesError } = await supabase
      .from("customer_invoices")
      .select("customer_id, total_amount, amount_paid, status")
      .in("customer_id", customerIds)
      .not("status", "in", '("paid","cancelled")');

    if (invoicesError) {
      console.error("Error fetching invoices:", invoicesError);
    }

    // Calculate outstanding balance per customer
    const balanceMap = new Map<string, number>();
    if (invoices) {
      for (const inv of invoices) {
        const outstanding = (inv.total_amount || 0) - (inv.amount_paid || 0);
        const current = balanceMap.get(inv.customer_id) || 0;
        balanceMap.set(inv.customer_id, current + outstanding);
      }
    }

    // Map customers with their balances
    const customersWithBalance: CustomerWithBalance[] = customers.map((c) => {
      const outstanding = balanceMap.get(c.id) || 0;
      const creditLimit = c.credit_limit || 0;
      
      return {
        customer_code: c.customer_code,
        company_name: c.company_name,
        contact_person: c.contact_person,
        email: c.email,
        phone: c.phone,
        credit_limit: creditLimit,
        outstanding_balance: outstanding,
        available_credit: Math.max(0, creditLimit - outstanding),
        payment_terms: c.payment_terms,
        status: c.status,
        billing_address: c.billing_address,
        shipping_address: c.shipping_address,
        tax_id: c.tax_id,
      };
    });

    console.log(`Returning ${customersWithBalance.length} customers`);

    return new Response(
      JSON.stringify({
        success: true,
        customers: customersWithBalance,
        total: customersWithBalance.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("POS Customers Error:", error);

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
