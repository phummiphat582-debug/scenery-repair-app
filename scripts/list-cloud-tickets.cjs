const { createClient } = require('@supabase/supabase-js');

const c1 = createClient(
  'https://rimwhvvashgcaepyavjq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbXdodnZhc2hnY2FlcHlhdmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NjkwNzcsImV4cCI6MjEwMTE0NTA3N30.XAo8nJPSDHokoQIv4GkMcXghb3uBeV5I7Re4Wb0mxFw'
);

async function listAll() {
  const { data, error } = await c1
    .from('repair_tickets')
    .select('id, request_id, title, department, location, requester_name, priority, status, remark, created_at, request_image_url')
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    console.error(error);
  } else {
    console.log(`Total tickets in cloud: ${data.length}`);
    data.forEach((t, i) => {
      const imgLen = t.request_image_url ? t.request_image_url.length : 0;
      const imgPreview = t.request_image_url ? t.request_image_url.slice(0, 25) : 'none';
      console.log(`#${i + 1}: [${t.request_id}] ${t.title} | dept: ${t.department} | loc: ${t.location} | requester: ${t.requester_name} | status: ${t.status} | img: ${imgPreview} (len ${imgLen}) | date: ${t.created_at}`);
    });
  }
}

listAll();
