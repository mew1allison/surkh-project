import { NextResponse } from 'next/server'

const ALLOWED_ORIGIN = 'http://localhost:5500'
const ALLOWED_METHODS = 'GET, POST, PATCH, OPTIONS'
const ALLOWED_HEADERS = 'Content-Type, Authorization'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': ALLOWED_METHODS,
    'Access-Control-Allow-Headers': ALLOWED_HEADERS,
  }
}

export function middleware(request) {
  // Handle preflight OPTIONS requests immediately — no route handler needed
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(),
    })
  }

  // For all other methods, let the route handler run and attach CORS headers
  // to the response so the browser accepts it from the frontend origin.
  const response = NextResponse.next()
  const headers = corsHeaders()
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value)
  }
  return response
}

// Only run middleware on API routes — static assets and pages are untouched
export const config = {
  matcher: '/api/:path*',
}
