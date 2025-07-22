import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-razorpay-signature")

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 })
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET as string)
      .update(body)
      .digest("hex")

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const event = JSON.parse(body)
    console.log("Razorpay webhook event:", event.event)

    // Handle different webhook events
    switch (event.event) {
      case "subscription.activated":
        await handleSubscriptionActivated(event.payload)
        break
      
      case "subscription.charged":
        await handleSubscriptionCharged(event.payload)
        break
      
      case "subscription.halted":
        await handleSubscriptionHalted(event.payload)
        break
      
      case "subscription.cancelled":
        await handleSubscriptionCancelled(event.payload)
        break
      
      case "subscription.completed":
        await handleSubscriptionCompleted(event.payload)
        break
      
      default:
        console.log("Unhandled webhook event:", event.event)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

async function handleSubscriptionActivated(payload: any) {
  const subscription = payload.subscription.entity
  const user_id = subscription.notes?.user_id

  if (user_id) {
    // Update user's premium status
    const expiryDate = new Date()
    const billingCycle = subscription.notes?.billing_cycle || "monthly"
    
    if (billingCycle === "quarterly") {
      expiryDate.setMonth(expiryDate.getMonth() + 3)
    } else {
      expiryDate.setMonth(expiryDate.getMonth() + 1)
    }

    await supabase
      .from("users")
      .update({
        account_status: subscription.notes?.plan_name || "sparsh", // Use plan name from subscription notes
        premium_expires_at: expiryDate.toISOString(),
        razorpay_subscription_id: subscription.id,
      })
      .eq("id", user_id)
  }
}

async function handleSubscriptionCharged(payload: any) {
  const subscription = payload.subscription.entity
  const payment = payload.payment.entity
  const user_id = subscription.notes?.user_id

  if (user_id) {
    // Record the transaction
    await supabase.from("transactions").insert({
      user_id,
      razorpay_payment_id: payment.id,
      razorpay_subscription_id: subscription.id,
      amount: payment.amount,
      status: "completed",
      metadata: {
        item_type: "plan",
        item_name: subscription.notes?.plan_name || "Premium Plan",
        payment_type: "subscription",
        billing_cycle: subscription.notes?.billing_cycle,
      },
    })

    // Extend premium expiry
    const { data: user } = await supabase
      .from("users")
      .select("premium_expires_at")
      .eq("id", user_id)
      .single()

    if (user?.premium_expires_at) {
      const currentExpiry = new Date(user.premium_expires_at)
      const billingCycle = subscription.notes?.billing_cycle || "monthly"
      
      if (billingCycle === "quarterly") {
        currentExpiry.setMonth(currentExpiry.getMonth() + 3)
      } else {
        currentExpiry.setMonth(currentExpiry.getMonth() + 1)
      }

      await supabase
        .from("users")
        .update({
          premium_expires_at: currentExpiry.toISOString(),
        })
        .eq("id", user_id)
    }
  }
}

async function handleSubscriptionHalted(payload: any) {
  const subscription = payload.subscription.entity
  const user_id = subscription.notes?.user_id

  if (user_id) {
    // Optionally notify user about payment failure
    console.log(`Subscription halted for user ${user_id}`)
  }
}

async function handleSubscriptionCancelled(payload: any) {
  const subscription = payload.subscription.entity
  const user_id = subscription.notes?.user_id

  if (user_id) {
    // Downgrade user to free plan
    await supabase
      .from("users")
      .update({
        account_status: "drishti",
        premium_expires_at: null,
        razorpay_subscription_id: null,
      })
      .eq("id", user_id)
  }
}

async function handleSubscriptionCompleted(payload: any) {
  const subscription = payload.subscription.entity
  const user_id = subscription.notes?.user_id

  if (user_id) {
    // Downgrade user to free plan when subscription completes
    await supabase
      .from("users")
      .update({
        account_status: "drishti",
        premium_expires_at: null,
        razorpay_subscription_id: null,
      })
      .eq("id", user_id)
  }
} 