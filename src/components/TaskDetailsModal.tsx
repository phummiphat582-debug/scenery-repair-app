import React, { useState } from 'react';
import { Ticket, Technician, PartItem } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { AcceptWorkModal } from './AcceptWorkModal';
import { CompleteWorkModal } from './CompleteWorkModal';
import { DivisionBadge } from './DivisionBadge';
import { getDivisionInfo } from '../data/divisionData';
import { Clock } from 'lucide-react';
import { getTicketAgingInfo } from '../lib/ticketAging';

interface TaskDetailsModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  technicians: Technician[];
  onUpdateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>;
  onOpenPartsModal?: (ticket?: Ticket) => void;
  onDeleteTicket?: (id: string) => Promise<void>;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  ticket,
  isOpen,
  onClose,
  technicians,
  onUpdateTicket,
  onOpenPartsModal,
  onDeleteTicket
}) => {
  if (!isOpen || !ticket) return null;

  const assignedTechnician = technicians.find(
    technician => technician.name.toLowerCase() === (ticket.technicianName || '').toLowerCase()
  );
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [currentTechName, setCurrentTechName] = useState(assignedTechnician?.name || '');
  const [currentTechPhone, setCurrentTechPhone] = useState(
    assignedTechnician?.phone || ''
  );
  const [isDeletePromptOpen, setIsDeletePromptOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmAcceptWork = async (ticketId: string, technicianName: string, technicianPhone?: string) => {
    setCurrentTechName(technicianName);
    if (technicianPhone) setCurrentTechPhone(technicianPhone);
    await onUpdateTicket(ticketId, {
      requestId: ticket.requestId,
      status: 'in_progress',
      technicianName,
      technicianPhone: technicianPhone || '',
      remark: `ช่าง ${technicianName} กดรับงานแล้ว กำลังดำเนินการ`
    });
  };

  const handleConfirmCompleteWork = async (
    ticketId: string,
    data: {
      requestId?: string;
      technicianName?: string;
      technicianPhone?: string;
      diagnosticReason: string;
      actionSteps: string;
      repairResult: string;
      parts: PartItem[];
      resultImageUrl?: string;
    }
  ) => {
    const finalTechName = data.technicianName || ticket.technicianName || '';
    const finalTechPhone = data.technicianPhone || ticket.technicianPhone || '';
    await onUpdateTicket(ticketId, {
      requestId: data.requestId || ticket.requestId,
      status: 'completed',
      technicianName: finalTechName,
      technicianPhone: finalTechPhone,
      diagnosticReason: data.diagnosticReason,
      actionSteps: data.actionSteps,
      repairResult: data.repairResult,
      parts: data.parts,
      resultImageUrl: data.resultImageUrl,
      completedAt: new Date().toISOString(),
      remark: `ช่าง ${finalTechName} บันทึกจบงานซ่อมเรียบร้อย`
    });
    onClose();
  };

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: 'primary' | 'danger' | 'warning' | 'success';
    onConfirm: () => void;
  } | null>(null);

  const isEmergency = ticket.priority === 'critical' || ticket.priority === 'high';
  const aging = getTicketAgingInfo(ticket);
  const requestImageUrl = ticket.requestImageUrl && ticket.requestImageUrl !== '-'
    ? ticket.requestImageUrl
    : '';
  const createdAtText = new Date(ticket.createdAt).toLocaleString('th-TH', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  const statusLabels: Record<string, string> = {
    pending: 'รอช่างรับงาน', assigned: 'รับงานแล้ว', received: 'รับงานแล้ว',
    in_progress: 'กำลังดำเนินการ', waiting_parts: 'รออะไหล่',
    waiting_inspect: 'รอตรวจรับ', completed: 'เสร็จสิ้น', cancelled: 'ยกเลิก'
  };

  const handleDeleteTicket = async () => {
    if (deletePassword !== '1234') {
      setDeleteError('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      return;
    }
    if (!onDeleteTicket) return;
    setIsDeleting(true);
    try {
      await onDeleteTicket(ticket.id);
      setIsDeletePromptOpen(false);
      onClose();
    } finally {
      setIsDeleting(false);
      setDeletePassword('');
      setDeleteError('');
    }
  };

  // Step mapping - Only 4 core steps: 1. รอช่างรับงาน, 2. รับงานแล้ว, 3. รออะไหล่, 4. เสร็จสิ้น
  const steps = [
    { id: 'pending', label: '1. รอรับงาน', sub: 'รอช่างกดรับ' },
    { id: 'in_progress', label: '2. รับงานแล้ว', sub: 'กำลังดำเนินการ' },
    { id: 'waiting_parts', label: '3. รออะไหล่', sub: 'สั่งซื้อ/รอของ' },
    { id: 'completed', label: '4. เสร็จสิ้น', sub: 'ปิดงานเรียบร้อย' }
  ];

  let currentStepIndex = 1; // in_progress default
  if (ticket.status === 'pending') currentStepIndex = 0;
  else if (ticket.status === 'assigned' || ticket.status === 'in_progress') currentStepIndex = 1;
  else if (ticket.status === 'waiting_parts') currentStepIndex = 2;
  else if (ticket.status === 'waiting_inspect' || ticket.status === 'completed') currentStepIndex = 3;

  const handleStatusChange = (newStatus: any, alertText: string) => {
    let confirmMsg = `คุณต้องการบันทึกสถานะงานเป็น "${alertText}" ใช่หรือไม่?`;
    let confirmBtn = 'ยืนยันเปลี่ยนสถานะ';
    let variant: 'primary' | 'danger' | 'warning' | 'success' = 'primary';

    if (newStatus === 'completed') {
      confirmMsg = `ยืนยันว่าการซ่อมงาน #${ticket.requestId} ("${ticket.title}") เสร็จสิ้นสมบูรณ์แล้ว รายการนี้จะถูกย้ายไปที่แท็บ "✅ เสร็จสิ้น"`;
      confirmBtn = 'ยืนยันปิดงานซ่อม';
      variant = 'success';
    } else if (newStatus === 'cancelled') {
      confirmMsg = `คุณต้องการยกเลิกใบงาน #${ticket.requestId} ใช่หรือไม่? รายการนี้จะถูกย้ายไปที่แท็บ "🚫 ยกเลิกแล้ว"`;
      confirmBtn = 'ยืนยันยกเลิกใบงาน';
      variant = 'danger';
    } else if (newStatus === 'in_progress') {
      confirmMsg = `คุณต้องการรับงาน #${ticket.requestId} เข้าสู่สถานะ "🔧 กำลังซ่อม" ใช่หรือไม่?`;
      confirmBtn = 'ยืนยันเริ่มงาน';
      variant = 'primary';
    } else if (newStatus === 'waiting_parts') {
      confirmMsg = `คุณต้องการพักงาน #${ticket.requestId} เพื่อรออะไหล่/อุปกรณ์ ใช่หรือไม่? รายการจะแสดงที่แท็บ "📦 รออะไหล่"`;
      confirmBtn = 'ยืนยันพักรออะไหล่';
      variant = 'warning';
    }

    setConfirmConfig({
      isOpen: true,
      title: newStatus === 'completed' ? 'ยืนยันการปิดงานซ่อม' : (newStatus === 'cancelled' ? 'ยืนยันการยกเลิกใบงาน' : 'ยืนยันการเปลี่ยนสถานะใบงาน'),
      message: confirmMsg,
      confirmText: confirmBtn,
      cancelText: 'ย้อนกลับ',
      confirmVariant: variant,
      onConfirm: async () => {
        const updates: Partial<Ticket> = { requestId: ticket.requestId, status: newStatus };
        if (newStatus === 'completed') {
          updates.completedAt = new Date().toISOString();
        }
        await onUpdateTicket(ticket.id, updates);
        setConfirmConfig(null);
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center items-center overflow-y-auto">
      <div className="w-full max-w-2xl bg-surface rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto border border-slate-200/50">
        
        {/* Header Bar */}
        <div className="h-16 px-gutter flex items-center justify-between bg-surface-container-lowest border-b border-slate-200/50 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              aria-label="ปิด"
              className="w-10 h-10 flex items-center justify-center text-on-surface rounded-full hover:bg-surface-container transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              รายละเอียดใบงาน #{ticket.requestId}
            </h3>
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
            SCENERY FARM
          </span>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-gutter flex flex-col gap-4 pb-12">
          
          {/* Top Incident Summary Card */}
          <div className="p-gutter flex flex-col gap-space-sm bg-surface-container-lowest rounded-2xl shadow-sm border border-slate-200/40">
            <div className="flex items-center justify-between gap-space-xs">
              <div className="flex items-center gap-space-xs min-w-0 flex-wrap">
                <span className="font-label-md text-label-md text-primary bg-primary-fixed px-2.5 py-1 rounded-full font-semibold">
                  #{ticket.requestId}
                </span>
                <DivisionBadge division={ticket.division} size="sm" />
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${aging.badgeClass}`} title={aging.label}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>{aging.label}</span>
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  {createdAtText}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {isEmergency && (
                  <span className="inline-flex items-center gap-1 bg-error-container text-on-error-container px-2.5 py-1 rounded-full font-label-sm text-label-sm font-bold animate-pulse">
                    <span className="material-symbols-outlined text-[14px]">priority_high</span>
                    ด่วนมาก
                  </span>
                )}
                <span className="inline-flex items-center gap-1 bg-primary-container text-on-primary px-2.5 py-1 rounded-full font-label-sm text-label-sm font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed"></span>
                  {statusLabels[ticket.status] || ticket.status}
                </span>
              </div>
            </div>

            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface leading-snug font-bold">
                {ticket.title}
              </h2>
              <div className="flex items-center gap-1.5 text-on-surface-variant mt-1 font-body-sm text-body-sm">
                <span className="material-symbols-outlined text-[18px] text-secondary">location_on</span>
                <span>{ticket.location}</span>
              </div>
            </div>
          </div>

          {/* Workflow Progress Status - Clear, Spacious, Never Clipped */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[20px]">alt_route</span>
                </span>
                <div>
                  <h4 className="font-bold text-sm text-on-surface">ขั้นตอนสถานะใบงาน</h4>
                  <p className="text-[11px] text-on-surface-variant">ความคืบหน้าของงานซ่อมบำรุง</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 bg-primary text-on-primary px-3 py-1 rounded-full text-xs font-bold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                <span>{statusLabels[ticket.status] || ticket.status}</span>
              </span>
            </div>

            {/* Visual Step Indicator Cards - 4 Core Steps: 1, 3, 4, 6 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {steps.map((s, idx) => {
                const isPassed = idx < currentStepIndex;
                const isActive = idx === currentStepIndex;
                return (
                  <div
                    key={s.id}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                      isActive
                        ? 'bg-primary text-white border-primary shadow-md font-bold ring-2 ring-primary/30 scale-[1.02]'
                        : isPassed
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200 font-semibold'
                        : 'bg-surface-container-low text-on-surface-variant border-slate-200/60'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 text-xs font-bold ${
                      isActive
                        ? 'bg-white text-primary shadow-xs'
                        : isPassed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}>
                      {isPassed ? (
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>
                    <span className="text-xs font-bold leading-tight">{s.label}</span>
                    <span className={`text-[10px] mt-0.5 ${isActive ? 'text-white/80' : 'text-on-surface-variant'}`}>
                      {s.sub}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 1: Reporter Details */}
          <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-3 border border-slate-200/40">
            <div className="flex items-center justify-between">
              <span className="font-label-lg text-label-lg text-on-surface flex items-center gap-2 font-bold">
                <span className="material-symbols-outlined text-[20px] text-primary">person_pin</span>
                ข้อมูลผู้แจ้งซ่อม
              </span>
              {ticket.requesterPhone ? <a
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container text-on-surface rounded-full font-label-sm text-label-sm active:bg-surface-variant cursor-pointer font-semibold"
                href={`tel:${ticket.requesterPhone}`}
              >
                <span className="material-symbols-outlined text-[16px] text-primary">call</span>
                โทรด่วน
              </a> : <span className="text-xs text-slate-400">ไม่ได้ระบุเบอร์โทร</span>}
            </div>
            <div className="flex items-center gap-3 pt-1">
              <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed font-bold text-headline-sm shrink-0 shadow-inner">
                {ticket.requesterName ? ticket.requesterName.slice(0, 1) : 'ผ'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-headline-sm text-headline-sm text-on-surface truncate leading-tight font-bold">
                  {ticket.requesterName || 'ไม่ระบุชื่อผู้แจ้ง'}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {ticket.department} • โทร {ticket.requesterPhone || 'ไม่ได้ระบุเบอร์โทร'}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Division & Work Scope */}
          <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-2.5 border border-slate-200/40">
            <div className="flex items-center justify-between">
              <span className="font-label-lg text-label-lg text-on-surface flex items-center gap-2 font-bold">
                <span className="material-symbols-outlined text-[20px] text-primary">diversity_3</span>
                สายงานที่รับผิดชอบ
              </span>
              <DivisionBadge division={ticket.division} size="md" />
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low text-xs text-on-surface-variant">
              <div className="font-bold text-on-surface text-sm mb-0.5">
                {getDivisionInfo(ticket.division).name}
              </div>
              <p className="leading-relaxed">
                {getDivisionInfo(ticket.division).description}
              </p>
            </div>
          </div>

          {/* Section 2: Issue Photos */}
          <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-3 border border-slate-200/40">
            <div className="flex items-center justify-between">
              <span className="font-label-lg text-label-lg text-on-surface flex items-center gap-2 font-bold">
                <span className="material-symbols-outlined text-[20px] text-primary">photo_library</span>
                {requestImageUrl ? 'ภาพที่ผู้แจ้งแนบ' : 'ยังไม่มีภาพที่ผู้แจ้งแนบ'}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">บันทึกตอนแจ้งงาน</span>
            </div>
            {requestImageUrl ? (
              <div className="relative rounded-lg overflow-hidden bg-surface-container shadow-sm group">
                <img
                  alt="ภาพที่ผู้แจ้งแนบ"
                  className="w-full max-h-72 object-contain bg-surface-container transition-transform duration-300 group-hover:scale-105"
                  src={requestImageUrl}
                />
                <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="font-label-sm text-label-sm text-white font-medium truncate">ภาพที่แนบมากับใบแจ้งงาน</p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                <span className="material-symbols-outlined text-[32px] text-slate-400">image_not_supported</span>
                <p className="mt-1 font-semibold">ผู้แจ้งยังไม่ได้แนบรูปภาพ</p>
              </div>
            )}
          </div>

          {/* Section 2.1: After-Repair Photo (ภาพถ่ายหลังการแก้ไข) */}
          {ticket.resultImageUrl && (
            <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-3 border border-emerald-300">
              <div className="flex items-center justify-between">
                <span className="font-label-lg text-label-lg text-emerald-800 flex items-center gap-2 font-bold">
                  <span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span>
                  ภาพถ่ายหลังการซ่อม / แก้ไข
                </span>
                <span className="font-label-sm text-label-sm text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full font-bold">
                  ซ่อมเสร็จสมบูรณ์
                </span>
              </div>
              <div className="relative rounded-lg overflow-hidden bg-surface-container shadow-sm group">
                <img
                  alt="ภาพหลังการซ่อมแก้ไข"
                  className="w-full max-h-72 object-contain bg-surface-container transition-transform duration-300 group-hover:scale-105"
                  src={ticket.resultImageUrl}
                />
                <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="font-label-sm text-label-sm text-white font-medium truncate">ภาพยืนยันหลังการซ่อมเสร็จสิ้น</p>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Technician In Charge / Self-service Acceptance */}
          <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-3 border border-slate-200/40">
            <div className="flex items-center justify-between">
              <span className="font-label-lg text-label-lg text-on-surface flex items-center gap-2 font-bold">
                <span className="material-symbols-outlined text-[20px] text-primary">engineering</span>
                ช่างผู้รับงาน
              </span>
              {currentTechName && (
                <button
                  className="px-2.5 py-1 bg-surface-container text-on-surface rounded-md font-label-sm text-label-sm hover:bg-surface-container-high transition-colors cursor-pointer font-semibold"
                  onClick={() => setIsAcceptModalOpen(true)}
                  type="button"
                >
                  เปลี่ยนช่างรับงาน
                </button>
              )}
            </div>
            {currentTechName ? (
              (() => {
                const matchedTech = technicians.find(t => t.name.toLowerCase() === currentTechName.toLowerCase());
                return (
                  <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg">
                    <div className="relative shrink-0">
                      {matchedTech?.avatarUrl ? (
                        <img
                          alt={currentTechName}
                          className="w-12 h-12 rounded-2xl object-cover shadow-sm ring-2 ring-primary-fixed"
                          src={matchedTech.avatarUrl}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-base shadow-sm">
                          {currentTechName.slice(4, 5) || currentTechName.slice(0, 1) || 'ช'}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-white"></span>
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-headline-sm text-headline-sm truncate font-bold text-on-surface">
                          {currentTechName}
                        </span>
                        <span
                          className="material-symbols-outlined text-[16px] text-primary"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          verified
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          รับงานแล้ว
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                        {matchedTech?.role || 'ช่างเทคนิค'} • {ticket.department || 'ทีมซ่อมบำรุง'}
                      </span>
                      {currentTechPhone ? (
                        <div className="flex items-center gap-2 mt-1">
                          <a
                            href={`tel:${currentTechPhone}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-fixed text-on-primary-fixed font-bold text-xs rounded-full hover:bg-primary hover:text-on-primary transition-colors"
                            title="กดโทรออกทันที"
                          >
                            <span className="material-symbols-outlined text-[14px]">call</span>
                            {currentTechPhone} (โทรออก)
                          </a>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 mt-0.5">
                          (ยังไม่มีเบอร์โทรช่าง)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="flex flex-col items-center justify-center p-4 bg-amber-50/80 border border-amber-200/80 rounded-xl text-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[24px]">touch_app</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">ยังไม่มีช่างรับงานนี้</h4>
                  <p className="text-xs text-slate-500 mt-0.5">ไม่ต้องรอมอบหมาย ช่างคนใดสะดวกสามารถกดรับงานได้เองเลย</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAcceptModalOpen(true)}
                  className="mt-1 px-4 py-2.5 bg-primary hover:bg-primary-container text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>กดรับงานเองเลย (ลงชื่อช่าง)</span>
                </button>
              </div>
            )}
          </div>

          {/* Section 4: Parts Management */}
          <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-3 border border-slate-200/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">inventory_2</span>
                <span className="font-label-lg text-label-lg text-on-surface font-bold">
                  รายการอะไหล่และอุปกรณ์ที่ใช้
                </span>
              </div>
              {ticket.parts && ticket.parts.length > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {ticket.parts.length} รายการ
                </span>
              )}
            </div>

            {ticket.parts && ticket.parts.length > 0 ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 space-y-2">
                <div className="text-xs font-bold text-emerald-800 mb-1">
                  อะไหล่ที่เปลี่ยนในงานนี้:
                </div>
                <div className="divide-y divide-emerald-100">
                  {ticket.parts.map((p, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-800">{p.name}</span>
                      </div>
                      <div className="font-bold text-emerald-700">
                        {p.quantity} {p.unit || 'ชิ้น'}
                        {p.cost ? ` (${p.cost.toLocaleString()} บ.)` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                <span className="material-symbols-outlined text-[30px] text-slate-400">inventory_2</span>
                <p className="mt-1 font-semibold">ยังไม่มีรายการอะไหล่ที่บันทึก</p>
              </div>
            )}

            <button
              onClick={() => {
                if (onOpenPartsModal) onOpenPartsModal(ticket);
                else alert('เปิดหน้าจอเบิกอะไหล่จากคลังกลางฟาร์มเดอะซีนเนอรี่');
              }}
              className="w-full py-2.5 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer font-semibold"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">add_circle</span>
              + เบิกอะไหล่เพิ่มจากคลังกลาง
            </button>
          </div>

          {/* Section 5: Technician Repair Notes */}
          <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-3 border border-slate-200/40">
            <span className="font-label-lg text-label-lg text-on-surface flex items-center gap-2 font-bold">
              <span className="material-symbols-outlined text-[20px] text-primary">edit_note</span>
              บันทึกการวิเคราะห์และวิธีแก้ไข
            </span>

            <div className="flex flex-col gap-1">
              <label className="font-label-md text-label-md text-on-surface-variant font-semibold">
                สาเหตุของปัญหาที่ตรวจพบ
              </label>
              <div className="p-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md">
                {ticket.diagnosticReason || ticket.description || 'ยังไม่มีรายละเอียดอาการที่บันทึก'}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-md text-label-md text-on-surface-variant font-semibold">
                ขั้นตอนและวิธีดำเนินการแก้ไข
              </label>
              <div className="p-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md whitespace-pre-line">
                {ticket.actionSteps || ticket.repairResult || 'ยังไม่มีบันทึกขั้นตอนการแก้ไข'}
              </div>
            </div>
          </div>

          {/* Section 6: Quick Action Status Buttons */}
          <div className="flex flex-col gap-2.5 pt-2">
            {(ticket.status === 'pending' || !currentTechName) && ticket.status !== 'completed' && ticket.status !== 'cancelled' && (
              <button
                onClick={() => setIsAcceptModalOpen(true)}
                className="w-full h-12 rounded-xl bg-primary hover:bg-primary-container text-white font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer font-bold"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">touch_app</span>
                กดรับงานเองเลย (ลงชื่อช่าง)
              </button>
            )}

            {ticket.status !== 'completed' && ticket.status !== 'cancelled' && (
              <button
                onClick={() => setIsCompleteModalOpen(true)}
                className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer font-bold"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                บันทึกซ่อมเสร็จ / จบงาน (ลงสาเหตุ, วิธีแก้, อะไหล่, รูป)
              </button>
            )}

            {ticket.status === 'in_progress' && (
              <button
                onClick={() => handleStatusChange('waiting_parts', 'บันทึกสถานะรออะไหล่เรียบร้อย')}
                className="w-full h-11 rounded-xl bg-secondary-container hover:bg-secondary text-on-secondary-container font-label-md text-label-md flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer font-bold"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
                ขอเบิกอะไหล่ / พักรองาน (Waiting Parts)
              </button>
            )}

            {ticket.status === 'waiting_parts' && (
              <button
                onClick={() => handleStatusChange('in_progress', 'ได้รับอะไหล่แล้ว กลับมาดำเนินการต่อ')}
                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-label-md text-label-md flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer font-bold"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">build</span>
                ได้รับอะไหล่แล้ว (เริ่มซ่อมต่อ)
              </button>
            )}

            {ticket.status === 'completed' && (
              <button
                onClick={() => handleStatusChange('in_progress', 'เปิดงานซ่อมใหม่')}
                className="w-full h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-label-md text-label-md flex items-center justify-center gap-2 transition-colors cursor-pointer font-bold"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">replay</span>
                เปิดงานซ่อมใหม่ (Reopen Ticket)
              </button>
            )}

            <button
              onClick={() => handleStatusChange('cancelled', 'ยกเลิกใบงานซ่อมนี้')}
              className="w-full h-10 rounded-xl bg-surface-container hover:bg-surface-container-high text-error font-label-md text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer font-semibold"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">cancel</span>
              ขอยกเลิกใบงานซ่อมนี้
            </button>

            {onDeleteTicket && (
              <button
                onClick={() => { setDeletePassword(''); setDeleteError(''); setIsDeletePromptOpen(true); }}
                className="w-full h-11 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-label-md text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer font-bold mt-1 shadow-xs"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                ลบรายการแจ้งซ่อม
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Confirmation Modal */}
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

      {isDeletePromptOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-rose-200" role="dialog" aria-modal="true">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[28px]">delete_forever</span>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold">ยืนยันการลบรายการแจ้งซ่อม</h3>
                <p className="text-sm text-slate-600 mt-0.5">การลบรายการนี้ไม่สามารถกู้คืนได้</p>
              </div>
            </div>
            <label className="block mt-5 text-sm font-bold text-slate-700" htmlFor="delete-password">
              ใส่รหัสผ่าน 4 หลัก เพื่อยืนยันการลบ:
            </label>
            <input
              id="delete-password"
              type="password"
              inputMode="numeric"
              autoFocus
              value={deletePassword}
              onChange={(event) => { setDeletePassword(event.target.value); setDeleteError(''); }}
              onKeyDown={(event) => { if (event.key === 'Enter') void handleDeleteTicket(); }}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-xl tracking-[0.4em] text-center font-bold outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
              placeholder="••••"
              maxLength={4}
            />
            {deleteError && <p className="mt-2 text-sm font-semibold text-rose-600 text-center">{deleteError}</p>}
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setIsDeletePromptOpen(false)} className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 cursor-pointer" disabled={isDeleting}>ยกเลิก</button>
              <button type="button" onClick={() => void handleDeleteTicket()} className="flex-1 rounded-xl bg-rose-600 py-3 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60 cursor-pointer shadow-xs" disabled={isDeleting}>
                {isDeleting ? 'กำลังลบ...' : 'ยืนยันลบรายการ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Self-Service Accept Work Modal */}
      <AcceptWorkModal
        isOpen={isAcceptModalOpen}
        onClose={() => setIsAcceptModalOpen(false)}
        ticket={ticket}
        technicians={technicians}
        onConfirmAccept={handleConfirmAcceptWork}
      />

      {/* Detailed Completion Record Modal */}
      <CompleteWorkModal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        ticket={ticket}
        technicians={technicians}
        onConfirmComplete={handleConfirmCompleteWork}
      />
    </div>
  );
};
