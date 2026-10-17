const { createClient } = require('@supabase/supabase-js');

const oldClient = createClient(
  'https://roqsnzofqtjtendcpdqs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvcXNuem9mcXRqdGVuZGNwZHFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NTc2NzYsImV4cCI6MjEwNjQzMzY3Nn0.kObOMFrinAFmOOQi05GvXmupvc28_wyKqcqKlwS0tao'
);

const newClient = createClient(
  'https://rimwhvvashgcaepyavjq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbXdodnZhc2hnY2FlcHlhdmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NjkwNzcsImV4cCI6MjEwMTE0NTA3N30.XAo8nJPSDHokoQIv4GkMcXghb3uBeV5I7Re4Wb0mxFw'
);

async function run() {
  console.log('Checking old Supabase...');
  try {
    const { data: oldTickets, error: oldError } = await oldClient
      .from('repair_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (oldError) {
      console.log('Old Supabase error:', oldError);
    } else {
      console.log(`Old Supabase returned ${oldTickets?.length} tickets!`);
      const { data: newTickets, error: newError } = await newClient
        .from('repair_tickets')
        .select('request_id');

      const newReqIds = new Set((newTickets || []).map(t => t.request_id));
      const missingInNew = (oldTickets || []).filter(t => !newReqIds.has(t.request_id));
      console.log(`Found ${missingInNew.length} tickets in OLD database that are MISSING in NEW database!`);
      missingInNew.forEach(t => {
        console.log(`Missing ticket: ${t.request_id} | ${t.created_at} | ${t.department} | ${t.title}`);
      });
    }
  } catch (e) {
    console.error('Exception querying old Supabase:', e);
  }
}

run();
