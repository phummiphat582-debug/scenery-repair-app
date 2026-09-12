import React, { useState } from 'react';
import { Ticket, Technician } from '../types';
import { ConfirmModal } from './ConfirmModal';

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
  const [selectedZone, setSelectedZone] = useState('all');
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

  // Active technician (defaults to first tech)
  const currentTech = technicians[0] || {
    id: 't-1',
    name: 'ช่างสมชาย (หัวหน้าช่าง)',
    role: 'หัวหน้าฝ่ายซ่อมบำรุง',
    code: 'T-042',
    phone: '081-234-5678'
  };

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
    <div className="flex flex-col w-full pb-16">
      
      {/* 1. Sync & Connectivity Status Banner */}
      <section className="px-margin pt-space-sm pb-space-xs">
        <div className="flex items-center justify-between px-space-md py-space-xs rounded-full bg-primary-fixed text-on-primary-fixed shadow-sm">
          <div className="flex items-center gap-space-xs min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
            <span className="font-label-sm text-label-sm truncate font-medium">
              เชื่อมต่อระบบคลังฟาร์มออนไลน์ • ซิงค์เมื่อ 1 นาทีที่แล้ว
            </span>
          </div>
          <span className="material-symbols-outlined text-[16px] text-primary shrink-0">cloud_done</span>
        </div>
      </section>

      {/* 2. Technician Profile Header */}
      <header className="px-margin py-space-sm">
        <div className="relative overflow-hidden rounded-xl bg-primary text-on-primary p-space-md shadow-md">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-primary-container opacity-40 pointer-events-none"></div>
          <div className="flex items-center gap-space-md relative z-10">
            <div className="relative shrink-0">
              <img
                className="w-14 h-14 rounded-full object-cover shadow-sm ring-2 ring-primary-fixed"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYB2PFeA-M3r405BGFajCzKCm0AsBLbZuVDeUyCkEcden4KiWIXAyksZtC-7qTCmzUmcgGyohPl7PaRUthRc5GjrFt9jfizuRrfeOu060wxEbfz1h3nXcqfd__YxLxUKxMV-arf_pVfOcFLdYA-TfVwnoKCtOh4Xay5oqkb7YLzGI7P3yYJyb51w-Xki13kvjWl_cHUDwNufvT1g_k_MhwnDYt470UXHiVA8O6BuqE1MEWTghHIs0jew"
                alt="Portrait of Anurak, Thai farm technician"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span
                className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-tertiary-fixed border-2 border-primary flex items-center justify-center"
                title="On Duty"
              >
                <span className="w-2 h-2 rounded-full bg-tertiary-container"></span>
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-space-xs flex-wrap">
                <h1 className="font-headline-sm text-headline-sm text-on-primary tracking-tight truncate font-bold">
                  {currentTech.name}
                </h1>
                <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-tertiary-container text-tertiary-fixed font-semibold">
                  รหัส {currentTech.code || 'T-042'}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-primary-fixed-dim truncate">
                {currentTech.role || 'ช่างระบบไฟและเครื่องกล • สายซ่อมบำรุง A'}
              </p>
              <div className="mt-1 flex items-center gap-1 text-tertiary-fixed font-label-sm text-label-sm">
                <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
                <span>พร้อมปฏิบัติงาน (On Duty) เข้ากะเช้า</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Counters */}
          <div className="grid grid-cols-4 gap-space-xs mt-space-md pt-space-sm bg-primary-container/60 rounded-lg p-2 text-center">
            <div className="flex flex-col items-center">
              <span className="font-headline-sm text-headline-sm text-secondary-fixed font-bold">1</span>
              <span className="font-label-sm text-label-sm text-primary-fixed-dim">รับงาน</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-headline-sm text-headline-sm text-tertiary-fixed font-bold">2</span>
              <span className="font-label-sm text-label-sm text-primary-fixed-dim">กำลังทำ</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-headline-sm text-headline-sm text-secondary-container font-bold">1</span>
              <span className="font-label-sm text-label-sm text-primary-fixed-dim">รออะไหล่</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-headline-sm text-headline-sm text-on-primary font-bold">3</span>
              <span className="font-label-sm text-label-sm text-primary-fixed-dim">เสร็จแล้ว</span>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Segmented Mode Switcher */}
      <section className="px-margin py-space-xs">
        <div className="flex items-center p-1 rounded-xl bg-surface-container gap-1 shadow-sm" role="tablist">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex-1 min-h-[44px] py-2 px-2 rounded-lg font-label-md text-label-md font-semibold text-center transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'today'
                ? 'bg-surface-container-lowest text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            <span>งานวันนี้</span>
            <span className="px-1.5 py-0.2 rounded-full bg-primary text-on-primary font-label-sm text-[11px]">
              3
            </span>
          </button>

          <button
            onClick={() => setActiveTab('waiting')}
            className={`flex-1 min-h-[44px] py-2 px-2 rounded-lg font-label-md text-label-md font-semibold text-center transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'waiting'
                ? 'bg-surface-container-lowest text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            <span>รออะไหล่</span>
            <span className="px-1.5 py-0.2 rounded-full bg-surface-container-highest text-on-surface font-label-sm text-[11px]">
              1
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 min-h-[44px] py-2 px-2 rounded-lg font-label-md text-label-md font-semibold text-center transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-surface-container-lowest text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            <span>ประวัติงาน</span>
            <span className="px-1.5 py-0.2 rounded-full bg-surface-container-highest text-on-surface font-label-sm text-[11px]">
              28
            </span>
          </button>
        </div>
      </section>

      {/* 4. Zone Pill Filter */}
      <section className="py-space-xs px-margin overflow-x-auto no-scrollbar flex items-center gap-space-xs">
        {[
          { id: 'all', label: 'ทุกจุดในฟาร์ม (4)', icon: 'tune' },
          { id: 'cafe', label: 'โซนคาเฟ่ & เบเกอรี่ (1)', dot: 'bg-secondary-container' },
          { id: 'pasture', label: 'คอกแกะ Pasture C (1)', dot: 'bg-primary' },
          { id: 'barn', label: 'โรงเก็บฟาง & แปลงหญ้า (1)', dot: 'bg-outline' }
        ].map(z => (
          <button
            key={z.id}
            onClick={() => setSelectedZone(z.id)}
            className={`shrink-0 min-h-[36px] px-3.5 py-1.5 rounded-full font-label-sm text-label-sm flex items-center gap-1 shadow-sm transition-all cursor-pointer ${
              selectedZone === z.id
                ? 'bg-primary text-on-primary font-semibold'
                : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
            }`}
            type="button"
          >
            {z.icon && <span className="material-symbols-outlined text-[16px]">{z.icon}</span>}
            {z.dot && <span className={`w-2 h-2 rounded-full ${z.dot}`}></span>}
            <span>{z.label}</span>
          </button>
        ))}
      </section>

      {/* 5. Task Queue Feed */}
      <div className="px-margin flex flex-col gap-space-md mt-space-xs">
        
        {/* TASK 1: ACTIVE NOW (IN PROGRESS) */}
        <article className="relative overflow-hidden rounded-xl bg-surface-container-lowest shadow-md p-space-md border border-slate-200/40">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-error"></div>
          <div className="pl-space-xs flex flex-col gap-space-xs">
            <div className="flex items-start justify-between gap-space-xs">
              <div className="flex items-center gap-space-xs flex-wrap">
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  #MN-2024-0141
                </span>
                <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm flex items-center gap-0.5 font-bold">
                  <span className="material-symbols-outlined text-[14px]">bolt</span> ด่วนมาก
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1 shrink-0">
                <span className="material-symbols-outlined text-[14px]">schedule</span> 09:30 น.
              </span>
            </div>

            <h2 className="font-headline-sm text-headline-sm text-on-surface leading-tight mt-0.5 font-bold">
              แอร์ห้องเย็น Bakery & Craft ตัดการทำงาน
            </h2>
            <div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
              <span className="material-symbols-outlined text-[18px] text-primary">pin_drop</span>
              <span className="font-semibold text-on-surface">อาคาร Bakery Workshop โซนหน้าฟาร์ม</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant bg-surface-container-low p-2.5 rounded-lg mt-1">
              อุณหภูมิห้องเย็นพุ่งขึ้นถึง 18°C (ปกติ 4°C) วัตถุดิบเนยสดและวิปครีมเสี่ยงเสียหาย ช่างตรวจเบื้องต้นพบน้ำแข็งเกาะคอยล์เย็น
            </p>

            {/* Progress Tracker Mini Bar */}
            <div className="mt-1 flex flex-col gap-1">
              <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                <span>สถานะ: กำลังล้างแผงระบายความร้อน</span>
                <span className="text-primary font-semibold">65%</span>
              </div>
              <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary-container h-full rounded-full transition-all duration-300"
                  style={{ width: '65%' }}
                ></div>
              </div>
            </div>

            {/* Attached Photo Evidence */}
            <div className="mt-1 flex items-center gap-space-xs overflow-x-auto pb-1">
              <img
                className="w-16 h-16 rounded-lg object-cover shadow-sm shrink-0"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZBWBnZIQsLMZAsDsAR4zfQ-zC9F8sWHgr2VLP_oEWEm88ab8yiwBRiFHCxffeHFcKLWmeR3AJFwUhJqhig6Rcqq8_xJfsIJFBeRpcKsz57JJOucP7hkdVv-RgXd9SqYhVN0vzIm8Z_cL25A9Yw8pD8amCdaelwgSvQd4fzMvgb2ENqe7a9wsRjK3JiJ2xzpSM6CAl8TfbR1T3-BJ-UjPvRHSArsh6nJeIcH-QpMaIBxIGxAWaw_wICw"
                alt="Cold storage evaporator coil"
              />
              <button
                onClick={() => alert('เปิดกล้องสมาร์ตโฟนสำหรับแนบภาพถ่ายความคืบหน้าระหว่างซ่อม')}
                className="w-16 h-16 rounded-lg bg-surface-container flex flex-col items-center justify-center text-primary hover:bg-surface-container-high transition-colors shrink-0 cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[24px]">add_a_photo</span>
                <span className="font-label-sm text-[10px] mt-0.5">เพิ่มรูป</span>
              </button>
              <div className="p-2 rounded-lg bg-surface-container-low text-on-surface-variant flex-1 min-w-[120px] text-left">
                <span className="font-label-sm text-label-sm block font-semibold text-primary">อุปกรณ์ที่ใช้</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant truncate block">
                  เกจวัดน้ำยา R410A, ปั๊มฉีด
                </span>
              </div>
            </div>

            {/* Quick 1-Click Action Buttons */}
            <div className="grid grid-cols-2 gap-space-xs mt-space-sm pt-space-xs border-t border-slate-100">
              <button
                onClick={() => onOpenPartsModal(tickets[0])}
                className="min-h-[48px] px-3 rounded-lg bg-surface-container text-primary font-label-md text-label-md flex items-center justify-center gap-1.5 active:scale-98 transition-transform font-semibold cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                <span>บันทึกผล/เบิกอะไหล่</span>
              </button>
              <button
                onClick={() => handleCompleteWork(tickets[0] || { id: 't1', requestId: 'MN-2024-0141' } as any)}
                className="min-h-[48px] px-3 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-transform font-semibold cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                <span>ส่งตรวจรับงาน</span>
              </button>
            </div>
          </div>
        </article>

        {/* TASK 2: ASSIGNED / NEEDS ACCEPTANCE */}
        <article className="relative overflow-hidden rounded-xl bg-surface-container-lowest shadow-md p-space-md border border-slate-200/40">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-secondary-container"></div>
          <div className="pl-space-xs flex flex-col gap-space-xs">
            <div className="flex items-start justify-between gap-space-xs">
              <div className="flex items-center gap-space-xs flex-wrap">
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  #MN-2024-0143
                </span>
                <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm flex items-center gap-0.5 font-bold">
                  <span className="material-symbols-outlined text-[14px]">assignment_turned_in</span> งานใหม่รอรับ
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-secondary font-semibold flex items-center gap-0.5 shrink-0">
                <span className="material-symbols-outlined text-[14px]">history</span> 15 นาทีที่แล้ว
              </span>
            </div>

            <h2 className="font-headline-sm text-headline-sm text-on-surface leading-tight mt-0.5 font-bold">
              ปั๊มน้ำคอกแกะโซน C รั่วซึม แรงดันตก
            </h2>
            <div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
              <span className="material-symbols-outlined text-[18px] text-primary">place</span>
              <span className="font-semibold text-on-surface">Pasture C (โรงเรือนให้อาหารแกะหลังที่ 2)</span>
            </div>
            <div className="flex items-center gap-space-xs p-2 rounded-lg bg-surface-container-low text-on-surface-variant font-body-sm text-body-sm">
              <span className="material-symbols-outlined text-[18px] text-primary">supervisor_account</span>
              <span>มอบหมายโดย: <strong>หัวหน้าสมชาย (ผจก.ฝ่ายบำรุงรักษา)</strong></span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              น้ำไหลอ่อนกระทบรางน้ำดื่มฝูงแกะ 60 ตัว มีน้ำรั่วเจิ่งนองบริเวณฐานปั๊ม Mitsubishi 250W ต้องการช่างเข้าตรวจสอบท่อข้อต่อ PVC
            </p>

            {/* Prominent Acceptance Workflow */}
            <div className="flex flex-col gap-space-xs mt-space-sm pt-1 border-t border-slate-100">
              <button
                onClick={() => handleAcceptWork(tickets[1] || { id: 't2', requestId: 'MN-2024-0143' } as any)}
                disabled={acceptingId !== null}
                className="w-full min-h-[52px] px-4 rounded-xl bg-primary text-on-primary font-headline-sm text-headline-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all hover:bg-primary-container cursor-pointer font-bold"
                type="button"
              >
                {acceptingId ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[24px]">sync</span>
                    <span>กำลังบันทึกรับงาน...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[24px]">task_alt</span>
                    <span>แตะเพื่อ 'กดรับงาน' (Accept Work Order)</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-space-xs">
                <button
                  onClick={() => window.open('tel:0844270787')}
                  className="min-h-[44px] px-3 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md flex items-center justify-center gap-1.5 active:scale-98 transition-transform cursor-pointer font-semibold"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px] text-primary">phone</span>
                  <span>โทรหาผู้แจ้ง/หัวหน้า</span>
                </button>
                <button
                  onClick={() => handleDeclineWork(tickets[1] || { id: 't2', requestId: 'MN-2024-0143' } as any)}
                  className="min-h-[44px] px-3 rounded-lg bg-surface-container text-error font-label-md text-label-md flex items-center justify-center gap-1.5 active:scale-98 transition-transform cursor-pointer font-semibold"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">event_busy</span>
                  <span>แจ้งติดภารกิจอื่น</span>
                </button>
              </div>
            </div>
          </div>
        </article>

        {/* TASK 3: WAITING FOR PARTS */}
        <article className="relative overflow-hidden rounded-xl bg-surface-container-lowest shadow-md p-space-md border border-slate-200/40">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-outline"></div>
          <div className="pl-space-xs flex flex-col gap-space-xs">
            <div className="flex items-start justify-between gap-space-xs">
              <div className="flex items-center gap-space-xs flex-wrap">
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  #MN-2024-0138
                </span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm flex items-center gap-0.5 font-bold">
                  <span className="material-symbols-outlined text-[14px]">pending</span> รออะไหล่
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">บันทึกเมื่อวาน</span>
            </div>

            <h2 className="font-headline-sm text-headline-sm text-on-surface leading-tight mt-0.5 font-bold">
              ชุดลูกรอกสลิงโรงเก็บฟางและหญ้าแห้ง
            </h2>
            <div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
              <span className="material-symbols-outlined text-[18px] text-primary">warehouse</span>
              <span className="font-semibold text-on-surface">โรงฟางอาคาร 4 ทิศตะวันตก</span>
            </div>

            {/* Parts Tracking Box */}
            <div className="p-3 rounded-xl bg-secondary-fixed/40 text-on-secondary-fixed-variant flex items-start gap-space-sm mt-1 border border-secondary-fixed">
              <span className="material-symbols-outlined text-[24px] text-secondary shrink-0 mt-0.5">
                local_shipping
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-label-md text-label-md font-semibold text-on-secondary-fixed">
                  สั่งเบิก: ตลับลูกปืนเหล็กกล้า SKF 6204 & ลวดสลิง 8 มม.
                </div>
                <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  สถานะ: จัดส่งจากศูนย์กระจายสินค้าราชบุรี • กำหนดส่งถึงฟาร์ม <strong>พรุ่งนี้ 10:00 น.</strong>
                </div>
              </div>
            </div>

            {/* Parts Action */}
            <div className="mt-space-xs pt-1 border-t border-slate-100">
              <button
                onClick={() => alert('เปิดคลังอะไหล่: ตลับลูกปืน SKF 6204 เหลือสำรอง 0 ชิ้นในสโตร์ฟาร์ม (รอของส่งพรุ่งนี้), อะไหล่เทียบเท่า 6204-2RS เหลือ 1 ชิ้นในช็อปเกษตร')}
                className="w-full min-h-[48px] px-3 rounded-lg bg-surface-container text-primary font-label-md text-label-md flex items-center justify-center gap-2 active:scale-98 transition-transform font-semibold cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">manage_search</span>
                <span>เช็คสต็อกอะไหล่สำรองในฟาร์ม (Live Inventory)</span>
              </button>
            </div>
          </div>
        </article>

      </div>

      {/* 6. Farm Map Quick Location Spotlight */}
      <section className="px-margin pt-space-lg pb-space-sm">
        <div className="p-space-md rounded-xl bg-surface-container-low shadow-sm border border-slate-200/40">
          <div className="flex items-center justify-between mb-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary text-[22px]">map</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                แผนที่พิกัดงานซ่อมในฟาร์ม
              </h3>
            </div>
            <span className="font-label-sm text-label-sm text-primary font-semibold">3 จุดรอดำเนินการ</span>
          </div>

          <div
            className="w-full h-44 rounded-xl bg-cover bg-center relative overflow-hidden shadow-inner flex flex-col justify-between p-3"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDZU-ne5ehqWpSGs8mW9y2uRvE-fVEVC-1YsKhjjlK09kl11dfP7UsQU-qBaMfDw7tGVNdj4SIWMgEjfuafhUhG9PqQ7nGx6SQdoi4PatuZy_Vmxtf32hFOmaQZWt1Xx2Dx7Sd5Pit8pwuODeqdIrqpFDsVCmAXKplGIrbQsj7XkszaBNS1yzCqPf57a_AEfMId-10TrPM4cXR3rC8QZpIOKfKckjpsXhWDxnuZ1IBrCtnzLpGKVxOsdQ')"
            }}
          >
            <div className="flex justify-between items-start">
              <span className="px-2.5 py-1 rounded-full bg-primary/90 text-on-primary font-label-sm text-label-sm backdrop-blur-sm shadow-sm flex items-center gap-1 font-semibold">
                <span className="w-2 h-2 rounded-full bg-tertiary-fixed animate-pulse"></span> โซนเปิดบริการท่องเที่ยว
              </span>
              <button
                onClick={onOpenFarmMap}
                className="w-8 h-8 rounded-full bg-surface-container-lowest text-on-surface shadow-md flex items-center justify-center cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">my_location</span>
              </button>
            </div>

            <div className="bg-surface/90 backdrop-blur-md p-2.5 rounded-lg shadow-sm flex items-center justify-between">
              <div className="min-w-0">
                <p className="font-label-md text-label-md text-on-surface font-semibold truncate">
                  ตำแหน่งปัจจุบัน: ช็อปช่างกลางฟาร์ม
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  ระยะห่างถึงงานด่วนแอร์เบเกอรี่: 120 เมตร (เดิน 2 นาที)
                </p>
              </div>
              <button
                onClick={onOpenFarmMap}
                className="shrink-0 ml-2 px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm flex items-center gap-1 shadow-sm cursor-pointer font-bold"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">navigation</span>
                <span>นำทาง</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Sticky Floating Emergency Bar */}
      <aside className="sticky bottom-24 inset-x-0 px-margin mt-space-sm z-30 pointer-events-none">
        <div className="pointer-events-auto bg-surface/95 backdrop-blur-md p-2 rounded-2xl shadow-xl flex items-center gap-space-xs max-w-lg mx-auto border border-slate-200/50">
          <button
            onClick={onOpenSOSModal}
            className="flex-1 min-h-[50px] px-3 rounded-xl bg-error text-on-error font-label-lg text-label-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md cursor-pointer font-bold"
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">warning</span>
            <span>แจ้งเหตุฉุกเฉิน (SOS)</span>
          </button>
          <button
            onClick={() => window.open('tel:032909000')}
            aria-label="โทรติดต่อศูนย์ซ่อมบำรุงฟาร์ม"
            className="w-[50px] h-[50px] rounded-xl bg-surface-container-highest text-primary flex items-center justify-center active:scale-95 transition-all shadow-sm shrink-0 cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[24px]">call</span>
          </button>
          <button
            onClick={onOpenFarmMap}
            aria-label="เปิดแผนที่โซนฟาร์ม"
            className="w-[50px] h-[50px] rounded-xl bg-primary-container text-on-primary flex items-center justify-center active:scale-95 transition-all shadow-sm shrink-0 cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[24px]">near_me</span>
          </button>
        </div>
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
