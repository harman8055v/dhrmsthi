import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// Force dynamic behavior
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies(); 
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { user_id } = await request.json()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Run all validation queries in parallel for speed
    const [userProfileResult, existingLikeResult, existingMatchResult, currentUserSwipeResult] = await Promise.all([
      // Get user's current plan
      supabase
        .from("users")
        .select("account_status, verification_status")
        .eq("id", user.id)
        .single(),
      
      // Check if other user liked this user
      supabase
        .from("swipes")
        .select("*")
        .eq("swiper_id", user_id)
        .eq("swiped_id", user.id)
        .in("action", ["like", "superlike"])
        .single(),
      
      // Check if already matched
      supabase
        .from("matches")
        .select("*")
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${user_id}),and(user1_id.eq.${user_id},user2_id.eq.${user.id})`)
        .single(),
      
      // Check if current user already swiped
      supabase
        .from("swipes")
        .select("*")
        .eq("swiper_id", user.id)
        .eq("swiped_id", user_id)
        .single()
    ])

    const userProfile = userProfileResult.data
    const existingLike = existingLikeResult.data
    const existingMatch = existingMatchResult.data
    const currentUserSwipe = currentUserSwipeResult.data

    // Validate user profile
    if (!userProfile) {
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

    // Validate all conditions
    if (!existingLike) {
      return NextResponse.json({ error: "No like found from this user" }, { status: 404 })
    }

    if (existingMatch) {
      return NextResponse.json({ error: "Already matched with this user" }, { status: 400 })
    }

    if (currentUserSwipe) {
      return NextResponse.json({ error: "You've already swiped on this user" }, { status: 400 })
    }

    // Prepare batch operations
    const user1_id = user.id < user_id ? user.id : user_id
    const user2_id = user.id < user_id ? user_id : user.id
    const now = new Date().toISOString()
    const today = now.split("T")[0]

    // Execute swipe and match creation in parallel
    const [swipeResult, matchResult] = await Promise.all([
      // Record the reciprocal like
      supabase
        .from("swipes")
        .insert({
          swiper_id: user.id,
          swiped_id: user_id,
          action: "like",
          created_at: now
        }),
      
      // Create the match
      supabase
        .from("matches")
        .insert({
          user1_id,
          user2_id,
          created_at: now
        })
    ])

    if (swipeResult.error) {
      console.error("Error recording reciprocal swipe:", swipeResult.error)
      return NextResponse.json({ error: "Failed to record like" }, { status: 500 })
    }

    if (matchResult.error) {
      console.error("Error creating match:", matchResult.error)
      return NextResponse.json({ error: "Failed to create match" }, { status: 500 })
    }

    // Update stats asynchronously (don't wait for it)
    supabase.rpc("increment_swipe_count", {
      p_user_id: user.id,
      p_date: today
    }).then(() => {
      console.log("Stats updated for instant match")
    }).catch(error => {
      console.error("Failed to update stats:", error)
      // Don't fail the match creation if stats update fails
    })

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