import React, { useState } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';
import { ConfirmModal } from './ConfirmModal';
import { oneSignalService } from '../services/oneSignalService';

interface SettingsViewProps {
  onOpenMigration: () => void;
  onOpenRoster: () => void;
  onOpenDailyDuty?: () => void;
  onClearAllTickets?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onOpenMigration,
  onOpenRoster,
  onOpenDailyDuty,
  onClearAllTickets
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() =>
    oneSignalService.getPermission()
  );
  const [isEnablingNotif, setIsEnablingNotif] = useState(false);
  const [isTestingNotif, setIsTestingNotif] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handleEnablePush = async () => {
    setIsEnablingNotif(true);
    setTestFeedback(null);
    try {
      const result = await oneSignalService.enableTechnicianNotifications();
      setNotifPermission(oneSignalService.getPermission());
      if (result === 'enabled') {
        setTestFeedback({
          success: true,
          message: 'เปิดการแจ้งเตือนงานเข้าเรียบร้อยแล้ว! ✅'
        });
      } else if (result === 'denied') {
        setTestFeedback({
          success: false,
          message: 'การแจ้งเตือนถูกปิดกั้น กรุณาอนุญาต Notifications ในการตั้งค่าเบราว์เซอร์'
        });
      } else {
        setTestFeedback({
          success: false,
          message: 'ไม่สามารถเปิดการแจ้งเตือนได้ในอุปกรณ์นี้'
        });
      }
    } finally {
      setIsEnablingNotif(false);
    }
  };

  const handleTestPush = async () => {
    setIsTestingNotif(true);
    setTestFeedback(null);
    try {
      const result = await oneSignalService.testPushNotification();
      if (result.ok) {
        setTestFeedback({
          success: true,
          message: `${result.message} ตรวจสอบแถบแจ้งเตือนบนมือถือของคุณได้เลย 🔔`
        });
      } else {
        setTestFeedback({
          success: false,
          message: result.message
        });
      }
    } finally {
      setIsTestingNotif(false);
    }
  };

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

      {/* Push Notification Card */}
      <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-slate-200/50 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-[24px]">notifications_active</span>
            <div>
              <h3 className="font-label-lg font-bold text-on-surface">การแจ้งเตือนงานเข้า (มือถือช่าง)</h3>
              <p className="text-xs text-on-surface-variant">แจ้งเตือน Web Push เข้ามือถือทันทีเมื่อมีรายการใหม่</p>
            </div>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
            notifPermission === 'granted'
              ? 'bg-emerald-100 text-emerald-800'
              : notifPermission === 'denied'
              ? 'bg-rose-100 text-rose-800'
              : 'bg-amber-100 text-amber-800'
          }`}>
            {notifPermission === 'granted' ? 'เปิดใช้งานแล้ว' : notifPermission === 'denied' ? 'ถูกปิดกั้น' : 'ยังไม่เปิด'}
          </span>
        </div>

        {/* Info / Instructions */}
        <div className="text-xs text-on-surface-variant bg-surface-container-low p-3 rounded-xl space-y-1.5 border border-slate-200/40">
          <p>
            <strong>📱 มือถือ Android:</strong> แตะปุ่มเปิดแจ้งเตือนและกดยอมรับ จะมีเสียงเตือนแม้ปิดหน้าจอ
          </p>
          <p>
            <strong>🍎 iPhone / iPad:</strong> ต้องกดปุ่มแชร์ ➔ "เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen) ก่อน จึงจะสามารถเปิดแจ้งเตือนได้ (iOS 16.4+)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          {notifPermission !== 'granted' && (
            <button
              onClick={handleEnablePush}
              disabled={isEnablingNotif}
              className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:brightness-95 cursor-pointer disabled:opacity-60"
            >
              <span className={`material-symbols-outlined text-[18px] ${isEnablingNotif ? 'animate-spin' : ''}`}>
                {isEnablingNotif ? 'sync' : 'notification_add'}
              </span>
              <span>{isEnablingNotif ? 'กำลังดำเนินการ...' : 'เปิดแจ้งเตือนบนเครื่องนี้'}</span>
            </button>
          )}

          <button
            onClick={handleTestPush}
            disabled={isTestingNotif}
            className="flex-1 py-2.5 px-4 rounded-xl bg-secondary-fixed text-on-secondary-fixed font-bold text-xs flex items-center justify-center gap-2 hover:brightness-95 cursor-pointer disabled:opacity-60"
          >
            <span className={`material-symbols-outlined text-[18px] ${isTestingNotif ? 'animate-spin' : ''}`}>
              {isTestingNotif ? 'sync' : 'send_and_archive'}
            </span>
            <span>{isTestingNotif ? 'กำลังยิงสัญญาณ...' : '🔔 ทดสอบส่งแจ้งเตือนเข้ามือถือ'}</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {testFeedback && (
          <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
            testFeedback.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            <span className="material-symbols-outlined text-[18px] shrink-0">
              {testFeedback.success ? 'check_circle' : 'error'}
            </span>
            <span>{testFeedback.message}</span>
          </div>
        )}
      </div>

      {/* Menu List */}
      <div className="bg-surface-container-lowest rounded-2xl p-3 shadow-sm border border-slate-200/50 flex flex-col gap-1">
        
        {/* Daily Duty Shift */}
        {onOpenDailyDuty && (
          <button
            onClick={onOpenDailyDuty}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">calendar_month</span>
              </div>
              <div>
                <span className="font-label-lg font-bold block text-on-surface">จัดการเวรและเช็คชื่อช่างวันนี้</span>
                <span className="text-xs text-on-surface-variant">กำหนดว่าวันนี้ช่างท่านไหนมาทำงาน / หยุดงาน</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
          </button>
        )}

        {/* Roster Management */}
        <button
          onClick={onOpenRoster}
          className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">engineering</span>
            </div>
            <div>
              <span className="font-label-lg font-bold block text-on-surface">จัดการรายชื่อและเบอร์โทรทีมช่าง</span>
              <span className="text-xs text-on-surface-variant">เพิ่ม/แก้ไขเบอร์โทรศัพท์ช่าง, กำหนดความเชี่ยวชาญ</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
        </button>

        {/* Migration / CSV */}
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

        {/* Clear Demo / Reset All Tickets */}
        {onClearAllTickets && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-red-50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
              </div>
              <div>
                <span className="font-label-lg font-bold block text-red-700">ล้างข้อมูลรายการแจ้งซ่อมทั้งหมด</span>
                <span className="text-xs text-red-500">ล้างงานทั้งหมดในระบบเพื่อเริ่มระบบแบบคลีน (0 รายการ)</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-red-500 text-[20px]">chevron_right</span>
          </button>
        )}

      </div>

      {/* App Info */}
      <div className="text-center text-xs text-on-surface-variant pt-4 flex flex-col gap-1">
        <span className="font-bold text-primary">SCENERY VINTAGE FARM MAINTENANCE PRO</span>
        <span>ระบบแจ้งซ่อมและจัดการทีมช่าง • สวนผึ้ง ราชบุรี</span>
      </div>

      {/* Confirmation Dialog */}
      {showClearConfirm && (
        <ConfirmModal
          isOpen={showClearConfirm}
          title="ยืนยันการล้างข้อมูลแจ้งซ่อมทั้งหมด"
          message="คุณต้องการล้างรายการแจ้งซ่อมทั้งหมดในระบบเพื่อเริ่มต้นใหม่ใช่หรือไม่? (การกระทำนี้ไม่สามารถย้อนกลับได้)"
          confirmText="ยืนยันล้างข้อมูลทั้งหมด"
          cancelText="ยกเลิก"
          confirmVariant="danger"
          onConfirm={() => {
            setShowClearConfirm(false);
            if (onClearAllTickets) onClearAllTickets();
          }}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
    </div>
  );
};
