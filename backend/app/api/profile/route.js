import { createSupabaseServerClient } from '@/lib/supabase-server'
import { extractBearerToken } from '@/app/api/inventory/route'

export async function GET(request) {
  const accessToken = extractBearerToken(request)
  const supabase = await createSupabaseServerClient(accessToken)

  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from('Profile')
    .select('id, full_name, email, role, facility_id')
    .eq('id', user.id)
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  // Look up the facility separately — embedding Facility(name) in the Profile
  // select breaks .single()'s single-object coercion, so fetch the row directly.
  let facility = null
  if (profile.facility_id) {
    const { data: facilityData, error: facilityError } = await supabase
      .from('Facility')
      .select('id, name')
      .eq('id', profile.facility_id)
      .maybeSingle()

    if (facilityError) {
      return Response.json({ error: facilityError.message }, { status: 500 })
    }

    facility = facilityData
  }

  return Response.json({
    ...profile,
    Facility: facility ? { name: facility.name } : null,
  })
}
