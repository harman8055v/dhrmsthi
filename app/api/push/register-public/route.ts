import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Public endpoint for direct token registration from native app
// No auth required - uses service role to bypass RLS
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, userId, platform = "android" } = body;

    // Validate inputs
    if (!token || !userId) {
      return NextResponse.json({ error: "missing token or userId" }, { status: 400 });
    }

    if (!token.startsWith("ExponentPushToken[")) {
      return NextResponse.json({ error: "invalid token format" }, { status: 422 });
    }

    // Validate UUID format for userId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json({ error: "invalid userId format" }, { status: 422 });
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if user exists
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: "user not found" }, { status: 404 });
    }

    // Upsert token
    const { error } = await supabase
      .from("expo_push_tokens")
      .upsert({
        user_id: userId,
        token,
        platform,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,token",
      });

    if (error) {
      console.error("Failed to save push token:", error);
      return NextResponse.json({ error: "database error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Push token registration error:", error);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
