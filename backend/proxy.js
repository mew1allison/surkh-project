import { NextResponse } from "next/server";

// Server-only configuration — deliberately NOT prefixed with NEXT_PUBLIC_.
// FRONTEND_ORIGINS is a comma- or space-separated list, e.g.
//   FRONTEND_ORIGINS="http://localhost:5500, http://192.168.1.7:8080"
// The build-less frontend can be served from any port/host, so when the variable
// is unset we default to the loopback ports the usual static servers pick:
// Live Server (5500/5501) and `python -m http.server 4321`. Setting
// FRONTEND_ORIGINS replaces this list entirely. Nothing here is sent to the browser.
const DEFAULT_ORIGINS = [
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:5501",
  "http://127.0.0.1:5501",
  "http://localhost:4321",
  "http://127.0.0.1:4321",
];

const ALLOWED_METHODS = "GET, POST, PATCH, OPTIONS";
const ALLOWED_HEADERS = "Content-Type, Authorization";

// Origins are compared case-insensitively and ignoring any trailing slash, so a
// copy-pasted "http://localhost:5500/" in .env.local still matches.
function normalize(origin) {
  return origin.trim().replace(/\/+$/, "").toLowerCase();
}

const ALLOWED_ORIGINS = new Set(
  (process.env.FRONTEND_ORIGINS?.trim()
    ? process.env.FRONTEND_ORIGINS.split(/[,\s]+/)
    : DEFAULT_ORIGINS
  )
    .map(normalize)
    .filter(Boolean),
);

function isAllowedOrigin(rawOrigin) {
  if (!rawOrigin) return false;
  return ALLOWED_ORIGINS.has(normalize(rawOrigin));
}

// The caller's own origin is echoed back — one wildcard-free response per origin,
// which is why every response carrying these headers must be cached per-origin.
function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    Vary: "Origin",
  };
}

// This is the sole owner of CORS for all of /api/* — no route handler or
// preflight export should repeat it. (Next.js 16 renamed the deprecated
// `middleware` convention to `proxy`; behaviour, including `config.matcher`,
// is unchanged.)
export function proxy(request) {
  const origin = request.headers.get("origin");

  // Preflight: answered here so no route handler has to know about CORS.
  // A non-allowlisted (or absent) Origin is rejected outright — falling back to a
  // default origin here would grant CORS to whoever asked for it.
  if (request.method === "OPTIONS") {
    if (!isAllowedOrigin(origin)) {
      return new NextResponse(null, {
        status: 403,
        headers: { Vary: "Origin" },
      });
    }
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }

  // Other methods: run the route handler, then attach CORS headers only for an
  // allowlisted Origin. Address-bar navigation and curl send no Origin at all;
  // those must keep working, just without cross-origin headers.
  const response = NextResponse.next();
  if (isAllowedOrigin(origin)) {
    for (const [key, value] of Object.entries(corsHeaders(origin))) {
      response.headers.set(key, value);
    }
  } else {
    response.headers.set("Vary", "Origin");
  }
  return response;
}

// Only run the proxy on API routes — static assets and pages are untouched
export const config = {
  matcher: "/api/:path*",
};
