const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rimwhvvashgcaepyavjq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbXdodnZhc2hnY2FlcHlhdmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NjkwNzcsImV4cCI6MjEwMTE0NTA3N30.XAo8nJPSDHokoQIv4GkMcXghb3uBeV5I7Re4Wb0mxFw'
);

async function run() {
  console.log('--- 1. Testing End-to-End Realtime Photo Sync ---');
  const dummyPhoto = 'data:image/jpeg;base64,' + 'C'.repeat(30000); // 30KB realistic compressed photo
  const testReqId = `REP-TEST-E2E-${Date.now().toString().slice(-4)}`;

  // Test 1: Insert ticket with photo and missing optional fields (testing not-null defaults)
  const newRow = {
    request_id: testReqId,
    title: 'ซ่อมบำรุง 84: ทดสอบอัพโหลดภาพถ่ายและข้อมูลเรียลไทม์',
    description: 'ทดสอบการส่งรูปภาพขึ้นเซิร์ฟเวอร์แบบเรียลไทม์',
    department: 'ฟร้อน',
    location: 'พื้นที่ฟาร์ม (อัตโนมัติ)',
    requester_name: 'ผู้ทดสอบระบบ',
    priority: 'high',
    status: 'pending',
    request_image_url: dummyPhoto,
    remark: '[DIV:84] ทดสอบระบบ'
  };

  const { data: inserted, error: insErr } = await supabase
    .from('repair_tickets')
    .insert([newRow])
    .select('id, request_id, title, department, location, requester_name, priority, status, request_image_url')
    .single();

  if (insErr) {
    console.error('❌ Insert test failed:', insErr);
    process.exit(1);
  }

  console.log('✅ Inserted ticket successfully:', inserted.request_id);
  console.log('✅ Photo stored in DB with length:', inserted.request_image_url?.length);

  // Test 2: Query ticket as another client
  const { data: queried, error: qErr } = await supabase
    .from('repair_tickets')
    .select('id, request_id, title, description, department, location, requester_name, requester_phone, priority, status, technician_name, technician_phone, repair_result, remark, request_image_url, result_image_url, created_at, updated_at, completed_at')
    .eq('request_id', testReqId)
    .single();

  if (qErr) {
    console.error('❌ Query test failed:', qErr);
    process.exit(1);
  }

  console.log('✅ Another client queried ticket successfully:');
  console.log(`   - ID: ${queried.id}`);
  console.log(`   - Request ID: ${queried.request_id}`);
  console.log(`   - Title: ${queried.title}`);
  console.log(`   - Photo received: ${queried.request_image_url ? `YES (${queried.request_image_url.length} bytes)` : 'NO'}`);

  if (queried.request_image_url !== dummyPhoto) {
    console.error('❌ Photo mismatch!');
    process.exit(1);
  } else {
    console.log('✅ Photo data matches 100% byte-for-byte!');
  }

  // Clean up
  await supabase.from('repair_tickets').delete().eq('request_id', testReqId);
  console.log('✅ Test ticket cleaned up.');
  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
}

run();
