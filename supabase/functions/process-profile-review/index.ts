// Deno Edge Function: process queued profile reviews end-to-end
// Notifications use only {{name}}; no other variables.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// Support both legacy and working WATI env vars; prefer working OTP pattern
const WATI_API_ENDPOINT = Deno.env.get("WATI_API_ENDPOINT") || Deno.env.get("WATI_BASE_URL") || "";
const WATI_ACCESS_TOKEN = Deno.env.get("WATI_ACCESS_TOKEN") || Deno.env.get("WATI_TOKEN") || "";
const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY")!;
const SENDGRID_FROM_EMAIL = Deno.env.get("SENDGRID_FROM_EMAIL")!;
const SENDGRID_REPLY_TO_EMAIL = Deno.env.get("SENDGRID_REPLY_TO_EMAIL") || "verification@dharmasaathi.com";

// New template names
const WATI_TPL_VERIFIED = Deno.env.get("WATI_TPL_VERIFIED") || "verified_update";
const WATI_TPL_UNVERIFIED = Deno.env.get("WATI_TPL_UNVERIFIED") || "unverified_update";

const SG_TPL_VERIFIED = Deno.env.get("SG_TPL_VERIFIED")!;
const SG_TPL_MORE_INFO = Deno.env.get("SG_TPL_MORE_INFO")!;
const SG_TPL_REJECTED = Deno.env.get("SG_TPL_REJECTED")!;
const SG_TPL_PHOTOS_ISSUE = Deno.env.get("SG_TPL_PHOTOS_ISSUE")!;

const NOTIFY_ON_BACKFILL = (Deno.env.get("NOTIFY_ON_BACKFILL") || "true").toLowerCase() !== "false";
const PAUSE_NOTIFICATIONS = (Deno.env.get("PAUSE_NOTIFICATIONS") || "false").toLowerCase() === "true";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function extractObjectPaths(user: any): string[] {
  const paths = new Set<string>();
  const photos = user?.user_photos;
  if (Array.isArray(photos)) {
    for (const ph of photos) {
      if (typeof ph === "string") {
        const marker = "/object/public/user-photos/";
        const idx = ph.indexOf(marker);
        if (idx >= 0) {
          const p = ph.substring(idx + marker.length);
          if (p) paths.add(p);
        }
      }
      else if (ph && typeof ph === "object") {
        // try common keys
        if (typeof ph.url === "string") {
          const marker = "/object/public/user-photos/";
          const idx = ph.url.indexOf(marker);
          if (idx >= 0) {
            const p = ph.url.substring(idx + marker.length);
            if (p) paths.add(p);
          }
        }
        if (typeof ph.path === "string") {
          const p = ph.path.replace(/^\/?user-photos\//, "");
          if (p) paths.add(p);
        }
      }
    }
  }
  return Array.from(paths).slice(0, 6); // cap per user
}

function normalizePhone(p?: string | null) {
  if (!p) return null;
  return p.replace(/^\+/, "");
}

async function notifyWATI(phone: string | null | undefined, template: string, name: string) {
  const normalized = normalizePhone(phone);
  if (!normalized || !WATI_API_ENDPOINT || !WATI_ACCESS_TOKEN) return;
  const url = `${WATI_API_ENDPOINT}/api/v2/sendTemplateMessage?whatsappNumber=${normalized}`;
  const body = {
    template_name: template,
    broadcast_name: template,
    parameters: [{ name: "name", value: name }],
  };
  await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${WATI_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function notifySendGrid(email: string | null | undefined, templateId: string, name: string) {
  if (!email) return;
  await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${SENDGRID_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: { email: SENDGRID_FROM_EMAIL, name: "DharmaSaathi" },
      reply_to: { email: SENDGRID_REPLY_TO_EMAIL, name: "DharmaSaathi Verification" },
      personalizations: [
        { to: [{ email }], dynamic_template_data: { name } }
      ],
      template_id: templateId
    }),
  });
}

async function enqueueResubmitted(limit = 100) {
  // Find users who need review due to resubmission or explicit flag
  const { data: candidates } = await supabase
    .from("users")
    .select("id, resubmitted_at, last_reviewed_at, needs_review")
    .or("needs_review.eq.true,resubmitted_at.not.is.null")
    .limit(limit);
  if (!candidates?.length) return 0;

  let enqueued = 0;
  for (const u of candidates) {
    const resubmitted = !!u.resubmitted_at && (!u.last_reviewed_at || new Date(u.last_reviewed_at) < new Date(u.resubmitted_at));
    if (!resubmitted && !u.needs_review) continue;
    // Skip if already queued
    const { data: existing } = await supabase
      .from("profile_reviews_queue")
      .select("id,status")
      .eq("user_id", u.id)
      .in("status", ["pending", "processing"])
      .maybeSingle();
    if (existing) continue;
    await supabase.from("profile_reviews_queue").insert({ user_id: u.id, event: "resubmit", status: "pending" });
    enqueued++;
  }
  return enqueued;
}

async function markProviderNotification(userId: string, provider: "wati" | "email") {
  const now = new Date().toISOString();
  if (provider === "wati") {
    await supabase.from("users").update({ wati_notified_at: now }).eq("id", userId);
  } else {
    await supabase.from("users").update({ email_notified_at: now }).eq("id", userId);
  }
  const { data } = await supabase
    .from("users")
    .select("email_notified_at, wati_notified_at")
    .eq("id", userId)
    .single();
  if (data?.email_notified_at && data?.wati_notified_at) {
    await supabase.from("users").update({ review_notified: true }).eq("id", userId);
  }
}

serve(async () => {
  await enqueueResubmitted(100);
  const { data: jobs } = await supabase.from("profile_reviews_queue").select("id,user_id,event").eq("status", "pending").order("created_at", { ascending: true }).limit(25);
  if (!jobs?.length) return new Response(JSON.stringify({ processed: 0 }), { status: 200 });

  for (const job of jobs) {
    await supabase.from("profile_reviews_queue").update({ status: "processing", attempts: 1 }).eq("id", job.id);

    const { data: user } = await supabase.from("users").select("id, email, phone, first_name, last_name, user_photos, about_me, profile_score").eq("id", job.user_id).single();
    const { data: rules } = await supabase.from("user_review_rules").select("*").eq("id", job.user_id).single();
    // Run text moderation in parallel (best-effort)
    try { await fetch(`${SUPABASE_URL}/functions/v1/moderate-text`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }, body: JSON.stringify({ userId: job.user_id }) }); } catch {}
    // Ensure photo moderation exists for this user's photos
    const paths = extractObjectPaths(user);
    for (const p of paths) {
      const object_path = `user-photos/${p.replace(/^\/+/, '')}`;
      const { data: existing } = await supabase
        .from("photo_moderation")
        .select("id,status")
        .eq("user_id", job.user_id)
        .eq("object_path", object_path)
        .maybeSingle();
      if (!existing) {
        await supabase.from("photo_moderation").insert({ user_id: job.user_id, object_path, status: "pending", provider: "pending" });
      }
      // Call moderate-photo now (await to keep it simple and consistent)
      await fetch(`${SUPABASE_URL}/functions/v1/moderate-photo`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
        body: JSON.stringify({ userId: job.user_id, bucket: "user-photos", path: p }),
      });
    }
    // Read latest moderation statuses
    const { data: photos } = await supabase.from("photo_moderation").select("status").eq("user_id", job.user_id);

    const statuses = (photos || []).map(p => p.status);
    const hasRejectedPhoto = statuses.includes("rejected");
    const hasApprovedPhoto = statuses.includes("approved");
    const hasAnyPhoto = Array.isArray(user?.user_photos) && user.user_photos.length > 0;
    const nameOK = Boolean((user?.first_name || '').trim() && (user?.last_name || '').trim());
    const bio = (user?.about_me || '').trim();
    const hasBio = bio.length >= 50; // tunable threshold

    // New 4-case logic
    // 4) Little/no details -> keep pending
    let finalStatus: 'verified' | 'pending' = 'pending';
    let reviewCategory: string = 'needs_more_details';
    let reviewReason: string = 'Auto classification';
    let profileScore: number | null = null;

    if (!nameOK || (!hasAnyPhoto && !hasBio)) {
      // Case 4: pending
      finalStatus = 'pending';
      reviewCategory = 'needs_more_details';
      reviewReason = 'Incomplete profile (name/photos/bio)';
    } else if (!hasAnyPhoto && hasBio) {
      // Case 2: verify without photos, send ds_verified
      finalStatus = 'verified';
      reviewCategory = 'eligible';
      reviewReason = 'Verified with bio; missing photos';
      profileScore = Math.min(Number(user?.profile_score || 6), 6);
    } else if (!hasRejectedPhoto && (hasApprovedPhoto || hasAnyPhoto)) {
      // Case 1 or 3: at least one acceptable photo and no red flags -> verify
      finalStatus = 'verified';
      if (hasBio) {
        // Case 3: all details
        reviewCategory = 'eligible';
        reviewReason = 'Verified - complete profile';
        profileScore = Math.max(Number(user?.profile_score || 8), 8);
      } else {
        // Case 1: photo ok, needs more info
        reviewCategory = 'eligible';
        reviewReason = 'Verified with minimal details; more info requested';
        profileScore = Math.min(Number(user?.profile_score || 7), 7);
      }
    } else {
      // Fallback: pending (e.g., red-flag photo present)
      finalStatus = 'pending';
      reviewCategory = 'red_flags';
      reviewReason = 'Photo policy issues or insufficient info';
    }

    // Build DB update
    let update: Record<string, unknown> = {
      review_category: reviewCategory,
      review_reason: reviewReason,
      suspicious_score: rules?.suspicious_score ?? 0,
      missing_fields: rules?.missing_fields ?? [],
      needs_review: false,
      last_reviewed_at: new Date().toISOString(),
      verification_status: finalStatus,
      is_verified: finalStatus === 'verified',
    };
    if (profileScore !== null) update = { ...update, profile_score: profileScore };
    await supabase.from("users").update(update).eq("id", job.user_id);

    // Notifications (WATI-only; respect pause/backfill)
    const name = (user?.first_name || "there") as string;
    const isBackfill = job.event === "backfill";
    const shouldNotify = !PAUSE_NOTIFICATIONS && (NOTIFY_ON_BACKFILL || !isBackfill);
    if (shouldNotify) {
      if (finalStatus === 'verified') {
        await notifyWATI(user?.phone, WATI_TPL_VERIFIED, name); await markProviderNotification(job.user_id, "wati");
      } else {
        await notifyWATI(user?.phone, WATI_TPL_UNVERIFIED, name); await markProviderNotification(job.user_id, "wati");
      }
    }

    await supabase.from("profile_reviews_queue").update({ status: "done" }).eq("id", job.id);
  }

  return new Response(JSON.stringify({ processed: jobs.length }), { status: 200 });
});


