const { createClient } = require('@supabase/supabase-js');
const supa = createClient('https://rimwhvvashgcaepyavjq.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbXdodnZhc2hnY2FlcHlhdmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NjkwNzcsImV4cCI6MjEwMTE0NTA3N30.XAo8nJPSDHokoQIv4GkMcXghb3uBeV5I7Re4Wb0mxFw');

async function test() {
  const { data } = await supa.from('departments').select('*');
  data.forEach(d => {
    try {
      const decoded = Buffer.from(d.name, 'latin1').toString('utf8');
      console.log(`Original: "${d.name}" -> Decoded: "${decoded}"`);
    } catch (e) {
      console.log(`Failed for "${d.name}":`, e.message);
    }
  });
}
test();
