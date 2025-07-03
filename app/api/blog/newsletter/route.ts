import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from("blog_newsletter_subscribers")
      .select("id, is_active")
      .eq("email", email.toLowerCase())
      .single()

    if (existing) {
      if (existing.is_active) {
        return NextResponse.json({
          message: "You are already subscribed to our newsletter!",
        })
      } else {
        // Reactivate subscription
        const { error } = await supabase
          .from("blog_newsletter_subscribers")
          .update({
            is_active: true,
            subscribed_at: new Date().toISOString(),
            unsubscribed_at: null,
          })
          .eq("id", existing.id)

        if (error) {
          console.error("Error reactivating subscription:", error)
          return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 })
        }

        return NextResponse.json({
          message: "Welcome back! Your subscription has been reactivated.",
        })
      }
    }

    // Create new subscription
    const { error } = await supabase.from("blog_newsletter_subscribers").insert({
      email: email.toLowerCase(),
      name: name || null,
      is_active: true,
    })

    if (error) {
      console.error("Error creating subscription:", error)
      return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 })
    }

    // Track the subscription event
    await supabase.from("blog_post_views").insert({
      user_agent: request.headers.get("user-agent"),
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      referrer: request.headers.get("referer"),
      viewed_at: new Date().toISOString(),
    })

    return NextResponse.json({
      message: "Thank you for subscribing! You will receive our latest spiritual insights.",
    })
  } catch (error) {
    console.error("Error in newsletter subscription:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
