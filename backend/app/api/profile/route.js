import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createSupabaseServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

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
