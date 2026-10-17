import { createClient } from '@supabase/supabase-js';

const URL = 'https://rimwhvvashgcaepyavjq.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbXdodnZhc2hnY2FlcHlhdmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NjkwNzcsImV4cCI6MjEwMTE0NTA3N30.XAo8nJPSDHokoQIv4GkMcXghb3uBeV5I7Re4Wb0mxFw';

async function testExchange() {
  const client1 = createClient(URL, KEY);
  const client2 = createClient(URL, KEY);

  const channel1 = client1.channel('scenery_realtime_db_channel', { config: { broadcast: { self: false } } });
  const channel2 = client2.channel('scenery_realtime_db_channel', { config: { broadcast: { self: false } } });

  let client1Received = false;

  channel1.on('broadcast', { event: 'TICKET_MUTATION' }, (payload) => {
    console.log('✅ Client 1 received TICKET_MUTATION broadcast:', payload.payload);
    client1Received = true;
    process.exit(0);
  });

  await new Promise((resolve) => {
    let sub1 = false;
    let sub2 = false;

    channel1.subscribe((status) => {
      console.log('Client 1 status:', status);
      if (status === 'SUBSCRIBED') {
        sub1 = true;
        if (sub2) resolve();
      }
    });

    channel2.subscribe((status) => {
      console.log('Client 2 status:', status);
      if (status === 'SUBSCRIBED') {
        sub2 = true;
        if (sub1) resolve();
      }
    });
  });

  console.log('Both clients subscribed! Client 2 sending CREATE ticket broadcast...');
  await channel2.send({
    type: 'broadcast',
    event: 'TICKET_MUTATION',
    payload: {
      action: 'CREATE',
      id: 'ticket-test-123',
      requestId: 'REP-202610-999',
      ticket: {
        id: 'ticket-test-123',
        requestId: 'REP-202610-999',
        title: 'ทดสอบแจ้งซ่อมเรียลไทม์ข้ามเครื่อง',
        department: '0 ฟร้อน',
        priority: 'high',
        status: 'pending'
      }
    }
  });

  setTimeout(() => {
    if (!client1Received) {
      console.error('❌ Failed: Client 1 did not receive message within 4 seconds');
      process.exit(1);
    }
  }, 4000);
}

testExchange();
