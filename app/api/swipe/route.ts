import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { swiped_user_id, action } = await request.json()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user can swipe (daily limit)
    const { data: canSwipeData, error: canSwipeError } = await supabase.rpc("can_user_swipe", {
      p_user_id: user.id,
    })

    if (canSwipeError) {
      console.error("Error checking swipe limit:", canSwipeError)
      return NextResponse.json({ error: "Failed to check swipe limit" }, { status: 500 })
    }

    if (!canSwipeData) {
      return NextResponse.json({ error: "Daily swipe limit reached", limit_reached: true }, { status: 429 })
    }

    // Check if user has already swiped on this profile
    const { data: existingSwipe } = await supabase
      .from("swipes")
      .select("*")
      .eq("swiper_id", user.id)
      .eq("swiped_id", swiped_user_id)
      .single()

    if (existingSwipe) {
      return NextResponse.json({ error: "Already swiped on this profile" }, { status: 400 })
    }

    // For superlikes, check if user has superlikes available
    if (action === "superlike") {
      const { data: userProfile } = await supabase.from("users").select("super_likes_count").eq("id", user.id).single()

      if (!userProfile || userProfile.super_likes_count <= 0) {
        return NextResponse.json({ error: "No superlikes available" }, { status: 400 })
      }

      // Deduct superlike
      await supabase
        .from("users")
        .update({ super_likes_count: userProfile.super_likes_count - 1 })
        .eq("id", user.id)
    }

    // Check if this creates a match (other user liked this user)
    let isMatch = false
    if (action === "like" || action === "superlike") {
      const { data: reciprocalSwipe } = await supabase
        .from("swipes")
        .select("*")
        .eq("swiper_id", swiped_user_id)
        .eq("swiped_id", user.id)
        .in("action", ["like", "superlike"])
        .single()

      if (reciprocalSwipe) {
        isMatch = true

        // Create match record
        const user1_id = user.id < swiped_user_id ? user.id : swiped_user_id
        const user2_id = user.id < swiped_user_id ? swiped_user_id : user.id

        await supabase.from("matches").insert({
          user1_id,
          user2_id,
          created_at: new Date().toISOString()
        })
      }
    }

    // Record the swipe action
    const { error: swipeError } = await supabase.from("swipes").insert({
      swiper_id: user.id,
      swiped_id: swiped_user_id,
      action,
      created_at: new Date().toISOString()
    })

    if (swipeError) {
      console.error("Error recording swipe:", swipeError)
      return NextResponse.json({ error: "Failed to record swipe" }, { status: 500 })
    }

    // Update daily stats
    const { error: statsError } = await supabase.rpc("get_or_create_daily_stats", {
      p_user_id: user.id,
    })

    if (!statsError) {
      // Get current stats and increment
      const { data: currentStats } = await supabase
        .from("user_daily_stats")
        .select("swipes_used, superlikes_used")
        .eq("user_id", user.id)
        .eq("date", new Date().toISOString().split("T")[0])
        .single()

      if (currentStats) {
        const updates: any = {
          swipes_used: (currentStats.swipes_used || 0) + 1,
        }

        if (action === "superlike") {
          updates.superlikes_used = (currentStats.superlikes_used || 0) + 1
        }

        await supabase
          .from("user_daily_stats")
          .update(updates)
          .eq("user_id", user.id)
          .eq("date", new Date().toISOString().split("T")[0])
      }
    }

    return NextResponse.json({
      success: true,
      is_match: isMatch,
      action,
    })
  } catch (error) {
    console.error("Swipe API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
