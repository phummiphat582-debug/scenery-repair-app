const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rimwhvvashgcaepyavjq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbXdodnZhc2hnY2FlcHlhdmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NjkwNzcsImV4cCI6MjEwMTE0NTA3N30.XAo8nJPSDHokoQIv4GkMcXghb3uBeV5I7Re4Wb0mxFw'
);

async function inspectAttached() {
  const { data, error } = await supabase
    .from('repair_tickets')
    .select('*')
    .eq('request_image_url', '[ATTACHED]')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${data.length} tickets with [ATTACHED]:`);
  data.forEach(t => {
    console.log(`\nTicket: ${t.request_id} | Status: ${t.status}`);
    console.log(`Dept: ${t.department} | Loc: ${t.location}`);
    console.log(`Title: ${t.title}`);
    console.log(`Requester: ${t.requester_name} (${t.requester_phone || 'no phone'})`);
    console.log(`Desc: ${t.description}`);
    console.log(`Created: ${t.created_at}`);
  });
}

inspectAttached();
