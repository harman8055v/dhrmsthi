import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import Expo from "expo-server-sdk";
import type { ExpoPushMessage, ExpoPushReceipt, ExpoPushTicket } from "expo-server-sdk";

export const runtime = "nodejs";

const isAdminRole = (role: string | null): boolean => {
  if (!role) return false;
  const normalizedRole = role.toLowerCase();
  return normalizedRole === "admin" || normalizedRole === "super_admin" || normalizedRole === "superadmin";
};

let expo: Expo | null = null;
try {
  if (process.env.EXPO_ACCESS_TOKEN) {
    expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });
  } else {
    console.warn("⚠️ EXPO_ACCESS_TOKEN is not set. Push notifications will be disabled.");
  }
} catch (e) {
  console.error("Failed to initialize Expo SDK", e);
}


export async function POST(req: Request) {
  // Gracefully fail if Expo SDK isn't configured
  if (!expo) {
    return NextResponse.json({ error: "Push notifications are not configured on the server." }, { status: 503 });
  }

  const supabaseAuth = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabaseAuth.auth.getUser();

  // Allow server-to-server calls via internal key OR require admin user
  const internalKeyHeader = req.headers.get("x-internal-api-key");
  const expectedInternalKey = process.env.INTERNAL_API_KEY;
  const isInternalCall = !!(expectedInternalKey && internalKeyHeader && internalKeyHeader === expectedInternalKey);

  // Service role client for privileged DB access
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (!isInternalCall) {
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    // Verify admin role
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "user not found" }, { status: 404 });
    }
    if (!userData.is_active) {
      return NextResponse.json({ error: "account deactivated" }, { status: 403 });
    }
    if (!isAdminRole(userData.role)) {
      return NextResponse.json({ error: "admin access required" }, { status: 403 });
    }
  }

  const { userId, title, body, data: customData } = await req.json();
  if (!userId || !title || !body) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  // Use service role for token lookup
  const { data: tokens, error: tokensError } = await supabaseAdmin
    .from("expo_push_tokens")
    .select("token")
    .eq("user_id", userId);

  if (tokensError) {
    console.error("Token lookup failed:", tokensError);
    return NextResponse.json({ error: "token lookup failed" }, { status: 500 });
  }

  if (!tokens?.length) {
    return NextResponse.json({ ok: true, detail: "no tokens for user" });
  }

  const messages: ExpoPushMessage[] = tokens
    .filter(t => Expo.isExpoPushToken(t.token)) // Validate tokens
    .map(t => ({
      to: t.token,
      title,
      body,
      sound: "default",
      data: customData,
    }));
  
  if (messages.length === 0) {
    return NextResponse.json({ ok: true, detail: "no valid tokens for user" });
  }

  // Chunk and send notifications
  const chunks = expo.chunkPushNotifications(messages);
  const tickets: ExpoPushTicket[] = [];
  const ticketIdToToken = new Map<string, string>();
  
  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
      // Map ticket ids back to tokens using the order guarantee
      ticketChunk.forEach((ticket, index) => {
        if (ticket.status === "ok") {
          const toField = (chunk[index] as ExpoPushMessage).to;
          const token = Array.isArray(toField) ? toField[0] : toField;
          ticketIdToToken.set(ticket.id, token);
        }
      });
    } catch (error) {
      console.error("Error sending push notification chunk:", error);
      // You might want to return a specific error response here
    }
  }

  // Process receipts to find invalid tokens
  const invalidTokens = new Set<string>();
  const okTokens = new Set<string>();
  const receipts: ExpoPushReceipt[] = [];
  const receiptIds = tickets
    .filter((t): t is Extract<ExpoPushTicket, { status: "ok" }> => t.status === "ok")
    .map(t => t.id);

  if (receiptIds.length > 0) {
    const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
    for (const chunk of receiptIdChunks) {
      try {
        const receiptChunk = await expo.getPushNotificationReceiptsAsync(chunk);
        const typedReceiptChunk = receiptChunk as Record<string, ExpoPushReceipt>;
        for (const [receiptId, receipt] of Object.entries(typedReceiptChunk)) {
          receipts.push(receipt);
          const token = ticketIdToToken.get(receiptId);
          if (receipt.status === "error" && (receipt.details as any)?.error === "DeviceNotRegistered") {
            if (token) invalidTokens.add(token);
          } else if (receipt.status === "ok") {
            if (token) okTokens.add(token);
          }
        }
      } catch (error) {
        console.error("Error fetching push notification receipts:", error);
      }
    }
  }

  // Also check initial tickets for immediate errors
  tickets.forEach((ticket, i) => {
    if (ticket.status === "error" && (ticket.details as any)?.error === "DeviceNotRegistered") {
      const message = messages[i];
      if (message) {
        const tokenFromMessage = Array.isArray(message.to) ? message.to[0] : message.to;
        if (tokenFromMessage) invalidTokens.add(tokenFromMessage);
      }
    }
  });

  if (invalidTokens.size > 0) {
    console.log("Pruning invalid tokens:", Array.from(invalidTokens));
    await supabaseAdmin.from("expo_push_tokens").delete().in("token", Array.from(invalidTokens));
  }

  if (okTokens.size > 0) {
    try {
      await supabaseAdmin.rpc("touch_tokens_last_used", { tokens_in: Array.from(okTokens) });
    } catch (rpcError) {
      console.warn("Failed to touch tokens:", rpcError); // Non-critical, just log
    }
  }

  return NextResponse.json({ tickets, receipts });
}
