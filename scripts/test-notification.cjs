const https = require('https');

const payload = JSON.stringify({
  ticket: {
    id: 'test-check-notification',
    requestId: 'TEST-CHECK',
    title: 'ทดสอบระบบแจ้งเตือนเข้ามือถือ',
    department: 'ซ่อมบำรุง',
    location: 'ศูนย์ช่าง',
    priority: 'critical'
  }
});

const req = https.request('https://rimwhvvashgcaepyavjq.supabase.co/functions/v1/notify-technicians', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbXdodnZhc2hnY2FlcHlhdmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NjkwNzcsImV4cCI6MjEwMTE0NTA3N30.XAo8nJPSDHokoQIv4GkMcXghb3uBeV5I7Re4Wb0mxFw',
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbXdodnZhc2hnY2FlcHlhdmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NjkwNzcsImV4cCI6MjEwMTE0NTA3N30.XAo8nJPSDHokoQIv4GkMcXghb3uBeV5I7Re4Wb0mxFw'
  }
}, (res) => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', body));
});

req.write(payload);
req.end();
