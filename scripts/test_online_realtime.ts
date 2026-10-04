import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://roqsnzofqtjtendcpdqs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvcXNuem9mcXRqdGVuZGNwZHFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NTc2NzYsImV4cCI6MjEwNjQzMzY3Nn0.kObOMFrinAFmOOQi05GvXmupvc28_wyKqcqKlwS0tao';

console.log('🔄 เริ่มต้นทดสอบระบบออนไลน์และเรียลไทม์ (Central Cloud Database)...');
console.log('📍 Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTests() {
  const results: Record<string, boolean> = {};

  // 1. Test Read repair_tickets
  try {
    const start = Date.now();
    const { data, error } = await supabase.from('repair_tickets').select('*').limit(5);
    const latency = Date.now() - start;
    if (error) {
      console.error('❌ 1. ตาราง repair_tickets (อ่านข้อมูล): ล้มเหลว -', error.message);
      results['tickets_read'] = false;
    } else {
      console.log(`✅ 1. ตาราง repair_tickets (อ่านข้อมูล): สำเร็จ (${latency}ms) พบ ${data?.length || 0} รายการล่าสุด`);
      results['tickets_read'] = true;
    }
  } catch (err: any) {
    console.error('❌ 1. ตาราง repair_tickets exception:', err.message);
    results['tickets_read'] = false;
  }

  // 2. Test Read technicians
  try {
    const start = Date.now();
    const { data, error } = await supabase.from('technicians').select('*');
    const latency = Date.now() - start;
    if (error) {
      console.error('❌ 2. ตาราง technicians (อ่านข้อมูล): ล้มเหลว -', error.message);
      results['technicians_read'] = false;
    } else {
      console.log(`✅ 2. ตาราง technicians (อ่านข้อมูล): สำเร็จ (${latency}ms) มีช่างในระบบ ${data?.length || 0} คน:`);
      data?.slice(0, 5).forEach((t: any) => console.log(`   - [${t.name}] ${t.role} (${t.phone || 'ไม่มีเบอร์'}) เข้าเวร: ${t.is_on_duty_today ? 'ใช่' : 'ไม่ใช่'}`));
      results['technicians_read'] = true;
    }
  } catch (err: any) {
    console.error('❌ 2. ตาราง technicians exception:', err.message);
    results['technicians_read'] = false;
  }

  // 3. Test Read departments
  try {
    const { data, error } = await supabase.from('departments').select('*');
    if (error) {
      console.error('❌ 3. ตาราง departments (อ่านข้อมูล): ล้มเหลว -', error.message);
      results['departments_read'] = false;
    } else {
      console.log(`✅ 3. ตาราง departments (อ่านข้อมูล): สำเร็จ พบ ${data?.length || 0} แผนก`);
      results['departments_read'] = true;
    }
  } catch (err: any) {
    console.error('❌ 3. ตาราง departments exception:', err.message);
    results['departments_read'] = false;
  }

  // 4. Test CRUD Mutation: Insert a test ticket, update it, and delete it
  const testId = 'REP-TEST-' + Date.now().toString().slice(-6);
  try {
    console.log(`🔄 4. กำลังทดสอบสร้างใบงานจำลอง #${testId}...`);
    const { data: insertData, error: insertError } = await supabase
      .from('repair_tickets')
      .insert([{
        request_id: testId,
        title: 'ทดสอบระบบออนไลน์เรียลไทม์',
        description: 'Auto-test realtime online sync',
        department: '0 ฟร้อน',
        location: 'ระบบทดสอบอัตโนมัติ',
        requester_name: 'ระบบทดสอบ',
        requester_phone: '0800000000',
        priority: 'normal',
        status: 'pending',
        division: '84'
      }])
      .select()
      .single();

    if (insertError) {
      console.error('❌ 4. สร้างใบงานจำลอง: ล้มเหลว -', insertError.message);
      results['ticket_crud'] = false;
    } else {
      console.log(`✅ 4.1 สร้างใบงานจำลอง #${testId}: สำเร็จ (ID: ${insertData.id})`);

      // Update test (กดรับงานเอง)
      const { error: updateError } = await supabase
        .from('repair_tickets')
        .update({
          status: 'in_progress',
          technician_name: 'ช่างทดสอบระบบ',
          technician_phone: '0812345678',
          remark: 'ทดสอบกดรับงานเอง'
        })
        .eq('id', insertData.id);

      if (updateError) {
        console.error('❌ 4.2 อัปเดตใบงานจำลอง: ล้มเหลว -', updateError.message);
        results['ticket_crud'] = false;
      } else {
        console.log(`✅ 4.2 อัปเดตใบงานจำลอง (กดรับงานเอง): สำเร็จ`);

        // Delete test
        const { error: deleteError } = await supabase
          .from('repair_tickets')
          .delete()
          .eq('id', insertData.id);

        if (deleteError) {
          console.error('❌ 4.3 ลบใบงานจำลอง: ล้มเหลว -', deleteError.message);
          results['ticket_crud'] = false;
        } else {
          console.log(`✅ 4.3 ลบใบงานจำลอง (Clean up): สำเร็จ`);
          results['ticket_crud'] = true;
        }
      }
    }
  } catch (err: any) {
    console.error('❌ 4. CRUD exception:', err.message);
    results['ticket_crud'] = false;
  }

  // 5. Test Realtime WebSocket Channel
  console.log('🔄 5. กำลังทดสอบ WebSocket Realtime Channel Subscription...');
  let realtimeResolved = false;

  await new Promise<void>((resolve) => {
    const timeout = setTimeout(() => {
      if (!realtimeResolved) {
        console.warn('⚠️ 5. WebSocket Realtime: ใช้เวลานานกว่าปกติ (>8s)');
        results['realtime_websocket'] = false;
        resolve();
      }
    }, 8000);

    const client1 = createClient(supabaseUrl, supabaseAnonKey);
    const client2 = createClient(supabaseUrl, supabaseAnonKey);

    const channel1 = client1.channel('test_realtime_channel', {
      config: { broadcast: { self: false } }
    });

    const channel2 = client2.channel('test_realtime_channel', {
      config: { broadcast: { self: false } }
    });

    let client1Subscribed = false;
    let client2Subscribed = false;

    channel1.on('broadcast', { event: 'PING' }, (payload) => {
      console.log('✅ 5.3 Realtime Peer-to-Peer Broadcast ได้รับสัญญาณ:', payload);
      realtimeResolved = true;
      results['realtime_websocket'] = true;
      clearTimeout(timeout);
      client1.removeChannel(channel1);
      client2.removeChannel(channel2);
      resolve();
    });

    channel1.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        client1Subscribed = true;
        console.log('✅ 5.1 Realtime Client 1 เชื่อมต่อสำเร็จ (SUBSCRIBED)');
        if (client2Subscribed) sendBroadcast();
      }
    });

    channel2.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        client2Subscribed = true;
        console.log('✅ 5.2 Realtime Client 2 เชื่อมต่อสำเร็จ (SUBSCRIBED)');
        if (client1Subscribed) sendBroadcast();
      }
    });

    function sendBroadcast() {
      console.log('📡 ส่งสัญญาณ Broadcast PING จาก Client 2 -> Client 1...');
      channel2.send({
        type: 'broadcast',
        event: 'PING',
        payload: { message: 'HELLO_FROM_CLIENT_2', timestamp: Date.now() }
      });
    }
  });

  // Summary
  console.log('\n========================================');
  console.log('📊 สรุปผลการทดสอบระบบออนไลน์เรียลไทม์');
  console.log('========================================');
  console.log('1. การเชื่อมต่อฐานข้อมูล Supabase:', results['tickets_read'] ? '🟢 ปกติ 100%' : '🔴 ผิดพลาด');
  console.log('2. รายชื่อช่างในระบบ:', results['technicians_read'] ? '🟢 ปกติ 100%' : '🔴 ผิดพลาด');
  console.log('3. แผนกและข้อมูลโค้ด:', results['departments_read'] ? '🟢 ปกติ 100%' : '🔴 ผิดพลาด');
  console.log('4. ทดสอบ CRUD (เพิ่ม/แก้ไข/ลบ):', results['ticket_crud'] ? '🟢 ปกติ 100%' : '🔴 ผิดพลาด');
  console.log('5. เครือข่าย WebSocket Realtime:', results['realtime_websocket'] ? '🟢 เชื่อมต่อสดเรียลไทม์ 100%' : '🟡 มีการหน่วงหรือจำกัด');
  console.log('========================================\n');
}

runTests().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
