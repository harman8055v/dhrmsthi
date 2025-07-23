import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    // Use cookie-based authentication like other working routes
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get current user from cookies
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Create service role client for operations that need elevated permissions
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Get user's plan and limits
    const { data: userProfile } = await supabaseAdmin
      .from("users")
      .select("account_status, super_likes_count, message_highlights_count")
      .eq("id", user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Get daily limit
    const { data: dailyLimit } = await supabaseAdmin.rpc("get_user_swipe_limit", {
      p_user_id: user.id,
    })

    // Get today's stats
    const { data: dailyStats } = await supabaseAdmin
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
