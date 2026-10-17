const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rimwhvvashgcaepyavjq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbXdodnZhc2hnY2FlcHlhdmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NjkwNzcsImV4cCI6MjEwMTE0NTA3N30.XAo8nJPSDHokoQIv4GkMcXghb3uBeV5I7Re4Wb0mxFw'
);

async function findMissing() {
  const { data, error } = await supabase
    .from('repair_tickets')
    .select('request_id, title, department, created_at, status')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total tickets: ${data.length}`);
  const octNums = [];
  const otherIds = [];

  data.forEach(t => {
    const match = t.request_id?.match(/REP-202610-(\d+)/);
    if (match) {
      octNums.push({ num: parseInt(match[1], 10), raw: t.request_id, title: t.title, dept: t.department, status: t.status });
    } else {
      otherIds.push(t.request_id);
    }
  });

  octNums.sort((a, b) => a.num - b.num);
  console.log(`October numbered tickets: ${octNums.length}`);
  console.log('Other request IDs:', otherIds);

  const existingNumSet = new Set(octNums.map(x => x.num));
  const min = octNums[0]?.num || 1;
  const max = 106; // highest known ticket before the 4-digit fallback

  const missing = [];
  for (let i = min; i <= max; i++) {
    if (!existingNumSet.has(i)) {
      missing.push(i);
    }
  }

  console.log('\nMissing ticket numbers between', min, 'and', max, ':');
  console.log(missing.map(n => `REP-202610-${String(n).padStart(3, '0')}`).join(', '));

  console.log('\nAll October tickets:');
  octNums.forEach(x => {
    if (x.num > 80) {
      console.log(`${x.raw} | ${x.status} | dept: ${x.dept} | ${x.title}`);
    }
  });
}

findMissing();
