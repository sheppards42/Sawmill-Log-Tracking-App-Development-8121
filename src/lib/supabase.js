import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://thiemhacvkgzmvqfrykh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoaWVtaGFjdmtnem12cWZyeWtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDE2MzAsImV4cCI6MjA2OTQ3NzYzMH0.GDiVUhOT-0_IUPvKnKjkboEvcSUHCoOs3JOrUaAoar0'

if(SUPABASE_URL === 'https://<PROJECT-ID>.supabase.co' || SUPABASE_ANON_KEY === '<ANON_KEY>'){
  throw new Error('Missing Supabase variables');
}

export default createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})