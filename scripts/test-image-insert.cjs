const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rimwhvvashgcaepyavjq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbXdodnZhc2hnY2FlcHlhdmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NjkwNzcsImV4cCI6MjEwMTE0NTA3N30.XAo8nJPSDHokoQIv4GkMcXghb3uBeV5I7Re4Wb0mxFw'
);

async function testImageInsert() {
  // Generate a realistic 50KB base64 JPEG string
  const dummyBase64 = 'data:image/jpeg;base64,' + 'A'.repeat(50000);
  const testId = `REP-202610-TEST-${Date.now().toString().slice(-4)}`;

  console.log(`Inserting test ticket ${testId} with 50KB base64 image...`);
  const { data, error } = await supabase
    .from('repair_tickets')
    .insert([
      {
        request_id: testId,
        title: 'ทดสอบระบบอัพโหลดภาพเรียลไทม์',
        description: 'ทดสอบความเร็วและขนาดภาพ',
        department: 'ฟร้อน',
        location: 'เคาน์เตอร์เช็คอิน',
        requester_name: 'ระบบทดสอบ',
        priority: 'normal',
        status: 'pending',
        request_image_url: dummyBase64
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Insert failed:', error);
    return;
  }

  console.log('Successfully inserted!', data.request_id);
  console.log('Image in DB length:', data.request_image_url?.length);

  // Now query it back with .select('...')
  const { data: queried, error: qErr } = await supabase
    .from('repair_tickets')
    .select('request_id, title, request_image_url')
    .eq('request_id', testId)
    .single();

  if (qErr) console.error('Query error:', qErr);
  else console.log('Successfully queried back image with length:', queried.request_image_url?.length);

  // Clean up test ticket
  await supabase.from('repair_tickets').delete().eq('request_id', testId);
  console.log('Test ticket cleaned up.');
}

testImageInsert();
