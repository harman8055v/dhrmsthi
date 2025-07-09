// @ts-nocheck
// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/x/supabase_functions@1.3.1/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

interface NewUserRecord {
  email: string;
  raw_user_meta_data?: {
    first_name?: string;
  };
}

interface Payload {
  record: NewUserRecord;
}

serve(async (req: Request) => {
  try {
    const payload: Payload = await req.json();
    const { record } = payload;

    const email = record?.email?.trim();
    const firstName = record?.raw_user_meta_data?.first_name?.trim() || "there";

    if (!email) {
      console.error("[send-welcome-email] Missing email in payload", payload);
      return new Response(JSON.stringify({ error: "Email is required" }), { status: 400 });
    }

    // Environment variables
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SENDGRID_API_KEY) {
      console.error("[send-welcome-email] Missing required environment variables");
      return new Response(JSON.stringify({ error: "Server misconfiguration" }), { status: 500 });
    }

    // Supabase Admin Client
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Generate email confirmation link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email,
      options: {
        redirectTo: "https://www.dharmasaathi.com/email-confirmed",
      },
    });

    if (linkError || !linkData?.action_link) {
      console.error("[send-welcome-email] Failed to generate confirmation link", linkError);
      throw new Error("Could not generate email confirmation link");
    }

    const confirmationUrl = linkData.action_link;

    // Prepare SendGrid payload
    const sgBody = {
      from: { email: "contact@dharmasaathi.com", name: "DharmaSaathi" },
      personalizations: [
        {
          to: [{ email }],
          dynamic_template_data: {
            first_name: firstName,
            confirmation_url: confirmationUrl,
          },
        },
      ],
      template_id: "d-0fdfc76bb2574931906650980b8e9698",
    };

    // Send email via SendGrid
    const sgRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sgBody),
    });

    if (!sgRes.ok) {
      const errText = await sgRes.text();
      console.error("[send-welcome-email] SendGrid error", errText);
      throw new Error("Failed to send welcome email");
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-welcome-email] Unhandled error", err);
    return new Response(
      JSON.stringify({ error: err.message ?? "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}); 