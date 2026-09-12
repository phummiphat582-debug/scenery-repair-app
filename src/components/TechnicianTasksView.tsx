import React, { useState, useMemo } from 'react';
import { Ticket, Technician } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { Phone, CheckCircle2, Clock, Wrench, AlertTriangle, AlertCircle, Eye, Check, ChevronRight, Package, RefreshCw } from 'lucide-react';

interface TechnicianTasksViewProps {
  tickets: Ticket[];
  technicians: Technician[];
  onSelectTicket: (ticket: Ticket) => void;
  onUpdateTicketStatus: (id: string, updates: Partial<Ticket>) => Promise<void>;
  onOpenFarmMap: () => void;
  onOpenSOSModal: () => void;
  onOpenPartsModal: (ticket?: Ticket) => void;
}

export const TechnicianTasksView: React.FC<TechnicianTasksViewProps> = ({
  tickets,
  technicians,
  onSelectTicket,
  onUpdateTicketStatus,
  onOpenFarmMap,
  onOpenSOSModal,
  onOpenPartsModal
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'waiting' | 'history'>('today');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: 'primary' | 'danger' | 'warning' | 'success';
    onConfirm: () => void;
  } | null>(null);

  // Active technician (defaults to first active on-duty tech or first tech)
  const currentTech = useMemo(() => {
    return technicians.find(t => t.isOnDutyToday) || technicians[0] || {
      id: 't-1',
      name: 'ช่างสมชาย (หัวหน้าช่าง)',
      role: 'หัวหน้าฝ่ายซ่อมบำรุง',
      phone: '081-234-5678'
    };
  }, [technicians]);

  // Dynamic metrics computed from real tickets prop
  const pendingOrAssignedCount = useMemo(() => 
    tickets.filter(t => t.status === 'pending' || t.status === 'assigned').length, [tickets]);
  const inProgressCount = useMemo(() => 
    tickets.filter(t => t.status === 'in_progress').length, [tickets]);
  const waitingPartsCount = useMemo(() => 
    tickets.filter(t => t.status === 'waiting_parts').length, [tickets]);
  const completedCount = useMemo(() => 
    tickets.filter(t => t.status === 'completed').length, [tickets]);

  // Dynamic filter by activeTab
  const tabFilteredTasks = useMemo(() => {
    if (activeTab === 'today') {
      return tickets.filter(t => t.status === 'pending' || t.status === 'assigned' || t.status === 'in_progress');
    } else if (activeTab === 'waiting') {
      return tickets.filter(t => t.status === 'waiting_parts' || t.status === 'waiting_inspect');
    } else {
      return tickets.filter(t => t.status === 'completed' || t.status === 'cancelled');
    }
  }, [tickets, activeTab]);

  // Distinct departments in tickets for filter
  const availableDepts = useMemo(() => {
    const set = new Set(tickets.map(t => t.department).filter(Boolean));
    return Array.from(set);
  }, [tickets]);

  // Final filtered list
  const finalTasks = useMemo(() => {
    if (selectedZone === 'all') return tabFilteredTasks;
    return tabFilteredTasks.filter(t => t.department === selectedZone);
  }, [tabFilteredTasks, selectedZone]);

  const handleAcceptWork = (ticket: Ticket) => {
    setConfirmConfig({
      isOpen: true,
      title: 'ยืนยันการรับงานซ่อม',
      message: `คุณต้องการรับงาน #${ticket.requestId} ("${ticket.title}") เข้าสู่สถานะกำลังดำเนินการ ใช่หรือไม่?`,
      confirmText: 'ยืนยันรับงาน',
      cancelText: 'ยกเลิก',
      confirmVariant: 'primary',
      onConfirm: async () => {
        setAcceptingId(ticket.id);
        setConfirmConfig(null);
        try {
          await onUpdateTicketStatus(ticket.id, {
            status: 'in_progress',
            technicianName: currentTech.name,
            technicianPhone: currentTech.phone || '081-234-5678',
            remark: 'ช่างกดรับงานแล้ว กำลังเข้าตรวจสอบหน้างาน'
          });
        } finally {
          setAcceptingId(null);
        }
      }
    });
  };

  const handleCompleteWork = (ticket: Ticket) => {
    setConfirmConfig({
      isOpen: true,
      title: 'ยืนยันส่งตรวจรับงานซ่อม',
      message: `ยืนยันว่าการซ่อมใบงาน #${ticket.requestId} เสร็จสิ้นแล้ว และส่งมอบให้ผู้ตรวจรับ ใช่หรือไม่?`,
      confirmText: 'ส่งตรวจรับงาน',
      cancelText: 'ยกเลิก',
      confirmVariant: 'success',
      onConfirm: async () => {
        setConfirmConfig(null);
        await onUpdateTicketStatus(ticket.id, {
          status: 'waiting_inspect',
          repairResult: ticket.repairResult || 'ดำเนินการแก้ไขเสร็จสิ้น ทดสอบการใช้งานปกติ'
        });
      }
    });
  };

  const handleDeclineWork = (ticket: Ticket) => {
    setConfirmConfig({
      isOpen: true,
      title: 'ยืนยันการส่งต่องาน',
      message: `คุณต้องการส่งต่องานซ่อม #${ticket.requestId} กลับเข้าคิวส่วนกลางเพื่อให้ช่างท่านอื่นรับงาน ใช่หรือไม่?`,
      confirmText: 'ส่งต่องาน',
      cancelText: 'ยกเลิก',
      confirmVariant: 'warning',
      onConfirm: async () => {
        setConfirmConfig(null);
        await onUpdateTicketStatus(ticket.id, {
          status: 'pending',
          remark: 'ช่างส่งต่องานกลับเข้าคิวส่วนกลาง'
        });
      }
    });
  };

  return (
    <div className="flex flex-col w-full pb-20">
      
      {/* 1. Header Profile & Real-Time Counters */}
      <header className="px-margin pt-3">
        <div className="rounded-3xl bg-gradient-to-br from-primary via-primary to-primary-container p-space-md text-white shadow-lg border border-primary-fixed/30">
          <div className="flex items-center gap-space-sm">
            <div className="relative shrink-0">
              {currentTech.avatarUrl ? (
                <img
                  src={currentTech.avatarUrl}
                  alt={currentTech.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-white/40 shadow-inner"
                />
              ) : (
                <span className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center font-bold text-xl shadow-inner border border-white/20">
                  {currentTech.name.slice(4, 5) || currentTech.name.slice(0, 1) || 'ช'}
                </span>
              )}
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 ring-2 ring-primary"></span>
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-headline-sm text-headline-sm text-on-primary tracking-tight truncate font-bold">
                  {currentTech.name}
                </h1>
                <span className="font-label-sm text-xs px-2.5 py-0.5 rounded-full bg-white/20 text-white font-semibold">
                  {currentTech.phone || '081-234-5678'}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-primary-fixed truncate mt-0.5">
                {currentTech.role}
              </p>
              <div className="mt-1 flex items-center gap-1 text-secondary-fixed text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>สถานะ: พร้อมปฏิบัติงาน (On Duty)</span>
              </div>
            </div>
          </div>

          {/* Real-time Dynamic Metrics Counters */}
          <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/15 text-center">
            <div className="flex flex-col items-center">
              <span className="font-headline-sm text-lg sm:text-xl text-amber-300 font-extrabold">
                {pendingOrAssignedCount}
              </span>
              <span className="text-[11px] text-primary-fixed font-medium">รอรับงาน</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-headline-sm text-lg sm:text-xl text-emerald-300 font-extrabold">
                {inProgressCount}
              </span>
              <span className="text-[11px] text-primary-fixed font-medium">กำลังทำ</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-headline-sm text-lg sm:text-xl text-orange-300 font-extrabold">
                {waitingPartsCount}
              </span>
              <span className="text-[11px] text-primary-fixed font-medium">รออะไหล่</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-headline-sm text-lg sm:text-xl text-white font-extrabold">
                {completedCount}
              </span>
              <span className="text-[11px] text-primary-fixed font-medium">เสร็จสิ้น</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Dynamic Segmented Tabs */}
      <section className="px-margin py-3">
        <div className="flex items-center p-1.5 rounded-2xl bg-surface-container-low border border-slate-200 gap-1 shadow-xs">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'today'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            <span>งานที่ต้องทำ</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
              activeTab === 'today' ? 'bg-white text-primary' : 'bg-surface-container-high text-on-surface'
            }`}>
              {pendingOrAssignedCount + inProgressCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('waiting')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'waiting'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            <span>รออะไหล่ / รอตรวจ</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
              activeTab === 'waiting' ? 'bg-white text-primary' : 'bg-surface-container-high text-on-surface'
            }`}>
              {waitingPartsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            <span>งานเสร็จสิ้น</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
              activeTab === 'history' ? 'bg-white text-primary' : 'bg-surface-container-high text-on-surface'
            }`}>
              {completedCount}
            </span>
          </button>
        </div>
      </section>

      {/* 3. Zone Pill Filter (Dynamic from tickets) */}
      {availableDepts.length > 0 && (
        <section className="py-1 px-margin overflow-x-auto no-scrollbar flex items-center gap-2">
          <button
            onClick={() => setSelectedZone('all')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xs transition-all cursor-pointer ${
              selectedZone === 'all'
                ? 'bg-primary text-white font-bold'
                : 'bg-surface-container-lowest border border-slate-200 text-on-surface hover:bg-surface-container'
            }`}
            type="button"
          >
            ทุกแผนก ({tabFilteredTasks.length})
          </button>
          {availableDepts.map(dept => {
            const cnt = tabFilteredTasks.filter(t => t.department === dept).length;
            return (
              <button
                key={dept}
                onClick={() => setSelectedZone(dept)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xs transition-all cursor-pointer ${
                  selectedZone === dept
                    ? 'bg-primary text-white font-bold'
                    : 'bg-surface-container-lowest border border-slate-200 text-on-surface hover:bg-surface-container'
                }`}
                type="button"
              >
                {dept} ({cnt})
              </button>
            );
          })}
        </section>
      )}

      {/* 4. Real Tasks Feed (Clean Slate when empty) */}
      <div className="px-margin flex flex-col gap-3.5 mt-2">
        {finalTasks.length === 0 ? (
          <div className="p-12 text-center bg-surface-container-lowest rounded-3xl border border-dashed border-slate-300 text-on-surface-variant flex flex-col items-center gap-3 my-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-fixed/30 text-primary flex items-center justify-center">
              <Wrench className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-on-surface">
              ไม่มีงานซ่อมค้างในหน้านี้
            </h3>
            <p className="text-xs text-on-surface-variant max-w-sm">
              ข้อมูลเดโม่ถูกเคลียร์ออกเรียบร้อยแล้ว เมื่อแผนกต่างๆ แจ้งงานซ่อมเข้ามา รายการงานจะปรากฏที่นี่ทันที
            </p>
          </div>
        ) : (
          finalTasks.map(ticket => {
            const isPending = ticket.status === 'pending' || ticket.status === 'assigned';
            const isInProgress = ticket.status === 'in_progress';
            const isWaitingParts = ticket.status === 'waiting_parts';
            const isCritical = ticket.priority === 'critical' || ticket.priority === 'high';

            return (
              <article 
                key={ticket.id}
                className="relative overflow-hidden rounded-3xl bg-surface-container-lowest shadow-xs hover:shadow-md p-4 sm:p-5 border border-slate-200/80 transition-all flex flex-col gap-3"
              >
                {/* Left urgency colored stripe */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  isCritical ? 'bg-red-500' : isInProgress ? 'bg-emerald-500' : 'bg-amber-500'
                }`}></div>

                {/* Card Top: Request ID, Priority, Date */}
                <div className="pl-1.5 flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-primary bg-primary-fixed/40 px-2.5 py-1 rounded-full">
                      #{ticket.requestId}
                    </span>
                    {isCritical && (
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-[11px] border border-red-200 animate-pulse">
                        ด่วนมาก
                      </span>
                    )}
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface">
                      {ticket.department}
                    </span>
                  </div>

                  <span className="text-[11px] text-on-surface-variant flex items-center gap-1 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(ticket.createdAt).toLocaleDateString('th-TH', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                {/* Title & Location */}
                <div className="pl-1.5">
                  <h2 className="font-bold text-sm sm:text-base text-on-surface leading-tight">
                    {ticket.title}
                  </h2>
                  <div className="flex items-center gap-1.5 text-on-surface-variant text-xs mt-1">
                    <span className="material-symbols-outlined text-[16px] text-primary">pin_drop</span>
                    <span className="font-semibold text-on-surface">{ticket.location}</span>
                  </div>
                  {ticket.description && (
                    <p className="text-xs text-on-surface-variant bg-surface-container-low p-2.5 rounded-xl mt-2">
                      {ticket.description}
                    </p>
                  )}
                </div>

                {/* Requester Info */}
                <div className="pl-1.5 flex items-center justify-between text-xs text-on-surface-variant pt-1 border-t border-slate-100 flex-wrap gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">ผู้แจ้ง:</span>
                    <strong className="text-on-surface">{ticket.requesterName}</strong>
                    {ticket.requesterPhone && (
                      <a href={`tel:${ticket.requesterPhone}`} className="text-primary font-bold ml-1 hover:underline">
                        ({ticket.requesterPhone})
                      </a>
                    )}
                  </div>

                  {ticket.technicianName && (
                    <div className="flex items-center gap-1.5 text-[11px] text-primary font-semibold">
                      {(() => {
                        const tech = technicians.find(t => t.name.toLowerCase() === ticket.technicianName?.toLowerCase());
                        if (tech?.avatarUrl) {
                          return <img src={tech.avatarUrl} alt={tech.name} className="w-4 h-4 rounded-full object-cover border border-primary/30" />;
                        }
                        return null;
                      })()}
                      <span>ช่าง: {ticket.technicianName}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pl-1.5 grid grid-cols-2 gap-2 pt-1">
                  {isPending ? (
                    <button
                      type="button"
                      disabled={acceptingId === ticket.id}
                      onClick={() => handleAcceptWork(ticket)}
                      className="col-span-2 py-3 bg-primary hover:bg-primary-container text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <Check className="w-4 h-4" />
                      <span>{acceptingId === ticket.id ? 'กำลังบันทึก...' : 'แตะเพื่อรับงาน (Accept Work)'}</span>
                    </button>
                  ) : isInProgress ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onOpenPartsModal(ticket)}
                        className="py-2.5 bg-surface-container hover:bg-surface-container-high text-primary rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Package className="w-4 h-4" />
                        <span>เบิกอะไหล่ / บันทึกผล</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCompleteWork(ticket)}
                        className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-98"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>ส่งตรวจรับงาน</span>
                      </button>
                    </>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => onSelectTicket(ticket)}
                    className="col-span-2 py-2 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>ดูรายละเอียดใบงานแบบเต็ม</span>
                  </button>
                </div>

              </article>
            );
          })
        )}
      </div>

      {/* 5. Floating Bottom Help Actions */}
      <aside className="fixed bottom-24 right-4 z-40 flex items-center gap-2">
        <button
          onClick={onOpenSOSModal}
          className="h-11 px-3.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
          type="button"
        >
          <AlertCircle className="w-4 h-4" />
          <span>SOS ฉุกเฉิน</span>
        </button>

        <button
          onClick={onOpenFarmMap}
          className="w-11 h-11 rounded-full bg-primary hover:bg-primary-container text-white flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer"
          type="button"
          title="เปิดแผนที่โซนฟาร์ม"
        >
          <span className="material-symbols-outlined text-[20px]">near_me</span>
        </button>
      </aside>

      {/* Confirmation Dialog */}
      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmText={confirmConfig.confirmText}
          cancelText={confirmConfig.cancelText}
          confirmVariant={confirmConfig.confirmVariant}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
        />
      )}

    </div>
  );
};
