import { Ticket } from '../types';

export interface TicketAgingInfo {
  days: number;
  hours: number;
  minutes: number;
  label: string;
  badgeText: string;
  badgeClass: string;
  urgencyLevel: 'today' | 'moderate' | 'warning' | 'critical' | 'completed' | 'cancelled';
  isOverdue: boolean;
}

export interface DepartmentQueueInfo {
  departmentQueueNumber: number;
  totalInDepartment: number;
  overallQueueNumber: number;
  totalOverall: number;
  waitingAheadInDept: number;
  isCurrentInDept: boolean;
  queueBadgeText: string;
  queueStatusText: string;
}

/**
 * Calculates aging backlog duration (งานค้างกี่วัน) with human-friendly Thai text and styling.
 */
export function getTicketAgingInfo(ticket: {
  createdAt: string;
  status: string;
  completedAt?: string;
  updatedAt?: string;
}): TicketAgingInfo {
  const isCompleted = ticket.status === 'completed';
  const isCancelled = ticket.status === 'cancelled';
  const now = Date.now();
  const createdMs = new Date(ticket.createdAt).getTime();

  if (isNaN(createdMs)) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      label: 'ไม่ระบุเวลา',
      badgeText: '-',
      badgeClass: 'bg-slate-100 text-slate-600 border border-slate-200',
      urgencyLevel: 'moderate',
      isOverdue: false
    };
  }

  if (isCompleted) {
    const endMs = ticket.completedAt
      ? new Date(ticket.completedAt).getTime()
      : ticket.updatedAt
      ? new Date(ticket.updatedAt).getTime()
      : now;
    const diffMs = Math.max(0, endMs - createdMs);
    const days = Math.floor(diffMs / 86400000);
    const hours = Math.floor((diffMs % 86400000) / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);

    const timeText = days === 0 
      ? (hours === 0 ? 'เสร็จในไม่กี่นาที' : `เสร็จใน ${hours} ชม.`) 
      : `เสร็จใน ${days} วัน ${hours > 0 ? hours + ' ชม.' : ''}`.trim();

    return {
      days,
      hours,
      minutes,
      label: `✅ ${timeText}`,
      badgeText: days === 0 ? 'เสร็จในวันเดียว' : `เสร็จใน ${days} วัน`,
      badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold',
      urgencyLevel: 'completed',
      isOverdue: false
    };
  }

  if (isCancelled) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      label: '❌ ยกเลิกรายการ',
      badgeText: 'ยกเลิก',
      badgeClass: 'bg-slate-100 text-slate-600 border border-slate-200 font-medium',
      urgencyLevel: 'cancelled',
      isOverdue: false
    };
  }

  // Active tickets: pending, assigned, in_progress, waiting_parts, waiting_inspect
  const diffMs = Math.max(0, now - createdMs);
  const days = Math.floor(diffMs / 86400000);
  const hours = Math.floor((diffMs % 86400000) / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);

  if (days >= 7) {
    return {
      days,
      hours,
      minutes,
      label: `🚨 ค้างนาน ${days} วัน (เกินกำหนด/ด่วนมาก)`,
      badgeText: `ค้างนาน ${days} วัน`,
      badgeClass: 'bg-rose-100 text-rose-800 border border-rose-300 font-extrabold animate-pulse',
      urgencyLevel: 'critical',
      isOverdue: true
    };
  }

  if (days >= 3) {
    return {
      days,
      hours,
      minutes,
      label: `⚠️ ค้างมาแล้ว ${days} วัน (รอนาน)`,
      badgeText: `ค้าง ${days} วัน`,
      badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold',
      urgencyLevel: 'warning',
      isOverdue: true
    };
  }

  if (days >= 1) {
    return {
      days,
      hours,
      minutes,
      label: `🕒 ค้างมาแล้ว ${days} วัน ${hours > 0 ? hours + ' ชม.' : ''}`.trim(),
      badgeText: `ค้าง ${days} วัน`,
      badgeClass: 'bg-sky-50 text-sky-800 border border-sky-200 font-semibold',
      urgencyLevel: 'moderate',
      isOverdue: false
    };
  }

  // Same day (0 days)
  if (hours > 0) {
    return {
      days: 0,
      hours,
      minutes,
      label: `⚡ แจ้งวันนี้ (${hours} ชม.ที่แล้ว)`,
      badgeText: 'แจ้งวันนี้',
      badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold',
      urgencyLevel: 'today',
      isOverdue: false
    };
  }

  return {
    days: 0,
    hours: 0,
    minutes,
    label: minutes > 0 ? `⚡ แจ้งเมื่อ ${minutes} นาทีที่แล้ว` : '⚡ เพิ่งแจ้งเมื่อสักครู่',
    badgeText: 'แจ้งวันนี้',
    badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold',
    urgencyLevel: 'today',
    isOverdue: false
  };
}

/**
 * Calculates department queue position and queue rank across active tickets.
 */
export function getTicketDepartmentQueue(
  ticketId: string,
  ticketDepartment: string,
  allTickets: Ticket[]
): DepartmentQueueInfo {
  const activeTickets = allTickets
    .filter(t => t.status !== 'completed' && t.status !== 'cancelled')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const deptTickets = activeTickets.filter(t => t.department === ticketDepartment);
  const deptIdx = deptTickets.findIndex(t => t.id === ticketId);
  const departmentQueueNumber = deptIdx >= 0 ? deptIdx + 1 : 1;
  const totalInDepartment = deptTickets.length;

  const overallIdx = activeTickets.findIndex(t => t.id === ticketId);
  const overallQueueNumber = overallIdx >= 0 ? overallIdx + 1 : 1;
  const totalOverall = activeTickets.length;

  const waitingAheadInDept = Math.max(0, departmentQueueNumber - 1);
  const isCurrentInDept = departmentQueueNumber === 1;

  let queueStatusText = '';
  if (isCurrentInDept) {
    queueStatusText = '🔥 ถึงคิวแล้ว (คิวแรกของแผนก)';
  } else {
    queueStatusText = `⏳ รออีก ${waitingAheadInDept} คิว (มีงานก่อนหน้า ${waitingAheadInDept} คิว)`;
  }

  const queueBadgeText = `คิวที่ #${departmentQueueNumber} ของแผนก`;

  return {
    departmentQueueNumber,
    totalInDepartment,
    overallQueueNumber,
    totalOverall,
    waitingAheadInDept,
    isCurrentInDept,
    queueBadgeText,
    queueStatusText
  };
}
