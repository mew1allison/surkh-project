// No credentials live in frontend/ anymore. Derive the backend origin from the
// host we were served from (works on localhost, LAN IPs and deploys), then fetch
// the public config. Override for split-host deploys with
// window.SURKH_BACKEND_URL or ?backend=https://… before this script loads.
//
// This file must be included on every page that touches Supabase or /api, and
// AFTER the @supabase/supabase-js CDN tag (it calls window.supabase.createClient).
// Consumers must `await window.SURKH_READY` — the client does not exist until the
// config fetch resolves, which is why nothing here is synchronous anymore.
window.SURKH_READY = (async () => {
  const host = location.hostname || "localhost";
  const qsBase = new URLSearchParams(location.search).get("backend");
  const base =
    (qsBase && decodeURIComponent(qsBase)) ||
    window.SURKH_BACKEND_URL ||
    `${location.protocol}//${host}:3000`;
  const res = await fetch(`${base}/api/config`);
  if (!res.ok) throw new Error(`GET ${base}/api/config failed (${res.status})`);
  const cfg = await res.json();
  // The backend probes the database too, so a missing `supabase db push` is
  // visible here rather than as an empty dashboard.
  if (!cfg.databaseReady) {
    console.warn(
      `Database not ready: ${cfg.databaseError || "unknown error"} — run npm run db:push in backend/`,
    );
  }
  return {
    BACKEND_BASE_URL: base,
    supabaseUrl: cfg.supabaseUrl,
    client: window.supabase.createClient(
      cfg.supabaseUrl,
      cfg.supabasePublishableKey,
    ),
  };
})();
window.SURKH_READY.catch(() =>
  console.error(
    "Surkh config unavailable — is `npm run dev` running in backend/ on port 3000?",
  ),
);
window.supabaseClient = { auth: {}, from: () => ({}) }; // never undefined; await the promise
