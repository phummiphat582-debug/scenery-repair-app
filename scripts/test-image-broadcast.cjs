const { createClient } = require('@supabase/supabase-js');

const client1 = createClient(
  'https://rimwhvvashgcaepyavjq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbXdodnZhc2hnY2FlcHlhdmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NjkwNzcsImV4cCI6MjEwMTE0NTA3N30.XAo8nJPSDHokoQIv4GkMcXghb3uBeV5I7Re4Wb0mxFw'
);

const client2 = createClient(
  'https://rimwhvvashgcaepyavjq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbXdodnZhc2hnY2FlcHlhdmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NjkwNzcsImV4cCI6MjEwMTE0NTA3N30.XAo8nJPSDHokoQIv4GkMcXghb3uBeV5I7Re4Wb0mxFw'
);

async function testBroadcast() {
  const dummyBase64 = 'data:image/jpeg;base64,' + 'B'.repeat(45000); // 45KB realistic image
  const channelName = 'scenery_realtime_db_channel';

  const ch2 = client2.channel(channelName);
  let received = false;

  ch2.on('broadcast', { event: 'TICKET_MUTATION' }, (payload) => {
    console.log('Client 2 received broadcast event!');
    console.log('Action:', payload?.payload?.action);
    console.log('Image length in broadcast:', payload?.payload?.ticket?.requestImageUrl?.length);
    received = true;
  });

  await new Promise(r => ch2.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('Client 2 SUBSCRIBED');
      r();
    }
  }));

  const ch1 = client1.channel(channelName);
  await new Promise(r => ch1.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('Client 1 SUBSCRIBED');
      r();
    }
  }));

  console.log('Client 1 sending broadcast with 45KB image...');
  await ch1.send({
    type: 'broadcast',
    event: 'TICKET_MUTATION',
    payload: {
      action: 'CREATE',
      ticket: {
        id: 'test-realtime',
        requestId: 'REP-TEST-REALTIME',
        title: 'ทดสอบภาพสด',
        requestImageUrl: dummyBase64
      }
    }
  });

  await new Promise(r => setTimeout(r, 2000));
  if (received) {
    console.log('SUCCESS: Realtime broadcast with image works perfectly!');
  } else {
    console.log('FAILED: Realtime broadcast did not receive message.');
  }

  process.exit(0);
}

testBroadcast();
