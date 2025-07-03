import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// Force dynamic behavior
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    console.log("=== WHO LIKED ME API CALLED ===")
    const supabase = createRouteHandlerClient({ cookies })

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("Auth result:", { user: user?.id, authError })

    if (authError || !user) {
      console.error("Auth error in who-liked-me:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's current plan
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("account_status, verification_status")
      .eq("id", user.id)
      .single()

    console.log("User profile result:", { userProfile, profileError })

    if (profileError || !userProfile) {
      console.error("User profile error:", profileError)
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // For testing, let's not block unverified users for now
    const userPlan = userProfile.account_status || "drishti"
    const isPremium = userPlan === "sangam" || userPlan === "samarpan"
    
    console.log("User plan info:", { userPlan, isPremium, verification: userProfile.verification_status })

    // Get users who liked the current user (exclude already matched users)
    console.log("Fetching existing matches for user:", user.id)
    const { data: existingMatches } = await supabase
      .from("matches")
      .select("user1_id, user2_id")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

    const matchedUserIds = existingMatches?.flatMap(match => 
      match.user1_id === user.id ? [match.user2_id] : [match.user1_id]
    ) || []

    // Build query for users who liked current user - simplified approach
    let swipeQuery = supabase
      .from("swipe_actions")
      .select("swiper_id, action, created_at")
      .eq("swiped_id", user.id)
      .in("action", ["like", "superlike"])
      .order("created_at", { ascending: false })

    // Exclude already matched users
    if (matchedUserIds.length > 0) {
      swipeQuery = swipeQuery.not("swiper_id", "in", `(${matchedUserIds.join(",")})`)
    }

    console.log("Executing swipe query for user:", user.id)
    const { data: swipes, error: swipesError } = await swipeQuery.limit(20)

    console.log("Swipe query result:", { swipesCount: swipes?.length, swipesError })

    // Handle case where swipe tables don't exist yet - graceful fallback
    if (swipesError && (swipesError.code === '42P01' || swipesError.message?.includes('does not exist'))) {
      console.log("Swipe tables don't exist yet, returning empty result")
      return NextResponse.json({
        likes: [],
        total_likes: 0,
        user_plan: userPlan,
        can_see_details: isPremium,
        upgrade_message: !isPremium ? 
          "Upgrade to Sangam or Samarpan plan to see who liked you and instantly match!" : 
          null
      })
    }

    if (swipesError) {
      console.error("Error fetching swipes:", swipesError)
      return NextResponse.json({ error: "Failed to fetch swipes" }, { status: 500 })
    }

    // If no swipes, return empty result
    if (!swipes || swipes.length === 0) {
      console.log("No swipes found, returning empty result")
      return NextResponse.json({
        likes: [],
        total_likes: 0,
        user_plan: userPlan,
        can_see_details: isPremium,
        upgrade_message: !isPremium ? 
          "Upgrade to Sangam or Samarpan plan to see who liked you and instantly match!" : 
          null
      })
    }

    // Get profile details for swipers
    const swiperIds = swipes.map(swipe => swipe.swiper_id)
    const { data: profiles, error: profilesError } = await supabase
      .from("users")
      .select(`
        id,
        first_name,
        last_name,
        profile_photo_url,
        user_photos,
        birthdate,
        gender,
        verification_status,
        city:city_id(name),
        state:state_id(name)
      `)
      .in("id", swiperIds)
      .eq("verification_status", "verified")

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError)
      return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 })
    }

    // Combine swipes with profiles
    const likes = swipes
      .map(swipe => {
        const profile = profiles?.find(p => p.id === swipe.swiper_id)
        if (!profile) {
          console.log(`Profile not found for swiper_id: ${swipe.swiper_id}`)
          return null
        }
        
        return {
          id: swipe.swiper_id,
          action: swipe.action,
          created_at: swipe.created_at,
          profile
        }
      })
      .filter(like => like !== null)

    // Process likes based on user plan
    const processedLikes = likes?.map(like => {
      const profile = like.profile as any
      
      // For basic users (drishti, sparsh), blur sensitive info
      if (!isPremium) {
        return {
          id: like.id,
          action: like.action,
          created_at: like.created_at,
          profile: {
            ...profile,
            // Blur personal details for basic users
            first_name: "Someone",
            last_name: "",
            profile_photo_url: null, // Will show blurred placeholder
            user_photos: null,
            // Keep basic demographic info visible to encourage upgrade
            gender: profile?.gender,
            city: profile?.city?.[0] || profile?.city,
            state: profile?.state?.[0] || profile?.state,
            is_premium: false
          }
        }
      }

      // For premium users (sangam, samarpan), show full details
      return {
        id: like.id,
        action: like.action,
        created_at: like.created_at,
        profile: {
          ...profile,
          city: profile?.city?.[0] || profile?.city,
          state: profile?.state?.[0] || profile?.state,
          is_premium: true
        }
      }
    }) || []

    console.log("SUCCESS: Returning processed likes:", { 
      processedLikesCount: processedLikes?.length, 
      userPlan, 
      isPremium 
    })
    
    return NextResponse.json({
      likes: processedLikes,
      total_likes: processedLikes?.length || 0,
      user_plan: userPlan,
      can_see_details: isPremium,
      upgrade_message: !isPremium ? 
        "Upgrade to Sangam or Samarpan plan to see who liked you and instantly match!" : 
        null
    })

  } catch (error) {
    console.error("Who liked me API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 