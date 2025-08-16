import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

const EXPO_ENDPOINT = "https://exp.host/--/api/v2/push/send";

const isAdminRole = (role: string | null): boolean => {
  if (!role) return false;
  const normalizedRole = role.toLowerCase();
  return normalizedRole === "admin" || normalizedRole === "super_admin" || normalizedRole === "superadmin";
};

export async function POST(req: Request) {
  const supabaseAuth = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabaseAuth.auth.getUser();

  // Allow server-to-server calls via internal key OR require admin user
  const internalKeyHeader = req.headers.get("x-internal-api-key");
  const expectedInternalKey = process.env.INTERNAL_API_KEY;
  const isInternalCall = Boolean(expectedInternalKey && internalKeyHeader && internalKeyHeader === expectedInternalKey);

  // Service role client for privileged DB access
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (!isInternalCall) {
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    // Verify admin role
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "user not found" }, { status: 404 });
    }
    if (!userData.is_active) {
      return NextResponse.json({ error: "account deactivated" }, { status: 403 });
    }
    if (!isAdminRole(userData.role)) {
      return NextResponse.json({ error: "admin access required" }, { status: 403 });
    }
  }

  const { userId, title, body, data } = await req.json();
  if (!userId || !title || !body) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  // Use service role for token lookup
  const { data: tokens, error: tokensError } = await supabaseAdmin
    .from("expo_push_tokens")
    .select("token")
    .eq("user_id", userId);

  if (tokensError) {
    return NextResponse.json({ error: "token lookup failed" }, { status: 500 });
  }

  if (!tokens?.length) return NextResponse.json({ ok: true, detail: "no tokens" });

  const messages = tokens.map(t => ({ to: t.token, title, body, sound: "default", data }));
  const res = await fetch(EXPO_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messages),
  });

  const out = await res.json();

  // Prune invalid tokens & touch healthy ones
  const invalid = new Set<string>();
  const ok = new Set<string>();
  const tickets = Array.isArray(out?.data) ? out.data : [];

  tickets.forEach((ticket: any, idx: number) => {
    const token = tokens[idx]?.token;
    const status = ticket?.status;
    const detailsError = ticket?.details?.error;
    if (status === "error" && (detailsError === "DeviceNotRegistered" || detailsError === "InvalidCredentials")) {
      if (token) invalid.add(token);
    } else if (status === "ok" && token) {
      ok.add(token);
    }
  });

  if (invalid.size) {
    await supabaseAdmin.from("expo_push_tokens").delete().in("token", Array.from(invalid));
  }
  if (ok.size) {
    try {
      await supabaseAdmin.rpc("touch_tokens_last_used", { tokens_in: Array.from(ok) });
    } catch {
      // Ignore RPC errors for now
    }
  }

  return NextResponse.json(out);
}
