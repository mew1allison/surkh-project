import { createSupabaseServerClient } from '@/lib/supabase-server'
import { extractBearerToken } from '@/app/api/inventory/route'

export async function GET(request) {
  const accessToken = extractBearerToken(request)
  const supabase = await createSupabaseServerClient(accessToken)

  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('Exchange Request')
    .select('*')

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}

const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const VALID_EXCHANGE_STATUSES = ['accepted', 'rejected']

export async function POST(request) {
  const supabase = await createSupabaseServerClient()

  // Step 1: authenticate
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Step 2: get profile (facility_id and id must come from server)
  const { data: profile, error: profileError } = await supabase
    .from('Profile')
    .select('id, facility_id')
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

  if (body.requester_facility_id !== undefined) {
    return Response.json(
      { error: 'You are not authorized to specify a requester facility' },
      { status: 403 }
    )
  }

  const { blood_group, quantity } = body

  const provider_facility_id = Number(body.provider_facility_id)

  if (!Number.isInteger(provider_facility_id) || provider_facility_id < 1) {
    return Response.json({ error: 'provider_facility_id must be a positive integer' }, { status: 400 })
  }

  if (provider_facility_id === profile.facility_id) {
    return Response.json({ error: 'Cannot request from your own facility' }, { status: 400 })
  }

  if (!blood_group || !VALID_BLOOD_GROUPS.includes(blood_group)) {
    return Response.json(
      { error: `blood_group must be one of: ${VALID_BLOOD_GROUPS.join(', ')}` },
      { status: 400 }
    )
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    return Response.json({ error: 'quantity must be a positive integer' }, { status: 400 })
  }

  // Step 4: insert — server controls requester_facility_id, requested_by, status
  const { data, error } = await supabase
    .from('Exchange Request')
    .insert({
      requester_facility_id: profile.facility_id,
      requested_by: profile.id,
      provider_facility_id,
      blood_group,
      quantity,
      status: 'pending',
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
  const accessToken = extractBearerToken(request)
  const supabase = await createSupabaseServerClient(accessToken)

  // Step 1: authenticate
  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Step 2: validate ?id= query parameter
  const { searchParams } = new URL(request.url)
  const parsedId = Number(searchParams.get('id'))
  if (!Number.isInteger(parsedId) || parsedId < 1) {
    return Response.json({ error: 'id must be a positive integer' }, { status: 400 })
  }

  // Step 3: get facility_id from server-side Profile
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

  // Step 4: fetch the exchange request
  const { data: exchangeRequest, error: fetchError } = await supabase
    .from('Exchange Request')
    .select('id, status, provider_facility_id')
    .eq('id', parsedId)
    .single()

  if (fetchError || !exchangeRequest) {
    return Response.json({ error: 'Exchange request not found' }, { status: 404 })
  }

  // Step 5: only the provider facility may update
  if (profile.facility_id !== exchangeRequest.provider_facility_id) {
    return Response.json(
      { error: 'Only the provider facility may update this request' },
      { status: 403 }
    )
  }

  // Step 6: only pending requests can be updated
  if (exchangeRequest.status !== 'pending') {
    return Response.json(
      { error: 'Only pending requests can be updated' },
      { status: 409 }
    )
  }

  // Step 7: validate status from request body
  const body = await request.json()
  const { status } = body

  if (!status || !VALID_EXCHANGE_STATUSES.includes(status)) {
    return Response.json(
      { error: `status must be one of: ${VALID_EXCHANGE_STATUSES.join(', ')}` },
      { status: 400 }
    )
  }

  // Step 8: update only the status field
  const { data, error } = await supabase
    .from('Exchange Request')
    .update({ status })
    .eq('id', parsedId)
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  // Step 9: return updated record
  return Response.json(data, { status: 200 })
}