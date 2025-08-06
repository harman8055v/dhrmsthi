import { type NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logger"

// Webhook handler disabled - subscriptions removed
export async function POST(request: NextRequest) {
  try {
    logger.log("Webhook endpoint called but subscriptions are disabled")
    return NextResponse.json({ message: "Subscriptions disabled" }, { status: 200 })
  } catch (error) {
    logger.error("Webhook processing error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

 