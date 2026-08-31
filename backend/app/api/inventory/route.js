import { createSupabaseServerClient } from '@/lib/supabase-server'

const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const VALID_STATUSES = ['available', 'low', 'not available']

export async function GET(request) {
  const supabase = await createSupabaseServerClient()

  // Extract query params for Find Blood feature
  const { searchParams } = new URL(request.url)
  const blood_group = searchParams.get('blood_group')
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  // Validate blood_group if provided
  if (blood_group && !VALID_BLOOD_GROUPS.includes(blood_group)) {
    return Response.json(
      { error: `blood_group must be one of: ${VALID_BLOOD_GROUPS.join(', ')}` },
      { status: 400 }
    )
  }

  // Validate lat/lng if provided (both must be present together)
  if ((lat && !lng) || (!lat && lng)) {
    return Response.json(
      { error: 'lat and lng must both be provided' },
      { status: 400 }
    )
  }

  if (lat && (isNaN(Number(lat)) || Number(lat) < -90 || Number(lat) > 90)) {
    return Response.json(
      { error: 'lat must be a number between -90 and 90' },
      { status: 400 }
    )
  }

  if (lng && (isNaN(Number(lng)) || Number(lng) < -180 || Number(lng) > 180)) {
    return Response.json(
      { error: 'lng must be a number between -180 and 180' },
      { status: 400 }
    )
  }

  // Query inventory with facility join; filter by availability
  let query = supabase
    .from('Inventory')
    .select('*, Facility(*)')
    .eq('status', 'available')
    .gt('quantity', 0)

  if (blood_group) {
    query = query.eq('blood_group', blood_group)
  }

  const { data, error } = await query

  if (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return Response.json(data)
}

export async function POST(request) {
  const supabase = await createSupabaseServerClient()

  // Step 1: authenticate
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Step 2: get facility_id from server-side Profile
  const { data: profile, error: profileError } = await supabase
    .from('Profile')
    .select('facility_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return Response.json({ error: 'Profile not found' }, { status: 404 })
  }

  if (!profile.facility_id) {
    return Response.json(
      { error: 'No facility associated with this account' },
      { status: 403 }
    )
  }

  // Step 3: validate client-supplied fields
  const body = await request.json()

  if (body.facility_id !== undefined) {
    return Response.json(
      { error: 'You are not authorized to specify a facility' },
      { status: 403 }
    )
  }

  const { blood_group, quantity, expiry_date, status } = body

  if (!blood_group || !VALID_BLOOD_GROUPS.includes(blood_group)) {
    return Response.json(
      { error: `blood_group must be one of: ${VALID_BLOOD_GROUPS.join(', ')}` },
      { status: 400 }
    )
  }

  const parsedQuantity = Number(quantity)
  if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
    return Response.json({ error: 'quantity must be a non-negative integer' }, { status: 400 })
  }

  if (!expiry_date || isNaN(Date.parse(expiry_date))) {
    return Response.json({ error: 'expiry_date must be a valid date' }, { status: 400 })
  }

  if (!status || !VALID_STATUSES.includes(status)) {
    return Response.json(
      { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    )
  }

  // Step 4: insert — facility_id always from server-side Profile
  const { data, error } = await supabase
    .from('Inventory')
    .insert({
      facility_id: profile.facility_id,
      blood_group,
      quantity: parsedQuantity,
      expiry_date,
      status,
    })
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  // Step 5: return created record
  return Response.json(data, { status: 201 })
}

export async function PATCH(request) {
  const supabase = await createSupabaseServerClient()

  // Step 1: authenticate
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Step 2: get facility_id from server-side Profile
  const { data: profile, error: profileError } = await supabase
    .from('Profile')
    .select('facility_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return Response.json({ error: 'Profile not found' }, { status: 404 })
  }

  if (!profile.facility_id) {
    return Response.json(
      { error: 'No facility associated with this account' },
      { status: 403 }
    )
  }

  // Step 3: extract and validate id + fields to update
  const body = await request.json()
  const { id, blood_group, quantity, expiry_date, status } = body

  const parsedId = Number(id)
  if (!Number.isInteger(parsedId) || parsedId < 1) {
    return Response.json({ error: 'id must be a positive integer' }, { status: 400 })
  }

  const updates = {}

  if (blood_group !== undefined) {
    if (!VALID_BLOOD_GROUPS.includes(blood_group)) {
      return Response.json(
        { error: `blood_group must be one of: ${VALID_BLOOD_GROUPS.join(', ')}` },
        { status: 400 }
      )
    }
    updates.blood_group = blood_group
  }

  if (quantity !== undefined) {
    const parsedQuantity = Number(quantity)
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
      return Response.json({ error: 'quantity must be a non-negative integer' }, { status: 400 })
    }
    updates.quantity = parsedQuantity
  }

  if (expiry_date !== undefined) {
    if (isNaN(Date.parse(expiry_date))) {
      return Response.json({ error: 'expiry_date must be a valid date' }, { status: 400 })
    }
    updates.expiry_date = expiry_date
  }

  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      return Response.json(
        { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }
    updates.status = status
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'No valid fields provided to update' }, { status: 400 })
  }

  // Step 4: update — RLS enforces facility ownership, facility_id never touched
  const { data, error } = await supabase
    .from('Inventory')
    .update(updates)
    .eq('id', parsedId)
    .select()
    .single()

  if (error) {
    // When RLS blocks the update, .single() fails because no row is returned
    if (
      error.message.includes('Cannot coerce the result to a single JSON object') ||
      error.code === 'PGRST116'
    ) {
      return Response.json(
        { error: 'You are not authorized to modify this inventory' },
        { status: 403 }
      )
    }
    return Response.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return Response.json(
      { error: 'You are not authorized to modify this inventory' },
      { status: 403 }
    )
  }

  // Step 5: return updated record
  return Response.json(data, { status: 200 })
}
