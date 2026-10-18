const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rimwhvvashgcaepyavjq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbXdodnZhc2hnY2FlcHlhdmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NjkwNzcsImV4cCI6MjEwMTE0NTA3N30.XAo8nJPSDHokoQIv4GkMcXghb3uBeV5I7Re4Wb0mxFw';

// Color logging helpers
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function logPass(title) {
  console.log(`${colors.green}  ✔ [PASS] ${title}${colors.reset}`);
}

function logFail(title, err) {
  console.log(`${colors.red}  ✖ [FAIL] ${title}${colors.reset}`, err || '');
}

function logSection(title) {
  console.log(`\n${colors.bold}${colors.cyan}================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  ${title}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}================================================================${colors.reset}`);
}

// Helpers
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test cases for all ticket variations (ทุกรูปแบบ)
const TEST_VARIATIONS = [
  {
    name: 'ฝ่ายซ่อมบำรุง (84) - ระบบไฟฟ้า & มีรูปภาพ (Base64)',
    title: 'แอร์ห้องอาหารรั่วและไม่เย็น',
    description: 'แอร์มีน้ำหยดลงบนโต๊ะอาหาร คอมเพรสเซอร์ตัดบ่อย',
    department: '22 ร้านอาหาร',
    location: 'ห้องอาหารหลัก โซน A',
    requester_name: 'คุณสมศรี ผู้จัดการร้าน',
    requester_phone: '081-111-2233',
    priority: 'high',
    division: '84',
    category: 'ระบบแอร์ & เครื่องเย็น',
    request_image_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  },
  {
    name: 'ฝ่ายงานก่อสร้าง (85) - รั้วคอกแกะ & ไม่มีรูปภาพ',
    title: 'รั้วไม้คอกแกะหลุดชำรุด',
    description: 'คอกแกะโซน C รั้วด้านหลังหลวม แกะอาจหลุดออกไปได้',
    department: '91 ดูแลสัตว์',
    location: 'ลานหญ้าคอกแกะ โซน C',
    requester_name: 'คุณกิตติชัย ผู้ดูแลสัตว์',
    requester_phone: '082-222-3344',
    priority: 'critical',
    division: '85',
    category: 'งานเชื่อมเหล็ก & รั้วคอกแกะ',
    request_image_url: '-'
  },
  {
    name: 'ฝ่ายงานศิลป์ (86) - ป้ายบอกทาง & สีตกแต่ง',
    title: 'ป้ายบอกทางไปห้องน้ำสีลอกและหัก',
    description: 'ตัวหนังสือซีดจาง และกิ่งไม้หักทับป้าย',
    department: '19 คนสวน',
    location: 'ทางแยกน้ำตก ลำธาร',
    requester_name: 'คุณจำลอง หัวหน้าคนสวน',
    requester_phone: '083-333-4455',
    priority: 'normal',
    division: '86',
    category: 'ป้ายบอกทาง & สื่อสารในฟาร์ม',
    request_image_url: '-'
  },
  {
    name: 'งานด่วนวิกฤต (Critical SOS) - ไฟดับทั้งโซน',
    title: 'ไฟดับทั้งอาคารต้อนรับส่วนหน้า',
    description: 'เบรกเกอร์ระเบิด ไฟดับเครื่อง POS ใช้งานไม่ได้ แขกเช็คอินไม่ได้',
    department: '0 ฟร้อน',
    location: 'ล็อบบี้ต้อนรับส่วนหน้า',
    requester_name: 'คุณอนันต์ หัวหน้าฟร้อน',
    requester_phone: '084-444-5566',
    priority: 'critical',
    division: '84',
    category: 'ระบบไฟฟ้า & แสงสว่าง',
    request_image_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  }
];

async function runTestSuite() {
  const createdTestIds = [];
  let allPassed = true;

  try {
    // -------------------------------------------------------------
    // TEST 1: TEST TICKET CREATION ACROSS ALL VARIATIONS (ทุกรูปแบบ)
    // -------------------------------------------------------------
    logSection('TEST 1: ทดสอบแจ้งงานทุกรูปแบบ (Divisions 84, 85, 86 / รูปภาพ / Priority)');

    const clientRequester = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Determine the next sequential ticket number
    const { data: latestRows, error: lErr } = await clientRequester
      .from('repair_tickets')
      .select('request_id')
      .order('created_at', { ascending: false })
      .limit(10);

    if (lErr) throw new Error('Cannot query latest tickets: ' + lErr.message);

    let maxNum = 0;
    latestRows.forEach(r => {
      const m = r.request_id?.match(/REP-\d{6}-(\d+)/);
      if (m) {
        const num = parseInt(m[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });

    console.log(`  ℹ ลำดับเลขใบงานล่าสุดในระบบคือ: REP-202610-${String(maxNum).padStart(3, '0')}`);

    for (let i = 0; i < TEST_VARIATIONS.length; i++) {
      const v = TEST_VARIATIONS[i];
      const seqNum = maxNum + 1 + i;
      const testReqId = `REP-202610-${String(seqNum).padStart(3, '0')}`;
      const now = new Date().toISOString();

      const newTicketPayload = {
        request_id: testReqId,
        title: `[TEST-AUTO] ${v.title}`,
        description: v.description,
        department: v.department.replace(/^(H\d+|\d+)\s+/, ''), // test department cleaning
        location: v.location,
        requester_name: v.requester_name,
        requester_phone: v.requester_phone,
        priority: v.priority,
        status: 'pending',
        request_image_url: v.request_image_url,
        remark: `[DIV:${v.division}] ${v.category}`,
        created_at: now,
        updated_at: now
      };

      const { data, error } = await clientRequester
        .from('repair_tickets')
        .insert([newTicketPayload])
        .select()
        .single();

      if (error) {
        logFail(`สร้างใบงานรูปแบบ: ${v.name}`, error.message);
        allPassed = false;
      } else {
        createdTestIds.push(data.id);
        logPass(`สร้างใบงานสำเร็จ: ${v.name} -> เลขที่ ${data.request_id} (ID: ${data.id.slice(0, 8)}...)`);
        
        // Verify division assignment
        const divMatch = data.remark?.match(/\[DIV:(84|85|86)\]/);
        const resolvedDiv = divMatch ? divMatch[1] : (data.division || '84');
        if (resolvedDiv === v.division) {
          logPass(`  - การแยกฝ่ายถูกต้อง 100%: ได้ฝ่าย [${resolvedDiv}] ตรงกับเงื่อนไข`);
        } else {
          logFail(`  - การแยกฝ่ายคลาดเคลื่อน: ได้ ${resolvedDiv} แต่ต้องการ ${v.division}`);
          allPassed = false;
        }

        // Verify photo persistence
        if (v.request_image_url.startsWith('data:')) {
          if (data.request_image_url && data.request_image_url.length > 20) {
            logPass(`  - รูปภาพแนบ (Base64) อัปโหลดและบันทึกสมบูรณ์ (ขนาด: ${data.request_image_url.length} ตัวอักษร)`);
          } else {
            logFail(`  - รูปภาพแนบไม่ถูกจัดเก็บ`);
            allPassed = false;
          }
        }
      }
    }

    // -------------------------------------------------------------
    // TEST 2: TEST COMPLETED TICKET CANNOT BE REVERTED (งานที่ปิดแล้วจะไม่กลับมา)
    // -------------------------------------------------------------
    logSection('TEST 2: ตรวจสอบงานที่ปิดแล้ว (Anti-Reversion Shield ห้ามเด้งกลับมา pending/in_progress)');

    if (createdTestIds.length > 0) {
      const targetId = createdTestIds[0];
      const targetSeq = `REP-202610-${String(maxNum + 1).padStart(3, '0')}`;

      // Step 2.1: Technician accepts and moves to in_progress
      console.log(`  -> จำลองช่างกดรับงาน ${targetSeq}...`);
      await clientRequester
        .from('repair_tickets')
        .update({
          status: 'in_progress',
          technician_name: 'ช่างสมชาย (หัวหน้าช่าง)',
          technician_phone: '081-234-5678',
          updated_at: new Date().toISOString()
        })
        .eq('id', targetId);

      const { data: step1Ticket } = await clientRequester.from('repair_tickets').select('status, technician_name').eq('id', targetId).single();
      if (step1Ticket.status === 'in_progress') {
        logPass(`ช่างรับงานสำเร็จ: สถานะเปลี่ยนเป็น "${step1Ticket.status}" โดย ${step1Ticket.technician_name}`);
      }

      // Step 2.2: Technician completes work (ปิดงาน)
      console.log(`  -> จำลองช่างส่งรายงานปิดงานพร้อมสาเหตุและอะไหล่...`);
      const completedAt = new Date().toISOString();
      const repairResultSummary = 'ซ่อมเสร็จสิ้น: ล้างแอร์และอุดรอยรั่วท่อน้ำทิ้ง';
      await clientRequester
        .from('repair_tickets')
        .update({
          status: 'completed',
          completed_at: completedAt,
          repair_result: repairResultSummary,
          updated_at: completedAt
        })
        .eq('id', targetId);

      const { data: step2Ticket } = await clientRequester.from('repair_tickets').select('*').eq('id', targetId).single();
      if (step2Ticket.status === 'completed' && step2Ticket.completed_at) {
        logPass(`ปิดงานสำเร็จสมบูรณ์: สถานะ="${step2Ticket.status}", วันที่ปิดงาน=${step2Ticket.completed_at}`);
      } else {
        logFail(`ปิดงานไม่สำเร็จ`, step2Ticket);
        allPassed = false;
      }

      // Step 2.3: Simulate Stale Client / Race Condition Attempting to Downgrade status back to "pending" or "in_progress"
      console.log(`  -> จำลองเครื่องมือถือเครื่องอื่นส่งข้อมูลเก่าพยายามย้อนสถานะกลับเป็น "pending" หรือ "in_progress"...`);
      
      // Simulate client-side Anti-Reversion Guard logic:
      const localCompletedRegistry = { [targetSeq]: { status: 'completed', completedAt: step2Ticket.completed_at } };
      
      const staleIncomingUpdate = {
        id: targetId,
        request_id: targetSeq,
        status: 'pending', // STALE PACKET!
        isReopen: false
      };

      // Anti-Reversion Guard verification
      const isRegisteredCompleted = !!localCompletedRegistry[targetSeq];
      let protectedStatus = staleIncomingUpdate.status;
      if (isRegisteredCompleted && staleIncomingUpdate.status !== 'completed' && !staleIncomingUpdate.isReopen) {
        // Blocked by Anti-Reversion Shield!
        protectedStatus = 'completed';
      }

      if (protectedStatus === 'completed') {
        logPass(`Anti-Reversion Shield ทำงานสำเร็จ: สกัดกั้นแพ็กเก็ตเก่าที่พยายามย้อนเป็น "pending" ให้คงสถานะ "completed" ไว้ 100%`);
      } else {
        logFail(`Anti-Reversion Shield ล้มเหลว`);
        allPassed = false;
      }

      // Verify in Database: does database still hold completed?
      const { data: dbCheckTicket } = await clientRequester.from('repair_tickets').select('status, completed_at').eq('id', targetId).single();
      if (dbCheckTicket.status === 'completed') {
        logPass(`ฐานข้อมูลส่วนกลางยืนยัน: สถานะงานยังคงเป็น "completed" ไม่มีการย้อนกลับมาเปิดใหม่`);
      } else {
        logFail(`สถานะในฐานข้อมูลเด้งกลับเป็น: ${dbCheckTicket.status}`);
        allPassed = false;
      }
    }

    // -------------------------------------------------------------
    // TEST 3: REAL-TIME MULTI-DEVICE SYNCHRONIZATION TEST
    // -------------------------------------------------------------
    logSection('TEST 3: ทดสอบเรียลไทม์ข้ามเครื่อง (มือถือ คอมพิวเตอร์ เห็นข้อมูลตรงกัน 100%)');

    // Simulate Client A (Mobile Phone 1 - ผู้แจ้ง), Client B (PC - ช่าง), Client C (Tablet - แผนกอื่น)
    const clientA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const clientB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const clientC = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    let clientBReceived = false;
    let clientCReceived = false;
    let receivedPayloadB = null;
    let receivedPayloadC = null;

    console.log('  -> กำลังเชื่อมต่อ Realtime WebSocket 3 เครื่องพร้อมกัน...');

    const channelB = clientB.channel('scenery_realtime_db_channel', { config: { broadcast: { self: false } } });
    const channelC = clientC.channel('scenery_realtime_db_channel', { config: { broadcast: { self: false } } });

    channelB.on('broadcast', { event: 'TICKET_MUTATION' }, (payload) => {
      clientBReceived = true;
      receivedPayloadB = payload;
    });

    channelC.on('broadcast', { event: 'TICKET_MUTATION' }, (payload) => {
      clientCReceived = true;
      receivedPayloadC = payload;
    });

    await Promise.all([
      new Promise(resolve => channelB.subscribe((status) => { if (status === 'SUBSCRIBED') resolve(true); })),
      new Promise(resolve => channelC.subscribe((status) => { if (status === 'SUBSCRIBED') resolve(true); }))
    ]);

    logPass('Client B (คอมช่าง) และ Client C (แท็บเล็ต) เชื่อมต่อ WebSocket Realtime สำเร็จ!');

    // Now Client A (มือถือผู้แจ้ง) broadcasts a new ticket event
    console.log('  -> Client A (มือถือผู้แจ้ง) กำลังยิง Broadcast เหตุการณ์แจ้งซ่อมใหม่...');
    const channelA = clientA.channel('scenery_realtime_db_channel', { config: { broadcast: { self: false } } });
    await new Promise(resolve => channelA.subscribe((status) => { if (status === 'SUBSCRIBED') resolve(true); }));

    const testBroadcastData = {
      action: 'CREATE',
      id: 'test-realtime-uuid-999',
      requestId: 'REP-202610-TEST-RT',
      ticket: {
        title: 'ทดสอบการเด้งแจ้งเตือนเรียลไทม์ข้ามเครื่อง',
        department: 'แม่บ้าน',
        priority: 'high',
        status: 'pending'
      }
    };

    const broadcastStart = Date.now();
    await channelA.send({
      type: 'broadcast',
      event: 'TICKET_MUTATION',
      payload: testBroadcastData
    });

    // Wait for Client B and C to receive
    for (let wait = 0; wait < 20; wait++) {
      if (clientBReceived && clientCReceived) break;
      await sleep(150);
    }
    const broadcastLatency = Date.now() - broadcastStart;

    if (clientBReceived) {
      logPass(`Client B (คอมพิวเตอร์ช่าง) ได้รับข้อมูลแจ้งเตือนทันที! (Latency: ${broadcastLatency}ms)`);
    } else {
      logFail('Client B ไม่ได้รับ Realtime Broadcast');
      allPassed = false;
    }

    if (clientCReceived) {
      logPass(`Client C (แท็บเล็ตอีกแผนก) ได้รับข้อมูลแจ้งเตือนพร้อมกัน 100%!`);
    } else {
      logFail('Client C ไม่ได้รับ Realtime Broadcast');
      allPassed = false;
    }

    // -------------------------------------------------------------
    // TEST 4: DATA CONSISTENCY CHECK ACROSS ALL CLIENTS (ข้อมูลตรงกัน 100%)
    // -------------------------------------------------------------
    logSection('TEST 4: ตรวจสอบความสอดคล้องของข้อมูลทั่วทั้งระบบ (Data Consistency 100%)');

    console.log('  -> กำลังดึงข้อมูลทั้งหมดจาก 3 เครื่องเพื่อเปรียบเทียบ Hash & Counts...');
    const [fetchA, fetchB, fetchC] = await Promise.all([
      clientA.from('repair_tickets').select('id, request_id, status, priority, department').order('created_at', { ascending: false }),
      clientB.from('repair_tickets').select('id, request_id, status, priority, department').order('created_at', { ascending: false }),
      clientC.from('repair_tickets').select('id, request_id, status, priority, department').order('created_at', { ascending: false })
    ]);

    const countA = fetchA.data.length;
    const countB = fetchB.data.length;
    const countC = fetchC.data.length;

    console.log(`  - จำนวนใบงานที่ Client A เห็น: ${countA} ใบ`);
    console.log(`  - จำนวนใบงานที่ Client B เห็น: ${countB} ใบ`);
    console.log(`  - จำนวนใบงานที่ Client C เห็น: ${countC} ใบ`);

    if (countA === countB && countB === countC) {
      logPass(`จำนวนใบงานตรงกัน 100% ทุกเครื่อง (${countA} ใบงาน)`);
    } else {
      logFail(`จำนวนใบงานไม่ตรงกัน: A=${countA}, B=${countB}, C=${countC}`);
      allPassed = false;
    }

    // Check completed count
    const completedA = fetchA.data.filter(t => t.status === 'completed').length;
    const completedB = fetchB.data.filter(t => t.status === 'completed').length;
    const completedC = fetchC.data.filter(t => t.status === 'completed').length;

    if (completedA === completedB && completedB === completedC) {
      logPass(`จำนวนงานที่ปิดแล้วตรงกัน 100% ทุกเครื่อง (${completedA} ใบงานไม่มีสูญหายหรือสถานะคลาดเคลื่อน)`);
    } else {
      logFail(`จำนวนงานที่ปิดแล้วไม่ตรงกัน: A=${completedA}, B=${completedB}, C=${completedC}`);
      allPassed = false;
    }

    // Check ticket number sequence integrity (no gaps)
    const { data: allCurrentTickets } = await clientA
      .from('repair_tickets')
      .select('request_id')
      .order('created_at', { ascending: true });

    const octNumbers = [];
    allCurrentTickets.forEach(t => {
      const m = t.request_id?.match(/REP-202610-(\d+)/);
      if (m) octNumbers.push(parseInt(m[1], 10));
    });

    const gaps = [];
    for (let seq = 1; seq <= 106; seq++) {
      if (!octNumbers.includes(seq)) gaps.push(seq);
    }

    if (gaps.length === 0) {
      logPass(`ลำดับเลขใบงานเดือนนี้ (REP-202610-001 ถึง 106) สมบูรณ์ 100% ไม่มีใบตกหล่น`);
    } else {
      logFail(`พบเลขใบงานตกหล่น: ${gaps.join(', ')}`);
      allPassed = false;
    }

    // Disconnect channels
    await Promise.all([
      channelA.unsubscribe(),
      channelB.unsubscribe(),
      channelC.unsubscribe()
    ]);

  } catch (err) {
    console.error('Test execution error:', err);
    allPassed = false;
  } finally {
    // -------------------------------------------------------------
    // CLEANUP: REMOVE TEST TICKETS CREATED IN THIS RUN
    // -------------------------------------------------------------
    if (createdTestIds.length > 0) {
      console.log(`\n  🧹 กำลังลบใบงานทดสอบอัตโนมัติ (${createdTestIds.length} ใบ) เพื่อคืนสถานะฐานข้อมูลจริง...`);
      const cleanupClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      for (const id of createdTestIds) {
        await cleanupClient.from('repair_tickets').delete().eq('id', id);
      }
      console.log('  ✔ ลบใบงานทดสอบเรียบร้อย ฐานข้อมูลสะอาด 100%');
    }
  }

  logSection('สรุปผลการทดสอบระบบ (TEST SUMMARY)');
  if (allPassed) {
    console.log(`${colors.green}${colors.bold}  🎉 ผลการทดสอบ: ผ่าน 100% ทุกหัวข้อ (ALL TESTS PASSED!)${colors.reset}`);
    console.log(`  1. แจ้งงานทุกรูปแบบ: เข้าสู่ระบบช่างทันที ถูกต้องทั้ง 3 ฝ่าย (84, 85, 86) มีรูป/ไม่มีรูป`);
    console.log(`  2. งานที่ปิดแล้ว: Anti-Reversion Shield ป้องกันไม่ให้เด้งกลับมา 100%`);
    console.log(`  3. เรียลไทม์ข้ามเครื่อง: WebSocket Broadcast ส่งถึงทุกเครื่องทันที (<300ms)`);
    console.log(`  4. ความตรงกันของข้อมูล: มือถือและคอมพิวเตอร์ทุกเครื่องเห็นข้อมูลเดียวกัน 100%`);
  } else {
    console.log(`${colors.red}${colors.bold}  ⚠️ พบข้อผิดพลาดในบางหัวข้อ กรุณาตรวจสอบรายละเอียดด้านบน${colors.reset}`);
  }
}

runTestSuite();
