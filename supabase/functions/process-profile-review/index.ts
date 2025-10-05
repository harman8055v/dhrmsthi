// Deno Edge Function: process queued profile reviews end-to-end
// Notifications use only {{name}}; no other variables.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WATI_BASE_URL = Deno.env.get("WATI_BASE_URL")!;
const WATI_TOKEN = Deno.env.get("WATI_TOKEN")!;
const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY")!;
const SENDGRID_FROM_EMAIL = Deno.env.get("SENDGRID_FROM_EMAIL")!;

const WATI_TPL_VERIFIED = Deno.env.get("WATI_TPL_VERIFIED") || "profile_verified";
const WATI_TPL_MORE_INFO = Deno.env.get("WATI_TPL_MORE_INFO") || "profile_needs_more_info";
const WATI_TPL_REJECTED = Deno.env.get("WATI_TPL_REJECTED") || "profile_rejected";
const WATI_TPL_PHOTOS_ISSUE = Deno.env.get("WATI_TPL_PHOTOS_ISSUE") || "profile_photos_issue";

const SG_TPL_VERIFIED = Deno.env.get("SG_TPL_VERIFIED")!;
const SG_TPL_MORE_INFO = Deno.env.get("SG_TPL_MORE_INFO")!;
const SG_TPL_REJECTED = Deno.env.get("SG_TPL_REJECTED")!;
const SG_TPL_PHOTOS_ISSUE = Deno.env.get("SG_TPL_PHOTOS_ISSUE")!;

const NOTIFY_ON_BACKFILL = (Deno.env.get("NOTIFY_ON_BACKFILL") || "true").toLowerCase() !== "false";
const PAUSE_NOTIFICATIONS = (Deno.env.get("PAUSE_NOTIFICATIONS") || "false").toLowerCase() === "true";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function extractObjectPaths(user: any): string[] {
  const paths = new Set<string>();
  const addFromUrl = (url?: string | null) => {
    if (!url) return;
    const marker = "/object/public/user-photos/";
    const idx = url.indexOf(marker);
    if (idx >= 0) {
      const p = url.substring(idx + marker.length);
      if (p) paths.add(p);
    }
  };
  addFromUrl(user?.profile_photo_url);
  const photos = user?.user_photos;
  if (Array.isArray(photos)) {
    for (const ph of photos) {
      if (typeof ph === "string") addFromUrl(ph);
      else if (ph && typeof ph === "object") {
        // try common keys
        if (typeof ph.url === "string") addFromUrl(ph.url);
        if (typeof ph.path === "string") {
          const p = ph.path.replace(/^\/?user-photos\//, "");
          if (p) paths.add(p);
        }
      }
    }
  }
  return Array.from(paths).slice(0, 6); // cap per user
}

async function notifyWATI(phone: string | null | undefined, template: string, name: string) {
  if (!phone) return;
  await fetch(`${WATI_BASE_URL}/sendTemplateMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${WATI_TOKEN}` },
    body: JSON.stringify({ template_name: template, broadcast_name: "profile_verification", parameters: [{ name: "name", value: name }], recipients: [phone] }),
  });
}

async function notifySendGrid(email: string | null | undefined, templateId: string, name: string) {
  if (!email) return;
  await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${SENDGRID_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: { email: SENDGRID_FROM_EMAIL, name: "DharmaSaathi" }, personalizations: [{ to: [{ email }], dynamic_template_data: { name } }], template_id: templateId }),
  });
}

serve(async () => {
  const { data: jobs } = await supabase.from("profile_reviews_queue").select("id,user_id,event").eq("status", "pending").order("created_at", { ascending: true }).limit(25);
  if (!jobs?.length) return new Response(JSON.stringify({ processed: 0 }), { status: 200 });

  for (const job of jobs) {
    await supabase.from("profile_reviews_queue").update({ status: "processing", attempts: 1 }).eq("id", job.id);

    const { data: user } = await supabase.from("users").select("id, email, phone, first_name, last_name, profile_photo_url, user_photos").eq("id", job.user_id).single();
    const { data: rules } = await supabase.from("user_review_rules").select("*").eq("id", job.user_id).single();
    // Ensure photo moderation exists for this user's photos
    const paths = extractObjectPaths(user);
    for (const p of paths) {
      const object_path = `user-photos/${p}`;
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

    const hasRejectedPhoto = (photos || []).some((p) => p.status === "rejected");
    let category = rules?.category_suggested || "needs_more_details";
    let reason = hasRejectedPhoto ? "Photo policy issues" : "Rules";
    if (hasRejectedPhoto) category = "red_flags";

    // Finalize status
    let update: Record<string, unknown> = { review_category: category, review_reason: reason, suspicious_score: rules?.suspicious_score ?? 0, missing_fields: rules?.missing_fields ?? [], needs_review: false, last_reviewed_at: new Date().toISOString() };
    if (category === "exceptional" || category === "eligible") {
      update = { ...update, verification_status: "verified", is_verified: true };
    } else if (category === "red_flags") {
      update = { ...update, verification_status: "rejected", is_verified: false };
    } else {
      update = { ...update, verification_status: "pending", is_verified: false };
    }
    await supabase.from("users").update(update).eq("id", job.user_id);

    // Notifications (respect pause/backfill) & mark review_notified
    const name = (user?.first_name || "there") as string;
    const isBackfill = job.event === "backfill";
    const shouldNotify = !PAUSE_NOTIFICATIONS && (NOTIFY_ON_BACKFILL || !isBackfill);
    if (shouldNotify) {
      if (hasRejectedPhoto) {
        await notifyWATI(user?.phone, WATI_TPL_PHOTOS_ISSUE, name);
        await notifySendGrid(user?.email, SG_TPL_PHOTOS_ISSUE, name);
      } else if (category === "exceptional" || category === "eligible") {
        await notifyWATI(user?.phone, WATI_TPL_VERIFIED, name);
        await notifySendGrid(user?.email, SG_TPL_VERIFIED, name);
      } else if (category === "needs_more_details") {
        await notifyWATI(user?.phone, WATI_TPL_MORE_INFO, name);
        await notifySendGrid(user?.email, SG_TPL_MORE_INFO, name);
      } else {
        await notifyWATI(user?.phone, WATI_TPL_REJECTED, name);
        await notifySendGrid(user?.email, SG_TPL_REJECTED, name);
      }
      await supabase.from("users").update({ review_notified: true }).eq("id", job.user_id);
    }

    await supabase.from("profile_reviews_queue").update({ status: "done" }).eq("id", job.id);
  }

  return new Response(JSON.stringify({ processed: jobs.length }), { status: 200 });
});


