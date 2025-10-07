import { type NextRequest, NextResponse } from "next/server"
import Razorpay from "razorpay"
import crypto from "crypto"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { logger } from "@/lib/logger"

// Validate environment variables
const validateEnvVars = () => {
  const requiredVars = {
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  }
  
  const missing = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key)
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

// Initialize Razorpay instance
const getRazorpayInstance = () => {
  validateEnvVars()
  
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID as string,
    key_secret: process.env.RAZORPAY_KEY_SECRET as string,
  })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params
  const cookieStore = await cookies(); const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  if (action === "order") {
    try {
      const razorpay = getRazorpayInstance()
      
      const { amount, currency = "INR", receipt, notes } = await request.json()
      
      logger.log("Payment order request:", {
        amount,
        currency,
        receipt,
        notes
      })
      
      // Validate required fields for one-time payments
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
      }
      
      // Create one-time order for all payment types (plans, superlikes, highlights)
      const order = await razorpay.orders.create({ 
        amount, 
        currency, 
        receipt, 
        notes 
      })
      
      logger.log("Order created successfully:", order.id)
      return NextResponse.json(order)
    } catch (error) {
      logger.error("Order creation error:", error)
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }
  }

  // Handle payment verification
  if (action === "verify") {
    try {
      const { order_id, payment_id, signature, item_type, item_name, amount, count } = await request.json()
      
      // Try to resolve the user via cookies first; if unavailable, we'll fallback to Razorpay order notes
      const { data: { user } } = await supabase.auth.getUser()
      
      // Verify payment signature
      const razorpay = getRazorpayInstance()
      const body = order_id + "|" + payment_id
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
        .update(body.toString())
        .digest("hex")
      
      const isSignatureValid = expectedSignature === signature
      
      if (isSignatureValid) {
        // Fallback: If auth cookies are missing (e.g., popup/3rd-party cookie blockers), try to fetch order notes for user_id
        let userIdToProcess: string | null = user?.id ?? null
        try {
          if (!userIdToProcess) {
            const orderDetails = await razorpay.orders.fetch(order_id as string)
            const notes = (orderDetails && (orderDetails as any).notes) || {}
            if (notes && typeof notes.user_id === "string" && notes.user_id.length > 0) {
              userIdToProcess = notes.user_id
            }
          }
        } catch (fetchErr) {
          logger.warn("Failed to fetch Razorpay order details for fallback user resolution", fetchErr)
        }
        
        if (!userIdToProcess) {
          logger.error("Unable to resolve user for verified payment", { order_id, payment_id })
          return NextResponse.json({ verified: false, error: "User not authenticated" }, { status: 401 })
        }
        
        // Process the payment
        const processResponse = await fetch(`${request.nextUrl.origin}/api/payments/process`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cookie": request.headers.get("Cookie") || "",
          },
          body: JSON.stringify({
            user_id: userIdToProcess,
            item_type,
            item_name,
            amount,
            count: count || 1,
            payment_id,
            order_id,
          }),
        })
        
        if (!processResponse.ok) {
          logger.error("Payment processing failed")
          return NextResponse.json({ error: "Payment processing failed" }, { status: 500 })
        }
        
        return NextResponse.json({ verified: true, message: "Payment verified and processed successfully" })
      } else {
        logger.error("Invalid payment signature")
        return NextResponse.json({ verified: false, error: "Invalid payment signature" }, { status: 400 })
      }
    } catch (error) {
      logger.error("Payment verification error:", error)
      return NextResponse.json({ verified: false, error: "Payment verification failed" }, { status: 500 })
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
