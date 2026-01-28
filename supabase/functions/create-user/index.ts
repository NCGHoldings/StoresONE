import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  fullName: string;
  department?: string;
  phone?: string;
  roles: string[];
  sendInvite: boolean;
  temporaryPassword?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create regular client to verify caller's auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the calling user
    const { data: { user: caller }, error: callerError } = await supabaseClient.auth.getUser();
    if (callerError || !caller) {
      throw new Error("Unauthorized: Invalid session");
    }

    // Verify caller has admin role
    const { data: hasAdminRole } = await supabaseAdmin.rpc("has_role", {
      _user_id: caller.id,
      _role: "admin",
    });

    if (!hasAdminRole) {
      throw new Error("Unauthorized: Admin role required");
    }

    // Parse request body
    const body: CreateUserRequest = await req.json();
    const { email, fullName, department, phone, roles, sendInvite, temporaryPassword } = body;

    // Validate required fields
    if (!email || !fullName || !roles || roles.length === 0) {
      throw new Error("Email, full name, and at least one role are required");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUsers?.users?.some(u => u.email === email);
    if (userExists) {
      throw new Error("A user with this email already exists");
    }

    // Create the user
    let createUserOptions: any = {
      email,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    };

    if (sendInvite) {
      // User will receive an invite email to set their password
      createUserOptions.password = crypto.randomUUID(); // Temporary password, user will reset
    } else if (temporaryPassword) {
      createUserOptions.password = temporaryPassword;
    } else {
      throw new Error("Either sendInvite must be true or temporaryPassword must be provided");
    }

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser(createUserOptions);

    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    if (!newUser.user) {
      throw new Error("User creation failed");
    }

    // Update profile with additional info
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: fullName,
        department: department || null,
        phone: phone || null,
        is_active: true,
      })
      .eq("id", newUser.user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
    }

    // Remove default viewer role if other roles are being assigned
    if (roles.length > 0 && !roles.includes("viewer")) {
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", newUser.user.id)
        .eq("role", "viewer");
    }

    // Assign roles (skip viewer if already assigned by trigger)
    for (const role of roles) {
      if (role === "viewer") continue; // Already assigned by trigger
      
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: newUser.user.id, role });

      if (roleError && !roleError.message.includes("duplicate")) {
        console.error(`Failed to assign role ${role}:`, roleError);
      }
    }

    // If sendInvite, send password reset email
    if (sendInvite) {
      const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
        type: "invite",
        email,
      });
      
      if (resetError) {
        console.error("Failed to send invite email:", resetError);
      }
    }

    // Log the action
    await supabaseAdmin.from("audit_logs").insert({
      user_id: caller.id,
      entity_type: "user",
      entity_id: newUser.user.id,
      action: "create",
      new_values: { email, fullName, department, roles },
    });

    return new Response(
      JSON.stringify({
        success: true,
        userId: newUser.user.id,
        email: newUser.user.email,
        message: sendInvite 
          ? "User created. An invitation email has been sent." 
          : "User created successfully.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in create-user function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
