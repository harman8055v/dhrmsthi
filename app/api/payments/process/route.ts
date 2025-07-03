import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { user_id, item_type, item_name, amount, count, payment_id, order_id } = await request.json()

    // Record the transaction
    const { error: transactionError } = await supabase.from("transactions").insert({
      user_id,
      razorpay_payment_id: payment_id,
      razorpay_order_id: order_id,
      amount: amount * 100, // Convert to paise
      status: "completed",
      metadata: {
        item_type,
        item_name,
        count,
        payment_type: "one_time",
      },
    })

    if (transactionError) {
      console.error("Transaction recording error:", transactionError)
      return NextResponse.json({ error: "Failed to record transaction" }, { status: 500 })
    }

    // Process based on item type
    if (item_type === "plan") {
      // Calculate premium duration based on plan name
      const expiryDate = new Date()
      if (item_name.includes("3 months")) {
        expiryDate.setMonth(expiryDate.getMonth() + 3)
      } else {
        expiryDate.setMonth(expiryDate.getMonth() + 1)
      }

      // Determine account status based on plan type
      let accountStatus = "premium"
      if (item_name.toLowerCase().includes("elite")) {
        accountStatus = "elite"
      }

      const { error: userUpdateError } = await supabase
        .from("users")
        .update({
          account_status: accountStatus,
          premium_expires_at: expiryDate.toISOString(),
        })
        .eq("id", user_id)

      if (userUpdateError) {
        console.error("User update error:", userUpdateError)
        return NextResponse.json({ error: "Failed to activate premium" }, { status: 500 })
      }
    } else if (item_type === "super_likes") {
      // Add super likes to user account
      const { data: userData, error: fetchError } = await supabase
        .from("users")
        .select("super_likes_count")
        .eq("id", user_id)
        .single()

      if (fetchError) {
        console.error("User fetch error:", fetchError)
        return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
      }

      const currentCount = userData.super_likes_count || 0
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({
          super_likes_count: currentCount + count,
        })
        .eq("id", user_id)

      if (userUpdateError) {
        console.error("Super likes update error:", userUpdateError)
        return NextResponse.json({ error: "Failed to add super likes" }, { status: 500 })
      }
    } else if (item_type === "highlights") {
      // Add message highlights to user account
      const { data: userData, error: fetchError } = await supabase
        .from("users")
        .select("message_highlights_count")
        .eq("id", user_id)
        .single()

      if (fetchError) {
        console.error("User fetch error:", fetchError)
        return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
      }

      const currentCount = userData.message_highlights_count || 0
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({
          message_highlights_count: currentCount + count,
        })
        .eq("id", user_id)

      if (userUpdateError) {
        console.error("Message highlights update error:", userUpdateError)
        return NextResponse.json({ error: "Failed to add message highlights" }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Payment processed successfully",
      item_type,
      item_name 
    })
  } catch (error) {
    console.error("Payment processing error:", error)
    return NextResponse.json({ error: "Payment processing failed" }, { status: 500 })
  }
}
