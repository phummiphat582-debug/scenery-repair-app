import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://roqsnzofqtjtendcpdqs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvcXNuem9mcXRqdGVuZGNwZHFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NTc2NzYsImV4cCI6MjEwNjQzMzY3Nn0.kObOMFrinAFmOOQi05GvXmupvc28_wyKqcqKlwS0tao';

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('Testing channel...');
const channel = client.channel('scenery_realtime_db_channel', {
  config: { broadcast: { self: false } }
});

channel.subscribe((status, err) => {
  console.log('Realtime status:', status, err || '');
  if (status === 'SUBSCRIBED') {
    console.log('Successfully subscribed to channel!');
    setTimeout(() => {
      process.exit(0);
    }, 2000);
  } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
    console.log('Failed:', status);
    process.exit(1);
  }
});

setTimeout(() => {
  console.log('Timeout waiting for Realtime status');
  process.exit(1);
}, 8000);
