import React, { useState } from 'react';
import { Ticket, Technician } from '../types';
import { AssignTechnicianModal } from './AssignTechnicianModal';

interface TaskDetailsModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  technicians: Technician[];
  onUpdateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>;
  onOpenPartsModal?: (ticket?: Ticket) => void;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  ticket,
  isOpen,
  onClose,
  technicians,
  onUpdateTicket,
  onOpenPartsModal
}) => {
  if (!isOpen || !ticket) return null;

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [currentTechName, setCurrentTechName] = useState(ticket.technicianName || 'ช่างอนุรักษ์ ยอดช่าง');
  const [currentTechPhone, setCurrentTechPhone] = useState(
    ticket.technicianPhone || technicians.find(t => t.name === (ticket.technicianName || ''))?.phone || ''
  );

  const isEmergency = ticket.priority === 'critical' || ticket.priority === 'high';

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

  const handleStatusChange = async (newStatus: any, alertText: string) => {
    await onUpdateTicket(ticket.id, { status: newStatus });
    alert(alertText);
    onClose();
  };

  const handleAssignTech = async (newTech: string, newPhone?: string) => {
    setCurrentTechName(newTech);
    if (newPhone !== undefined) setCurrentTechPhone(newPhone);
    await onUpdateTicket(ticket.id, { 
      technicianName: newTech, 
      technicianPhone: newPhone || currentTechPhone,
      status: 'in_progress' 
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
                  24 ต.ค. 2024 • 08:15 น.
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
                  กำลังดำเนินการ
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
          <div className="py-3 bg-surface-container-low rounded-xl overflow-x-auto no-scrollbar shadow-inner border border-slate-200/40">
            <div className="flex items-center gap-2 px-gutter min-w-max">
              {steps.map((s, idx) => {
                const isPassed = idx < currentStepIndex;
                const isActive = idx === currentStepIndex;
                return (
                  <React.Fragment key={s.id}>
                    <div
                      className={`flex items-center gap-1.5 py-1.5 px-3 rounded-full text-label-sm font-label-sm shadow-sm transition-all ${
                        isActive
                          ? 'bg-primary text-on-primary font-bold shadow-md'
                          : isPassed
                          ? 'bg-surface-container-lowest text-on-surface font-medium'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {isActive ? (
                        <span className="material-symbols-outlined text-[16px] animate-spin">autorenew</span>
                      ) : isPassed ? (
                        <span
                          className="material-symbols-outlined text-[16px] text-primary"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          check_circle
                        </span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-outline"></span>
                      )}
                      <span>{s.label}</span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div
                        className={`w-3 h-0.5 ${isPassed ? 'bg-primary' : 'bg-outline-variant'}`}
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
              <a
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container text-on-surface rounded-full font-label-sm text-label-sm active:bg-surface-variant cursor-pointer font-semibold"
                href={`tel:${ticket.requesterPhone || '0899876543'}`}
              >
                <span className="material-symbols-outlined text-[16px] text-primary">call</span>
                โทรด่วน
              </a>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed font-bold text-headline-sm shrink-0 shadow-inner">
                {ticket.requesterName ? ticket.requesterName.slice(0, 1) : 'ผ'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-headline-sm text-headline-sm text-on-surface truncate leading-tight font-bold">
                  {ticket.requesterName || 'คุณนงนุช รักษ์ดี'}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {ticket.department} • โทร {ticket.requesterPhone || '089-987-6543'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Issue Photos */}
          <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-3 border border-slate-200/40">
            <div className="flex items-center justify-between">
              <span className="font-label-lg text-label-lg text-on-surface flex items-center gap-2 font-bold">
                <span className="material-symbols-outlined text-[20px] text-primary">photo_library</span>
                ภาพถ่ายจุดเกิดเหตุ (2 รูป)
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">บันทึกตอนแจ้งงาน</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative rounded-lg overflow-hidden bg-surface-container shadow-sm group">
                <img
                  alt="น้ำแข็งเกาะวาล์วทำความเย็น"
                  className="w-full h-36 object-cover transition-transform duration-300 group-hover:scale-105"
                  src={
                    ticket.requestImageUrl && ticket.requestImageUrl !== '-'
                      ? ticket.requestImageUrl
                      : 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEYiG8Cbg4XUfTwm9t20T-7owpqHpv8_O6FsZcKoX7atFIxMqIVe7eaHQLGqpDoHDVPc6KCvE575MEZBB1ZLQJybn9W4BF462XmrtszbIACSzv6jKECBdu4pDa7RSqi2fek1eNksfsHzTSlNsmzkgJ6zKf99fHAZ4gbxV_F9crwT-XMWeJ562c7hCPu-_AHPr6xIr-Nfcvjm7G-44IEpN56ke5VOTohwpfhQdo0yFaIEya0F2VcCkiog'
                  }
                />
                <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="font-label-sm text-label-sm text-white font-medium truncate">
                    1. น้ำแข็งเกาะหนาวาล์ว
                  </p>
                </div>
              </div>

              <div className="relative rounded-lg overflow-hidden bg-surface-container shadow-sm group">
                <img
                  alt="รอยต่อท่อส่งน้ำยาแอร์"
                  className="w-full h-36 object-cover transition-transform duration-300 group-hover:scale-105"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYt9Sr6Fxgn2bgr64TwGr7KobPvE64qoD94ZcGD7aCMOdkNgkQFblZXy3DzW9emEEkWnn8eVw0H-wmZxNljjv3PDxrUEjd7KyMN6-DW33pkih9u9j9P3lHz2ShgqPXYt5yx4aKHBaH_qX2TgRhOZ3edsqjwMfju-Zsr3CVGDYYySw5VUq5YMp15NqQemBnoC925iD_uL-CxUx3q1Vcp0qYSpbAltjyhEGo1znt19w24DVBt6-vBRgJWA"
                />
                <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="font-label-sm text-label-sm text-white font-medium truncate">
                    2. รอยต่อท่อส่งน้ำยา
                  </p>
                </div>
              </div>
            </div>
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
            <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg">
              <div className="relative shrink-0">
                <img
                  alt="ช่างอนุรักษ์"
                  className="w-12 h-12 rounded-full object-cover shadow-sm ring-2 ring-primary-fixed"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDLYKl-ggYkb2HgUL1HLYNFkaRtJlkseOaqQ1JENyZvv5lzpj-uzl5lx8sZtgjyb3svdUhzAF_0gU14KHe9AAiFfDhP7tWGvQYUBJTHAbVhuyZ6JpUAlKJAL41k_ljJSLPUige-zj8Bx8M7EciKWhR4Bplo-bVi7HxJjmMK94DJa7icM8yj0yreOH-qi81RWmPXXz2N48eDCyLH8mu0M36TX2gfNoGHU65X9dn2spTRCgHFtw7ohRuc5w"
                />
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-primary rounded-full ring-2 ring-surface-container-lowest"></span>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-headline-sm text-headline-sm text-on-surface truncate font-bold">
                    {currentTechName}
                  </span>
                  <span
                    className="material-symbols-outlined text-[16px] text-primary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  ช่างเทคนิค • {ticket.department || 'ทีมซ่อมบำรุง'}
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
                    (ยังไม่ได้กำหนดเบอร์โทร - กดเปลี่ยน/เพิ่มช่างเพื่อระบุ)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Parts & Cost Management */}
          <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-3 border border-slate-200/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">inventory_2</span>
                <span className="font-label-lg text-label-lg text-on-surface font-bold">
                  อะไหล่และค่าใช้จ่ายซ่อมบำรุง
                </span>
              </div>
              <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-semibold">
                Stock Synced
              </span>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low">
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="font-label-md text-label-md text-on-surface truncate font-semibold">
                    Expansion Valve Danfoss R404A
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    รหัส: DF-VLV-404 • จำนวน: 1 ชิ้น
                  </span>
                </div>
                <span className="font-label-lg text-label-lg text-on-surface font-bold shrink-0">
                  ฿1,850
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low">
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="font-label-md text-label-md text-on-surface truncate font-semibold">
                    น้ำยาแอร์ R404A (กระบอก 3 kg)
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    รหัส: GAS-R404-03 • จำนวน: 1 ถัง
                  </span>
                </div>
                <span className="font-label-lg text-label-lg text-on-surface font-bold shrink-0">
                  ฿950
                </span>
              </div>
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

            {/* Cost Breakdown */}
            <div className="mt-2 pt-3 bg-surface-container-low p-3 rounded-lg flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-on-surface-variant font-body-sm text-body-sm">
                <span>รวมมูลค่าอะไหล่ (2 รายการ)</span>
                <span>฿2,800</span>
              </div>
              <div className="flex justify-between items-center text-on-surface-variant font-body-sm text-body-sm">
                <span>ค่าแรงและบริการเทคนิคพิเศษ</span>
                <span>฿500</span>
              </div>
              <div className="h-px bg-surface-container-highest my-1"></div>
              <div className="flex justify-between items-center">
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  รวมค่าใช้จ่ายทั้งสิ้น
                </span>
                <span className="font-headline-sm text-headline-sm text-primary font-bold">
                  ฿3,300
                </span>
              </div>
            </div>
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
                {ticket.description || 'วาล์วควบคุมแรงดันเสื่อมสภาพ ทำให้น้ำยาแอร์อุดตันและระบบตัดการทำงานอัตโนมัติเพื่อป้องกันคอมเพรสเซอร์เสียหาย'}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-md text-label-md text-on-surface-variant font-semibold">
                ขั้นตอนดำเนินการแก้ไข
              </label>
              <div className="p-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md">
                {ticket.repairResult || 'เปลี่ยน Expansion Valve ใหม่ แวคคั่มระบบกำจัดความชื้น และเติมน้ำยาแอร์เพิ่ม 2.5 kg ทำการเดินเครื่องทดสอบความเย็นเสถียรที่ 4 องศาเซลเซียส เรียบร้อย'}
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
              onClick={() => {
                const conf = window.confirm('ยืนยันยกเลิกใบงานซ่อมนี้ใช่หรือไม่?');
                if (conf) handleStatusChange('cancelled', 'ยกเลิกใบงานเรียบร้อย');
              }}
              className="w-full h-11 rounded-xl bg-surface-container hover:bg-surface-container-high text-error font-label-md text-label-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer font-semibold"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">cancel</span>
              ขอยกเลิกใบงานซ่อมนี้
            </button>
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
    </div>
  );
};
