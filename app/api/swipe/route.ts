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

    // Don't check for existing swipe - let the database handle it with unique constraint
    // This avoids race conditions with optimistic updates

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
