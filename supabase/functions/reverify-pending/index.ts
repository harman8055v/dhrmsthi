// Deno Edge Function: Leniently re-verify pending profiles
// Goal: Only keep truly red-flag/suspicious profiles pending. Others get verified.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
        } else {
          // Assume it's a storage path already
          const clean = ph.replace(/^\/?user-photos\//, "");
          if (clean) paths.add(clean);
        }
      } else if (ph && typeof ph === "object") {
        if (typeof (ph as any).path === "string") {
          const p = (ph as any).path.replace(/^\/?user-photos\//, "");
          if (p) paths.add(p);
        } else if (typeof (ph as any).url === "string") {
          const marker = "/object/public/user-photos/";
          const idx = (ph as any).url.indexOf(marker);
          if (idx >= 0) {
            const p = (ph as any).url.substring(idx + marker.length);
            if (p) paths.add(p);
          }
        }
      }
    }
  }
  return Array.from(paths).slice(0, 6);
}

async function callModeratePhoto(userId: string, path: string) {
  await fetch(`${SUPABASE_URL}/functions/v1/moderate-photo`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
    body: JSON.stringify({ userId, bucket: "user-photos", path }),
  });
}

async function callModerateText(userId: string) {
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/moderate-text`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
      body: JSON.stringify({ userId }),
    });
  } catch (_) {
    // best-effort
  }
}

serve(async (req) => {
  try {
    const { limit = 200, dryRun = false } = await req.json().catch(() => ({ limit: 200, dryRun: false }));

    // Fetch pending users in small batches
    const { data: users } = await supabase
      .from("users")
      .select("id, first_name, last_name, about_me, profession, user_photos")
      .eq("verification_status", "pending")
      .limit(limit);

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ processed: 0, verified: 0, keptPending: 0 }), { status: 200 });
    }

    let verified = 0;
    let keptPending = 0;

    for (const user of users) {
      const userId: string = user.id;

      // Ensure photos are moderated (best-effort)
      const paths = extractObjectPaths(user);
      for (const p of paths) {
        const object_path = `user-photos/${p.replace(/^\/+/, '')}`;
        const { data: existing } = await supabase
          .from("photo_moderation")
          .select("id,status")
          .eq("user_id", userId)
          .eq("object_path", object_path)
          .maybeSingle();
        if (!existing || existing.status === "pending") {
          await callModeratePhoto(userId, p);
        }
      }

      // Refresh latest photo statuses
      const { data: photos } = await supabase
        .from("photo_moderation")
        .select("status")
        .eq("user_id", userId);
      const statuses = (photos || []).map((p) => p.status);
      const hasRejectedPhoto = statuses.includes("rejected");
      const hasApprovedPhoto = statuses.includes("approved");
      const hasAnyPhoto = Array.isArray(user?.user_photos) && user.user_photos.length > 0;

      // Ensure text is moderated (best-effort)
      await callModerateText(userId);
      const { data: textVerdict } = await supabase
        .from("profile_text_moderation")
        .select("status")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const textRejected = textVerdict?.status === 'rejected';

      // Lenient rules: only keep red-flag/suspicious pending.
      const bioLen = (user?.about_me || '').trim().length;
      const minimalInfo = hasApprovedPhoto || (hasAnyPhoto && !hasRejectedPhoto) || bioLen >= 20 || Boolean((user?.profession || '').trim());
      const suspicious = hasRejectedPhoto || textRejected;

      if (suspicious) {
        // keep pending
        keptPending++;
        if (!dryRun) {
          await supabase
            .from("users")
            .update({ review_category: 'red_flags', review_reason: 'Photo/text policy issues', last_reviewed_at: new Date().toISOString(), needs_review: false, verification_status: 'pending', is_verified: false })
            .eq("id", userId);
        }
        continue;
      }

      if (minimalInfo) {
        verified++;
        if (!dryRun) {
          const score = hasApprovedPhoto && bioLen >= 50 ? 8 : (hasApprovedPhoto || bioLen >= 20 ? 7 : 6);
          await supabase
            .from("users")
            .update({ review_category: 'eligible', review_reason: 'Lenient pending reverify pass', last_reviewed_at: new Date().toISOString(), needs_review: false, verification_status: 'verified', is_verified: true, profile_score: score })
            .eq("id", userId);
        }
      } else {
        keptPending++;
        if (!dryRun) {
          await supabase
            .from("users")
            .update({ review_category: 'needs_more_details', review_reason: 'Very sparse profile', last_reviewed_at: new Date().toISOString(), needs_review: false, verification_status: 'pending', is_verified: false })
            .eq("id", userId);
        }
      }
    }

    return new Response(JSON.stringify({ processed: users.length, verified, keptPending }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});


