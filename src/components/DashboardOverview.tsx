import React, { useState, useMemo } from 'react';
import { Ticket, Department, Technician } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { DivisionBadge } from './DivisionBadge';
import { DivisionFilterTabs } from './DivisionFilterTabs';
import { getTicketAgingInfo } from '../lib/ticketAging';
import {
  Wrench,
  AlertTriangle,
  Clock,
  UserPlus,
  Search,
  X,
  QrCode,
  BarChart2,
  RotateCw,
  Hammer,
  Package,
  AlertOctagon,
  CheckCircle2,
  SlidersHorizontal,
  MapPin,
  Phone,
  Eye
} from 'lucide-react';

interface DashboardOverviewProps {
  tickets: Ticket[];
  departments: Department[];
  technicians: Technician[];
  onSelectTicket: (ticket: Ticket) => void;
  onQuickAssign: (ticket: Ticket) => void;
  onOpenQRScanner: () => void;
  onRefresh: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  tickets,
  departments,
  technicians,
  onSelectTicket,
  onQuickAssign,
  onOpenQRScanner,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState<string>('84');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('active');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('all');
  const [callConfirmTech, setCallConfirmTech] = useState<{ name: string; phone: string } | null>(null);

  // Format today's date in Thai
  const todayText = useMemo(() => {
    return new Date().toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }, []);

  // Most critical urgent ticket for emergency banner (ONLY if real emergency exists)
  const emergencyTicket = useMemo(() => {
    return (
      tickets.find(t => t.priority === 'critical' && t.status !== 'completed' && t.status !== 'cancelled') ||
      tickets.find(t => t.priority === 'high' && t.status !== 'completed' && t.status !== 'cancelled') ||
      null
    );
  }, [tickets]);

  // Counts for KPIs - calculated by selected division
  const kpis = useMemo(() => {
    const divTickets = selectedDivisionFilter === 'all'
      ? tickets
      : tickets.filter(t => (t.division || '84') === selectedDivisionFilter);
    const total = divTickets.length;
    const pending = divTickets.filter(t => t.status === 'pending' || t.status === 'assigned').length;
    const inProgress = divTickets.filter(t => t.status === 'in_progress').length;
    const waitingParts = divTickets.filter(t => t.status === 'waiting_parts').length;
    const completed = divTickets.filter(t => t.status === 'completed' || t.status === 'waiting_inspect').length;
    const active = divTickets.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length;
    const overdue = divTickets.filter(t => (t.isOverdue || (t.priority === 'critical')) && t.status !== 'completed' && t.status !== 'cancelled').length;
    
    return { total, pending, inProgress, waitingParts, completed, active, overdue };
  }, [tickets, selectedDivisionFilter]);

  // Filtered tickets for feed
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          ticket.requestId.toLowerCase().includes(q) ||
          ticket.title.toLowerCase().includes(q) ||
          ticket.location.toLowerCase().includes(q) ||
          ticket.department.toLowerCase().includes(q) ||
          (ticket.technicianName && ticket.technicianName.toLowerCase().includes(q));
        if (!match) return false;
      }

      // Division (strict separation per division)
      if (selectedDivisionFilter !== 'all' && (ticket.division || '84') !== selectedDivisionFilter) {
        return false;
      }

      // Status: active excludes completed & cancelled; completed only shows completed
      if (selectedStatusFilter === 'active' || selectedStatusFilter === 'all') {
        if (ticket.status === 'completed' || ticket.status === 'cancelled') return false;
      } else if (selectedStatusFilter === 'pending') {
        if (ticket.status !== 'pending' && ticket.status !== 'assigned') return false;
      } else if (selectedStatusFilter === 'in_progress') {
        if (ticket.status !== 'in_progress') return false;
      } else if (selectedStatusFilter === 'waiting_parts') {
        if (ticket.status !== 'waiting_parts') return false;
      } else if (selectedStatusFilter === 'completed') {
        if (ticket.status !== 'completed' && ticket.status !== 'waiting_inspect') return false;
      }

      // Zone
      if (selectedZoneFilter !== 'all' && ticket.zone && !ticket.zone.includes(selectedZoneFilter)) {
        return false;
      }

      return true;
    });
  }, [tickets, searchQuery, selectedDivisionFilter, selectedStatusFilter, selectedZoneFilter]);

  const getUrgencyText = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'ด่วนที่สุด (Critical)';
      case 'high':
        return 'ด่วนมาก (High)';
      case 'low':
        return 'ตามแผนงาน (Low)';
      default:
        return 'ทั่วไป (Normal)';
    }
  };

  return (
    <div className="flex flex-col w-full pb-10">
      
      {/* 1. Top Greeting & Shift Overview */}
      <section className="px-margin pt-space-md pb-space-sm flex flex-col gap-space-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse"></span>
            <span className="font-label-sm text-label-sm text-primary font-semibold tracking-wide uppercase">
              พร้อมปฏิบัติการภาคสนาม
            </span>
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container-high px-2.5 py-1 rounded-full font-medium">
            {todayText}
          </span>
        </div>
        <div className="flex flex-col">
          <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
            <Wrench className="w-4 h-4 text-primary shrink-0" />
            หัวหน้าฝ่ายซ่อมบำรุง • ฟาร์มเดอะซีนเนอรี่ สวนผึ้ง
          </p>
        </div>
      </section>

      {/* 2. Urgent Emergency Banner (Hazard Tier) */}
      {emergencyTicket && (
        <section className="px-margin my-space-xs">
          <div className="relative overflow-hidden rounded-xl bg-error-container text-on-error-container p-space-md shadow-md">
            <div className="absolute -right-4 -bottom-4 w-28 h-28 rounded-full bg-error/10 pointer-events-none"></div>
            <div className="flex items-start gap-space-sm relative z-10">
              <div className="w-10 h-10 rounded-lg bg-error text-on-error flex items-center justify-center shrink-0 shadow-sm animate-bounce">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-space-xs flex-wrap mb-1">
                  <span className="bg-error text-on-error font-label-sm text-label-sm px-2 py-0.5 rounded-full tracking-wide uppercase font-bold">
                    ด่วนที่สุด (Critical)
                  </span>
                  <span className="font-label-sm text-label-sm text-error font-medium flex items-center gap-0.5">
                    <Clock className="w-3.5 h-3.5 shrink-0" /> 25 นาทีก่อน
                  </span>
                </div>
                <h2 className="font-headline-sm text-headline-sm text-on-error-container font-bold leading-tight">
                  {emergencyTicket.title}
                </h2>
                <p className="font-body-sm text-body-sm text-on-error-container/85 mt-1 line-clamp-2">
                  แจ้งโดย {emergencyTicket.requesterName} ({emergencyTicket.department}) • {emergencyTicket.description}
                </p>
                <div className="mt-space-sm flex items-center gap-space-xs">
                  <button
                    onClick={() => onQuickAssign(emergencyTicket)}
                    className="flex items-center justify-center gap-1.5 bg-error text-on-error px-4 py-2 rounded-lg font-label-md text-label-md shadow active:scale-95 transition-transform min-h-[44px] cursor-pointer"
                    type="button"
                  >
                    <UserPlus className="w-4 h-4 shrink-0" />
                    <span>มอบหมายทันที</span>
                  </button>
                  <button
                    onClick={() => onSelectTicket(emergencyTicket)}
                    className="flex items-center justify-center px-3 py-2 rounded-lg bg-surface-container-lowest/80 text-error font-label-md text-label-md hover:bg-surface-container-lowest min-h-[44px] cursor-pointer"
                    type="button"
                  >
                    ดูภาพหน้างาน
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. Quick Operational Search & QR Scanner Bar */}
      <section className="px-margin my-space-sm">
        <div className="flex items-center gap-space-xs">
          <div className="flex-1 flex items-center bg-surface-container-lowest rounded-xl px-3 py-2 shadow-sm min-h-[48px] border border-slate-200/50">
            <Search className="w-5 h-5 text-outline mr-2 shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent font-body-sm text-body-sm text-on-surface focus:outline-none placeholder:text-outline"
              placeholder="ค้นหาด้วยรหัสใบงาน, อุปกรณ์, หรือโซน..."
              type="search"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-on-surface-variant hover:text-on-surface p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={onOpenQRScanner}
            aria-label="สแกน QR Code ประจำจุดซ่อม"
            className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-sm active:scale-95 hover:bg-primary transition-transform shrink-0 cursor-pointer"
            type="button"
          >
            <QrCode className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* 4. KPI Metrics Carousel */}
      <section className="mt-space-xs mb-space-sm">
        <div className="flex items-center justify-between px-margin mb-2">
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold flex items-center gap-1.5">
            <BarChart2 className="w-5 h-5 text-primary shrink-0" />
            ตัวชี้วัดประจำวัน
          </h3>
          <button
            onClick={onRefresh}
            className="font-label-sm text-label-sm text-secondary font-semibold flex items-center gap-1 cursor-pointer hover:underline bg-transparent border-none"
          >
            รีเฟรชล่าสุด <RotateCw className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>
        <div className="flex overflow-x-auto gap-space-sm px-margin pb-2 scroll-smooth no-scrollbar">
          {/* Card: Active Pending */}
          <div className="min-w-[130px] flex-shrink-0 bg-surface-container-lowest rounded-xl p-space-sm shadow-sm flex flex-col justify-between border border-slate-200/40">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm text-label-sm font-medium">งานรอซ่อม</span>
              <Wrench className="w-4 h-4" />
            </div>
            <div className="mt-2">
              <span className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold">
                {kpis.active}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant ml-1">รายการ</span>
            </div>
          </div>

          {/* Card: Pending */}
          <div className="min-w-[130px] flex-shrink-0 bg-surface-container-lowest rounded-xl p-space-sm shadow-sm flex flex-col justify-between border border-slate-200/40">
            <div className="flex items-center justify-between text-on-secondary-fixed-variant">
              <span className="font-label-sm text-label-sm font-medium">รอมอบหมาย</span>
              <Clock className="w-4 h-4 text-secondary" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-headline-lg-mobile text-headline-lg-mobile text-secondary font-bold">
                {kpis.pending}
              </span>
              <span className="font-label-sm text-label-sm text-secondary font-medium">รอคิว</span>
            </div>
          </div>

          {/* Card: In Progress */}
          <div className="min-w-[130px] flex-shrink-0 bg-surface-container-lowest rounded-xl p-space-sm shadow-sm flex flex-col justify-between border border-slate-200/40">
            <div className="flex items-center justify-between text-primary">
              <span className="font-label-sm text-label-sm font-medium">กำลังซ่อม</span>
              <Hammer className="w-4 h-4 text-primary" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold">
                {kpis.inProgress}
              </span>
              <span className="font-label-sm text-label-sm text-primary font-medium">ช่างทำอยู่</span>
            </div>
          </div>

          {/* Card: Waiting Parts */}
          <div className="min-w-[130px] flex-shrink-0 bg-surface-container-lowest rounded-xl p-space-sm shadow-sm flex flex-col justify-between border border-slate-200/40">
            <div className="flex items-center justify-between text-on-secondary-container">
              <span className="font-label-sm text-label-sm font-medium">รออะไหล่</span>
              <Package className="w-4 h-4 text-secondary-container" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-headline-lg-mobile text-headline-lg-mobile text-on-secondary-container font-bold">
                {kpis.waitingParts}
              </span>
              <span className="font-label-sm text-label-sm text-outline font-medium">สั่งซื้อแล้ว</span>
            </div>
          </div>

          {/* Card: SLA Breach */}
          <div className="min-w-[130px] flex-shrink-0 bg-error-container/40 rounded-xl p-space-sm shadow-sm flex flex-col justify-between border border-error/20">
            <div className="flex items-center justify-between text-error">
              <span className="font-label-sm text-label-sm font-medium">เกิน SLA</span>
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-headline-lg-mobile text-headline-lg-mobile text-error font-bold">
                {kpis.overdue}
              </span>
              <span className="font-label-sm text-label-sm text-error font-semibold">ล่าช้า</span>
            </div>
          </div>

          {/* Card: Completed */}
          <div className="min-w-[130px] flex-shrink-0 bg-surface-container-lowest rounded-xl p-space-sm shadow-sm flex flex-col justify-between border border-slate-200/40">
            <div className="flex items-center justify-between text-teal-700">
              <span className="font-label-sm text-label-sm font-medium">เสร็จสิ้นแล้ว</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-headline-lg-mobile text-headline-lg-mobile text-teal-700 font-bold">
                {kpis.completed}
              </span>
              <span className="font-label-sm text-label-sm text-teal-600 font-medium">งานเสร็จ</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4.5 Division Filter Tabs (84 ซ่อมบำรุง, 85 ก่อสร้าง, 86 งานศิลป์) */}
      <section className="px-margin my-space-xs">
        <DivisionFilterTabs
          selectedDivision={selectedDivisionFilter}
          onSelectDivision={setSelectedDivisionFilter}
          tickets={tickets}
        />
      </section>

      {/* 5. Quick Status Pill Filter Bar */}
      <section className="px-margin my-space-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scroll-smooth no-scrollbar">
          {[
            { id: 'active', label: `งานรอซ่อม (${kpis.active})` },
            { id: 'pending', label: `รอรับงาน (${kpis.pending})` },
            { id: 'in_progress', label: `กำลังทำ (${kpis.inProgress})` },
            { id: 'waiting_parts', label: `รออะไหล่ (${kpis.waitingParts})` },
            { id: 'completed', label: `เสร็จสิ้น (${kpis.completed})` }
          ].map(pill => (
            <button
              key={pill.id}
              onClick={() => setSelectedStatusFilter(pill.id)}
              className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap min-h-[38px] transition-all cursor-pointer ${
                selectedStatusFilter === pill.id
                  ? 'bg-primary-container text-on-primary font-semibold shadow-sm'
                  : 'bg-surface-container-highest text-on-surface hover:bg-surface-container-high'
              }`}
              type="button"
            >
              {pill.label}
            </button>
          ))}
        </div>
      </section>

      {/* 6. Work Orders Feed Header */}
      <div className="px-margin mt-space-sm mb-space-xs flex items-center justify-between">
        <div className="flex items-center gap-1">
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
            รายการแจ้งซ่อมภาคสนาม
          </h3>
          <span className="w-5 h-5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-[11px] flex items-center justify-center font-bold">
            {filteredTickets.length}
          </span>
        </div>
        <button
          onClick={() => {
            const next = selectedZoneFilter === 'all' ? 'A' : selectedZoneFilter === 'A' ? 'B' : selectedZoneFilter === 'B' ? 'C' : 'all';
            setSelectedZoneFilter(next);
          }}
          className="font-label-md text-label-md text-primary font-semibold flex items-center gap-1 cursor-pointer bg-transparent border-none"
          type="button"
        >
          <span>{selectedZoneFilter === 'all' ? 'ทุกโซน' : `โซน ${selectedZoneFilter}`}</span>
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* 7. Work Order Cards List */}
      <section className="px-margin flex flex-col gap-space-sm mb-space-lg">
        {filteredTickets.length === 0 ? (
          <div className="p-12 text-center bg-surface-container-lowest rounded-3xl border border-dashed border-slate-300 text-on-surface-variant flex flex-col items-center gap-3 my-2">
            <div className="w-14 h-14 rounded-2xl bg-primary-fixed/30 text-primary flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-on-surface">ไม่มีรายการแจ้งซ่อมในหมวดนี้</h4>
            <p className="text-xs text-on-surface-variant max-w-sm">
              ข้อมูลระบบเป็นปัจจุบันแบบคลีน เมื่อมีใบแจ้งซ่อมใหม่เข้ามาจะแสดงที่นี่ทันที
            </p>
          </div>
        ) : (
          filteredTickets.map(ticket => {
            const isWaitingParts = ticket.status === 'waiting_parts';
            const isCompleted = ticket.status === 'completed' || ticket.status === 'waiting_inspect';
            const isEmergency = ticket.priority === 'critical' || ticket.priority === 'high';
            const aging = getTicketAgingInfo(ticket);

            // Accent strip color
            let stripColor = 'bg-primary-container';
            if (isEmergency) stripColor = 'bg-error';
            else if (isWaitingParts) stripColor = 'bg-secondary-container';
            else if (isCompleted) stripColor = 'bg-tertiary-container';

            return (
              <article
                key={ticket.id}
                className="relative bg-surface-container-lowest rounded-2xl overflow-hidden shadow-xs hover:shadow-sm flex flex-col border border-slate-200/60"
              >
                {/* Status Left Accent Strip */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${stripColor}`}></div>

                <div className="p-space-md pl-5 flex flex-col gap-space-xs">
                  {/* Header Row */}
                  <div className="flex items-center justify-between gap-space-xs flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-label-md text-label-md font-bold text-primary tracking-tight">
                        #{ticket.requestId}
                      </span>
                      <DivisionBadge division={ticket.division} size="sm" />
                      
                      {/* Aging Badge (งานค้างกี่วัน) */}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${aging.badgeClass}`} title={aging.label}>
                        <Clock className="w-3 h-3" />
                        <span>{aging.badgeText}</span>
                      </span>

                      {ticket.category && (
                        <span className="px-2 py-0.5 rounded-full bg-primary-fixed/40 text-primary font-bold text-[10px]">
                          {ticket.category}
                        </span>
                      )}
                      {isEmergency && (
                        <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-bold">
                          {ticket.priority === 'critical' ? 'ด่วนที่สุด' : 'ด่วนมาก'}
                        </span>
                      )}
                    </div>
                    
                    <span className={`px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-semibold flex items-center gap-1 ${
                      ticket.status === 'in_progress'
                        ? 'bg-primary-fixed text-on-primary-fixed'
                        : ticket.status === 'waiting_parts'
                        ? 'bg-secondary-fixed text-on-secondary-fixed-variant'
                        : ticket.status === 'completed'
                        ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}>
                      {ticket.status === 'in_progress' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                      )}
                      {ticket.status === 'in_progress' && 'กำลังดำเนินการ'}
                      {ticket.status === 'waiting_parts' && 'รออะไหล่'}
                      {ticket.status === 'pending' && 'รอตรวจสอบ'}
                      {ticket.status === 'assigned' && 'รับงานแล้ว'}
                      {ticket.status === 'waiting_inspect' && 'รอตรวจรับ'}
                      {ticket.status === 'completed' && 'เสร็จสิ้น'}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm">
                    <MapPin className="w-4 h-4 text-secondary shrink-0" />
                    <span className="font-semibold text-on-surface">{ticket.department}</span>
                    <span className="text-outline">•</span>
                    <span>{ticket.location}</span>
                  </div>

                  {/* Title */}
                  <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold leading-snug">
                    {ticket.title}
                  </h4>

                  {/* Part info alert box if waiting parts */}
                  {isWaitingParts && (
                    <div className="p-2.5 rounded-lg bg-surface-container-low flex items-start gap-2 border border-secondary-container/20">
                      <Wrench className="w-5 h-5 text-secondary-container shrink-0 mt-0.5" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-sm text-label-sm text-on-surface font-semibold truncate">
                          สถานะอะไหล่: {ticket.remark || 'กำลังสั่งซื้อชิ้นส่วนทดแทน'}
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          อยู่ระหว่างรอของส่งมอบเพื่อนำเข้าติดตั้ง
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Requester & Technician grid */}
                  <div className="grid grid-cols-2 gap-2 mt-1 py-2 px-3 rounded-lg bg-surface-container-low">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">ผู้แจ้งเหตุ</span>
                      <span className="font-body-sm text-body-sm text-on-surface font-medium truncate">
                        {ticket.requesterName}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">ช่างผู้รับผิดชอบ</span>
                      <span className="font-body-sm text-body-sm text-primary font-semibold truncate flex items-center gap-1">
                        <Wrench className="w-3.5 h-3.5 shrink-0" />
                        {ticket.technicianName || 'ยังไม่กำหนด'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom row: urgency and time */}
                  <div className="flex items-center justify-between pt-1 text-on-surface-variant font-label-sm text-label-sm">
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-medium">
                      ความเร่งด่วน: {getUrgencyText(ticket.priority)}
                    </span>
                    <span className="flex items-center gap-1 text-outline font-medium">
                      <Clock className="w-3.5 h-3.5 shrink-0" /> วันนี้
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        const targetName = ticket.technicianName || ticket.requesterName || 'ศูนย์ซ่อมฟาร์ม';
                        const targetPhone = ticket.technicianPhone || ticket.requesterPhone || '';
                        setCallConfirmTech({ name: targetName, phone: targetPhone });
                      }}
                      className="flex-1 bg-surface-container-high hover:bg-surface-container text-on-surface rounded-lg py-2 font-label-md text-label-md font-semibold text-center min-h-[42px] flex items-center justify-center gap-1.5 cursor-pointer"
                      type="button"
                    >
                      <Phone className="w-4 h-4 shrink-0" />
                      โทรหาช่าง
                    </button>
                    <button
                      onClick={() => onSelectTicket(ticket)}
                      className="flex-1 bg-primary hover:bg-primary-container text-on-primary rounded-lg py-2 font-label-md text-label-md font-semibold text-center shadow active:scale-98 transition-transform min-h-[42px] flex items-center justify-center gap-1.5 cursor-pointer"
                      type="button"
                    >
                      <Eye className="w-4 h-4 shrink-0" />
                      ดูรายละเอียด
                    </button>
                  </div>

                </div>
              </article>
            );
          })
        )}
      </section>

      {/* Phone Call Confirmation Modal */}
      {callConfirmTech && (
        <ConfirmModal
          isOpen={!!callConfirmTech}
          title="ยืนยันการโทรออก"
          message={`คุณต้องการโทรติดต่อ "${callConfirmTech.name}" ที่หมายเลข ${callConfirmTech.phone} ใช่หรือไม่?`}
          confirmText="โทรออกทันที"
          cancelText="ยกเลิก"
          confirmVariant="primary"
          onConfirm={() => {
            window.location.href = `tel:${callConfirmTech.phone}`;
            setCallConfirmTech(null);
          }}
          onCancel={() => setCallConfirmTech(null)}
        />
      )}

    </div>
  );
};
