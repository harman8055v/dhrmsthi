import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { blocked_user_id } = await request.json()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Block user
    const { error: blockError } = await supabase.from("blocked_users").insert({
      blocker_id: user.id,
      blocked_id: blocked_user_id,
    })

    if (blockError) {
      console.error('[Block API] Database error:', blockError)
      return NextResponse.json({ 
        error: "Failed to block user", 
        details: blockError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Block error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
