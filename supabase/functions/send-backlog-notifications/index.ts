// Deno Edge Function: one-time backlog notifier
// Sends notifications for users processed during backlog that haven't been notified yet.

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

const SG_TPL_VERIFIED = Deno.env.get("SG_TPL_VERIFIED")!;
const SG_TPL_MORE_INFO = Deno.env.get("SG_TPL_MORE_INFO")!;
const SG_TPL_REJECTED = Deno.env.get("SG_TPL_REJECTED")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function notifyWATI(phone: string | null | undefined, template: string, name: string) {
  if (!phone) return;
  await fetch(`${WATI_BASE_URL}/sendTemplateMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${WATI_TOKEN}` },
    body: JSON.stringify({ template_name: template, broadcast_name: "profile_verification_backlog", parameters: [{ name: "name", value: name }], recipients: [phone] }),
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

serve(async (req) => {
  const { statuses, limit, dryRun } = await (async () => {
    try { return await req.json(); } catch { return {}; }
  })();
  const allowed = ["verified","pending","rejected"] as const;
  const targetStatuses = Array.isArray(statuses) ? statuses.filter((s: string) => (allowed as readonly string[]).includes(s)) : null;
  const batch = typeof limit === "number" && limit > 0 && limit <= 500 ? limit : 200;
  // Fetch in batches to avoid timeouts
  let q = supabase
    .from("users")
    .select("id, email, phone, first_name, verification_status")
    .eq("review_notified", false)
    .not("verification_status", "is", null)
    .limit(batch);
  if (targetStatuses && targetStatuses.length > 0) {
    q = q.in("verification_status", targetStatuses);
  }
  const { data: users } = await q;
  if (!users?.length) return new Response(JSON.stringify({ notified: 0 }), { status: 200 });

  let count = 0;
  for (const u of users) {
    const name = (u.first_name || "there") as string;
    if (!dryRun) {
      if (u.verification_status === "verified") {
        await notifyWATI(u.phone, WATI_TPL_VERIFIED, name);
        await notifySendGrid(u.email, SG_TPL_VERIFIED, name);
      } else if (u.verification_status === "pending") {
        await notifyWATI(u.phone, WATI_TPL_MORE_INFO, name);
        await notifySendGrid(u.email, SG_TPL_MORE_INFO, name);
      } else {
        await notifyWATI(u.phone, WATI_TPL_REJECTED, name);
        await notifySendGrid(u.email, SG_TPL_REJECTED, name);
      }
      await supabase.from("users").update({ review_notified: true }).eq("id", u.id);
    }
    count++;
  }

  return new Response(JSON.stringify({ notified: count, filtered: targetStatuses || "all", limit: batch, dryRun: !!dryRun }), { status: 200 });
});


