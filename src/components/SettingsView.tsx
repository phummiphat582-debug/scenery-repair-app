import React from 'react';
import { isSupabaseConfigured } from '../lib/supabase';

interface SettingsViewProps {
  onOpenMigration: () => void;
  onOpenRoster: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onOpenMigration,
  onOpenRoster
}) => {
  return (
    <div className="flex flex-col w-full px-margin pb-20 pt-4 gap-4 max-w-lg mx-auto">
      <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-slate-200/50">
        <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-1">
          การตั้งค่าและระบบคลาวด์
        </h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          ศูนย์ควบคุมข้อมูล • การเชื่อมต่อ Supabase & Cloudflare
        </p>

        {/* Cloud Status */}
        <div className="mt-4 p-3 rounded-xl bg-surface-container-low flex items-center justify-between border border-slate-200/40">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-[22px]">cloud_sync</span>
            <div>
              <span className="font-label-md font-bold block text-on-surface">สถานะฐานข้อมูล</span>
              <span className="text-xs text-on-surface-variant">
                {isSupabaseConfigured ? 'Supabase Live Cloud พร้อมทำงาน' : 'Local Offline Storage Mode'}
              </span>
            </div>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
            isSupabaseConfigured ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-secondary-fixed text-on-secondary-fixed'
          }`}>
            {isSupabaseConfigured ? 'ออนไลน์' : 'ออฟไลน์'}
          </span>
        </div>
      </div>

      {/* Menu List */}
      <div className="bg-surface-container-lowest rounded-2xl p-3 shadow-sm border border-slate-200/50 flex flex-col gap-1">
        <button
          onClick={onOpenMigration}
          className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">database</span>
            </div>
            <div>
              <span className="font-label-lg font-bold block text-on-surface">ศูนย์จัดการและย้ายข้อมูลซ่อม</span>
              <span className="text-xs text-on-surface-variant">นำเข้า / ส่งออก CSV, สำรองข้อมูล JSON</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
        </button>

        <button
          onClick={onOpenRoster}
          className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">engineering</span>
            </div>
            <div>
              <span className="font-label-lg font-bold block text-on-surface">จัดการรายชื่อทีมช่าง</span>
              <span className="text-xs text-on-surface-variant">เพิ่ม/ลบช่าง, กำหนดสถานะพร้อมปฏิบัติงาน</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
        </button>
      </div>

      {/* App Info */}
      <div className="text-center text-xs text-on-surface-variant pt-4 flex flex-col gap-1">
        <span className="font-bold text-primary">SCENERY VINTAGE FARM MAINTENANCE PRO</span>
        <span>เวอร์ชัน 2.0.0 (Design System Material 3) • สวนผึ้ง ราชบุรี</span>
      </div>
    </div>
  );
};
