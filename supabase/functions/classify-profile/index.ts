// Deno Edge Function: classify profile using rules + LLM (finalizer)
// Only uses {{name}} in notifications upstream; here we just compute category & reason

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function llmClassify(user: any, rules: any) {
  if (!OPENAI_API_KEY) {
    return { category: rules?.category_suggested || "needs_more_details", reason: "Rules-only" };
  }
  const prompt = `Return strict JSON {"category":"...","reason":"..."}. Categories: eligible, needs_more_details, red_flags, exceptional. Be slightly lenient for eligible.`;
  const body = {
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You classify profiles reliably with short reasons." },
      { role: "user", content: `${prompt}\nUser:${JSON.stringify({
        first_name: user?.first_name,
        last_name: user?.last_name,
        about_me: user?.about_me,
        ideal_partner_notes: user?.ideal_partner_notes,
        profile_score: user?.profile_score,
      })}\nRules:${JSON.stringify({
        category_suggested: rules?.category_suggested,
        suspicious_score: rules?.suspicious_score,
        missing_fields: rules?.missing_fields,
      })}` },
    ],
  };
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  try {
    const content = data?.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    return { category: parsed.category, reason: parsed.reason };
  } catch {
    return { category: rules?.category_suggested || "needs_more_details", reason: "Rules fallback" };
  }
}

serve(async (req) => {
  try {
    const { userId } = await req.json();
    if (!userId) return new Response("Missing userId", { status: 400 });

    const { data: user } = await supabase.from("users").select("id, first_name, last_name, about_me, ideal_partner_notes, profile_score").eq("id", userId).single();
    const { data: rules } = await supabase.from("user_review_rules").select("*").eq("id", userId).single();

    let category = rules?.category_suggested || "needs_more_details";
    let reason = "Rules";
    if (["eligible","needs_more_details"].includes(category)) {
      const llm = await llmClassify(user, rules);
      category = llm.category || category;
      reason = llm.reason || reason;
    }

    await supabase.from("users").update({ review_category: category, review_reason: reason, suspicious_score: rules?.suspicious_score ?? 0, missing_fields: rules?.missing_fields ?? [], needs_review: false, last_reviewed_at: new Date().toISOString() }).eq("id", userId);

    return new Response(JSON.stringify({ category, reason }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});


