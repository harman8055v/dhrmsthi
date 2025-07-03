import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const { userId, message, type } = await request.json()

    // Create admin client with service role key
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Create auth client to verify user session
    const supabaseAuth = createRouteHandlerClient({ cookies })

    // Check if user is authenticated
    const {
      data: { session },
      error: sessionError,
    } = await supabaseAuth.auth.getSession()

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }

    // Get user details
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("email, phone, first_name, last_name")
      .eq("id", userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create notification record
    const { error: notificationError } = await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      title: getNotificationTitle(type),
      message: message,
      type: type,
      created_at: new Date().toISOString(),
      read: false,
    })

    if (notificationError) {
      console.error("Failed to create notification:", notificationError)
    }

    // Here you would integrate with SMS/Email service
    // For now, we'll just log the notification
    console.log(`Notification sent to ${user.first_name} ${user.last_name}:`, {
      email: user.email,
      mobile: user.phone,
      message,
      type,
    })

    // In a real implementation, you would:
    // 1. Send SMS via Twilio/AWS SNS
    // 2. Send email via SendGrid/AWS SES
    // 3. Send push notification

    return NextResponse.json({
      success: true,
      message: "Notification sent successfully",
    })
  } catch (error) {
    console.error("Notification API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function getNotificationTitle(type: string): string {
  switch (type) {
    case "profile_update":
      return "Profile Update Required"
    case "verification_pending":
      return "Verification Under Review"
    case "verification_approved":
      return "Profile Verified!"
    case "verification_rejected":
      return "Verification Update Needed"
    default:
      return "DharmaSaathi Notification"
  }
}
