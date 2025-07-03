import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { reported_user_id, reason, details } = await request.json()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Create report
    const { error: reportError } = await supabase.from("user_reports").insert({
      reporter_id: user.id,
      reported_user_id,
      reason,
      details,
      status: "pending",
    })

    if (reportError) {
      return NextResponse.json({ error: "Failed to submit report" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Report error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
