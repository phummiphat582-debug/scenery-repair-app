-- ==============================================================================
-- SCENERY VINTAGE FARM - MAINTENANCE & REPAIR SYSTEM DATABASE SCHEMA
-- PostgreSQL / Supabase Migration
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Departments Table (ตารางแผนกงาน)
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    icon VARCHAR(10) DEFAULT '📌',
    color VARCHAR(20) DEFAULT '#0f766e',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Technicians Table (ตารางรายชื่อช่างผู้รับผิดชอบ)
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

-- 3. Repair Tickets Table (ตารางรายการแจ้งซ่อม - รองรับคิว FIFO, แยกแผนก, งานด่วน)
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

-- 4. Ticket Logs Table (บันทึกประวัติการเปลี่ยนแปลงสถานะและผลการซ่อม)
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
CREATE POLICY "Allow public read departments" ON departments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public write departments" ON departments FOR ALL TO anon, authenticated USING (true);

CREATE POLICY "Allow public read technicians" ON technicians FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public write technicians" ON technicians FOR ALL TO anon, authenticated USING (true);

CREATE POLICY "Allow public read tickets" ON repair_tickets FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public write tickets" ON repair_tickets FOR ALL TO anon, authenticated USING (true);

CREATE POLICY "Allow public read logs" ON ticket_logs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public write logs" ON ticket_logs FOR ALL TO anon, authenticated USING (true);
