import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { swiped_user_id, action } = await request.json()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // SIMPLE INLINE SWIPE LIMIT CHECK - NO RPC FUNCTIONS
    console.log("[Swipe API] Checking swipe limit for user:", user.id)
    
    try {
      // Get user's plan directly
      const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select("account_status")
        .eq("id", user.id)
        .single()
      
      if (profileError || !userProfile) {
        console.error("[Swipe API] Failed to get user profile:", profileError)
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }
      
      console.log("[Swipe API] User plan:", userProfile.account_status)
      
      // Set limits based on plan
      let dailyLimit = 5 // Default for drishti
      if (userProfile.account_status === 'sparsh') dailyLimit = 20
      if (userProfile.account_status === 'sangam') dailyLimit = 50
      if (userProfile.account_status === 'samarpan') dailyLimit = -1 // Unlimited
      
      console.log("[Swipe API] Daily limit for user:", dailyLimit)
      
      // If unlimited, skip limit check
      if (dailyLimit === -1) {
        console.log("[Swipe API] Unlimited plan - allowing swipe")
      } else {
        // Check today's usage
        const { data: dailyStats } = await supabase
          .from("user_daily_stats")
          .select("swipes_used")
          .eq("user_id", user.id)
          .eq("date", new Date().toISOString().split("T")[0])
          .single()
        
        const swipesUsed = dailyStats?.swipes_used || 0
        console.log("[Swipe API] Swipes used today:", swipesUsed, "/ limit:", dailyLimit)
        
        if (swipesUsed >= dailyLimit) {
          console.log("[Swipe API] Daily limit reached")
          return NextResponse.json({ 
            error: "Daily swipe limit reached", 
            limit_reached: true,
            swipes_used: swipesUsed,
            daily_limit: dailyLimit,
            upgrade_message: "Upgrade your plan for more daily swipes!",
            current_plan: userProfile.account_status,
            store_link: "/dashboard/store"
          }, { status: 429 })
        }
      }
      
    } catch (error) {
      console.error("[Swipe API] Error in swipe limit check:", error)
      // Continue with swipe even if limit check fails
    }

    // Don't check for existing swipe - let the database handle it with unique constraint
    // This avoids race conditions with optimistic updates

    // For superlikes, check if user has superlikes available and plan access
    if (action === "superlike") {
      const { data: userProfile } = await supabase.from("users").select("super_likes_count, account_status").eq("id", user.id).single()

      if (!userProfile) {
        return NextResponse.json({ error: "User profile not found" }, { status: 404 })
      }

      // Check if user's plan allows Super Likes (only sangam and samarpan)
      if (!['sangam', 'samarpan'].includes(userProfile.account_status || '')) {
        return NextResponse.json({ 
          error: "Super Likes not available on your plan", 
          upgrade_required: true,
          message: "Upgrade to Sangam or Samarpan plan to use Super Likes",
          store_link: "/dashboard/store"
        }, { status: 403 })
      }

      if (userProfile.super_likes_count <= 0) {
        return NextResponse.json({ 
          error: "No superlikes available",
          message: "You've used all your monthly Super Likes. They reset monthly or you can purchase more."
        }, { status: 400 })
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

        const { error: matchError } = await supabase.from("matches").insert({
          user1_id,
          user2_id,
          created_at: new Date().toISOString()
        })
        
        // Ignore duplicate match errors
        if (matchError && matchError.code !== '23505') {
          console.error("Error creating match:", matchError)
        }
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
      
      // Check if it's a duplicate key error
      if (swipeError.code === '23505') {
        console.log("Duplicate swipe detected, treating as success")
        return NextResponse.json({
          success: true,
          is_match: isMatch,
          action,
        })
      }
      
      return NextResponse.json({ 
        error: "Failed to record swipe",
        details: swipeError.message 
      }, { status: 500 })
    }

    // Update daily stats directly - NO RPC FUNCTIONS
    try {
      const today = new Date().toISOString().split("T")[0]
      
      // Create or update today's stats
      const { data: existingStats } = await supabase
        .from("user_daily_stats")
        .select("swipes_used, superlikes_used")
        .eq("user_id", user.id)
        .eq("date", today)
        .single()
      
      if (existingStats) {
        // Update existing record
        const updates: any = {
          swipes_used: existingStats.swipes_used + 1,
          updated_at: new Date().toISOString()
        }
        
        if (action === "superlike") {
          updates.superlikes_used = existingStats.superlikes_used + 1
        }
        
        await supabase
          .from("user_daily_stats")
          .update(updates)
          .eq("user_id", user.id)
          .eq("date", today)
        
        console.log("[Swipe API] Updated daily stats for user", user.id)
      } else {
        // Create new record
        await supabase
          .from("user_daily_stats")
          .insert({
            user_id: user.id,
            date: today,
            swipes_used: 1,
            superlikes_used: action === "superlike" ? 1 : 0,
            message_highlights_used: 0
          })
        
        console.log("[Swipe API] Created new daily stats for user", user.id)
      }
      
    } catch (error) {
      console.error("[Swipe API] Error updating daily stats:", error)
      // Don't fail the swipe if stats update fails
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

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { swiped_user_id } = await request.json()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // First check if the swipe exists
    const { data: existingSwipe, error: checkError } = await supabase
      .from("swipes")
      .select("*")
      .eq("swiper_id", user.id)
      .eq("swiped_id", swiped_user_id)
      .single()
    
    console.log("Existing swipe check:", { existingSwipe, checkError })
    
    if (!existingSwipe) {
      return NextResponse.json({ error: "No swipe to undo" }, { status: 404 })
    }

    // Use the database function to delete the swipe (bypasses RLS)
    const { data: deleteResult, error: deleteError } = await supabase
      .rpc('undo_swipe', {
        p_swiper_id: user.id,
        p_swiped_id: swiped_user_id
      })

    console.log("Delete function result:", { deleteResult, deleteError })

    if (deleteError) {
      console.error("Error calling undo_swipe function:", deleteError)
      return NextResponse.json({ error: deleteError.message, details: deleteError }, { status: 500 })
    }

    if (!deleteResult) {
      return NextResponse.json({ error: "No swipe was deleted" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Undo swipe API error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
