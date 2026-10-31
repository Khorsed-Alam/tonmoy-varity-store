import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uhntqrgwwwlcirjzfgrh.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_DTlMnknPYqr2v181_NUhIw_dL-U6igC'

export const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('your-project-id')

if (!isSupabaseConfigured) {
  console.warn('Supabase URL or Anon Key is missing. Check your environment variables.')
}

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Alias export for convenient backward compatibility
export const supabase = supabaseClient
export default supabaseClient
