import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    // Create two Supabase clients:
    // 1) supabaseAdmin – service-role key for reading protected tables
    // 2) supabaseAuth  – anon key for JWT validation (does not create new sessions)
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const supabaseAuth  = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // Use the admin client for all DB queries below.
    const supabase = supabaseAdmin

    // Get the authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")

    // Validate the JWT using the *anon* client to prevent session bloat.
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token)

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
