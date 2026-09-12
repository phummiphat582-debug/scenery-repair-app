import { Department, Technician, Ticket } from '../types';

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept-1', name: 'คาเฟ่ & F&B', code: 'CAFE', icon: '☕', color: '#d97706', description: 'ร้านกาแฟ เบเกอรี่ และห้องอาหารหลัก' },
  { id: 'dept-2', name: 'ห้องพัก & วิลล่า', code: 'HOTEL', icon: '🏨', color: '#7c3aed', description: 'บ้านพักวิลล่า โซนรีสอร์ท และบริการแม่บ้าน' },
  { id: 'dept-3', name: 'ฟาร์มสัตว์ & กิจกรรม', code: 'FARM', icon: '🐑', color: '#059669', description: 'ลานป้อนอาหารแกะ ซุ้มกิจกรรม และโรงเรือนสัตว์' },
  { id: 'dept-4', name: 'ไฟฟ้า & แอร์', code: 'ELEC', icon: '⚡', color: '#2563eb', description: 'ระบบไฟฟ้ากำลัง เครื่องปรับอากาศ แสงสว่าง และหม้อแปลง' },
  { id: 'dept-5', name: 'ประปา & สุขาภิบาล', code: 'PLUMB', icon: '💧', color: '#0891b2', description: 'ระบบประปา สปริงเกอร์ บำบัดน้ำเสีย และห้องน้ำส่วนรวม' },
  { id: 'dept-6', name: 'ซ่อมบำรุงอาคาร & สี', code: 'BLDG', icon: '🛠️', color: '#475467', description: 'โครงสร้างอาคาร รั้วฟาร์ม งานสี ประตูหน้าต่าง' },
  { id: 'dept-7', name: 'งานสวน & ภูมิทัศน์', code: 'GARDEN', icon: '🌿', color: '#16a34a', description: 'สนามหญ้า ต้นไม้ ไม้ดอก และระบบระบายน้ำผิวดิน' },
  { id: 'dept-8', name: 'รถบริการ & ยานพาหนะ', code: 'VEHICLE', icon: '🚗', color: '#ea580c', description: 'รถรางบริการนักท่องเที่ยว รถกอล์ฟ และเครื่องจักรกลฟาร์ม' },
  { id: 'dept-9', name: 'ไอที & ระบบสื่อสาร', code: 'IT', icon: '💻', color: '#e11d48', description: 'ระบบแคชเชียร์ POS กล้องวงจรปิด Wi-Fi และเครือข่าย' },
];

export const INITIAL_TECHNICIANS: Technician[] = [
  { 
    id: 'tech-1', 
    name: 'ช่างสมชาย (หัวหน้าช่าง)', 
    role: 'หัวหน้าฝ่ายซ่อมบำรุง', 
    status: 'active', 
    phone: '081-234-5678', 
    isOnDutyToday: true,
    avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80'
  },
  { 
    id: 'tech-2', 
    name: 'ช่างวิชัย (ไฟฟ้า/แอร์)', 
    role: 'ช่างไฟฟ้าและระบบปรับอากาศ', 
    status: 'active', 
    phone: '082-345-6789', 
    isOnDutyToday: true,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  { 
    id: 'tech-3', 
    name: 'ช่างประสิทธิ์ (ประปา/สุขาภิบาล)', 
    role: 'ช่างสุขาภิบาลและระบบท่อ', 
    status: 'active', 
    phone: '083-456-7890', 
    isOnDutyToday: true,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  },
  { 
    id: 'tech-4', 
    name: 'ช่างเอกชัย (อาคาร/สี)', 
    role: 'ช่างไม้ อาคาร และโครงสร้าง', 
    status: 'active', 
    phone: '084-567-8901', 
    isOnDutyToday: true,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
  },
  { 
    id: 'tech-5', 
    name: 'ช่างธนพล (ช่างยนต์/เครื่องจักร)', 
    role: 'ช่างซ่อมยานพาหนะและเครื่องกล', 
    status: 'active', 
    phone: '085-678-9012', 
    isOnDutyToday: true,
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
  },
  { 
    id: 'tech-6', 
    name: 'ช่างเดี่ยว (อู่ภายนอก D.Bike Garage)', 
    role: 'อู่ซ่อมรถ ATV และระบบเครื่องยนต์', 
    status: 'active', 
    phone: '081-736-5127', 
    isOnDutyToday: false,
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'
  },
  { 
    id: 'tech-7', 
    name: 'ช่าง 84 (งานปะยาง/เชื่อม/บัดกรี)', 
    role: 'ช่างเทคนิคยางและโลหะโครงสร้าง', 
    status: 'active', 
    phone: '084-848-4848', 
    isOnDutyToday: false,
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80'
  },
  { 
    id: 'tech-8', 
    name: 'ช่างบูร (ตาฟเกลียว/โรงกลึง)', 
    role: 'ช่างกลโรงงานและตาฟเกลียว', 
    status: 'active', 
    phone: '086-123-4567', 
    isOnDutyToday: false,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
];

export const INITIAL_TICKETS: Ticket[] = [];
