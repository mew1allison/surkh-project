import { createSupabaseAdminClient } from '@/lib/supabase-admin'

export async function POST(request) {
  // Admin client — bypasses RLS, server-only
  const supabase = createSupabaseAdminClient()

  // Step 1: parse body
  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Step 2: role and facility_id are server-controlled — never accepted from the client
  if (body.role !== undefined || body.facility_id !== undefined) {
    return Response.json(
      { error: 'You are not authorized to specify role or facility_id' },
      { status: 403 }
    )
  }

  const { full_name, email, password, facility_code } = body

  // Step 3: missing fields
  if (
    full_name === undefined ||
    email === undefined ||
    password === undefined ||
    facility_code === undefined
  ) {
    return Response.json(
      { error: 'Missing required fields: full_name, email, password, facility_code' },
      { status: 400 }
    )
  }

  // Step 4: validate types
  if (typeof full_name !== 'string' || full_name.trim().length === 0) {
    return Response.json({ error: 'full_name must be a non-empty string' }, { status: 400 })
  }

  if (typeof email !== 'string' || email.trim().length === 0) {
    return Response.json({ error: 'email must be a non-empty string' }, { status: 400 })
  }

  // Note: password is intentionally not trimmed — spaces may be part of a password
  if (typeof password !== 'string' || password.length === 0) {
    return Response.json({ error: 'password must be a non-empty string' }, { status: 400 })
  }

  if (typeof facility_code !== 'string' || facility_code.trim().length === 0) {
    return Response.json({ error: 'facility_code must be a non-empty string' }, { status: 400 })
  }

  // Step 5: look up the facility by facility_code (the server decides facility_id)
  const { data: facility, error: facilityError } = await supabase
    .from('Facility')
    .select('id, name')
    .eq('facility_code', facility_code.trim())
    .maybeSingle()

  if (facilityError) {
    return Response.json({ error: facilityError.message }, { status: 500 })
  }

  if (!facility) {
    return Response.json(
      { error: 'No facility found with that facility_code' },
      { status: 400 }
    )
  }

  // Step 6: create the Auth user — role/facility are not part of the Auth record
  const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
  })

  if (createUserError) {
    // Typical causes: invalid email, email already registered, password too weak
    return Response.json({ error: createUserError.message }, { status: 400 })
  }

  // Step 7: create the Profile row — the server controls id, role, and facility_id
  const { data: profile, error: profileError } = await supabase
    .from('Profile')
    .insert({
      id: createdUser.user.id,
      full_name: full_name.trim(),
      email: email.trim(),
      role: 'Hospital Staff',
      facility_id: facility.id,
    })
    .select()
    .single()

  if (profileError) {
    // Compensating action: remove the Auth account so it is not orphaned
    await supabase.auth.admin.deleteUser(createdUser.user.id)
    return Response.json({ error: profileError.message }, { status: 500 })
  }

  // Step 8: success — the response contains no password or secret material
  return Response.json(profile, { status: 201 })
}
