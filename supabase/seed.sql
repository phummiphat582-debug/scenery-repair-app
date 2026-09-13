-- ==============================================================================
-- SEED DATA - SCENERY VINTAGE FARM
-- ==============================================================================

-- 1. Insert Standard Departments
INSERT INTO departments (name, code, icon, color, description) VALUES
('คาเฟ่ & F&B', 'CAFE', '☕', '#d97706', 'ร้านกาแฟ เบเกอรี่ และห้องอาหารหลัก'),
('ห้องพัก & วิลล่า', 'HOTEL', '🏨', '#7c3aed', 'บ้านพักวิลล่า โซนรีสอร์ท และบริการแม่บ้าน'),
('ฟาร์มสัตว์ & กิจกรรม', 'FARM', '🐑', '#059669', 'ลานป้อนอาหารแกะ ซุ้มกิจกรรม และโรงเรือนสัตว์'),
('ไฟฟ้า & แอร์', 'ELEC', '⚡', '#2563eb', 'ระบบไฟฟ้ากำลัง เครื่องปรับอากาศ แสงสว่าง และหม้อแปลง'),
('ประปา & สุขาภิบาล', 'PLUMB', '💧', '#0891b2', 'ระบบประปา สปริงเกอร์ บำบัดน้ำเสีย และห้องน้ำส่วนรวม'),
('ซ่อมบำรุงอาคาร & สี', 'BLDG', '🛠️', '#475467', 'โครงสร้างอาคาร รั้วฟาร์ม งานสี ประตูหน้าต่าง'),
('งานสวน & ภูมิทัศน์', 'GARDEN', '🌿', '#16a34a', 'สนามหญ้า ต้นไม้ ไม้ดอก และระบบระบายน้ำผิวดิน'),
('รถบริการ & ยานพาหนะ', 'VEHICLE', '🚗', '#ea580c', 'รถรางบริการนักท่องเที่ยว รถกอล์ฟ และเครื่องจักรกลฟาร์ม'),
('ไอที & ระบบสื่อสาร', 'IT', '💻', '#e11d48', 'ระบบแคชเชียร์ POS กล้องวงจรปิด Wi-Fi และเครือข่าย')
ON CONFLICT (code) DO NOTHING;

-- 2. Insert Standard Technicians (8 ช่างซ่อมบำรุงพร้อมรูปและเบอร์โทร)
INSERT INTO technicians (name, role, status, phone, avatar_url, is_on_duty_today) VALUES
('ช่างสมชาย (หัวหน้าช่าง)', 'หัวหน้าฝ่ายซ่อมบำรุง', 'active', '081-234-5678', 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80', true),
('ช่างวิชัย (ไฟฟ้า/แอร์)', 'ช่างไฟฟ้าและระบบปรับอากาศ', 'active', '082-345-6789', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', true),
('ช่างประสิทธิ์ (ประปา/สุขาภิบาล)', 'ช่างสุขาภิบาลและระบบท่อ', 'active', '083-456-7890', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', true),
('ช่างเอกชัย (อาคาร/สี)', 'ช่างไม้ อาคาร และโครงสร้าง', 'active', '084-567-8901', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', true),
('ช่างธนพล (ช่างยนต์/เครื่องจักร)', 'ช่างซ่อมยานพาหนะและเครื่องกล', 'active', '085-678-9012', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', true),
('ช่างเดี่ยว (อู่ภายนอก D.Bike Garage)', 'อู่ซ่อมรถ ATV และระบบเครื่องยนต์', 'active', '081-736-5127', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80', false),
('ช่าง 84 (งานปะยาง/เชื่อม/บัดกรี)', 'ช่างเทคนิคยางและโลหะโครงสร้าง', 'active', '084-848-4848', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80', false),
('ช่างบูร (ตาฟเกลียว/โรงกลึง)', 'ช่างกลโรงงานและตาฟเกลียว', 'active', '086-123-4567', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', false)
ON CONFLICT (name) DO NOTHING;

-- 3. Tickets table is strictly empty: 0 Demo Tickets (ไม่มีข้อมูลเดโม่ พร้อมใช้งานจริง 100%)

