import React, { useState } from 'react';
import { Ticket, Technician } from '../types';
import { AssignTechnicianModal } from './AssignTechnicianModal';
import { ConfirmModal } from './ConfirmModal';

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
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [currentTechName, setCurrentTechName] = useState(assignedTechnician?.name || '');
  const [currentTechPhone, setCurrentTechPhone] = useState(
    assignedTechnician?.phone || ''
  );
  const [isDeletePromptOpen, setIsDeletePromptOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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
  const requestImageUrl = ticket.requestImageUrl && ticket.requestImageUrl !== '-'
    ? ticket.requestImageUrl
    : '';
  const createdAtText = new Date(ticket.createdAt).toLocaleString('th-TH', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  const statusLabels: Record<string, string> = {
    pending: 'รอตรวจสอบ', assigned: 'มอบหมายแล้ว', received: 'รับงานแล้ว',
    in_progress: 'กำลังดำเนินการ', waiting_parts: 'รออะไหล่',
    waiting_inspect: 'รอตรวจรับ', completed: 'เสร็จสิ้น', cancelled: 'ยกเลิก'
  };

  const handleDeleteTicket = async () => {
    if (deletePassword !== '2904') {
      setDeleteError('รหัสผ่านไม่ถูกต้อง');
      return;
    }
    if (!onDeleteTicket) return;
    setIsDeleting(true);
    try {
      await onDeleteTicket(ticket.id);
    } finally {
      setIsDeleting(false);
      setDeletePassword('');
      setDeleteError('');
      setIsDeletePromptOpen(false);
    }
  };

  // Step mapping
  const steps = [
    { id: 'pending', label: 'รอตรวจสอบ' },
    { id: 'assigned', label: 'มอบหมายแล้ว' },
    { id: 'received', label: 'รับงานแล้ว' },
    { id: 'in_progress', label: 'กำลังดำเนินการ' },
    { id: 'waiting_parts', label: 'รออะไหล่' },
    { id: 'waiting_inspect', label: 'รอตรวจรับ' },
    { id: 'completed', label: 'เสร็จสิ้น' }
  ];

  let currentStepIndex = 3; // in_progress default
  if (ticket.status === 'pending') currentStepIndex = 0;
  else if (ticket.status === 'assigned') currentStepIndex = 1;
  else if (ticket.status === 'waiting_parts') currentStepIndex = 4;
  else if (ticket.status === 'waiting_inspect') currentStepIndex = 5;
  else if (ticket.status === 'completed') currentStepIndex = 6;

  const handleStatusChange = (newStatus: any, alertText: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'ยืนยันการเปลี่ยนสถานะใบงาน',
      message: `คุณต้องการบันทึกสถานะงานเป็น "${alertText}" ใช่หรือไม่?`,
      confirmText: 'ยืนยันเปลี่ยนสถานะ',
      cancelText: 'ยกเลิก',
      confirmVariant: newStatus === 'cancelled' ? 'danger' : 'primary',
      onConfirm: async () => {
        await onUpdateTicket(ticket.id, { status: newStatus });
        setConfirmConfig(null);
        onClose();
      }
    });
  };

  const handleAssignTech = (newTech: string, newPhone?: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'ยืนยันการมอบหมายช่าง',
      message: `ยืนยันการมอบหมายงานซ่อมให้ "${newTech}" ${newPhone ? `(เบอร์โทร: ${newPhone})` : ''} ใช่หรือไม่?`,
      confirmText: 'ยืนยันมอบหมาย',
      cancelText: 'ยกเลิก',
      confirmVariant: 'primary',
      onConfirm: async () => {
        setCurrentTechName(newTech);
        if (newPhone !== undefined) setCurrentTechPhone(newPhone);
        await onUpdateTicket(ticket.id, { 
          technicianName: newTech, 
          technicianPhone: newPhone || currentTechPhone,
          status: 'in_progress' 
        });
        setConfirmConfig(null);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center items-center overflow-y-auto">
      <div className="w-full max-w-xl bg-surface rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto border border-slate-200/50">
        
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
              <div className="flex items-center gap-space-xs min-w-0">
                <span className="font-label-md text-label-md text-primary bg-primary-fixed px-2.5 py-1 rounded-full font-semibold">
                  #{ticket.requestId}
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

          {/* Horizontal Workflow Stepper */}
          <div className="py-4 bg-surface-container-low rounded-xl overflow-x-auto overflow-y-hidden overscroll-y-none touch-pan-x no-scrollbar shadow-inner border border-slate-200/40" style={{ touchAction: 'pan-x' }}>
            <div className="flex items-center gap-2.5 px-gutter min-w-max">
              {steps.map((s, idx) => {
                const isPassed = idx < currentStepIndex;
                const isActive = idx === currentStepIndex;
                return (
                  <React.Fragment key={s.id}>
                    <div
                      className={`flex items-center gap-1.5 py-2 px-3.5 rounded-full text-xs sm:text-sm font-semibold shadow-sm transition-all ${
                        isActive
                          ? 'bg-primary text-on-primary font-bold shadow-md'
                          : isPassed
                          ? 'bg-surface-container-lowest text-on-surface font-medium'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {isActive ? (
                        <span className="material-symbols-outlined text-[18px] animate-spin">autorenew</span>
                      ) : isPassed ? (
                        <span
                          className="material-symbols-outlined text-[18px] text-primary"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          check_circle
                        </span>
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-outline"></span>
                      )}
                      <span>{s.label}</span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div
                        className={`w-4 h-0.5 ${isPassed ? 'bg-primary' : 'bg-outline-variant'}`}
                      ></div>
                    )}
                  </React.Fragment>
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

          {/* Section 3: Technician Assignment */}
          <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-3 border border-slate-200/40">
            <div className="flex items-center justify-between">
              <span className="font-label-lg text-label-lg text-on-surface flex items-center gap-2 font-bold">
                <span className="material-symbols-outlined text-[20px] text-primary">engineering</span>
                ช่างผู้รับผิดชอบหลัก
              </span>
              <button
                className="px-2.5 py-1 bg-surface-container text-on-surface rounded-md font-label-sm text-label-sm hover:bg-surface-container-high transition-colors cursor-pointer font-semibold"
                onClick={() => setIsAssignModalOpen(true)}
                type="button"
              >
                เปลี่ยน / เพิ่มช่าง
              </button>
            </div>
            {(() => {
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
                        {currentTechName ? currentTechName.slice(4, 5) || currentTechName.slice(0, 1) : '—'}
                      </div>
                    )}
                    {currentTechName && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-white"></span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-headline-sm text-headline-sm truncate font-bold ${currentTechName ? 'text-on-surface' : 'text-slate-500'}`}>
                        {currentTechName || 'ยังไม่ได้มอบหมายช่าง'}
                      </span>
                      {currentTechName && (
                        <span
                          className="material-symbols-outlined text-[16px] text-primary"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          verified
                        </span>
                      )}
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      {currentTechName ? (matchedTech?.role || 'ช่างเทคนิค') : 'เลือกช่างผู้รับผิดชอบเพื่อเริ่มงาน'} • {ticket.department || 'ทีมซ่อมบำรุง'}
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
            })()}
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
            </div>

            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              <span className="material-symbols-outlined text-[30px] text-slate-400">inventory_2</span>
              <p className="mt-1 font-semibold">ยังไม่มีรายการอะไหล่ที่บันทึก</p>
            </div>

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
                สาเหตุข้อบกพร่องที่พบ
              </label>
              <div className="p-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md">
                {ticket.description || 'ยังไม่มีรายละเอียดอาการที่บันทึก'}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-md text-label-md text-on-surface-variant font-semibold">
                ขั้นตอนดำเนินการแก้ไข
              </label>
              <div className="p-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md">
                {ticket.repairResult || 'ยังไม่มีบันทึกขั้นตอนการแก้ไข'}
              </div>
            </div>
          </div>

          {/* Section 6: Quick Action Status Buttons */}
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              onClick={() => handleStatusChange('waiting_inspect', 'ส่งงานเรียบร้อย รอผู้แจ้งตรวจรับ')}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer font-bold"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
              ส่งงานเพื่อให้ผู้แจ้งตรวจรับ (Ready for Inspection)
            </button>

            <button
              onClick={() => handleStatusChange('waiting_parts', 'บันทึกสถานะรออะไหล่เรียบร้อย')}
              className="w-full h-12 rounded-xl bg-secondary-container hover:bg-secondary text-on-secondary-container font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer font-bold"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">hourglass_top</span>
              ขอเบิกอะไหล่ / พักรองาน (Waiting Parts)
            </button>

            <button
              onClick={() => handleStatusChange('cancelled', 'ยกเลิกใบงานซ่อมนี้')}
              className="w-full h-11 rounded-xl bg-surface-container hover:bg-surface-container-high text-error font-label-md text-label-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer font-semibold"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">cancel</span>
              ขอยกเลิกใบงานซ่อมนี้
            </button>

            {onDeleteTicket && (
              <button
                onClick={() => { setDeletePassword(''); setDeleteError(''); setIsDeletePromptOpen(true); }}
                className="w-full h-11 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-label-md text-label-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer font-semibold"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                ลบรายการแจ้งซ่อม
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Sub-modal: Assign Technician */}
      <AssignTechnicianModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        technicians={technicians}
        currentTechnicianName={currentTechName}
        currentTechnicianPhone={currentTechPhone}
        onAssign={handleAssignTech}
      />

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
                <h3 className="text-lg sm:text-xl font-bold">ยืนยันการลบรายการ</h3>
                <p className="text-sm text-slate-600 mt-0.5">การลบรายการนี้ไม่สามารถย้อนกลับได้</p>
              </div>
            </div>
            <label className="block mt-5 text-sm font-bold text-slate-700" htmlFor="delete-password">
              ใส่รหัสเพื่อยืนยันการลบ
            </label>
            <input
              id="delete-password"
              type="password"
              inputMode="numeric"
              autoFocus
              value={deletePassword}
              onChange={(event) => { setDeletePassword(event.target.value); setDeleteError(''); }}
              onKeyDown={(event) => { if (event.key === 'Enter') void handleDeleteTicket(); }}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-lg tracking-[0.35em] outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
              placeholder="รหัส 4 หลัก"
              maxLength={4}
            />
            {deleteError && <p className="mt-2 text-sm font-semibold text-rose-600">{deleteError}</p>}
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setIsDeletePromptOpen(false)} className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200" disabled={isDeleting}>ยกเลิก</button>
              <button type="button" onClick={() => void handleDeleteTicket()} className="flex-1 rounded-xl bg-rose-600 py-3 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60" disabled={isDeleting}>
                {isDeleting ? 'กำลังลบ...' : 'ยืนยันลบรายการ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
