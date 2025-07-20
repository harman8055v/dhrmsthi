import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    // Extract bearer token from Authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
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

    const { swiped_user_id, action } = await request.json()

    // Verify JWT with service client
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    /*───────────────────────────────────────────────
      Daily-limit check (inlined – no SQL function).
    ───────────────────────────────────────────────*/
    // 1) Determine plan
    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('account_status')
      .eq('id', user.id)
      .single()

    const plan = (userRow?.account_status || 'drishti') as string

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
      const { data: stats } = await supabaseAdmin
        .rpc('get_or_create_daily_stats', { p_user_id: user.id })

      const swipesUsed = stats?.swipes_used ?? 0
      if (swipesUsed >= dailyLimit) {
        return NextResponse.json({ error: 'Daily swipe limit reached', limit_reached: true }, { status: 429 })
      }
    }

    // Check if user has already swiped on this profile
    const { data: existingSwipe } = await supabaseAdmin
      .from("swipe_actions")
      .select("*")
      .eq("swiper_id", user.id)
      .eq("swiped_id", swiped_user_id)
      .single()

    if (existingSwipe) {
      return NextResponse.json({ error: "Already swiped on this profile" }, { status: 400 })
    }

    // For superlikes, check if user has superlikes available
    if (action === "superlike") {
      const { data: userProfile } = await supabaseAdmin.from("users").select("super_likes_count").eq("id", user.id).single()

      if (!userProfile || userProfile.super_likes_count <= 0) {
        return NextResponse.json({ error: "No superlikes available" }, { status: 400 })
      }

      // Deduct superlike
      await supabaseAdmin
        .from("users")
        .update({ super_likes_count: userProfile.super_likes_count - 1 })
        .eq("id", user.id)
    }

    // Check if this creates a match (other user liked this user)
    let isMatch = false
    if (action === "like" || action === "superlike") {
      const { data: reciprocalSwipe } = await supabaseAdmin
        .from("swipe_actions")
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

        // Prevent duplicate unique-constraint errors if the match already exists
        const { data: existingMatch } = await supabaseAdmin
          .from("matches")
          .select("id")
          .or(`user1_id.eq.${user1_id},user2_id.eq.${user1_id}`)
          .eq("user1_id", user1_id)
          .eq("user2_id", user2_id)
          .single()

        if (!existingMatch) {
          await supabaseAdmin.from("matches").upsert({
            user1_id,
            user2_id,
            created_at: new Date().toISOString(),
          }, { onConflict: 'user1_id,user2_id', ignoreDuplicates: true })
        }
      }
    }

    // Record the swipe action
    const { error: swipeError } = await supabaseAdmin.from("swipe_actions").upsert({
      swiper_id: user.id,
      swiped_id: swiped_user_id,
      action,
      created_at: new Date().toISOString()
    }, { onConflict: 'swiper_id,swiped_id', ignoreDuplicates: true })

    if (swipeError) {
      console.error("Error recording swipe:", swipeError)
      return NextResponse.json({ error: "Failed to record swipe" }, { status: 500 })
    }

    // Update daily stats
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

    return NextResponse.json({
      success: true,
      is_match: isMatch,
      action,
    })
  } catch (error) {
    console.error("Swipe API error:", error)
    // In development return error details for easier debugging
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ error: (error as any)?.message || 'Server error', details: error }, { status: 500 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
