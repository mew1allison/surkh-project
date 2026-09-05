import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// GET /api/config — public runtime configuration for the static frontend.
// The frontend derives this server's origin from window.location and fetches
// this BEFORE creating a Supabase client, so backend/.env.local is the only
// file anywhere that carries credentials. Returns publishable values only.
// There is deliberately no `backendBase` field: the browser already knows this
// server's origin from window.location, and the Supabase host is inside supabaseUrl.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    return Response.json(
      {
        error:
          "Supabase is not configured — copy .env.example to .env.local in backend/ and restart npm run dev",
      },
      { status: 500 },
    );
  }
  // Deliberately does NOT read SUPABASE_SECRET_KEY or GEMINI_API_KEY.
  const supabase = await createSupabaseServerClient(); // anon client: RLS-governed
  const { error } = await supabase.from("Facility").select("id").limit(1);
  return Response.json(
    {
      supabaseUrl: url,
      supabasePublishableKey: publishableKey,
      databaseReady: !error,
      databaseError: error?.message ?? null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
