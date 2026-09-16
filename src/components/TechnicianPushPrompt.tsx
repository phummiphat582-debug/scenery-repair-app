import React, { useState } from 'react';
import { Bell, BellRing, CheckCircle2, Loader2 } from 'lucide-react';
import { oneSignalService } from '../services/oneSignalService';

export const TechnicianPushPrompt: React.FC = () => {
  const [state, setState] = useState<'idle' | 'loading' | 'enabled' | 'denied' | 'unavailable'>('idle');

  if (!oneSignalService.isConfigured || state === 'enabled') {
    if (state !== 'enabled') return null;
    return (
      <div className="mx-auto mb-5 flex w-[calc(100%-2rem)] max-w-7xl items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 shadow-sm">
        <CheckCircle2 size={20} />
        <span className="text-sm font-semibold">เปิดแจ้งเตือนงานเข้าให้ทีมช่างแล้ว</span>
      </div>
    );
  }

  const handleEnable = async () => {
    setState('loading');
    const result = await oneSignalService.enableTechnicianNotifications();
    setState(result);
  };

  return (
    <div className="mx-auto mb-5 flex w-[calc(100%-2rem)] max-w-7xl flex-col gap-3 rounded-2xl border border-primary/20 bg-primary-fixed/40 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary p-2 text-on-primary"><BellRing size={20} /></div>
        <div>
          <p className="font-semibold text-on-surface">รับแจ้งเตือนเมื่อมีงานใหม่</p>
          <p className="text-xs text-on-surface-variant">เปิดบนมือถือเครื่องนี้ เพื่อให้ทีมช่างเห็นงานเข้าแม้ไม่ได้เปิดหน้าเว็บค้างไว้</p>
          {state === 'denied' && <p className="mt-1 text-xs font-medium text-error">การแจ้งเตือนถูกปิดไว้ ให้เปิดสิทธิ์ Notifications ในการตั้งค่าเบราว์เซอร์</p>}
          {state === 'unavailable' && <p className="mt-1 text-xs font-medium text-error">ยังตั้งค่า OneSignal ไม่ครบ กรุณาตรวจ App ID และ Service Worker</p>}
        </div>
      </div>
      <button type="button" onClick={handleEnable} disabled={state === 'loading'} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary shadow-sm transition hover:brightness-95 disabled:cursor-wait disabled:opacity-70">
        {state === 'loading' ? <Loader2 size={17} className="animate-spin" /> : <Bell size={17} />}
        {state === 'loading' ? 'กำลังเปิด...' : 'เปิดแจ้งเตือน'}
      </button>
    </div>
  );
};
