import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("Facility")
    .select('id, name, location, latitude, longitude, has_emr')

  if (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return Response.json(data);
}

export async function POST(request) {
  const supabase = await createSupabaseServerClient()

  // Authenticate
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  // Parse body
  let body
  try {
    body = await request.json()
  } catch {
    return Response.json(
      { error: "Invalid JSON" },
      { status: 400 }
    )
  }

  const { name, location, latitude, longitude, has_emr } = body

  // Validate required fields
  if (!name || !location || latitude === undefined || longitude === undefined || has_emr === undefined) {
    return Response.json(
      { error: "Missing required fields: name, location, latitude, longitude, has_emr" },
      { status: 400 }
    )
  }

  // Validate types
  if (typeof name !== "string" || name.trim().length === 0) {
    return Response.json(
      { error: "name must be a non-empty string" },
      { status: 400 }
    )
  }

  if (typeof location !== "string" || location.trim().length === 0) {
    return Response.json(
      { error: "location must be a non-empty string" },
      { status: 400 }
    )
  }

  const lat = Number(latitude)
  const lng = Number(longitude)

  if (Number.isNaN(lat) || lat < -90 || lat > 90) {
    return Response.json(
      { error: "latitude must be a number between -90 and 90" },
      { status: 400 }
    )
  }

  if (Number.isNaN(lng) || lng < -180 || lng > 180) {
    return Response.json(
      { error: "longitude must be a number between -180 and 180" },
      { status: 400 }
    )
  }

  if (typeof has_emr !== "boolean") {
    return Response.json(
      { error: "has_emr must be a boolean" },
      { status: 400 }
    )
  }

  // Insert — RLS policy "Admins can create Facilities" handles authorization
  const { data, error } = await supabase
    .from("Facility")
    .insert({
      name: name.trim(),
      location: location.trim(),
      latitude: lat,
      longitude: lng,
      has_emr,
    })
    .select()
    .single()

  if (error) {
    // RLS policy rejection returns SQLSTATE 42501 (insufficient_privilege)
    const status = error.code === "42501" ? 403 : 500
    return Response.json(
      { error: error.message },
      { status }
    )
  }

  return Response.json(data, { status: 201 })
}