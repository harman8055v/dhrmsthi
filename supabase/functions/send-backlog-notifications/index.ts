// Deno Edge Function: bulk notifications dispatcher
// Sends WATI and/or SendGrid messages to users. Supports pending-only or all users.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WATI_API_ENDPOINT = Deno.env.get("WATI_API_ENDPOINT") || Deno.env.get("WATI_BASE_URL") || "";
const WATI_TOKEN = Deno.env.get("WATI_ACCESS_TOKEN") || Deno.env.get("WATI_TOKEN") || "";
const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY") || "";
const SENDGRID_FROM_EMAIL = Deno.env.get("SENDGRID_FROM_EMAIL") || "";
const SENDGRID_REPLY_TO_EMAIL = Deno.env.get("SENDGRID_REPLY_TO_EMAIL") || "verification@dharmasaathi.com";

const WATI_TPL_VERIFIED = Deno.env.get("WATI_TPL_VERIFIED") || "verified_update";
const WATI_TPL_UNVERIFIED = Deno.env.get("WATI_TPL_UNVERIFIED") || "unverified_update";

const SG_TPL_VERIFIED = Deno.env.get("SG_TPL_VERIFIED")!;
const SG_TPL_MORE_INFO = Deno.env.get("SG_TPL_MORE_INFO")!;
const SG_TPL_REJECTED = Deno.env.get("SG_TPL_REJECTED")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function notifyWATI(phone: string | null | undefined, template: string, name: string) {
  if (!phone || !WATI_API_ENDPOINT || !WATI_TOKEN) return false;
  const base = WATI_API_ENDPOINT.replace(/\/$/, "");
  // Match working OTP pattern: remove leading '+' only, else use digits
  let clean = String(phone).replace(/^\+/, "");
  if (!/^\d+$/.test(clean)) clean = clean.replace(/[^\d]/g, "");
  const url = `${base}/api/v2/sendTemplateMessage?whatsappNumber=${encodeURIComponent(clean)}`;
  const body = {
    template_name: template,
    broadcast_name: template,
    parameters: [{ name: "name", value: name }]
  };
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${WATI_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!r.ok) return false;
    // Require explicit success indicators
    try {
      const data = await r.json();
      if (data && (data.result === true || data.success === true || typeof data.messageId !== "undefined")) return true;
    } catch {}
    return false;
  } catch {
    return false;
  }
}

async function notifySendGrid(email: string | null | undefined, templateId: string, name: string) {
  if (!email || !SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) return false;
  try {
    const r = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${SENDGRID_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: { email: SENDGRID_FROM_EMAIL, name: "DharmaSaathi" },
        reply_to: { email: SENDGRID_REPLY_TO_EMAIL, name: "DharmaSaathi Verification" },
        personalizations: [{ to: [{ email }], dynamic_template_data: { name } }],
        template_id: templateId
      }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

serve(async (req) => {
  const { statuses, limit, dryRun, providers, audience } = await (async () => {
    try { return await req.json(); } catch { return {}; }
  })();
  const scope = audience === "all" ? "all" : "pending";
  const allowed = ["verified","pending","rejected"] as const;
  const targetStatuses = Array.isArray(statuses) ? statuses.filter((s: string) => (allowed as readonly string[]).includes(s)) : null;
  const batch = typeof limit === "number" && limit > 0 && limit <= 500 ? limit : 200;
  const wantSendgrid = Array.isArray(providers) ? providers.includes("sendgrid") : true;
  const wantWati = Array.isArray(providers) ? providers.includes("wati") : true;
  // Fetch in batches to avoid timeouts
  let q = supabase
    .from("users")
    .select("id, email, phone, first_name, verification_status, email_notified_at, wati_notified_at, review_notified")
    .not("verification_status", "is", null)
    .limit(batch);
  if (targetStatuses && targetStatuses.length > 0) {
    q = q.in("verification_status", targetStatuses);
  }
  // Provider-specific pending filter: need at least one pending channel
  // Apply post-filter in memory to keep SQL simple across providers
  const { data: users } = await q;
  const filtered = (users || []).filter(u => {
    const hasEmail = !!u.email;
    const hasPhone = !!u.phone;
    if (scope === "all") {
      if (wantSendgrid && wantWati) return hasEmail || hasPhone;
      if (wantSendgrid) return hasEmail;
      if (wantWati) return hasPhone;
      return false;
    } else {
      const emailPending = wantSendgrid ? (!u.email_notified_at && hasEmail) : false;
      const watiPending = wantWati ? (!u.wati_notified_at && hasPhone) : false;
      if (wantSendgrid && wantWati) return emailPending || watiPending;
      if (wantSendgrid) return emailPending;
      if (wantWati) return watiPending;
      return false;
    }
  }).slice(0, batch);
  if (!filtered.length) return new Response(JSON.stringify({ notified: 0 }), { status: 200 });

  let count = 0;
  let watiCount = 0;
  let sgCount = 0;
  for (const u of filtered) {
    const name = (u.first_name || "there") as string;
    if (!dryRun) {
      let emailSent = false;
      let watiSent = false;
      if (u.verification_status === "verified") {
        if (wantWati) watiSent = await notifyWATI(u.phone, WATI_TPL_VERIFIED, name) || false;
        if (wantSendgrid) emailSent = await notifySendGrid(u.email, SG_TPL_VERIFIED, name) || false;
      } else if (u.verification_status === "pending") {
        if (wantWati) watiSent = await notifyWATI(u.phone, WATI_TPL_UNVERIFIED, name) || false;
        if (wantSendgrid) emailSent = await notifySendGrid(u.email, SG_TPL_MORE_INFO, name) || false;
      } else { // rejected
        if (wantWati) watiSent = await notifyWATI(u.phone, WATI_TPL_UNVERIFIED, name) || false;
        if (wantSendgrid) emailSent = await notifySendGrid(u.email, SG_TPL_REJECTED, name) || false;
      }
      if (emailSent) sgCount++;
      if (watiSent) watiCount++;
      // Update per-provider timestamps
      const upd: Record<string, unknown> = {};
      if (emailSent) upd.email_notified_at = new Date().toISOString();
      if (watiSent) upd.wati_notified_at = new Date().toISOString();
      // Mark review_notified only if both providers have been sent (either in this run or previously)
      const finalEmail = emailSent || !!u.email_notified_at || !wantSendgrid;
      const finalWati = watiSent || !!u.wati_notified_at || !wantWati;
      if (finalEmail && finalWati) upd.review_notified = true;
      if (Object.keys(upd).length > 0) await supabase.from("users").update(upd).eq("id", u.id);
    }
    count++;
  }

  return new Response(JSON.stringify({ notified: count, watiSent: watiCount, sendgridSent: sgCount, filtered: targetStatuses || "all", providers: providers || "both", audience: scope, limit: batch, dryRun: !!dryRun, providersConfigured: { wati: !!(WATI_API_ENDPOINT && WATI_TOKEN), sendgrid: !!(SENDGRID_API_KEY && SENDGRID_FROM_EMAIL) } }), { status: 200 });
});


