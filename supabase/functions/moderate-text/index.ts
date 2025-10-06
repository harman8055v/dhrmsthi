// Deno Edge Function: moderate profile text fields (name, profession, about_me, ideal_partner_notes)
// Uses Sightengine text moderation if keys are present; otherwise approves by default.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SIGHTENGINE_USER = Deno.env.get("SIGHTENGINE_USER");
const SIGHTENGINE_SECRET = Deno.env.get("SIGHTENGINE_SECRET");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function callSightengineText(text: string) {
  if (!SIGHTENGINE_USER || !SIGHTENGINE_SECRET) return null;
  const params = new URLSearchParams({
    text,
    mode: 'standard',
    lang: 'en',
    api_user: SIGHTENGINE_USER,
    api_secret: SIGHTENGINE_SECRET,
    // Default classifiers; Sightengine auto-detects categories like personal info, insults, sexual, etc.
  });
  const r = await fetch("https://api.sightengine.com/1.0/text/check.json", { method: "POST", body: params });
  if (!r.ok) return null;
  return await r.json();
}

function evaluateText(result: any): { status: 'approved'|'needs_review'|'rejected'; reason: string; flags: Record<string, unknown> } {
  if (!result) return { status: 'approved', reason: 'No provider', flags: {} };
  const flags: Record<string, unknown> = {};
  let rejected = false;
  let needsReview = false;

  // Examples of signals: profanity, personal data, links, spam, sexual, hate/insult
  const profanity = result?.profanity?.matches?.length || 0;
  const personal = result?.personal_data?.matches?.length || 0;
  const links = result?.link?.matches?.length || 0;
  const phone = result?.phone?.matches?.length || 0;
  const email = result?.email?.matches?.length || 0;
  const sexual = result?.sexual?.matches?.length || 0;
  const hate = result?.hate?.matches?.length || 0;
  const insult = result?.insult?.matches?.length || 0;
  const spam = result?.spam?.matches?.length || 0;

  flags.profanity = profanity;
  flags.personal = personal + phone + email;
  flags.links = links;
  flags.sexual = sexual;
  flags.hate = hate;
  flags.insult = insult;
  flags.spam = spam;

  // Policies (tunable)
  if (links > 0 || phone > 0 || email > 0 || spam > 0) rejected = true; // disallow contact/links/spam outright
  if (profanity > 0 || sexual > 0 || hate > 0 || insult > 0) needsReview = true; // send to manual review

  if (rejected) return { status: 'rejected', reason: 'Contact info/links/spam not allowed', flags };
  if (needsReview) return { status: 'needs_review', reason: 'Potentially inappropriate language', flags };
  return { status: 'approved', reason: 'OK', flags };
}

serve(async (req) => {
  try {
    const { userId } = await req.json();
    if (!userId) return new Response('Missing userId', { status: 400 });

    const { data: user } = await supabase
      .from('users')
      .select('id, first_name, last_name, profession, about_me, ideal_partner_notes')
      .eq('id', userId)
      .single();

    if (!user) return new Response('User not found', { status: 404 });

    const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
    const profession = (user.profession || '').trim();
    const about = (user.about_me || '').trim();
    const partner = (user.ideal_partner_notes || '').trim();

    // Combine fields into one descriptive text block for a single moderation call
    const combined = [
      name ? `My name is "${name}".` : '',
      profession ? `My profession is "${profession}".` : '',
      about ? `A little about me: "${about}".` : '',
      partner ? `I am looking for a partner as follows: "${partner}".` : '',
    ].filter(Boolean).join(' ');

    if (combined.length > 0) {
      const result = await callSightengineText(combined);
      const verdict = evaluateText(result);
      await supabase.from('profile_text_moderation').insert({
        user_id: userId,
        field_name: 'profile_text',
        status: verdict.status,
        provider: result ? 'sightengine' : 'none',
        labels: result || null,
        flags: verdict.flags,
        reason: verdict.reason,
      });
      if (verdict.status === 'rejected') {
        await supabase.from('users').update({ review_category: 'red_flags', review_reason: 'Text policy violation', verification_status: 'rejected', needs_review: false, last_reviewed_at: new Date().toISOString() }).eq('id', userId);
      }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});


