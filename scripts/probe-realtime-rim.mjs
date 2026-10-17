import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rimwhvvashgcaepyavjq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbXdodnZhc2hnY2FlcHlhdmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NjkwNzcsImV4cCI6MjEwMTE0NTA3N30.XAo8nJPSDHokoQIv4GkMcXghb3uBeV5I7Re4Wb0mxFw';

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('Testing rimwhvvashgcaepyavjq Realtime WebSocket...');
const channel = client.channel('scenery_realtime_probe', {
  config: { broadcast: { self: false } }
});

channel.subscribe((status, err) => {
  console.log('Realtime status on rimwhvvashgcaepyavjq:', status, err || '');
  if (status === 'SUBSCRIBED') {
    console.log('✅ Realtime WebSocket CONNECTED AND SUBSCRIBED successfully!');
    process.exit(0);
  } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
    console.log('❌ Failed:', status);
    process.exit(1);
  }
});

setTimeout(() => {
  console.log('Timeout waiting for Realtime status');
  process.exit(1);
}, 8000);
