import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { reported_user_id, reason } = await request.json()

    // Validate input
    if (!reported_user_id) {
      return NextResponse.json({ 
        error: "Missing required fields", 
        message: "User ID is required" 
      }, { status: 400 })
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Note: User reporting is a safety feature available to all users regardless of plan

    // Create report
    const { error: reportError } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_user_id,
      reason,
    })

    if (reportError) {
      console.error('[Report API] Database error:', reportError)
      
      // Handle foreign key constraint violations
      if (reportError.message?.includes('reports_reported_user_id_fkey') || reportError.message?.includes('does not exist')) {
        return NextResponse.json({ 
          error: "Invalid user", 
          message: "The reported user does not exist",
          details: reportError.message 
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        error: "Failed to submit report", 
        message: "Unable to process your report. Please try again.",
        details: reportError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Report error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
