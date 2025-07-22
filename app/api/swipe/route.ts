import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    console.log("=== SWIPE API START ===")
    
    // Extract bearer token from Authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ No auth header")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")

    // Two clients:
    // 1) supabaseAdmin – service role for DB writes
    // 2) supabaseAuth  – anon for verifying the JWT (avoids creating extra sessions)

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const requestBody = await request.json()
    console.log("📝 Request body:", requestBody)
    
    const { swiped_user_id, action } = requestBody

    if (!swiped_user_id || !action) {
      console.log("❌ Missing required fields:", { swiped_user_id, action })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify JWT with service client
    console.log("🔐 Verifying JWT...")
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token)

    if (authError || !user) {
      console.log("❌ Auth error:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ User authenticated:", user.id)

    /*───────────────────────────────────────────────
      Daily-limit check (inlined – no SQL function).
    ───────────────────────────────────────────────*/
    // 1) Determine plan
    console.log("📊 Checking user plan...")
    const { data: userRow, error: userError } = await supabaseAdmin
      .from('users')
      .select('account_status')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.log("❌ Error fetching user:", userError)
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
    }

    const plan = (userRow?.account_status || 'drishti') as string
    console.log("📋 User plan:", plan)

    let dailyLimit: number
    switch (plan) {
      case 'sparsh':
        dailyLimit = 20; break
      case 'sangam':
        dailyLimit = 50; break
      case 'samarpan':
        dailyLimit = -1; break // unlimited
      default:
        dailyLimit = 5; // drishti / unknown
    }

    if (dailyLimit !== -1) {
      // 2) get today's stats row (or create)
      console.log("📈 Checking daily stats...")
      try {
        const { data: stats, error: statsError } = await supabaseAdmin
          .rpc('get_or_create_daily_stats', { p_user_id: user.id })

        if (statsError) {
          console.log("⚠️ Stats error (continuing anyway):", statsError)
        }

        const swipesUsed = stats?.swipes_used ?? 0
        console.log(`📊 Swipes used: ${swipesUsed}/${dailyLimit}`)
        
        if (swipesUsed >= dailyLimit) {
          return NextResponse.json({ error: 'Daily swipe limit reached', limit_reached: true }, { status: 429 })
        }
      } catch (statsErr) {
        console.log("⚠️ Stats check failed (continuing anyway):", statsErr)
      }
    }

    // Check if user has already swiped on this profile
    console.log("🔍 Checking existing swipe...")
    const { data: existingSwipe, error: existingSwipeError } = await supabaseAdmin
      .from("swipe_actions")
      .select("*")
      .eq("swiper_id", user.id)
      .eq("swiped_id", swiped_user_id)
      .single()

    if (existingSwipeError && existingSwipeError.code !== 'PGRST116') {
      console.log("❌ Error checking existing swipe:", existingSwipeError)
      // Continue anyway - this isn't critical
    }

    if (existingSwipe) {
      console.log("⚠️ Already swiped on this profile")
      return NextResponse.json({ error: "Already swiped on this profile" }, { status: 400 })
    }

    // For superlikes, check if user has superlikes available
    if (action === "superlike") {
      console.log("⭐ Checking superlike count...")
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from("users")
        .select("super_likes_count")
        .eq("id", user.id)
        .single()

      if (profileError) {
        console.log("❌ Error fetching user profile for superlikes:", profileError)
        return NextResponse.json({ error: "Failed to check superlikes" }, { status: 500 })
      }

      if (!userProfile || userProfile.super_likes_count <= 0) {
        console.log("⚠️ No superlikes available")
        return NextResponse.json({ error: "No superlikes available" }, { status: 400 })
      }

      // Deduct superlike
      console.log("⭐ Deducting superlike...")
      const { error: updateError } = await supabaseAdmin
        .from("users")
        .update({ super_likes_count: userProfile.super_likes_count - 1 })
        .eq("id", user.id)

      if (updateError) {
        console.log("❌ Error updating superlike count:", updateError)
        return NextResponse.json({ error: "Failed to update superlikes" }, { status: 500 })
      }
    }

    // Check if this creates a match (other user liked this user)
    console.log("💕 Checking for match...")
    let isMatch = false
    if (action === "like" || action === "superlike") {
      const { data: reciprocalSwipe, error: reciprocalError } = await supabaseAdmin
        .from("swipe_actions")
        .select("*")
        .eq("swiper_id", swiped_user_id)
        .eq("swiped_id", user.id)
        .in("action", ["like", "superlike"])
        .single()

      if (reciprocalError && reciprocalError.code !== 'PGRST116') {
        console.log("⚠️ Error checking reciprocal swipe (continuing):", reciprocalError)
      }

      if (reciprocalSwipe) {
        isMatch = true
        console.log("🎉 Match found!")

        // Create match record
        const user1_id = user.id < swiped_user_id ? user.id : swiped_user_id
        const user2_id = user.id < swiped_user_id ? swiped_user_id : user.id

        console.log("💕 Creating match record...")
        // Prevent duplicate unique-constraint errors if the match already exists
        const { data: existingMatch, error: existingMatchError } = await supabaseAdmin
          .from("matches")
          .select("id")
          .or(`user1_id.eq.${user1_id},user2_id.eq.${user1_id}`)
          .eq("user1_id", user1_id)
          .eq("user2_id", user2_id)
          .single()

        if (existingMatchError && existingMatchError.code !== 'PGRST116') {
          console.log("⚠️ Error checking existing match (continuing):", existingMatchError)
        }

        if (!existingMatch) {
          const { error: matchError } = await supabaseAdmin.from("matches").upsert({
            user1_id,
            user2_id,
            created_at: new Date().toISOString(),
          }, { onConflict: 'user1_id,user2_id', ignoreDuplicates: true })

          if (matchError) {
            console.log("❌ Error creating match:", matchError)
            // Don't return error - the swipe should still work
          }
        }
      }
    }

    // Record the swipe action
    console.log("📝 Recording swipe action...")
    const { error: swipeError } = await supabaseAdmin.from("swipe_actions").upsert({
      swiper_id: user.id,
      swiped_id: swiped_user_id,
      action,
      created_at: new Date().toISOString()
    }, { onConflict: 'swiper_id,swiped_id', ignoreDuplicates: true })

    if (swipeError) {
      console.error("❌ Error recording swipe:", swipeError)
      return NextResponse.json({ error: "Failed to record swipe", details: swipeError }, { status: 500 })
    }

    // Update daily stats (non-critical)
    console.log("📊 Updating daily stats...")
    try {
      const { error: statsError } = await supabaseAdmin.rpc("get_or_create_daily_stats", {
        p_user_id: user.id,
      })

      if (!statsError) {
        // Get current stats and increment
        const { data: currentStats } = await supabaseAdmin
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

          await supabaseAdmin
            .from("user_daily_stats")
            .update(updates)
            .eq("user_id", user.id)
            .eq("date", new Date().toISOString().split("T")[0])
        }
      }
    } catch (statsUpdateError) {
      console.log("⚠️ Stats update failed (non-critical):", statsUpdateError)
    }

    console.log("✅ Swipe successful!")
    return NextResponse.json({
      success: true,
      is_match: isMatch,
      action,
    })
  } catch (error) {
    console.error("💥 SWIPE API ERROR:", error)
    console.error("💥 Error stack:", (error as Error).stack)
    
    // In development return error details for easier debugging
    return NextResponse.json({ 
      error: (error as any)?.message || 'Server error', 
      details: process.env.NODE_ENV === 'development' ? error : undefined 
    }, { status: 500 })
  }
}
