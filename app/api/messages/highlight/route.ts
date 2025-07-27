import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies(); const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { message_id } = await request.json()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check user's plan and message highlights
    const { data: userProfile } = await supabase
      .from("users")
      .select("message_highlights_count, account_status")
      .eq("id", user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Check if user has messaging access
    const hasMessagingAccess = ['sparsh', 'sangam', 'samarpan'].includes(userProfile.account_status || '')
    if (!hasMessagingAccess) {
      return NextResponse.json({ 
        error: 'Upgrade required', 
        message: 'Message highlighting is available with Sparsh Plan or higher. Upgrade to access premium messaging features.',
        upgrade_url: '/dashboard/store'
      }, { status: 403 })
    }

    if (userProfile.message_highlights_count <= 0) {
      return NextResponse.json({ error: "No message highlights available" }, { status: 400 })
    }

    // Check if message belongs to user
    const { data: message } = await supabase
      .from("messages")
      .select("*, matches!inner(*)")
      .eq("id", message_id)
      .eq("sender_id", user.id)
      .single()

    if (!message) {
      return NextResponse.json({ error: "Message not found or unauthorized" }, { status: 404 })
    }

    // Highlight the message
    const { error: highlightError } = await supabase
      .from("messages")
      .update({ is_highlighted: true })
      .eq("id", message_id)

    if (highlightError) {
      return NextResponse.json({ error: "Failed to highlight message" }, { status: 500 })
    }

    // Deduct message highlight
    await supabase
      .from("users")
      .update({ message_highlights_count: userProfile.message_highlights_count - 1 })
      .eq("id", user.id)

    // Update daily stats
    await supabase.rpc("get_or_create_daily_stats", { p_user_id: user.id })
    await supabase
      .from("user_daily_stats")
      .update({ message_highlights_used: supabase.raw("message_highlights_used + 1") })
      .eq("user_id", user.id)
      .eq("date", new Date().toISOString().split("T")[0])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Message highlight error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
