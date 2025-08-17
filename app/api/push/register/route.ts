import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

// Save/update the Expo push token for the authenticated user
// Body: { token: string, platform?: 'android'|'ios'|'web', deviceName?: string, appVersion?: string }
export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const token = (body?.token ?? body?.expoPushToken)?.toString();
  const platform = (body?.platform ?? "android").toString();
  const deviceName = body?.deviceName ? String(body.deviceName) : null;
  const appVersion = body?.appVersion ? String(body.appVersion) : null;

  if (!token || !token.startsWith("ExponentPushToken[")) {
    return NextResponse.json({ error: "invalid token" }, { status: 422 });
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("expo_push_tokens")
    .upsert({
      user_id: user.id,
      token,
      platform,
      device_name: deviceName,
      app_version: appVersion,
      updated_at: now,
    }, {
      onConflict: "user_id,token",
    });

  if (error) {
    return NextResponse.json({ error: "db error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// List current user's tokens (diagnostics)
export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("expo_push_tokens")
    .select("token, platform, updated_at, last_used_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: "db error" }, { status: 500 });
  return NextResponse.json({ tokens: data ?? [] });
}

// Delete current user's tokens (diagnostics)
export async function DELETE(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let tokenToDelete: string | undefined;
  try {
    const body = await req.json();
    tokenToDelete = body?.token ? String(body.token) : undefined;
  } catch {}

  const query = supabase.from("expo_push_tokens").delete().eq("user_id", user.id);
  const exec = tokenToDelete ? query.eq("token", tokenToDelete) : query;
  const { error } = await exec;
  if (error) return NextResponse.json({ error: "db error" }, { status: 500 });
  return NextResponse.json({ ok: true });
}


