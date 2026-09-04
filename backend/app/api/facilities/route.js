import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import { extractBearerToken } from '@/app/api/inventory/route'

export async function GET() {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("Facility")
    .select('id, name, city, location, latitude, longitude, has_emr')

  if (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return Response.json(data);
}

export async function POST(request) {
  // Authenticate — Bearer token pattern (same as inventory/exchange-requests/profile)
  const accessToken = extractBearerToken(request)
  if (!accessToken) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createSupabaseServerClient(accessToken)

  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
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

  const { name, city, location, latitude, longitude, has_emr } = body

  // Validate required fields
  if (!name || !city || !location || latitude === undefined || longitude === undefined || has_emr === undefined) {
    return Response.json(
      { error: "Missing required fields: name, city, location, latitude, longitude, has_emr" },
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

  if (typeof city !== "string" || city.trim().length === 0) {
    return Response.json(
      { error: "city must be a non-empty string" },
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
      city: city.trim(),
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

export async function PATCH(request) {
  // Authenticate — Bearer token pattern (same as POST)
  const accessToken = extractBearerToken(request)
  if (!accessToken) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify identity using the user-scoped client
  const supabase = await createSupabaseServerClient(accessToken)
  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Admin-only — verify Profile.role === 'Admin' before allowing any update.
  // The Facility table has no UPDATE RLS policy, so the actual write below
  // uses the admin (service_role) client which bypasses RLS. This application-
  // level check is therefore the sole authorization gate.
  const { data: profile, error: profileError } = await supabase
    .from('Profile')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || profile.role !== 'Admin') {
    return Response.json(
      { error: 'Only administrators can update facilities' },
      { status: 403 }
    )
  }

  // Parse body
  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { id, name, city, location, latitude, longitude, has_emr } = body

  // id is required to identify the facility
  if (id === undefined || id === null) {
    return Response.json({ error: 'id is required' }, { status: 400 })
  }

  const parsedId = Number(id)
  if (!Number.isInteger(parsedId) || parsedId < 1) {
    return Response.json({ error: 'id must be a positive integer' }, { status: 400 })
  }

  // Build updates object — only fields that are actually supplied,
  // so partial updates are supported.
  const updates = {}

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return Response.json({ error: 'name must be a non-empty string' }, { status: 400 })
    }
    updates.name = name.trim()
  }

  if (city !== undefined) {
    if (typeof city !== 'string' || city.trim().length === 0) {
      return Response.json({ error: 'city must be a non-empty string' }, { status: 400 })
    }
    updates.city = city.trim()
  }

  if (location !== undefined) {
    if (typeof location !== 'string' || location.trim().length === 0) {
      return Response.json({ error: 'location must be a non-empty string' }, { status: 400 })
    }
    updates.location = location.trim()
  }

  if (latitude !== undefined) {
    const lat = Number(latitude)
    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      return Response.json({ error: 'latitude must be a number between -90 and 90' }, { status: 400 })
    }
    updates.latitude = lat
  }

  if (longitude !== undefined) {
    const lng = Number(longitude)
    if (Number.isNaN(lng) || lng < -180 || lng > 180) {
      return Response.json({ error: 'longitude must be a number between -180 and 180' }, { status: 400 })
    }
    updates.longitude = lng
  }

  if (has_emr !== undefined) {
    if (typeof has_emr !== 'boolean') {
      return Response.json({ error: 'has_emr must be a boolean' }, { status: 400 })
    }
    updates.has_emr = has_emr
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'No valid fields provided to update' }, { status: 400 })
  }

  // Use admin client (service_role) to bypass RLS for the write.
  // Authorization is already enforced above via the Profile.role === 'Admin' check.
  const adminSupabase = createSupabaseAdminClient()
  const { data, error } = await adminSupabase
    .from('Facility')
    .update(updates)
    .eq('id', parsedId)
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return Response.json({ error: 'Facility not found' }, { status: 404 })
  }

  return Response.json(data)
}