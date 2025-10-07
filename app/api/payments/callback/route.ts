import { type NextRequest, NextResponse } from "next/server"
import Razorpay from "razorpay"
import crypto from "crypto"
import { logger } from "@/lib/logger"

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

const getRazorpayInstance = () => {
  validateEnvVars()
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID as string,
    key_secret: process.env.RAZORPAY_KEY_SECRET as string,
  })
}

export async function POST(request: NextRequest) {
  try {
    // Razorpay sends form-encoded by default; accept both
    let payload: Record<string, any> = {}
    const contentType = request.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      payload = await request.json()
    } else {
      const form = await request.formData()
      form.forEach((value, key) => {
        payload[key] = value
      })
    }

    const razorpayOrderId = payload["razorpay_order_id"] as string | undefined
    const razorpayPaymentId = payload["razorpay_payment_id"] as string | undefined
    const razorpaySignature = payload["razorpay_signature"] as string | undefined

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      logger.error("Callback missing required fields", { hasOrderId: !!razorpayOrderId, hasPaymentId: !!razorpayPaymentId, hasSignature: !!razorpaySignature })
      return NextResponse.json({ verified: false, error: "Missing required fields" }, { status: 400 })
    }

    // Validate signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex")

    const isSignatureValid = expectedSignature === razorpaySignature
    if (!isSignatureValid) {
      logger.error("Invalid payment signature (callback)")
      return NextResponse.json({ verified: false, error: "Invalid payment signature" }, { status: 400 })
    }

    // Fetch order details for notes (contains user_id and item metadata)
    const razorpay = getRazorpayInstance()
    let notes: any = {}
    try {
      const orderDetails = await razorpay.orders.fetch(razorpayOrderId)
      notes = (orderDetails as any)?.notes || {}
    } catch (err) {
      logger.warn("Failed to fetch Razorpay order details in callback", err)
    }

    const userId = (notes && typeof notes.user_id === "string") ? notes.user_id : null
    const itemType = notes?.item_type
    const itemName = notes?.item_name
    const amount = Number(notes?.item_price) || undefined
    const count = Number(notes?.count) || 1

    if (!userId) {
      logger.error("Callback could not resolve user from order notes", { razorpayOrderId })
      return NextResponse.json({ verified: false, error: "User not resolvable" }, { status: 400 })
    }

    // Process the payment server-side
    const processResponse = await fetch(`${request.nextUrl.origin}/api/payments/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        item_type: itemType,
        item_name: itemName,
        amount,
        count,
        payment_id: razorpayPaymentId,
        order_id: razorpayOrderId,
      }),
    })

    if (!processResponse.ok) {
      logger.error("Payment processing failed in callback")
      return NextResponse.json({ verified: false, error: "Payment processing failed" }, { status: 500 })
    }

    // Redirect to a friendly page or return JSON based on need
    return NextResponse.json({ verified: true, message: "Payment verified and processed successfully" })
  } catch (error) {
    logger.error("Payment callback error:", error)
    return NextResponse.json({ verified: false, error: "Callback processing failed" }, { status: 500 })
  }
}


