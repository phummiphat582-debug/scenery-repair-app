export type Priority = 'critical' | 'high' | 'normal' | 'low';

export type TicketStatus = 
  | 'pending'        // รอดำเนินการ
  | 'assigned'       // รับงานแล้ว
  | 'in_progress'    // กำลังดำเนินการ
  | 'waiting_parts'  // รออะไหล่
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
  repairResult?: string;
  remark?: string;
  requestImageUrl?: string;
  resultImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  
  // Computed fields for UI
  queueNumber?: number;
  ageDays?: number;
  waitingDurationText?: string;
  isOverdue?: boolean;
}

export type ViewMode = 'queue' | 'department_board' | 'dashboard';
export type SortOrder = 'fifo' | 'lifo' | 'priority';
