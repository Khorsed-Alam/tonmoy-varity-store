// Re-export the unified client from supabaseClient.js for backward compatibility
import { supabaseClient, supabase, isSupabaseConfigured } from './supabaseClient'

export { supabaseClient, supabase, isSupabaseConfigured }
export default supabaseClient
