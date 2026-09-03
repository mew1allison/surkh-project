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
    .from('Profile')
    .select('id, full_name, email, role, facility_id')
    .eq('id', user.id)
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}
