const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rimwhvvashgcaepyavjq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbXdodnZhc2hnY2FlcHlhdmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NjkwNzcsImV4cCI6MjEwMTE0NTA3N30.XAo8nJPSDHokoQIv4GkMcXghb3uBeV5I7Re4Wb0mxFw'
);

async function testRename() {
  const mapping = [
    { from: 'REP-202610-7619', to: 'REP-202610-095' },
    { from: 'REP-202610-2020', to: 'REP-202610-078' },
    { from: 'REP-202610-5966', to: 'REP-202610-071' },
    { from: 'REP-202610-2382', to: 'REP-202610-053' },
    { from: 'REP-202610-4646', to: 'REP-202610-038' },
    { from: 'REP-202610-7323', to: 'REP-202610-031' },
    { from: 'REP-202610-5977', to: 'REP-202610-030' },
  ];

  console.log('Restoring 7 missing ticket numbers in Supabase Central Cloud...');
  for (const item of mapping) {
    const { data, error } = await supabase
      .from('repair_tickets')
      .update({ request_id: item.to })
      .eq('request_id', item.from)
      .select('id, request_id, title, department, requester_name');

    if (error) {
      console.error(`Failed to restore ${item.from} -> ${item.to}:`, error);
    } else if (data && data.length > 0) {
      console.log(`✅ Restored ${item.from} -> ${item.to}: ${data[0].title} (${data[0].requester_name})`);
    } else {
      console.log(`Ticket ${item.from} not found or already renamed.`);
    }
  }

  // Verify missing ticket sequence now
  const { data: allTickets } = await supabase
    .from('repair_tickets')
    .select('request_id')
    .order('created_at', { ascending: true });

  const octNums = [];
  allTickets.forEach(t => {
    const m = t.request_id?.match(/REP-202610-(\d+)/);
    if (m) octNums.push(parseInt(m[1], 10));
  });

  const missing = [];
  for (let i = 1; i <= 106; i++) {
    if (!octNums.includes(i)) missing.push(i);
  }
  console.log(`\nRemaining missing tickets between 1 and 106: ${missing.length === 0 ? 'NONE! (ALL 1-106 PRESENT)' : missing.join(', ')}`);
}

testRename();
