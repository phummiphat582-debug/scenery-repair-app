const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rimwhvvashgcaepyavjq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbXdodnZhc2hnY2FlcHlhdmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NjkwNzcsImV4cCI6MjEwMTE0NTA3N30.XAo8nJPSDHokoQIv4GkMcXghb3uBeV5I7Re4Wb0mxFw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const OFFICIAL_FARM_DEPARTMENTS = [
  { name: 'ฟร้อน', code: '0', icon: '🛎️', color: '#2563eb', description: 'ต้อนรับส่วนหน้า / ฟร้อน' },
  { name: 'สโตร์SC', code: '10', icon: '📦', color: '#475569', description: 'สโตร์และคลังสินค้ากลาง' },
  { name: 'บุคคล', code: '11', icon: '👥', color: '#0284c7', description: 'ฝ่ายบุคคลและธุรการ' },
  { name: 'ไอศกรีม', code: '13', icon: '🍦', color: '#ec4899', description: 'จุดจำหน่ายไอศกรีม' },
  { name: 'รปภ', code: '14', icon: '🛡️', color: '#dc2626', description: 'รักษาความปลอดภัยและจราจร' },
  { name: 'บัญชี', code: '16', icon: '💼', color: '#059669', description: 'ฝ่ายบัญชีและการเงิน' },
  { name: 'ลำธาร', code: '17', icon: '🌊', color: '#0891b2', description: 'โซนกิจกรรมลำธาร' },
  { name: 'คนสวน', code: '19', icon: '🌿', color: '#16a34a', description: 'ทีมสวนและภูมิทัศน์' },
  { name: 'ซุ้มเกม', code: '20', icon: '🎯', color: '#d97706', description: 'ซุ้มเกมและกิจกรรมฟาร์ม' },
  { name: 'เบเกอรี่ (แกรนด์มา ลำธาร บูธน้ำ)', code: '21', icon: '🥐', color: '#b45309', description: 'เบเกอรี่ แกรนด์มาคาเฟ่ ลำธาร บูธน้ำ' },
  { name: 'ร้านอาหาร', code: '22', icon: '🍽️', color: '#ea580c', description: 'ห้องอาหารหลักและครัว' },
  { name: 'ขายของที่ระลึก (สโตร์+SPS3)', code: '23', icon: '🎁', color: '#7c3aed', description: 'ร้านขายของที่ระลึก สโตร์ และ SPS3' },
  { name: 'แม่บ้าน', code: '24', icon: '🧹', color: '#6366f1', description: 'แผนกแม่บ้านและทำความสะอาด' },
  { name: 'การตลาด', code: '25', icon: '📢', color: '#e11d48', description: 'ฝ่ายการตลาดและประชาสัมพันธ์' },
  { name: 'มอลทาเดล', code: '33', icon: '☕', color: '#92400e', description: 'ร้านกาแฟมอลทาเดล' },
  { name: 'ผู้บริหาร', code: '34', icon: '👑', color: '#4f46e5', description: 'สำนักงานผู้บริหาร' },
  { name: 'ซ่อมบำรุง', code: '84', icon: '🛠️', color: '#2563eb', description: 'ฝ่ายซ่อมบำรุง 84' },
  { name: 'ก่อสร้าง', code: '85', icon: '🏗️', color: '#ea580c', description: 'ฝ่ายก่อสร้างและต่อเติม 85' },
  { name: 'ศิลป์', code: '86', icon: '🎨', color: '#9333ea', description: 'ฝ่ายงานศิลป์ ป้าย สี ตกแต่ง 86' },
  { name: 'ดูแลสัตว์', code: '91', icon: '🐑', color: '#10b981', description: 'แผนกดูแลสัตว์และคอกฟาร์ม' },
  { name: 'โชว์', code: '92', icon: '🎪', color: '#f59e0b', description: 'เวทีการแสดงและโชว์ฟาร์ม' },
  { name: 'บ้านพัก', code: 'H0', icon: '🏡', color: '#0d9488', description: 'บ้านพักรีสอร์ท' },
  { name: 'สวนผึ้งอิกลู', code: 'H12', icon: '🛖', color: '#0284c7', description: 'โซนสวนผึ้งอิกลู' },
  { name: 'หอพักพนักงาน', code: 'H13', icon: '🏢', color: '#64748b', description: 'อาคารหอพักพนักงาน' },
  { name: 'แคนทีน', code: 'H18', icon: '🍲', color: '#ca8a04', description: 'โรงอาหารพนักงาน' }
];

function cleanDepartment(name) {
  if (!name) return '';
  if (name.toLowerCase() === 'all') return 'ทุกแผนก';
  return name.replace(/^(H\d+|\d+)\s+/, '').trim();
}

function cleanTitle(title) {
  if (!title) return '';
  return title
    .replace(/^(?:ซ่อมบำรุง|งานก่อสร้าง|งานศิลป์)\s*(?:84|85|86):?\s*/i, '')
    .replace(/^\[DIV:(?:84|85|86)\]\s*/i, '')
    .trim() || title;
}

async function run() {
  console.log('=== STEP 1: Purging corrupt Mojibake rows in Supabase "departments" table ===');
  const { data: oldDepts, error: getErr } = await supabase.from('departments').select('id, name, code');
  if (getErr) {
    console.error('Error getting old departments:', getErr);
    return;
  }
  console.log(`Found ${oldDepts.length} existing department rows in Supabase.`);
  for (const d of oldDepts) {
    const { error: delErr } = await supabase.from('departments').delete().eq('id', d.id);
    if (delErr) {
      console.warn(`Could not delete dept ${d.id}:`, delErr.message);
    } else {
      console.log(`Deleted old row: [${d.code}] ${d.name}`);
    }
  }

  console.log('\n=== STEP 2: Inserting 25 Official Clean Farm Departments ===');
  const { data: inserted, error: insErr } = await supabase
    .from('departments')
    .insert(OFFICIAL_FARM_DEPARTMENTS)
    .select('id, code, name, icon');

  if (insErr) {
    console.error('Error inserting departments:', insErr);
  } else {
    console.log(`✅ Successfully inserted ${inserted.length} clean farm departments!`);
    inserted.forEach(d => console.log(`  - [${d.code}] ${d.icon} ${d.name}`));
  }

  console.log('\n=== STEP 3: Cleaning "department" and "title" columns in "repair_tickets" ===');
  const { data: tickets, error: tErr } = await supabase
    .from('repair_tickets')
    .select('id, request_id, department, title');

  if (tErr) {
    console.error('Error fetching tickets:', tErr);
    return;
  }

  let updatedCount = 0;
  for (const t of tickets) {
    const cleanedDept = cleanDepartment(t.department);
    const cleanedTtl = cleanTitle(t.title);

    if (cleanedDept !== t.department || cleanedTtl !== t.title) {
      const { error: upErr } = await supabase
        .from('repair_tickets')
        .update({
          department: cleanedDept,
          title: cleanedTtl
        })
        .eq('id', t.id);

      if (upErr) {
        console.warn(`Failed to clean ticket ${t.request_id}:`, upErr.message);
      } else {
        updatedCount++;
        console.log(`✔ Cleaned #${t.request_id}: dept="${t.department}" -> "${cleanedDept}" | title="${t.title}" -> "${cleanedTtl}"`);
      }
    }
  }

  console.log(`\n🎉 Successfully cleaned ${updatedCount} tickets in Central Cloud database!`);
}

run();
