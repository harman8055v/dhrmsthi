import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// Force dynamic behavior
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { user_id } = await request.json()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's current plan to verify premium access
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("account_status, verification_status")
      .eq("id", user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Check if user is verified
    if (userProfile.verification_status !== "verified") {
      return NextResponse.json({ error: "Verification required" }, { status: 403 })
    }

    const userPlan = userProfile.account_status || "drishti"
    const isPremium = userPlan === "sangam" || userPlan === "samarpan"

    // Only premium users can use instant match
    if (!isPremium) {
      return NextResponse.json({ 
        error: "Premium subscription required for instant matching",
        upgrade_required: true 
      }, { status: 403 })
    }

    // Verify that the other user actually liked this user
    const { data: existingLike, error: likeError } = await supabase
      .from("swipe_actions")
      .select("*")
      .eq("swiper_id", user_id)
      .eq("swiped_id", user.id)
      .in("action", ["like", "superlike"])
      .single()

    if (likeError || !existingLike) {
      return NextResponse.json({ error: "No like found from this user" }, { status: 404 })
    }

    // Check if they're already matched
    const { data: existingMatch } = await supabase
      .from("matches")
      .select("*")
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${user_id}),and(user1_id.eq.${user_id},user2_id.eq.${user.id})`)
      .single()

    if (existingMatch) {
      return NextResponse.json({ error: "Already matched with this user" }, { status: 400 })
    }

    // Check if current user has already swiped on this person
    const { data: currentUserSwipe } = await supabase
      .from("swipe_actions")
      .select("*")
      .eq("swiper_id", user.id)
      .eq("swiped_id", user_id)
      .single()

    if (currentUserSwipe) {
      return NextResponse.json({ error: "You've already swiped on this user" }, { status: 400 })
    }

    // Record the reciprocal like
    const { error: swipeError } = await supabase
      .from("swipe_actions")
      .insert({
        swiper_id: user.id,
        swiped_id: user_id,
        action: "like",
        created_at: new Date().toISOString()
      })

    if (swipeError) {
      console.error("Error recording reciprocal swipe:", swipeError)
      return NextResponse.json({ error: "Failed to record like" }, { status: 500 })
    }

    // Create the match
    const user1_id = user.id < user_id ? user.id : user_id
    const user2_id = user.id < user_id ? user_id : user.id

    const { error: matchError } = await supabase
      .from("matches")
      .insert({
        user1_id,
        user2_id,
        created_at: new Date().toISOString()
      })

    if (matchError) {
      console.error("Error creating match:", matchError)
      return NextResponse.json({ error: "Failed to create match" }, { status: 500 })
    }

    // Update daily stats for the like
    const { data: currentStats } = await supabase
      .from("user_daily_stats")
      .select("swipes_used")
      .eq("user_id", user.id)
      .eq("date", new Date().toISOString().split("T")[0])
      .single()

    if (currentStats) {
      await supabase
        .from("user_daily_stats")
        .update({
          swipes_used: (currentStats.swipes_used || 0) + 1,
        })
        .eq("user_id", user.id)
        .eq("date", new Date().toISOString().split("T")[0])
    } else {
      // Create daily stats if they don't exist
      await supabase.rpc("get_or_create_daily_stats", {
        p_user_id: user.id,
      })
      
      await supabase
        .from("user_daily_stats")
        .update({ swipes_used: 1 })
        .eq("user_id", user.id)
        .eq("date", new Date().toISOString().split("T")[0])
    }

    return NextResponse.json({
      success: true,
      is_match: true,
      message: "Instant match created successfully!"
    })

  } catch (error) {
    console.error("Instant match API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 