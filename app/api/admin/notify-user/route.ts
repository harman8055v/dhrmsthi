import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/withAuth"
import type { SupabaseClient, User } from "@supabase/supabase-js"

export const POST = withAuth(async (request: NextRequest, { supabase, user }: { supabase: SupabaseClient; user: User }) => {
  try {
    const { userId, message, type } = await request.json()

    // Only admins can send notifications
    if ((user.app_metadata as any)?.role !== 'admin' && (user.user_metadata as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get user details
    const { data: targetUser, error: userError } = await supabase
      .from("users")
      .select("email, phone, first_name, last_name")
      .eq("id", userId)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create notification record
    const { error: notificationError } = await supabase.from("notifications").insert({
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
    console.log(`Notification sent to ${targetUser.first_name} ${targetUser.last_name}:`, {
      email: targetUser.email,
      mobile: targetUser.phone,
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
})

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
