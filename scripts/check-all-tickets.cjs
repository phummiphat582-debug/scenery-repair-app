const { createClient } = require('@supabase/supabase-js');

async function check() {
  const c1 = createClient(
    'https://rimwhvvashgcaepyavjq.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbXdodnZhc2hnY2FlcHlhdmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NjkwNzcsImV4cCI6MjEwMTE0NTA3N30.XAo8nJPSDHokoQIv4GkMcXghb3uBeV5I7Re4Wb0mxFw'
  );
  
  const c2 = createClient(
    'https://roqsnzofqtjtendcpdqs.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvcXNuem9mcXRqdGVuZGNwZHFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NTc2NzYsImV4cCI6MjEwNjQzMzY3Nn0.kObOMFrinAFmOOQi05GvXmupvc28_wyKqcqKlwS0tao'
  );

  console.log('--- Checking rimwhvvashgcaepyavjq (current cluster) ---');
  const r1 = await c1.from('repair_tickets').select('*');
  if (r1.error) {
    console.error('c1 error:', r1.error);
  } else {
    console.log('c1 repair_tickets count:', r1.data.length);
    r1.data.forEach(t => {
      const imgLen = t.request_image_url ? t.request_image_url.length : 0;
      const imgType = t.request_image_url ? (t.request_image_url.startsWith('data:') ? 'base64' : t.request_image_url.slice(0, 30)) : 'none';
      console.log(`  - [${t.request_id || t.id}] ${t.title} | dept: ${t.department} | status: ${t.status} | req_img: ${imgType} (len ${imgLen}) | remark: ${t.remark || ''}`);
    });
  }

  console.log('\n--- Checking roqsnzofqtjtendcpdqs (old cluster) ---');
  try {
    const r2 = await c2.from('repair_tickets').select('*');
    if (r2.error) {
      console.error('c2 error:', r2.error);
    } else {
      console.log('c2 repair_tickets count:', r2.data.length);
      r2.data.forEach(t => {
        const imgLen = t.request_image_url ? t.request_image_url.length : 0;
        const imgType = t.request_image_url ? (t.request_image_url.startsWith('data:') ? 'base64' : t.request_image_url.slice(0, 30)) : 'none';
        console.log(`  - [${t.request_id || t.id}] ${t.title} | dept: ${t.department} | status: ${t.status} | req_img: ${imgType} (len ${imgLen}) | remark: ${t.remark || ''}`);
      });
    }
  } catch (err) {
    console.error('c2 fetch error:', err.message);
  }

  // Also check storage buckets on both!
  console.log('\n--- Checking Storage Buckets on rimwhvvashgcaepyavjq ---');
  const b1 = await c1.storage.listBuckets();
  console.log('c1 buckets:', b1.data || b1.error);
  if (b1.data && b1.data.length > 0) {
    for (const b of b1.data) {
      const files = await c1.storage.from(b.name).list();
      console.log(`  bucket ${b.name} files:`, files.data?.length);
    }
  }

  console.log('\n--- Checking Storage Buckets on roqsnzofqtjtendcpdqs ---');
  try {
    const b2 = await c2.storage.listBuckets();
    console.log('c2 buckets:', b2.data || b2.error);
    if (b2.data && b2.data.length > 0) {
      for (const b of b2.data) {
        const files = await c2.storage.from(b.name).list();
        console.log(`  bucket ${b.name} files:`, files.data?.length);
      }
    }
  } catch (err) {
    console.error('c2 buckets error:', err.message);
  }
}

check();
