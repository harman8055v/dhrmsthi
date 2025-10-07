import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WATI_API_ENDPOINT = (process.env.WATI_API_ENDPOINT || '').replace(/\/$/, '');
const WATI_ACCESS_TOKEN = process.env.WATI_ACCESS_TOKEN || '';
const WATI_WEBHOOK_SECRET = process.env.WATI_WEBHOOK_SECRET || '';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://dharmasaathi.com').replace(/\/$/, '');

function normalizePhone(raw: string): string {
  const digitsOnly = String(raw || '').replace(/[^\d]/g, '');
  if (digitsOnly.startsWith('91')) return digitsOnly; // already with country code
  if (digitsOnly.length === 10) return `91${digitsOnly}`; // assume India default
  return digitsOnly;
}

function extractText(payload: any): string {
  return (
    payload?.text ||
    payload?.messageText ||
    payload?.message?.text ||
    payload?.payload?.text ||
    payload?.payload?.message?.text ||
    ''
  );
}

function extractFrom(payload: any): string {
  return (
    payload?.whatsappNumber ||
    payload?.waId ||
    payload?.from ||
    payload?.payload?.waId ||
    payload?.payload?.from ||
    ''
  );
}

function isLoginHelp(text: string): boolean {
  const t = (text || '').toLowerCase();
  if (!t) return false;
  return (
    t.includes('need help logging in') ||
    t.includes('login help') ||
    t.includes("can't log in") ||
    t.includes('cannot log in') ||
    t.includes('forgot password') ||
    t.includes('reset password')
  );
}

async function findUserEmailByPhone(normalizedNumber: string): Promise<string | null> {
  // Try several stored formats: with '+', raw, and without leading 91
  const variants = new Set<string>();
  variants.add(normalizedNumber);
  variants.add(`+${normalizedNumber}`);
  if (normalizedNumber.startsWith('91')) variants.add(normalizedNumber.slice(2));

  for (const phone of variants) {
    const { data } = await supabase
      .from('users')
      .select('email')
      .eq('phone', phone)
      .maybeSingle();
    if (data?.email) return data.email as string;
  }
  return null;
}

async function generateMagicLink(email: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${SITE_URL}/dashboard` }
    });
    if (error) return null;
    return (data?.properties as any)?.action_link || null;
  } catch {
    return null;
  }
}

async function generateRecoveryLink(email: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `${SITE_URL}/reset-password` }
    });
    if (error) return null;
    return (data?.properties as any)?.action_link || null;
  } catch {
    return null;
  }
}

async function sendWatiSessionMessage(number: string, messageText: string): Promise<boolean> {
  if (!WATI_API_ENDPOINT || !WATI_ACCESS_TOKEN) return false;
  // Prefer v2 endpoint; fall back to v1 if needed
  const v2Url = `${WATI_API_ENDPOINT}/api/v2/sendSessionMessage?whatsappNumber=${encodeURIComponent(number)}`;
  const headers = { Authorization: `Bearer ${WATI_ACCESS_TOKEN}`, 'Content-Type': 'application/json' } as const;
  try {
    const r2 = await fetch(v2Url, { method: 'POST', headers, body: JSON.stringify({ messageText }) });
    if (r2.ok) return true;
  } catch {}
  try {
    const v1Url = `${WATI_API_ENDPOINT}/api/v1/sendSessionMessage/${encodeURIComponent(number)}`;
    const r1 = await fetch(v1Url, { method: 'POST', headers, body: JSON.stringify({ messageText }) });
    return r1.ok;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Basic shared-secret validation (WATI can send custom headers; also allow query param for simple setups)
    const provided = req.headers.get('x-wati-signature') || req.nextUrl.searchParams.get('secret') || '';
    if (WATI_WEBHOOK_SECRET && provided !== WATI_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const text = extractText(body);
    const from = extractFrom(body);
    if (!text || !from) return NextResponse.json({ ok: true });
    if (!isLoginHelp(text)) return NextResponse.json({ ok: true });

    const number = normalizePhone(from);
    let messageToSend: string;

    const email = await findUserEmailByPhone(number);
    if (email) {
      const [magic, recovery] = await Promise.all([
        generateMagicLink(email),
        generateRecoveryLink(email)
      ]);

      if (magic && recovery) {
        messageToSend = `Tap to login instantly (one-time):\n${magic}\n\nNeed to change your password? Use this link:\n${recovery}\n\nBoth links expire in about 60 minutes.`;
      } else if (magic) {
        messageToSend = `Tap to login instantly (one-time):\n${magic}\n\nIf you still want to reset your password, visit:\n${SITE_URL}/reset-password`;
      } else if (recovery) {
        messageToSend = `Reset your password here:\n${recovery}\n\nAfter reset, you will be logged in.`;
      } else {
        messageToSend = `Please try again in a moment or use:\n${SITE_URL}/reset-password`;
      }
    } else {
      messageToSend = `We couldn’t match this WhatsApp number to an account.\nYou can reset your password here: ${SITE_URL}/reset-password\n(Use your registered email address.)`;
    }

    await sendWatiSessionMessage(number, messageToSend);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 });
  }
}


