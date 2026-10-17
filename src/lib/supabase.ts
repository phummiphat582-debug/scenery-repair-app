import { createClient } from '@supabase/supabase-js';

// Primary Central Cloud Database (Healthy, zero-quota restriction cluster)
const DEFAULT_SUPABASE_URL = 'https://rimwhvvashgcaepyavjq.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbXdodnZhc2hnY2FlcHlhdmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NjkwNzcsImV4cCI6MjEwMTE0NTA3N30.XAo8nJPSDHokoQIv4GkMcXghb3uBeV5I7Re4Wb0mxFw';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// If env is set to the old quota-exceeded project roqsnzofqtjtendcpdqs, automatically route to healthy rimwhvvashgcaepyavjq
const supabaseUrl = (envUrl && !envUrl.includes('roqsnzofqtjtendcpdqs')) ? envUrl : DEFAULT_SUPABASE_URL;
const supabaseAnonKey = (envKey && envUrl && !envUrl.includes('roqsnzofqtjtendcpdqs')) ? envKey : DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project')
);

// REST Database Client
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Dedicated High-Availability Realtime WebSocket Client
export const realtimeSupabase = createClient(
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_ANON_KEY
);
