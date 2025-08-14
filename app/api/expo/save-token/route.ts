import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { token, platform = "android" } = await req.json();
  if (!token) return NextResponse.json({ error: "missing token" }, { status: 400 });

  await supabase
    .from("expo_push_tokens")
    .upsert({ user_id: user.id, token, platform, updated_at: new Date().toISOString() });

  return NextResponse.json({ ok: true });
}
