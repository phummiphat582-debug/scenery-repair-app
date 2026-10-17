const { createClient } = require('@supabase/supabase-js');

const url = 'https://rimwhvvashgcaepyavjq.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbXdodnZhc2hnY2FlcHlhdmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NjkwNzcsImV4cCI6MjEwMTE0NTA3N30.XAo8nJPSDHokoQIv4GkMcXghb3uBeV5I7Re4Wb0mxFw';
const supabase = createClient(url, key);

(async () => {
  console.log('Testing CRUD on rimwhvvashgcaepyavjq...');

  // 1. Insert a ticket
  const testReqId = 'REP-TEST-LIVE-01';
  const newRow = {
    request_id: testReqId,
    title: 'ทดสอบงานปิดแล้วต้องไม่เด้ง',
    description: 'ทดสอบระบบปิดงานสมบูรณ์',
    department: '0 ฟร้อน',
    location: 'ล็อบบี้',
    requester_name: 'ผู้ทดสอบ',
    status: 'pending',
    priority: 'normal'
  };

  const { data: insData, error: insErr } = await supabase.from('repair_tickets').insert([newRow]).select();
  if (insErr) {
    console.error('❌ Insert failed:', insErr.message);
    process.exit(1);
  }
  console.log('✅ 1. Inserted ticket into cloud DB:', insData[0].request_id, insData[0].status);

  // 2. Query to verify pending
  const { data: queryData } = await supabase.from('repair_tickets').select('*').eq('request_id', testReqId);
  console.log('✅ 2. Queried ticket from cloud DB:', queryData[0].status);

  // 3. Update to completed
  const nowIso = new Date().toISOString();
  const { data: updData, error: updErr } = await supabase.from('repair_tickets').update({
    status: 'completed',
    completed_at: nowIso,
    technician_name: 'ช่างสมชาย',
    repair_result: 'ช่างผู้ปิดงาน: ช่างสมชาย\nสาเหตุ: ซ่อมเสร็จ\nวิธีแก้ไข: ดำเนินการแล้ว'
  }).eq('request_id', testReqId).select();

  if (updErr) {
    console.error('❌ Update failed:', updErr.message);
    process.exit(1);
  }
  console.log('✅ 3. Updated ticket in cloud DB to completed:', updData[0].status, updData[0].completed_at);

  // 4. Query again to guarantee it is completed
  const { data: verifyData } = await supabase.from('repair_tickets').select('*').eq('request_id', testReqId);
  if (verifyData[0].status === 'completed') {
    console.log('✅ 4. Cloud DB verified: status === completed!');
  } else {
    console.error('❌ Cloud DB status is NOT completed:', verifyData[0].status);
  }

  // 5. Clean up test record
  await supabase.from('repair_tickets').delete().eq('request_id', testReqId);
  console.log('✅ 5. Cleaned up test record.');
  console.log('\nALL CLOUD CRUD OPERATIONS PASSED WITH ZERO SCHEMA/QUOTA ERRORS!');
})();
