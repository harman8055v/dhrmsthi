import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const event = await request.json()

    // Validate the event data
    if (!event.event || typeof event.event !== "string") {
      return NextResponse.json({ error: "Invalid event data" }, { status: 400 })
    }

    // Store the analytics event in Supabase
    const { error } = await supabase.from("analytics_events").insert({
      event_name: event.event,
      properties: event.properties || {},
      timestamp: event.timestamp || new Date().toISOString(),
      user_agent: request.headers.get("user-agent"),
      ip_address: request.ip || request.headers.get("x-forwarded-for"),
    })

    if (error) {
      console.error("Failed to store analytics event:", error)
      return NextResponse.json({ error: "Failed to store event" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Analytics API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventType = searchParams.get("event_type")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")

    let query = supabase.from("analytics_events").select("*").order("timestamp", { ascending: false })

    if (eventType) {
      query = query.eq("event_name", eventType)
    }

    if (startDate) {
      query = query.gte("timestamp", startDate)
    }

    if (endDate) {
      query = query.lte("timestamp", endDate)
    }

    const { data, error } = await query.limit(1000)

    if (error) {
      console.error("Failed to fetch analytics events:", error)
      return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
    }

    return NextResponse.json({ events: data })
  } catch (error) {
    console.error("Analytics API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
