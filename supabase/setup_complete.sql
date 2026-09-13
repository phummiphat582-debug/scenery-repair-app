-- ==============================================================================
-- SCENERY VINTAGE FARM - COMPLETE DATABASE SETUP & MIGRATION SCRIPT
-- Copy all and paste into: https://supabase.com/dashboard/project/rimwhvvashgcaepyavjq/sql/new
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Departments Table (ตารางแผนกงาน 9 แผนก)
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    icon VARCHAR(10) DEFAULT '📌',
    color VARCHAR(20) DEFAULT '#0f766e',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Technicians Table (ตารางรายชื่อช่าง 8 ท่าน พร้อมรูปถ่ายและเบอร์โทร)
CREATE TABLE IF NOT EXISTS technicians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    role VARCHAR(100) DEFAULT 'ช่างซ่อมบำรุง',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    phone VARCHAR(30),
    avatar_url TEXT,
    is_on_duty_today BOOLEAN DEFAULT true,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Repair Tickets Table (ตารางรายการแจ้งซ่อม - ZERO DEMO DATA)
CREATE TABLE IF NOT EXISTS repair_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    department VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL,
    requester_name VARCHAR(100) NOT NULL,
    requester_phone VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('critical', 'high', 'normal', 'low')),
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'waiting_parts', 'waiting_inspect', 'completed', 'cancelled')),
    technician_name VARCHAR(100),
    technician_phone VARCHAR(50),
    repair_result TEXT,
    remark TEXT,
    request_image_url TEXT,
    result_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_status ON repair_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_department ON repair_tickets(department);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON repair_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON repair_tickets(created_at);

-- 4. Ticket Logs Table (ประวัติการเปลี่ยนสถานะ)
CREATE TABLE IF NOT EXISTS ticket_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES repair_tickets(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    previous_status VARCHAR(30),
    new_status VARCHAR(30),
    performed_by VARCHAR(100),
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Auto updated_at Trigger
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_repair_tickets_updated_at ON repair_tickets;
CREATE TRIGGER trg_repair_tickets_updated_at
BEFORE UPDATE ON repair_tickets
FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

-- Row Level Security (RLS) Policies
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_logs ENABLE ROW LEVEL SECURITY;

-- Allow public anonymous read & write for Scenery Farm operational devices
DROP POLICY IF EXISTS "Allow public read departments" ON departments;
DROP POLICY IF EXISTS "Allow public write departments" ON departments;
CREATE POLICY "Allow public read departments" ON departments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public write departments" ON departments FOR ALL TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public read technicians" ON technicians;
DROP POLICY IF EXISTS "Allow public write technicians" ON technicians;
CREATE POLICY "Allow public read technicians" ON technicians FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public write technicians" ON technicians FOR ALL TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public read tickets" ON repair_tickets;
DROP POLICY IF EXISTS "Allow public write tickets" ON repair_tickets;
CREATE POLICY "Allow public read tickets" ON repair_tickets FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public write tickets" ON repair_tickets FOR ALL TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public read logs" ON ticket_logs;
DROP POLICY IF EXISTS "Allow public write logs" ON ticket_logs;
CREATE POLICY "Allow public read logs" ON ticket_logs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public write logs" ON ticket_logs FOR ALL TO anon, authenticated USING (true);

-- Enable Realtime Broadcast
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE departments;
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE technicians;
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE repair_tickets;
EXCEPTION WHEN others THEN null;
END $$;

-- 5. SEED INITIAL DATA (9 Departments & 8 Technicians)
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

-- ZERO DEMO TICKETS (ตารางงานแจ้งซ่อมเริ่มต้นว่างเปล่า 100%)
