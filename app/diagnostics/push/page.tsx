"use client";
import { useEffect, useState } from "react";

type TokenRow = {
  token: string;
  platform: string;
  updated_at?: string;
  last_used_at?: string;
};

export default function PushDiagnosticsPage() {
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [status, setStatus] = useState<string>("idle");
  const [error, setError] = useState<string | null>(null);
  const [nativeEvents, setNativeEvents] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [latestToken, setLatestToken] = useState<{ token: string; platform?: string } | null>(null);
  const [hasNativeChannel, setHasNativeChannel] = useState<boolean>(false);
  const [lastRequestTs, setLastRequestTs] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokens = async () => {
      setStatus("loading");
      setError(null);
      try {
        const res = await fetch("/api/push/register", { method: "GET" });
        const json = await res.json();
        if (!res.ok) throw new Error(JSON.stringify(json));
        setTokens(json.tokens || []);
        setStatus("ready");
      } catch (e: any) {
        setError(String(e?.message || e));
        setStatus("error");
      }
    };
    fetchTokens();
  }, []);

  useEffect(() => {
    setHasNativeChannel(Boolean((window as any).ReactNativeWebView?.postMessage));
    
    // Log for debugging
    console.log('🔍 Diagnostics page mounted, native channel:', Boolean((window as any).ReactNativeWebView?.postMessage));
    
    const onMsg = (e: MessageEvent) => {
      try {
        console.log('📨 Diagnostics received message event:', e.data);
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        
        // Capture ALL messages for debugging
        setNativeEvents(prev => [{ ts: new Date().toISOString(), data }, ...prev].slice(0, 20));
        
        // Check for expo push token
        if (data?.type === 'expo_push_token' && data?.payload?.token) {
          console.log('🎯 Captured expo_push_token:', data.payload.token);
          setLatestToken({ token: data.payload.token, platform: data.payload.platform || 'android' });
        }
      } catch (err) {
        console.error('Error parsing message:', err);
      }
    };
    
    window.addEventListener('message', onMsg);
    
    // Also check if token was already injected
    setTimeout(() => {
      try {
        const last = (window as any).__lastExpoPushToken;
        if (last && typeof last === 'string') {
          console.log('Found injected token:', last);
          const parsed = JSON.parse(last);
          if (parsed?.type === 'expo_push_token' && parsed?.payload?.token) {
            setLatestToken({ token: parsed.payload.token, platform: parsed.payload.platform || 'android' });
          }
        }
      } catch {}
    }, 1000);
    
    return () => window.removeEventListener('message', onMsg);
  }, []);

  async function refreshTokens() {
    try {
      setStatus("loading");
      const res = await fetch("/api/push/register", { method: "GET" });
      const json = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(json));
      setTokens(json.tokens || []);
      setStatus("ready");
    } catch (e: any) {
      setError(String(e?.message || e));
      setStatus("error");
    }
  }

  function requestTokenFromNative() {
    try {
      setLastRequestTs(new Date().toISOString());
      if ((window as any).ReactNativeWebView?.postMessage) {
        // Fire multiple times to be robust
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            (window as any).ReactNativeWebView.postMessage(JSON.stringify({ type: 'request_push_token' }));
          }, i * 800);
        }
      } else {
        alert('Native channel not detected. Are you running inside the mobile app WebView?');
      }
    } catch {}
  }

  async function saveManualToken() {
    const token = prompt('Enter Expo push token (ExponentPushToken[...])');
    if (!token) return;
    try {
      const res = await fetch('/api/push/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, platform: 'android' }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(JSON.stringify(json));
      await refreshTokens();
      alert('Saved');
    } catch (e: any) {
      alert('Save failed: ' + String(e?.message || e));
    }
  }

  async function upsertLatestNativeToken() {
    if (!latestToken?.token) {
      alert('No latest native token captured yet. Tap Request Token (Native) and try again.');
      return;
    }
    try {
      const res = await fetch('/api/push/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: latestToken.token, platform: latestToken.platform || 'android' }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(JSON.stringify(json));
      await refreshTokens();
      alert('Latest native token saved');
    } catch (e: any) {
      alert('Save failed: ' + String(e?.message || e));
    }
  }

  async function clearTokens() {
    if (!confirm('Delete all tokens for current user?')) return;
    try {
      const res = await fetch('/api/push/register', { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(JSON.stringify(json));
      await refreshTokens();
    } catch (e: any) {
      alert('Delete failed: ' + String(e?.message || e));
    }
  }

  async function sendTestPush() {
    const target = userId || prompt('Enter target userId (UUID)') || '';
    if (!target) return;
    setUserId(target);
    try {
      setSending(true);
      const res = await fetch('/api/expo/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: target, title: 'Test', body: 'Hello from Diagnostics', data: { link: '/dashboard/messages' } }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(JSON.stringify(json));
      alert('Sent: ' + JSON.stringify(json));
    } catch (e: any) {
      alert('Send failed: ' + String(e?.message || e));
    } finally {
      setSending(false);
    }
  }

  async function getCurrentUserAndRegisterTestToken() {
    try {
      // Get current user
      const userRes = await fetch('/api/users/profile');
      const userData = await userRes.json();
      if (!userRes.ok || !userData?.id) {
        alert('Not logged in or could not get user ID');
        return;
      }
      
      const testToken = `ExponentPushToken[TEST_${Date.now()}]`;
      
      // Register via public endpoint
      const res = await fetch('/api/push/register-public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          token: testToken,
          platform: 'android'
        }),
      });
      
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(JSON.stringify(json));
      
      await refreshTokens();
      alert(`Test token registered for user ${userData.id}`);
      setUserId(userData.id); // Set for easy test push
    } catch (e: any) {
      alert('Failed: ' + String(e?.message || e));
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <h1 className="text-xl font-semibold">Push Diagnostics</h1>
      <div className="rounded-md border p-4 space-y-3">
        <div className="mb-2 text-sm text-gray-600">Token Save Status: {status}</div>
        <div className="text-xs text-gray-600">Native channel: {hasNativeChannel ? 'connected' : 'not detected'}{lastRequestTs ? ` · last request ${lastRequestTs}` : ''}</div>
        {error && <pre className="text-red-600 text-xs whitespace-pre-wrap">{error}</pre>}
        <div className="flex flex-wrap gap-2 text-sm">
          <button className="px-2 py-1 rounded border" onClick={refreshTokens}>Refresh Tokens</button>
          <button className="px-2 py-1 rounded border" onClick={requestTokenFromNative}>Request Token (Native)</button>
          <button className="px-2 py-1 rounded border" onClick={saveManualToken}>Save Manual Token</button>
          <button className="px-2 py-1 rounded border" onClick={upsertLatestNativeToken}>Upsert Latest Native Token</button>
          <button className="px-2 py-1 rounded border" onClick={clearTokens}>Clear Tokens</button>
          <button className="px-2 py-1 rounded border bg-green-100" onClick={getCurrentUserAndRegisterTestToken}>Register Test Token</button>
        </div>
        {latestToken?.token && (
          <div className="text-xs text-gray-600">Latest native token: <span className="font-mono break-all">{latestToken.token}</span></div>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th>Platform</th>
              <th>Token</th>
              <th>Updated</th>
              <th>Last Used</th>
            </tr>
          </thead>
          <tbody>
            {tokens.length === 0 && (
              <tr><td colSpan={4} className="py-2 text-gray-500">No tokens for current user</td></tr>
            )}
            {tokens.map((t, i) => (
              <tr key={i} className="border-t">
                <td className="py-2">{t.platform}</td>
                <td className="py-2 font-mono text-xs break-all">{t.token}</td>
                <td className="py-2 text-xs">{t.updated_at || '-'}</td>
                <td className="py-2 text-xs">{t.last_used_at || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-md border p-4 space-y-3">
        <div className="mb-2 text-sm text-gray-600">Recent Native Events</div>
        <ul className="space-y-1 text-xs font-mono">
          {nativeEvents.length === 0 && <li className="text-gray-500">No events yet</li>}
          {nativeEvents.map((e, idx) => (
            <li key={idx} className="break-all">
              {e.ts}: {JSON.stringify(e.data)}
            </li>
          ))}
        </ul>
        <div className="flex gap-2 text-sm">
          <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Target userId" className="px-2 py-1 border rounded w-full" />
          <button className="px-2 py-1 rounded border" onClick={sendTestPush} disabled={sending}>{sending ? 'Sending...' : 'Send Test Push'}</button>
        </div>
      </div>
    </div>
  );
}


