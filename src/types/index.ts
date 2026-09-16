export type Priority = 'critical' | 'high' | 'normal' | 'low';

export type TicketStatus = 
  | 'pending'        // รอดำเนินการ / รอตรวจสอบ
  | 'assigned'       // มอบหมายแล้ว / งานใหม่รอรับ
  | 'in_progress'    // กำลังดำเนินการ
  | 'waiting_parts'  // รออะไหล่
  | 'waiting_inspect'// รอตรวจรับ
  | 'completed'      // เสร็จสิ้น
  | 'cancelled';     // ยกเลิก

export interface Department {
  id: string;
  name: string;
  code: string;
  icon: string;
  color: string;
  description?: string;
  activeCount?: number;
  urgentCount?: number;
}

export interface Technician {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'inactive';
  phone?: string;
  departmentId?: string;
  code?: string;
  avatarUrl?: string;
  isOnDutyToday?: boolean;
  dutyNote?: string;
}

export interface PartItem {
  id?: string;
  name: string;
  code: string;
  quantity: number;
  cost: number;
  status?: string;
}

export interface Ticket {
  id: string;
  requestId: string;
  title: string;
  description: string;
  department: string;
  location: string;
  requesterName: string;
  requesterPhone?: string;
  priority: Priority;
  status: TicketStatus;
  technicianName?: string;
  technicianPhone?: string;
  repairResult?: string;
  remark?: string;
  requestImageUrl?: string;
  resultImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  
  // Rich details from design system
  zone?: string;
  category?: string;
  parts?: PartItem[];
  laborCost?: number;
  totalCost?: number;
  progressPercent?: number;
  diagnosticReason?: string;
  actionSteps?: string;
  extraPhotos?: string[];

  // Computed fields for UI
  queueNumber?: number;
  ageDays?: number;
  waitingDurationText?: string;
  isOverdue?: boolean;
}

export type NavTab = 'dashboard' | 'new-request' | 'all-requests' | 'settings';
export type ViewMode = 'table' | 'queue' | 'department_board' | 'dashboard';
export type SortOrder = 'fifo' | 'lifo' | 'priority';
export type UserRole = 'requester' | 'technician';
