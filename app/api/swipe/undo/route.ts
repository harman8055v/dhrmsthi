import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    // Create Supabase clients
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const supabaseAuth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // Use the admin client for DB operations
    const supabase = supabaseAdmin

    // Get the authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")

    // Validate the JWT using the anon client
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the profile ID to undo from request body
    const { swiped_user_id } = await request.json()

    if (!swiped_user_id) {
      return NextResponse.json({ error: "Missing swiped_user_id" }, { status: 400 })
    }

    // Check if user has access to undo feature (Sparsh plan and above)
    const { data: userProfile } = await supabase
      .from("users")
      .select("account_status")
      .eq("id", user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const plan = userProfile.account_status || 'drishti'
    const hasUndoAccess = plan === 'sparsh' || plan === 'sangam' || plan === 'samarpan'

    if (!hasUndoAccess) {
      return NextResponse.json({ 
        error: "Undo feature requires Sparsh plan or higher",
        upgrade_required: true 
      }, { status: 403 })
    }

    // Find and delete the most recent swipe record for this profile
    const { data: swipeRecord, error: findError } = await supabase
      .from("swipe_actions")
      .select("*")
      .eq("swiper_id", user.id)
      .eq("swiped_id", swiped_user_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (findError || !swipeRecord) {
      return NextResponse.json({ error: "No swipe record found to undo" }, { status: 404 })
    }

    // Delete the swipe record
    const { error: deleteError } = await supabase
      .from("swipe_actions")
      .delete()
      .eq("id", swipeRecord.id)

    if (deleteError) {
      console.error("Error deleting swipe record:", deleteError)
      return NextResponse.json({ error: "Failed to undo swipe" }, { status: 500 })
    }

    // If this was a match, we should also remove the match record
    if (swipeRecord.action === "like" || swipeRecord.action === "superlike") {
      // Check if there's a mutual match
      const { data: reverseSwipe } = await supabase
        .from("swipe_actions")
        .select("*")
        .eq("swiper_id", swiped_user_id)
        .eq("swiped_id", user.id)
        .in("action", ["like", "superlike"])
        .single()

      if (reverseSwipe) {
        // There was a match, remove it
        const { error: matchDeleteError } = await supabase
          .from("matches")
          .delete()
          .or(`and(user1_id.eq.${user.id},user2_id.eq.${swiped_user_id}),and(user1_id.eq.${swiped_user_id},user2_id.eq.${user.id})`)

        if (matchDeleteError) {
          console.error("Error deleting match record:", matchDeleteError)
          // Don't fail the request, but log the error
        }
      }
    }

    // Update daily stats to reflect the undo
    const today = new Date().toISOString().split("T")[0]
    
    // Decrement the swipe count for today
    const { error: statsError } = await supabase.rpc("decrement_daily_swipe", {
      p_user_id: user.id,
      p_date: today
    })

    if (statsError) {
      console.error("Error updating daily stats:", statsError)
      // Don't fail the request, but log the error
    }

    return NextResponse.json({ 
      success: true, 
      message: "Swipe undone successfully",
      undone_action: swipeRecord.action
    })

  } catch (error) {
    console.error("Undo swipe API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 