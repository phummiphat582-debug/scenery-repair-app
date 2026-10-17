const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rimwhvvashgcaepyavjq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbXdodnZhc2hnY2FlcHlhdmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NjkwNzcsImV4cCI6MjEwMTE0NTA3N30.XAo8nJPSDHokoQIv4GkMcXghb3uBeV5I7Re4Wb0mxFw'
);

async function check() {
  const { data, error } = await supabase
    .from('repair_tickets')
    .select('id, request_id, title, department, location, requester_name, status, request_image_url, created_at, remark')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Total tickets in DB:', data.length);
  const attachedCount = data.filter(t => t.request_image_url === '[ATTACHED]').length;
  const realImgCount = data.filter(t => t.request_image_url && t.request_image_url !== '[ATTACHED]').length;
  const noImgCount = data.filter(t => !t.request_image_url).length;
  console.log(`Attached: ${attachedCount}, Real Image: ${realImgCount}, No Image: ${noImgCount}`);

  console.log('\nLatest 25 tickets:');
  data.slice(0, 25).forEach(t => {
    const imgInfo = !t.request_image_url
      ? 'NO_IMG'
      : t.request_image_url === '[ATTACHED]'
      ? '[ATTACHED]'
      : `IMG(${t.request_image_url.length} chars)`;
    console.log(`${t.request_id || 'NO_REQ_ID'} | ${t.created_at} | ${t.status} | dept: ${t.department} | img: ${imgInfo} | ${t.title}`);
  });

  console.log('\nTickets with [ATTACHED]:');
  const attachedTickets = data.filter(t => t.request_image_url === '[ATTACHED]');
  attachedTickets.forEach(t => {
    console.log(`- ${t.request_id} | ${t.created_at} | ${t.department} | ${t.title}`);
  });
}

check();
