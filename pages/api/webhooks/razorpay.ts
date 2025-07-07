import type { NextApiRequest, NextApiResponse } from "next"
import Razorpay from "razorpay"
import crypto from "crypto"
import { supabase } from "@/lib/supabase"

// Disable the default body parser so we can access the raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
}

// Utility: read raw request body as string
async function getRawBody(req: NextApiRequest): Promise<string> {
  const chunks: Buffer[] = []
  await new Promise<void>((resolve, reject) => {
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)))
    req.on("end", () => resolve())
    req.on("error", (err) => reject(err))
  })
  return Buffer.concat(chunks).toString("utf8")
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  // 1. Grab raw body & signature
  let rawBody: string
  try {
    rawBody = await getRawBody(req)
  } catch (err) {
    console.error("[razorpay-webhook] Failed to read raw body", err)
    return res.status(400).json({ error: "Invalid body" })
  }

  const signature = req.headers["x-razorpay-signature"] as string | undefined
  if (!signature) {
    return res.status(400).json({ error: "Missing signature" })
  }

  // 2. Verify signature using webhook secret
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("[razorpay-webhook] RAZORPAY_WEBHOOK_SECRET env var not set")
    return res.status(500).json({ error: "Server misconfiguration" })
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex")

  if (expectedSignature !== signature) {
    console.warn("[razorpay-webhook] Signature mismatch", { expectedSignature, signature })
    return res.status(400).json({ error: "Invalid signature" })
  }

  // 3. Parse event
  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch (err) {
    console.error("[razorpay-webhook] Failed to parse JSON", err)
    return res.status(400).json({ error: "Invalid JSON" })
  }

  console.log("[razorpay-webhook] Received event", event.event)

  try {
    switch (event.event) {
      case "payment.captured": {
        await handlePaymentCaptured(event.payload.payment.entity)
        break
      }
      default: {
        console.log("[razorpay-webhook] Unhandled event", event.event)
      }
    }
  } catch (processingErr) {
    console.error("[razorpay-webhook] Processing error", processingErr)
    return res.status(500).json({ error: "Event processing failed" })
  }

  return res.json({ received: true })
}

async function handlePaymentCaptured(payment: any) {
  const orderId: string | undefined = payment.order_id
  if (!orderId) {
    console.warn("[razorpay-webhook] payment.captured received without order_id", payment.id)
    return
  }

  // Fetch the corresponding order to get our custom notes (metadata)
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID as string,
    key_secret: process.env.RAZORPAY_KEY_SECRET as string,
  })

  let orderDetails: any
  try {
    orderDetails = await razorpay.orders.fetch(orderId)
  } catch (err) {
    console.error("[razorpay-webhook] Failed fetching order", orderId, err)
    return
  }

  const notes = orderDetails.notes || {}
  const userId = notes.user_id as string | undefined
  const itemType = notes.item_type as string | undefined
  const itemName = notes.item_name as string | undefined
  const count = Number(notes.count || 1)

  if (!userId || !itemType) {
    console.warn("[razorpay-webhook] Missing userId/itemType in order notes", orderId, notes)
    return
  }

  // 1. Record / upsert transaction
  await supabase.from("transactions").upsert(
    {
      user_id: userId,
      razorpay_payment_id: payment.id,
      razorpay_order_id: orderId,
      amount: payment.amount,
      status: payment.status, // should be "captured"
      metadata: {
        item_type: itemType,
        item_name: itemName,
        count,
        payment_type: "one_time",
      },
    },
    { onConflict: "razorpay_payment_id" }
  )

  // 2. Fulfil purchase based on item type
  if (itemType === "super_likes") {
    const { data: userData, error: fetchErr } = await supabase
      .from("users")
      .select("super_likes_count")
      .eq("id", userId)
      .single()

    if (fetchErr) {
      console.error("[razorpay-webhook] Failed fetching user", fetchErr)
      return
    }

    const currentCount = userData?.super_likes_count || 0
    const { error: updateErr } = await supabase
      .from("users")
      .update({ super_likes_count: currentCount + count })
      .eq("id", userId)

    if (updateErr) {
      console.error("[razorpay-webhook] Failed updating super likes", updateErr)
      return
    }

    console.log(`[razorpay-webhook] Added ${count} super likes to user ${userId}`)
  }
} 