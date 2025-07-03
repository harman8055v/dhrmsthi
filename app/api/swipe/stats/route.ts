import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client with service role key for server-side operations
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Get the authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")

    // Verify the JWT token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's plan and limits
    const { data: userProfile } = await supabase
      .from("users")
      .select("account_status, super_likes_count, message_highlights_count")
      .eq("id", user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Get daily limit
    const { data: dailyLimit } = await supabase.rpc("get_user_swipe_limit", {
      p_user_id: user.id,
    })

    // Get today's stats
    const { data: dailyStats } = await supabase
      .from("user_daily_stats")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", new Date().toISOString().split("T")[0])
      .single()

    const swipesUsed = dailyStats?.swipes_used || 0
    const superlikesUsed = dailyStats?.superlikes_used || 0
    const highlightsUsed = dailyStats?.message_highlights_used || 0

    return NextResponse.json({
      plan: userProfile.account_status || "drishti",
      daily_limit: dailyLimit,
      swipes_used: swipesUsed,
      swipes_remaining: dailyLimit === -1 ? -1 : Math.max(0, dailyLimit - swipesUsed),
      super_likes_available: userProfile.super_likes_count || 0,
      superlikes_used_today: superlikesUsed,
      message_highlights_available: userProfile.message_highlights_count || 0,
      highlights_used_today: highlightsUsed,
      can_swipe: dailyLimit === -1 || swipesUsed < dailyLimit,
    })
  } catch (error) {
    console.error("Stats API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
