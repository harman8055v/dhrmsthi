// Deno Edge Function: moderate uploaded photos
// If SIGHTENGINE_USER/SECRET provided, calls provider; otherwise approves by default

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SIGHTENGINE_USER = Deno.env.get("SIGHTENGINE_USER");
const SIGHTENGINE_SECRET = Deno.env.get("SIGHTENGINE_SECRET");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function callSightengine(imageUrl: string) {
  if (!SIGHTENGINE_USER || !SIGHTENGINE_SECRET) return null;
  const params = new URLSearchParams({
    models: "nudity,offensive,gore,wad,faces",
    url: imageUrl,
    api_user: SIGHTENGINE_USER,
    api_secret: SIGHTENGINE_SECRET,
  });
  const r = await fetch("https://api.sightengine.com/1.0/check.json", {
    method: "POST",
    body: params,
  });
  if (!r.ok) return null;
  return await r.json();
}

serve(async (req) => {
  try {
    const { userId, bucket, path } = await req.json();
    if (!userId || !bucket || !path) return new Response("Missing body fields", { status: 400 });

    const cleanPath = path.replace(/^\/+/, '');
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${cleanPath}`;

    let provider = "none";
    let labels: Record<string, unknown> | null = null;
    let nsfwScore = 0;
    let faceCount = 0;
    let status: "approved" | "rejected" = "approved";
    let reason: string | null = null;

    const result = await callSightengine(publicUrl);
    if (result) {
      provider = "sightengine";
      labels = result;
      const nudity = result?.nudity?.sexual_activity ?? 0;
      const gore = result?.gore?.prob ?? 0;
      const weapons = result?.weapon?.prob ?? 0;
      const drugs = result?.drugs?.prob ?? 0;
      faceCount = Array.isArray(result?.faces) ? result.faces.length : 0;
      nsfwScore = Number(nudity) || 0;
      const reject = nudity >= 0.2 || gore >= 0.3 || weapons >= 0.4 || drugs >= 0.4 || faceCount === 0;
      if (reject) {
        status = "rejected";
        reason = "Policy thresholds exceeded or no clear face";
      }
    }

    await supabase.from("photo_moderation").insert({
      user_id: userId,
      object_path: `${bucket}/${path}`,
      status,
      provider,
      labels,
      nsfw_score: nsfwScore,
      face_count: faceCount,
      is_ai_generated: null,
      reason,
    });

    return new Response(JSON.stringify({ status }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});


