const SUPABASE_URL = 'https://fpvlbkdcqmcatvxhuzta.supabase.co/';
const SUPABASE_ANON_KEY = 'sb_publishable_jJ_I0osFLEfqcjR2t3tz8A_3DsYKPwE';

// Attach to window so any page/script can access it
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);