import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("Facility")
    .select("*");

  if (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return Response.json(data);
}