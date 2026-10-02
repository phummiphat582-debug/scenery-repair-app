import React, { useState } from 'react';
import { Bell, BellRing, CheckCircle2, Loader2, X } from 'lucide-react';
import { oneSignalService } from '../services/oneSignalService';

const PUSH_PROMPT_STORAGE_KEY = 'scenery_technician_push_prompt_dismissed';

export const TechnicianPushPrompt: React.FC = () => {
  // If user already clicked or dismissed once, or notifications are already granted, don't show
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    if (!oneSignalService.isConfigured) return false;
    const isDismissed = localStorage.getItem(PUSH_PROMPT_STORAGE_KEY) === 'true';
    if (isDismissed) return false;
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      return false;
    }
    return true;
  });

  const [state, setState] = useState<'idle' | 'loading' | 'enabled' | 'denied' | 'unavailable'>('idle');

  if (!isVisible) return null;

  const markDismissed = () => {
    try {
      localStorage.setItem(PUSH_PROMPT_STORAGE_KEY, 'true');
    } catch {}
  };

  const handleDismiss = () => {
    markDismissed();
    setIsVisible(false);
  };

  const handleEnable = async () => {
    markDismissed();
    setState('loading');
    const result = await oneSignalService.enableTechnicianNotifications();
    setState(result);

    // If successfully enabled, trigger a test push and show confirmation for 4 seconds, then hide
    if (result === 'enabled') {
      void oneSignalService.testPushNotification();
      setTimeout(() => {
        setIsVisible(false);
      }, 4000);
    }
  };

  if (state === 'enabled') {
    return (
      <div className="mx-auto mb-4 flex w-[calc(100%-2rem)] max-w-7xl items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 shadow-sm animate-in fade-in duration-200">
        <div className="flex items-center gap-3">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold">เปิดแจ้งเตือนงานเข้าเรียบร้อยแล้ว ✅ (กำลังส่งสัญญาณทดสอบเข้ามือถือคุณ)</span>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-lg hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
          title="ปิด"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto mb-4 flex w-[calc(100%-2rem)] max-w-7xl flex-col gap-3 rounded-2xl border border-primary/20 bg-primary-fixed/40 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between relative animate-in fade-in duration-200">
      <div className="flex items-start gap-3 pr-6 sm:pr-0">
        <div className="rounded-xl bg-primary p-2 text-on-primary shrink-0">
          <BellRing size={20} />
        </div>
        <div>
          <p className="font-semibold text-on-surface text-sm sm:text-base">รับแจ้งเตือนเมื่อมีงานใหม่</p>
          <p className="text-xs text-on-surface-variant">เปิดบนมือถือเครื่องนี้ เพื่อให้ทีมช่างเห็นงานเข้าแม้ไม่ได้เปิดหน้าเว็บค้างไว้</p>
          {state === 'denied' && (
            <p className="mt-1 text-xs font-medium text-error">การแจ้งเตือนถูกปิดไว้ ให้เปิดสิทธิ์ Notifications ในการตั้งค่าเบราว์เซอร์</p>
          )}
          {state === 'unavailable' && (
            <p className="mt-1 text-xs font-medium text-error">ยังตั้งค่า OneSignal ไม่ครบ กรุณาตรวจ App ID และ Service Worker</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <button
          type="button"
          onClick={handleEnable}
          disabled={state === 'loading'}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs sm:text-sm font-bold text-on-primary shadow-sm transition hover:brightness-95 disabled:cursor-wait disabled:opacity-70 cursor-pointer"
        >
          {state === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <Bell size={16} />}
          {state === 'loading' ? 'กำลังเปิด...' : 'เปิดแจ้งเตือน'}
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-black/5 transition-colors cursor-pointer"
          title="ไม่ต้องแสดงอีก"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
