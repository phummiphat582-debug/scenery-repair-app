const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rimwhvvashgcaepyavjq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbXdodnZhc2hnY2FlcHlhdmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NjkwNzcsImV4cCI6MjEwMTE0NTA3N30.XAo8nJPSDHokoQIv4GkMcXghb3uBeV5I7Re4Wb0mxFw'
);

async function inspectFallbacks() {
  const { data, error } = await supabase
    .from('repair_tickets')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  const fallbackIds = ['REP-202610-5977', 'REP-202610-7323', 'REP-202610-4646', 'REP-202610-2382', 'REP-202610-5966', 'REP-202610-2020', 'REP-202610-7619'];

  data.forEach((t, i) => {
    if (fallbackIds.includes(t.request_id)) {
      const prev = data[i - 1];
      const next = data[i + 1];
      console.log(`\nFound fallback ticket: ${t.request_id}`);
      console.log(`- Created: ${t.created_at}`);
      console.log(`- Title: ${t.title}`);
      console.log(`- Dept: ${t.department} | Loc: ${t.location}`);
      console.log(`- Requester: ${t.requester_name}`);
      console.log(`- Prev ticket: ${prev?.request_id} (${prev?.title}) at ${prev?.created_at}`);
      console.log(`- Next ticket: ${next?.request_id} (${next?.title}) at ${next?.created_at}`);
    }
  });
}

inspectFallbacks();
