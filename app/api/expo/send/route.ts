import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

const EXPO_ENDPOINT = "https://exp.host/--/api/v2/push/send";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  // TODO: Replace with a real admin check (role/claim)

  const { userId, title, body, data } = await req.json();
  if (!userId || !title || !body) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const { data: tokens } = await supabase
    .from("expo_push_tokens")
    .select("token")
    .eq("user_id", userId);

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
    await supabase.from("expo_push_tokens").delete().in("token", Array.from(invalid));
  }
  if (ok.size) {
    try {
      await supabase.rpc("touch_tokens_last_used", { tokens_in: Array.from(ok) });
    } catch (error) {
      // Ignore RPC errors for now
    }
  }

  return NextResponse.json(out);
}
