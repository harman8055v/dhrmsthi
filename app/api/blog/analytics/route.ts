import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { event, data } = await request.json()

    // Track different types of events
    const trackingData = {
      user_agent: request.headers.get("user-agent"),
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      referrer: request.headers.get("referer"),
      viewed_at: new Date().toISOString(),
      ...data,
    }

    switch (event) {
      case "page_view":
        await supabase.from("blog_post_views").insert(trackingData)
        break

      case "newsletter_signup":
        // Already handled in newsletter route
        break

      case "footer_button_click":
        await supabase.from("blog_post_views").insert({
          ...trackingData,
          post_id: null, // No specific post
          referrer: `footer_button_${data.page || "unknown"}`,
        })
        break

      default:
        console.log("Unknown event type:", event)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error tracking analytics:", error)
    return NextResponse.json({ error: "Failed to track event" }, { status: 500 })
  }
}
