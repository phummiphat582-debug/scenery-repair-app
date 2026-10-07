import React, { useState, useMemo } from 'react';
import { Ticket, Department, Technician } from '../types';
import { 
  BarChart2, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  ArrowRight, 
  Copy, 
  Download, 
  Share2, 
  Filter, 
  AlertCircle, 
  Check, 
  Sparkles, 
  ChevronRight, 
  ArrowUpDown, 
  Info,
  X,
  PieChart,
  Printer
} from 'lucide-react';
import { DivisionBadge } from './DivisionBadge';

export type TimeframeMode = 'today' | 'yesterday' | 'week' | 'month' | 'last_month' | 'all' | 'custom';

interface RepairSummaryViewProps {
  tickets: Ticket[];
  departments: Department[];
  technicians?: Technician[];
  initialDepartment?: string;
  onSelectDepartmentFilter?: (deptName: string) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const RepairSummaryView: React.FC<RepairSummaryViewProps> = ({
  tickets,
  departments,
  technicians = [],
  initialDepartment = 'all',
  onSelectDepartmentFilter,
  onClose,
  isModal = false
}) => {
  // Filters
  const [timeframe, setTimeframe] = useState<TimeframeMode>('month');
  const [selectedDept, setSelectedDept] = useState<string>(initialDepartment || 'all');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [copiedToast, setCopiedToast] = useState(false);
  const [sortField, setSortField] = useState<'total' | 'completed' | 'pending' | 'name'>('completed');
  const [sortAsc, setSortAsc] = useState(false);
  const [onlyCompletedDepts, setOnlyCompletedDepts] = useState<boolean>(true);
  const [statusViewFilter, setStatusViewFilter] = useState<'completed' | 'all'>('completed');

  // Timeframe labels
  const timeframeLabels: Record<TimeframeMode, string> = {
    today: '📅 วันนี้ (รายวัน)',
    yesterday: '⏮️ เมื่อวานนี้',
    week: '🗓️ 7 วันล่าสุด (รายสัปดาห์)',
    month: '📆 เดือนนี้ (รายเดือน)',
    last_month: '⏪ เดือนที่แล้ว',
    all: '🌐 ข้อมูลทั้งหมด (All Time)',
    custom: '🔍 กำหนดช่วงวันที่เอง'
  };

  // Filter tickets by timeframe (includes tickets created in timeframe OR completed in timeframe)
  const filteredByTimeframe = useMemo(() => {
    const now = new Date();
    
    return tickets.filter(t => {
      const createdDate = new Date(t.createdAt);
      const completedDate = t.completedAt ? new Date(t.completedAt) : null;
      if (isNaN(createdDate.getTime())) return true;

      const checkDateInTimeframe = (targetDate: Date) => {
        switch (timeframe) {
          case 'today': {
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            return targetDate >= startOfToday;
          }
          case 'yesterday': {
            const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
            const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
            return targetDate >= startOfYesterday && targetDate <= endOfYesterday;
          }
          case 'week': {
            const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return targetDate >= startOfWeek;
          }
          case 'month': {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            return targetDate >= startOfMonth;
          }
          case 'last_month': {
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            return targetDate >= startOfLastMonth && targetDate <= endOfLastMonth;
          }
          case 'custom': {
            if (customStart && targetDate < new Date(customStart + 'T00:00:00')) return false;
            if (customEnd && targetDate > new Date(customEnd + 'T23:59:59')) return false;
            return true;
          }
          case 'all':
          default:
            return true;
        }
      };

      return checkDateInTimeframe(createdDate) || (completedDate && !isNaN(completedDate.getTime()) && checkDateInTimeframe(completedDate));
    });
  }, [tickets, timeframe, customStart, customEnd]);

  // Filter by Division & Department
  const activeTickets = useMemo(() => {
    return filteredByTimeframe.filter(t => {
      if (selectedDivision !== 'all' && (t.division || '84') !== selectedDivision) {
        return false;
      }
      if (selectedDept !== 'all' && t.department !== selectedDept) {
        return false;
      }
      return true;
    });
  }, [filteredByTimeframe, selectedDivision, selectedDept]);

  // Display tickets: งานที่จบแล้ว (default) หรือทั้งหมด
  const displayTickets = useMemo(() => {
    if (statusViewFilter === 'completed') {
      return activeTickets.filter(t => t.status === 'completed' || t.status === 'waiting_inspect');
    }
    return activeTickets;
  }, [activeTickets, statusViewFilter]);

  // Overall Metrics for the current filter
  const metrics = useMemo(() => {
    const total = activeTickets.length;
    const completed = activeTickets.filter(t => t.status === 'completed' || t.status === 'waiting_inspect').length;
    const inProgress = activeTickets.filter(t => t.status === 'in_progress').length;
    const waitingParts = activeTickets.filter(t => t.status === 'waiting_parts').length;
    const pending = activeTickets.filter(t => t.status === 'pending' || t.status === 'assigned').length;
    const cancelled = activeTickets.filter(t => t.status === 'cancelled').length;
    
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Division breakdown
    const div84 = activeTickets.filter(t => (t.division || '84') === '84').length;
    const div85 = activeTickets.filter(t => t.division === '85').length;
    const div86 = activeTickets.filter(t => t.division === '86').length;

    // Average turnaround time for completed tickets
    let totalDurationMs = 0;
    let completedWithDuration = 0;
    activeTickets.forEach(t => {
      if (t.status === 'completed' && t.completedAt && t.createdAt) {
        const c = new Date(t.completedAt).getTime();
        const cr = new Date(t.createdAt).getTime();
        if (c > cr) {
          totalDurationMs += (c - cr);
          completedWithDuration++;
        }
      }
    });

    let avgDurationText = '-';
    if (completedWithDuration > 0) {
      const avgHours = totalDurationMs / completedWithDuration / (1000 * 60 * 60);
      if (avgHours < 24) {
        avgDurationText = `${avgHours.toFixed(1)} ชม.`;
      } else {
        avgDurationText = `${(avgHours / 24).toFixed(1)} วัน`;
      }
    }

    return {
      total,
      completed,
      inProgress,
      waitingParts,
      pending,
      cancelled,
      completionRate,
      div84,
      div85,
      div86,
      avgDurationText
    };
  }, [activeTickets]);

  // Department Breakdown Table (Per-Department Stats)
  const departmentStats = useMemo(() => {
    // Only filter by timeframe & division (not by selectedDept, so we can see all departments in the table)
    const baseList = filteredByTimeframe.filter(t => {
      if (selectedDivision !== 'all' && (t.division || '84') !== selectedDivision) {
        return false;
      }
      return true;
    });

    const stats = departments.map(d => {
      const deptTickets = baseList.filter(t => t.department === d.name);
      const total = deptTickets.length;
      const completed = deptTickets.filter(t => t.status === 'completed' || t.status === 'waiting_inspect').length;
      const inProgress = deptTickets.filter(t => t.status === 'in_progress').length;
      const waitingParts = deptTickets.filter(t => t.status === 'waiting_parts').length;
      const pending = deptTickets.filter(t => t.status === 'pending' || t.status === 'assigned').length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Extract sample recent titles (เน้นงานที่จบแล้ว)
      const recentTitle = deptTickets.find(t => t.status === 'completed' || t.status === 'waiting_inspect')?.title || deptTickets[0]?.title || '-';

      return {
        id: d.id,
        name: d.name,
        icon: d.icon,
        color: d.color,
        total,
        completed,
        inProgress,
        waitingParts,
        pending,
        rate,
        recentTitle
      };
    });

    // Also include any tickets with department not matching known departments list
    const knownDeptNames = new Set(departments.map(d => d.name));
    const extraDeptNames = Array.from(new Set(baseList.map(t => t.department))).filter(name => name && !knownDeptNames.has(name));
    extraDeptNames.forEach(extraName => {
      const deptTickets = baseList.filter(t => t.department === extraName);
      if (deptTickets.length > 0) {
        const total = deptTickets.length;
        const completed = deptTickets.filter(t => t.status === 'completed' || t.status === 'waiting_inspect').length;
        const inProgress = deptTickets.filter(t => t.status === 'in_progress').length;
        const waitingParts = deptTickets.filter(t => t.status === 'waiting_parts').length;
        const pending = deptTickets.filter(t => t.status === 'pending' || t.status === 'assigned').length;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
        const recentTitle = deptTickets.find(t => t.status === 'completed' || t.status === 'waiting_inspect')?.title || deptTickets[0]?.title || '-';
        stats.push({
          id: 'extra-' + extraName,
          name: extraName === 'all' ? 'งานส่วนกลางฟาร์ม' : extraName,
          icon: '📌',
          color: '#0f766e',
          total,
          completed,
          inProgress,
          waitingParts,
          pending,
          rate,
          recentTitle
        });
      }
    });

    // แสดงแค่งานแผนกที่จบแล้วพอ (completed > 0) ตามคำขอ
    let filteredStats = onlyCompletedDepts 
      ? stats.filter(d => d.completed > 0)
      : stats;

    // Sort
    filteredStats.sort((a, b) => {
      if (sortField === 'name') {
        return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      const valA = a[sortField];
      const valB = b[sortField];
      return sortAsc ? valA - valB : valB - valA;
    });

    return filteredStats;
  }, [filteredByTimeframe, selectedDivision, departments, sortField, sortAsc, onlyCompletedDepts]);

  // Copy Summary text for LINE messaging
  const handleCopySummary = () => {
    const deptText = selectedDept === 'all' ? 'ทุกแผนก (ภาพรวมทั้งฟาร์ม)' : `แผนก "${selectedDept}"`;
    const tfText = timeframeLabels[timeframe];
    const dateNow = new Date().toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const topDepts = departmentStats
      .filter(d => d.completed > 0)
      .slice(0, 10)
      .map((d, idx) => `${idx + 1}. ${d.name}: ซ่อมเสร็จแล้ว ${d.completed} งาน (จาก ${d.total} งาน • ${d.rate}%)`)
      .join('\n');

    const message = [
      `📊 สรุปรายงานการแจ้งซ่อม • Scenery Farm`,
      `📅 ช่วงเวลา: ${tfText}`,
      `🏢 ขอบเขต: ${deptText}`,
      `---------------------------------`,
      `📥 แจ้งซ่อมทั้งหมด: ${metrics.total} รายการ`,
      `✅ ซ่อมเสร็จสิ้น: ${metrics.completed} รายการ (${metrics.completionRate}%)`,
      `🔧 กำลังซ่อม: ${metrics.inProgress} รายการ`,
      metrics.waitingParts > 0 ? `📦 รออะไหล่: ${metrics.waitingParts} รายการ` : '',
      `⏳ รอรับงาน: ${metrics.pending} รายการ`,
      metrics.avgDurationText !== '-' ? `⚡ เวลาเฉลี่ยในการซ่อมเสร็จ: ${metrics.avgDurationText}` : '',
      `---------------------------------`,
      `🛠️ สรุปตามสายงาน:`,
      `• 84 ซ่อมบำรุง: ${metrics.div84} งาน`,
      `• 85 งานก่อสร้าง: ${metrics.div85} งาน`,
      `• 86 งานศิลป์: ${metrics.div86} งาน`,
      topDepts ? `---------------------------------\n🏆 แผนกที่มีงานซ่อมจบแล้ว (${departmentStats.filter(d => d.completed > 0).length} แผนก):\n${topDepts}` : '',
      `---------------------------------`,
      `⏰ รายงาน ณ วันที่ ${dateNow} น.`
    ].filter(Boolean).join('\n');

    void navigator.clipboard.writeText(message);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  // Export CSV
  const handleExportCSV = () => {
    const BOM = '\uFEFF';
    const headers = [
      'เลขที่ใบแจ้ง',
      'วันที่แจ้ง',
      'วันที่เสร็จสิ้น',
      'แผนก',
      'สายงาน',
      'ชื่องาน/อาการเสีย',
      'สถานที่',
      'ผู้แจ้ง',
      'เบอร์โทรผู้แจ้ง',
      'ช่างผู้รับผิดชอบ',
      'สถานะ',
      'สาเหตุ',
      'วิธีแก้ไข'
    ];

    const rows = activeTickets.map(t => [
      `"${t.requestId}"`,
      `"${new Date(t.createdAt).toLocaleString('th-TH')}"`,
      t.completedAt ? `"${new Date(t.completedAt).toLocaleString('th-TH')}"` : '""',
      `"${t.department}"`,
      `"${t.division || '84'}"`,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${(t.location || '').replace(/"/g, '""')}"`,
      `"${(t.requesterName || '').replace(/"/g, '""')}"`,
      `"${t.requesterPhone || ''}"`,
      `"${t.technicianName || '-'}"`,
      `"${t.status === 'completed' ? 'เสร็จสิ้น' : t.status === 'in_progress' ? 'กำลังซ่อม' : 'รอรับงาน'}"`,
      `"${(t.diagnosticReason || '').replace(/"/g, '""')}"`,
      `"${(t.actionSteps || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = BOM + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Scenery_Repair_Summary_${timeframe}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Print / Save as PDF
  const handlePrintPDF = () => {
    const deptTitle = selectedDept === 'all' ? 'ภาพรวมทุกแผนก (ทั้งฟาร์มเดอะซีนเนอรี่)' : `แผนก "${selectedDept}"`;
    const tfTitle = timeframeLabels[timeframe];
    const printDate = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const ticketsForPrint = displayTickets;
    const activeTicketsRows = ticketsForPrint.map((t) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 6px 8px; text-align: center; font-weight: bold; color: #184e38;">#${t.requestId}</td>
        <td style="padding: 6px 8px;">${new Date(t.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
        <td style="padding: 6px 8px; font-weight: 600;">${t.department}</td>
        <td style="padding: 6px 8px;">${t.title}</td>
        <td style="padding: 6px 8px;">${t.location}</td>
        <td style="padding: 6px 8px;">${t.technicianName || '-'}</td>
        <td style="padding: 6px 8px; text-align: center;">
          <span style="display: inline-block; padding: 2px 6px; border-radius: 9999px; font-size: 10px; font-weight: bold; ${
            t.status === 'completed' ? 'background: #d1fae5; color: #065f46;' :
            t.status === 'in_progress' ? 'background: #dbeafe; color: #1e40af;' :
            'background: #fef3c7; color: #92400e;'
          }">
            ${t.status === 'completed' ? 'เสร็จสิ้น' : t.status === 'in_progress' ? 'กำลังซ่อม' : 'รอรับงาน'}
          </span>
        </td>
      </tr>
    `).join('');

    const completedDeptsList = departmentStats.filter(d => d.completed > 0);
    const deptRows = completedDeptsList.map((d, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 6px 8px; text-align: center;">${idx + 1}</td>
        <td style="padding: 6px 8px; font-weight: 600;">${d.name}</td>
        <td style="padding: 6px 8px; text-align: center; color: #059669; font-weight: bold;">${d.completed} งาน</td>
        <td style="padding: 6px 8px; text-align: center;">${d.total} งาน</td>
        <td style="padding: 6px 8px; text-align: center; color: #d97706;">${d.pending + d.inProgress} งาน</td>
        <td style="padding: 6px 8px; text-align: center; font-weight: bold; color: #065f46;">${d.rate}%</td>
      </tr>
    `).join('');

    const printHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>รายงานสรุปงานซ่อมบำรุงที่จบแล้ว - ${deptTitle} (${tfTitle})</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    body { font-family: 'Sarabun', 'Prompt', 'Segoe UI', Tahoma, sans-serif; color: #0f172a; margin: 0; padding: 0; line-height: 1.4; }
    .header { text-align: center; border-bottom: 2px solid #184e38; padding-bottom: 10px; margin-bottom: 14px; }
    .logo-text { font-size: 20px; font-weight: 800; color: #184e38; letter-spacing: 0.5px; margin: 0; }
    .sub { font-size: 13px; color: #334155; margin: 3px 0 0; font-weight: 600; }
    .meta { font-size: 11px; color: #64748b; margin-top: 4px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px; }
    .kpi-card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 10px; text-align: center; background: #f8fafc; }
    .kpi-val { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 2px; }
    .kpi-label { font-size: 10px; color: #64748b; font-weight: 700; }
    .sec-title { font-size: 12px; font-weight: 800; color: #184e38; margin: 14px 0 6px; border-left: 3px solid #184e38; padding-left: 6px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    th { background: #f1f5f9; padding: 6px 8px; font-size: 10.5px; font-weight: 700; text-align: left; border-bottom: 2px solid #cbd5e1; }
    .sign-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 26px; text-align: center; font-size: 11px; page-break-inside: avoid; }
    .sign-line { border-bottom: 1px dotted #94a3b8; height: 35px; margin-bottom: 5px; }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="logo-text">ฟาร์มเดอะซีนเนอรี่ สวนผึ้ง (The Scenery Vintage Farm)</h1>
    <div class="sub">รายงานสรุปงานซ่อมบำรุงที่จบแล้ว • ${deptTitle}</div>
    <div class="meta">ช่วงเวลา: <strong>${tfTitle}</strong> | พิมพ์ข้อมูล ณ วันที่: ${printDate} น.</div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card" style="border-color: #a7f3d0; background: #f0fdf4;">
      <div class="kpi-label" style="color: #065f46;">ซ่อมเสร็จสิ้นแล้ว (${metrics.completionRate}%)</div>
      <div class="kpi-val" style="color: #047857;">${metrics.completed} <span style="font-size:11px; font-weight: normal;">งาน</span></div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">งานแจ้งซ่อมทั้งหมด</div>
      <div class="kpi-val">${metrics.total} <span style="font-size:11px; font-weight: normal;">งาน</span></div>
    </div>
    <div class="kpi-card" style="border-color: #fed7aa; background: #fffbeb;">
      <div class="kpi-label" style="color: #92400e;">กำลังซ่อม / รออะไหล่</div>
      <div class="kpi-val" style="color: #b45309;">${metrics.inProgress + metrics.waitingParts} <span style="font-size:11px; font-weight: normal;">งาน</span></div>
    </div>
    <div class="kpi-card" style="border-color: #bae6fd; background: #f0f9ff;">
      <div class="kpi-label" style="color: #0369a1;">เวลาเฉลี่ยในการซ่อม</div>
      <div class="kpi-val" style="color: #0284c7;">${metrics.avgDurationText}</div>
    </div>
  </div>

  <div style="font-size: 11px; margin-bottom: 10px; display: flex; gap: 14px; background: #f8fafc; padding: 6px 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
    <span>🛠️ <strong>สรุปสายงาน:</strong></span>
    <span>84 ซ่อมบำรุง: <strong>${metrics.div84} งาน</strong></span>
    <span>85 ก่อสร้าง: <strong>${metrics.div85} งาน</strong></span>
    <span>86 งานศิลป์: <strong>${metrics.div86} งาน</strong></span>
  </div>

  ${deptRows ? `
    <div class="sec-title">ตารางสถิติแผนกที่มีงานซ่อมเสร็จสิ้นแล้ว (${completedDeptsList.length} แผนก)</div>
    <table>
      <thead>
        <tr>
          <th style="width: 36px; text-align: center;">ลำดับ</th>
          <th>แผนก</th>
          <th style="width: 80px; text-align: center;">ซ่อมเสร็จแล้ว</th>
          <th style="width: 70px; text-align: center;">รวมแจ้ง</th>
          <th style="width: 70px; text-align: center;">คงค้าง</th>
          <th style="width: 75px; text-align: center;">ความสำเร็จ</th>
        </tr>
      </thead>
      <tbody>
        ${deptRows}
      </tbody>
    </table>
  ` : ''}

  <div class="sec-title">รายการงานซ่อม${statusViewFilter === 'completed' ? 'ที่เสร็จสิ้นแล้ว' : ''} (${ticketsForPrint.length} รายการ)</div>
  <table>
    <thead>
      <tr>
        <th style="width: 65px; text-align: center;">รหัส</th>
        <th style="width: 85px;">วันที่แจ้ง</th>
        <th style="width: 95px;">แผนก</th>
        <th>ชื่องาน / อาการเสีย</th>
        <th style="width: 85px;">สถานที่</th>
        <th style="width: 85px;">ช่างผู้ดูแล</th>
        <th style="width: 65px; text-align: center;">สถานะ</th>
      </tr>
    </thead>
    <tbody>
      ${activeTicketsRows || '<tr><td colspan="7" style="text-align:center; padding: 10px; color: #94a3b8;">ไม่มีรายการในช่วงเวลานี้</td></tr>'}
    </tbody>
  </table>

  <div class="sign-grid">
    <div>
      <div class="sign-line"></div>
      <div>(ลงชื่อ ผู้จัดทำรายงาน)</div>
      <div style="color: #64748b; font-size: 10px;">วันที่: ....../....../......</div>
    </div>
    <div>
      <div class="sign-line"></div>
      <div>(ลงชื่อ หัวหน้าฝ่ายช่างซ่อมบำรุง)</div>
      <div style="color: #64748b; font-size: 10px;">วันที่: ....../....../......</div>
    </div>
    <div>
      <div class="sign-line"></div>
      <div>(ลงชื่อ ผู้จัดการฟาร์ม / ผู้บริหาร)</div>
      <div style="color: #64748b; font-size: 10px;">วันที่: ....../....../......</div>
    </div>
  </div>
</body>
</html>`;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(printHtml);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        try {
          printWin.print();
        } catch {
          window.print();
        }
      }, 400);
    } else {
      window.print();
    }
  };

  const renderContent = (
    <div className="w-full max-w-5xl mx-auto space-y-4 animate-in fade-in duration-200">
      
      {/* 1. Header & Actions Bar */}
      <div className="bg-gradient-to-r from-primary via-primary to-primary-container text-white p-5 sm:p-6 rounded-3xl shadow-lg border border-primary-fixed/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 opacity-10 pointer-events-none">
          <BarChart2 className="w-56 h-56 text-white" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-extrabold mb-2">
              <PieChart className="w-3.5 h-3.5" />
              <span>สรุปรายงานสถิติงานซ่อมบำรุง</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {selectedDept === 'all' ? 'ภาพรวมการซ่อมบำรุงทั้งฟาร์ม' : `สรุปงานซ่อมบำรุง: แผนก "${selectedDept}"`}
            </h2>
            <p className="text-xs sm:text-sm text-primary-fixed mt-1">
              สรุปข้อมูลรายวัน / รายสัปดาห์ / รายเดือน แยกดูได้ทุกแผนก พร้อมยอดสรุปและอัตราการซ่อมเสร็จ
            </p>
          </div>

          {/* Quick Action Buttons: Copy for LINE + Print PDF + Export CSV */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopySummary}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="คัดลอกข้อความสรุปสำหรับส่งในกลุ่ม LINE"
            >
              {copiedToast ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              <span>{copiedToast ? 'คัดลอกแล้ว!' : 'คัดลอกส่งไลน์'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrintPDF}
              className="px-3.5 py-2 bg-white text-primary hover:bg-slate-50 border border-white/60 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="พิมพ์รายงานสรุป หรือบันทึกเป็นไฟล์ PDF (Print to PDF)"
            >
              <Printer className="w-4 h-4 text-primary" />
              <span>พิมพ์ / บันทึก PDF</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30 rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="ดาวน์โหลดข้อมูลเป็นไฟล์ Excel / CSV"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลด Excel</span>
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-2xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white cursor-pointer ml-1 active:scale-95 transition-all"
                title="ปิดหน้ารายงาน"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Filter Controls Card (ช่วงเวลา + เลือกแผนก + สายงาน) */}
      <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3.5">
        
        {/* Timeframe Selector Pills */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-on-surface flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-primary" />
            <span>เลือกช่วงเวลา:</span>
          </label>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-wrap">
            {(['today', 'yesterday', 'week', 'month', 'last_month', 'all', 'custom'] as TimeframeMode[]).map(tf => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  timeframe === tf
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
                }`}
              >
                {timeframeLabels[tf]}
              </button>
            ))}
          </div>

          {/* Custom Date Range Picker */}
          {timeframe === 'custom' && (
            <div className="flex items-center gap-2 pt-2 flex-wrap text-xs">
              <span className="font-bold text-slate-600">ตั้งแต่วันที่:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2.5 py-1.5 bg-surface-container-low border border-slate-200 rounded-xl outline-none focus:border-primary text-xs"
              />
              <span className="font-bold text-slate-600">ถึงวันที่:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2.5 py-1.5 bg-surface-container-low border border-slate-200 rounded-xl outline-none focus:border-primary text-xs"
              />
            </div>
          )}
        </div>

        {/* Department and Division Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
          
          {/* Department Selector */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                <span>แผนกที่ต้องการดู:</span>
              </span>
              {selectedDept !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedDept('all')}
                  className="text-[11px] text-primary hover:underline font-bold"
                >
                  กลับไปดูทุกแผนก
                </button>
              )}
            </label>
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                if (onSelectDepartmentFilter) onSelectDepartmentFilter(e.target.value);
              }}
              className="w-full h-10 px-3 bg-surface-container-low border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-on-surface outline-none focus:border-primary shadow-xs cursor-pointer"
            >
              <option value="all">
                {onlyCompletedDepts 
                  ? `🏢 แผนกที่มีงานจบแล้ว (${departments.filter(d => filteredByTimeframe.some(t => t.department === d.name && (t.status === 'completed' || t.status === 'waiting_inspect'))).length} แผนก)`
                  : '🏢 ทุกแผนก (ภาพรวมทั้งฟาร์ม)'}
              </option>
              {departments
                .filter(d => !onlyCompletedDepts || filteredByTimeframe.some(t => t.department === d.name && (t.status === 'completed' || t.status === 'waiting_inspect')))
                .map(d => {
                  const doneCount = filteredByTimeframe.filter(t => t.department === d.name && (t.status === 'completed' || t.status === 'waiting_inspect')).length;
                  return (
                    <option key={d.id} value={d.name}>
                      {d.icon} {d.name} {doneCount > 0 ? `(เสร็จ ${doneCount} งาน)` : '(0)'}
                    </option>
                  );
                })}
            </select>
          </div>

          {/* Division Selector */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-primary" />
              <span>สายงานผู้รับผิดชอบ:</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'all', label: 'ทุกสายงาน', icon: '🌐' },
                { id: '84', label: '84 ช่าง', icon: '🛠️' },
                { id: '85', label: '85 สร้าง', icon: '🏗️' },
                { id: '86', label: '86 ศิลป์', icon: '🎨' },
              ].map(div => (
                <button
                  key={div.id}
                  type="button"
                  onClick={() => setSelectedDivision(div.id)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center truncate cursor-pointer ${
                    selectedDivision === div.id
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant border border-slate-200'
                  }`}
                >
                  <span className="mr-0.5">{div.icon}</span>
                  <span>{div.label}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* 3. Summary Metric Cards (4 คอลัมน์) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Card 1: Total */}
        <div className="p-4 bg-surface-container-lowest rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant">แจ้งซ่อมทั้งหมด</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              📥
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-on-surface">
            {metrics.total} <span className="text-xs font-normal text-slate-500">รายการ</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
            <span>84: {metrics.div84} | 85: {metrics.div85} | 86: {metrics.div86}</span>
          </div>
        </div>

        {/* Card 2: Completed */}
        <div className="p-4 bg-surface-container-lowest rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700">ซ่อมเสร็จสิ้นแล้ว</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              ✅
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
            {metrics.completed} <span className="text-xs font-normal text-emerald-600">รายการ</span>
          </div>
          <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>อัตราสำเร็จ {metrics.completionRate}%</span>
          </div>
        </div>

        {/* Card 3: In Progress / Waiting */}
        <div className="p-4 bg-surface-container-lowest rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700">กำลังดำเนินการซ่อม</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
              🔧
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-700">
            {metrics.inProgress} <span className="text-xs font-normal text-amber-600">งาน</span>
          </div>
          <div className="text-[11px] text-amber-600 flex items-center gap-1 mt-0.5">
            <span>รออะไหล่ {metrics.waitingParts} งาน • รอรับงาน {metrics.pending} งาน</span>
          </div>
        </div>

        {/* Card 4: Avg Turnaround Time */}
        <div className="p-4 bg-surface-container-lowest rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700">เวลาเฉลี่ยซ่อมเสร็จ</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-sm">
              ⚡
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-700">
            {metrics.avgDurationText}
          </div>
          <div className="text-[11px] text-purple-600 flex items-center gap-1 mt-0.5">
            <Clock className="w-3.5 h-3.5" />
            <span>นับจากเวลาแจ้งถึงปิดงาน</span>
          </div>
        </div>

      </div>

      {/* 4. Department Breakdown & Ranking Table (ตารางแจกแจงแยกแต่ละแผนก) */}
      <div className="bg-surface-container-lowest rounded-3xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-on-surface flex items-center gap-2">
              <span>{onlyCompletedDepts ? '🏢 ตารางสรุปงานแผนกที่จบแล้ว' : '🏢 ตารางสรุปการซ่อมทุกแผนก'}</span>
              <span className="text-xs font-normal text-slate-500">
                ({timeframeLabels[timeframe]})
              </span>
            </h3>
            <p className="text-[11px] text-on-surface-variant">
              {onlyCompletedDepts 
                ? 'แสดงเฉพาะแผนกที่มีงานซ่อมเสร็จสิ้นแล้วตามรอบเวลา' 
                : 'แสดงทุกแผนกในฟาร์ม'} • คลิกแถวแผนกเพื่อเจาะลึกดูงาน
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle: เฉพาะแผนกที่จบแล้ว vs ทุกแผนก */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setOnlyCompletedDepts(true)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  onlyCompletedDepts
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ✅ แผนกที่จบแล้ว ({departmentStats.length})
              </button>
              <button
                type="button"
                onClick={() => setOnlyCompletedDepts(false)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !onlyCompletedDepts
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ทุกแผนก ({departments.length})
              </button>
            </div>

            {/* Sort Buttons */}
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  if (sortField === 'completed') setSortAsc(!sortAsc);
                  else { setSortField('completed'); setSortAsc(false); }
                }}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer ${
                  sortField === 'completed' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                }`}
              >
                <span>งานจบมากสุด</span>
                <ArrowUpDown className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (sortField === 'total') setSortAsc(!sortAsc);
                  else { setSortField('total'); setSortAsc(false); }
                }}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer ${
                  sortField === 'total' ? 'bg-primary text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                }`}
              >
                <span>งานรวม</span>
                <ArrowUpDown className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-slate-200 text-slate-600 font-extrabold">
                <th className="py-2.5 px-3">แผนก</th>
                <th className="py-2.5 px-3 text-center">ซ่อมเสร็จแล้ว</th>
                <th className="py-2.5 px-3 text-center">แจ้งซ่อมรวม</th>
                <th className="py-2.5 px-3 text-center">กำลังซ่อม/รอ</th>
                <th className="py-2.5 px-3 text-center">สำเร็จ (%)</th>
                <th className="py-2.5 px-3">ตัวอย่างงานล่าสุด</th>
                <th className="py-2.5 px-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departmentStats.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    <div className="flex flex-col items-center gap-2">
                      <span>ยังไม่มีแผนกที่มีงานซ่อมเสร็จสิ้น (จบงานแล้ว) ในช่วงเวลา {timeframeLabels[timeframe]}</span>
                      {onlyCompletedDepts && (
                        <button
                          type="button"
                          onClick={() => setOnlyCompletedDepts(false)}
                          className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-bold hover:bg-primary/20 cursor-pointer"
                        >
                          คลิกเพื่อดูทุกแผนก ({departments.length} แผนก)
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                departmentStats.map((d, idx) => {
                const isSelected = selectedDept === d.name;
                return (
                  <tr
                    key={d.id}
                    onClick={() => {
                      setSelectedDept(isSelected ? 'all' : d.name);
                      if (onSelectDepartmentFilter) {
                        onSelectDepartmentFilter(isSelected ? 'all' : d.name);
                      }
                    }}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-primary/10 font-bold'
                        : d.total > 0
                          ? 'hover:bg-slate-50/80 bg-white'
                          : 'hover:bg-slate-50/50 bg-slate-50/30 text-slate-400'
                    }`}
                  >
                    {/* Department Name & Icon */}
                    <td className="py-2.5 px-3 font-bold text-on-surface flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: `${d.color}20` }}>
                        {d.icon}
                      </span>
                      <span className="truncate">{d.name}</span>
                      {isSelected && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-primary text-white">เลือกอยู่</span>
                      )}
                    </td>

                    {/* Total count */}
                    <td className="py-2.5 px-3 text-center font-extrabold">
                      {d.total > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-bold">
                          {d.total}
                        </span>
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>

                    {/* Completed count */}
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-700">
                      {d.completed > 0 ? `✅ ${d.completed}` : '-'}
                    </td>

                    {/* Pending count */}
                    <td className="py-2.5 px-3 text-center font-bold text-amber-700">
                      {(d.pending + d.inProgress) > 0 ? (
                        <span className="text-amber-700">⏳ {d.pending + d.inProgress}</span>
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* Progress Bar & Rate */}
                    <td className="py-2.5 px-3 text-center">
                      {d.total > 0 ? (
                        <div className="flex items-center gap-1.5 justify-center">
                          <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${d.rate}%` }}
                            ></div>
                          </div>
                          <span className="font-mono text-[11px] font-bold text-slate-700">{d.rate}%</span>
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Recent issue */}
                    <td className="py-2.5 px-3 max-w-[200px] truncate text-slate-600 text-[11px]" title={d.recentTitle}>
                      {d.recentTitle}
                    </td>

                    {/* View Button */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-primary text-white'
                            : 'bg-surface-container hover:bg-surface-container-high text-primary'
                        }`}
                      >
                        {isSelected ? 'ดูรวม' : 'ดูแผนกนี้'}
                      </button>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Ticket List for Selected Scope */}
      <div className="bg-surface-container-lowest rounded-3xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-on-surface">
              {statusViewFilter === 'completed' ? '✅ รายการงานซ่อมที่จบแล้ว' : '📋 รายการงานซ่อมทั้งหมด'} ({displayTickets.length} รายการ)
            </h3>
            <p className="text-[11px] text-on-surface-variant">
              {selectedDept === 'all' ? 'แสดงทุกแผนก' : `เฉพาะแผนก "${selectedDept}"`} • {timeframeLabels[timeframe]}
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setStatusViewFilter('completed')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusViewFilter === 'completed'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ✅ เฉพาะงานที่จบแล้ว ({metrics.completed})
              </button>
              <button
                type="button"
                onClick={() => setStatusViewFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusViewFilter === 'all'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                งานทั้งหมด ({metrics.total})
              </button>
            </div>

            {selectedDept !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedDept('all')}
                className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-bold hover:bg-primary/20 cursor-pointer"
              >
                แสดงงานทุกแผนก
              </button>
            )}
          </div>
        </div>

        {displayTickets.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
            {statusViewFilter === 'completed'
              ? 'ยังไม่มีงานซ่อมที่เสร็จสิ้น (จบงานแล้ว) ในช่วงเวลาที่เลือก'
              : 'ไม่มีรายการแจ้งซ่อมในช่วงเวลาที่เลือก'}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {displayTickets.map(t => {
              const isDone = t.status === 'completed';
              return (
                <div
                  key={t.id}
                  className="p-3 sm:p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-sm shrink-0 mt-0.5">
                      {isDone ? '✅' : t.status === 'in_progress' ? '🔧' : '⏳'}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                          #{t.requestId}
                        </span>
                        <span className="font-bold text-xs text-on-surface truncate">
                          {t.title}
                        </span>
                        <DivisionBadge division={t.division} size="sm" />
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                        <span>🏢 {t.department}</span>
                        <span>•</span>
                        <span>ผู้แจ้ง: {t.requesterName}</span>
                        {t.technicianName && (
                          <>
                            <span>•</span>
                            <span className="text-primary font-medium">ช่าง: {t.technicianName}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>
                          {new Date(t.createdAt).toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5 self-end sm:self-auto">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                      isDone
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : t.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                      {isDone ? 'เสร็จสิ้น' : t.status === 'in_progress' ? 'กำลังซ่อม' : 'รอรับงาน'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );

  if (isModal) {
    return (
      <div 
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) onClose();
        }}
      >
        <div className="relative w-full max-w-5xl bg-surface-container-lowest rounded-3xl shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto p-2 sm:p-5 my-auto">
          {renderContent}
        </div>
      </div>
    );
  }

  return renderContent;
};
