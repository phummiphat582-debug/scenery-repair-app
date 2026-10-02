import { Department, Technician, Ticket } from '../types';

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept-0', name: '0 ฟร้อน', code: '0', icon: '🛎️', color: '#2563eb', description: 'ต้อนรับส่วนหน้า / ฟร้อน' },
  { id: 'dept-10', name: '10 สโตร์SC', code: '10', icon: '📦', color: '#475569', description: 'สโตร์และคลังสินค้ากลาง' },
  { id: 'dept-11', name: '11 บุคคล', code: '11', icon: '👥', color: '#0284c7', description: 'ฝ่ายบุคคลและธุรการ' },
  { id: 'dept-13', name: '13 ไอศกรีม', code: '13', icon: '🍦', color: '#ec4899', description: 'จุดจำหน่ายไอศกรีม' },
  { id: 'dept-14', name: '14 รปภ', code: '14', icon: '🛡️', color: '#dc2626', description: 'รักษาความปลอดภัยและจราจร' },
  { id: 'dept-16', name: '16 บัญชี', code: '16', icon: '💼', color: '#059669', description: 'ฝ่ายบัญชีและการเงิน' },
  { id: 'dept-17', name: '17 ลำธาร', code: '17', icon: '🌊', color: '#0891b2', description: 'โซนกิจกรรมลำธาร' },
  { id: 'dept-19', name: '19 คนสวน', code: '19', icon: '🌿', color: '#16a34a', description: 'ทีมสวนและภูมิทัศน์' },
  { id: 'dept-20', name: '20 ซุ้มเกม', code: '20', icon: '🎯', color: '#d97706', description: 'ซุ้มเกมและกิจกรรมฟาร์ม' },
  { id: 'dept-21', name: '21 เบเกอรี่(แกรนด์มา ลำธาร บูธน้ำ)', code: '21', icon: '🥐', color: '#b45309', description: 'เบเกอรี่ แกรนด์มาคาเฟ่ ลำธาร บูธน้ำ' },
  { id: 'dept-22', name: '22 ร้านอาหาร', code: '22', icon: '🍽️', color: '#ea580c', description: 'ห้องอาหารหลักและครัว' },
  { id: 'dept-23', name: '23 ขายของที่ระลึก (สโตร์+SPS3)', code: '23', icon: '🎁', color: '#7c3aed', description: 'ร้านขายของที่ระลึก สโตร์ และ SPS3' },
  { id: 'dept-24', name: '24 แม่บ้าน', code: '24', icon: '🧹', color: '#6366f1', description: 'แผนกแม่บ้านและทำความสะอาด' },
  { id: 'dept-25', name: '25 การตลาด', code: '25', icon: '📢', color: '#e11d48', description: 'ฝ่ายการตลาดและประชาสัมพันธ์' },
  { id: 'dept-33', name: '33 มอลทาเดล', code: '33', icon: '☕', color: '#92400e', description: 'ร้านกาแฟมอลทาเดล' },
  { id: 'dept-34', name: '34 ผู้บริหาร', code: '34', icon: '👑', color: '#4f46e5', description: 'สำนักงานผู้บริหาร' },
  { id: 'dept-84', name: '84 ซ่อมบำรุง', code: '84', icon: '🛠️', color: '#2563eb', description: 'ฝ่ายซ่อมบำรุง 84' },
  { id: 'dept-85', name: '85 ก่อสร้าง', code: '85', icon: '🏗️', color: '#ea580c', description: 'ฝ่ายก่อสร้างและต่อเติม 85' },
  { id: 'dept-86', name: '86 ศิลป์', code: '86', icon: '🎨', color: '#9333ea', description: 'ฝ่ายงานศิลป์ ป้าย สี ตกแต่ง 86' },
  { id: 'dept-91', name: '91 ดูแลสัตว์', code: '91', icon: '🐑', color: '#10b981', description: 'แผนกดูแลสัตว์และคอกฟาร์ม' },
  { id: 'dept-92', name: '92 โชว์', code: '92', icon: '🎪', color: '#f59e0b', description: 'เวทีการแสดงและโชว์ฟาร์ม' },
  { id: 'dept-H0', name: 'H0 บ้านพัก', code: 'H0', icon: '🏡', color: '#0d9488', description: 'บ้านพักรีสอร์ท' },
  { id: 'dept-H12', name: 'H12 สวนผึ้งอิกลู', code: 'H12', icon: '🛖', color: '#0284c7', description: 'โซนสวนผึ้งอิกลู' },
  { id: 'dept-H13', name: 'H13 หอพักพนักงาน', code: 'H13', icon: '🏢', color: '#64748b', description: 'อาคารหอพักพนักงาน' },
  { id: 'dept-H18', name: 'H18 แคนทีน', code: 'H18', icon: '🍲', color: '#ca8a04', description: 'โรงอาหารพนักงาน' }
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
