import React from 'react';
import { AlertCircle, Clock, ChevronRight, Zap } from 'lucide-react';
import { Ticket } from '../types';

interface UrgentAlertBannerProps {
  urgentTickets: Ticket[];
  onViewUrgent: () => void;
  isOnlyUrgentActive: boolean;
}

export const UrgentAlertBanner: React.FC<UrgentAlertBannerProps> = ({
  urgentTickets,
  onViewUrgent,
  isOnlyUrgentActive
}) => {
  if (!urgentTickets.length) return null;

  const criticalCount = urgentTickets.filter(t => t.priority === 'critical').length;
  const overdueCount = urgentTickets.filter(t => t.isOverdue).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        criticalCount > 0 || overdueCount > 0
          ? 'bg-rose-50 border-rose-200 text-rose-950'
          : 'bg-amber-50 border-amber-200 text-amber-950'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl text-white shadow-sm flex-none animate-pulse ${
            criticalCount > 0 || overdueCount > 0 ? 'bg-rose-600' : 'bg-amber-600'
          }`}>
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-bold text-sm">
              <span>แจ้งเตือนคิวงานเร่งด่วน!</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold">
                {urgentTickets.length} รายการ
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {criticalCount > 0 && `🚨 ด่วนที่สุด ${criticalCount} งาน `}
              {overdueCount > 0 && `⚠️ ค้างเกิน 3 วัน ${overdueCount} งาน `}
              กรุณาเข้าดำเนินการก่อนเพื่อไม่ให้กระทบการบริการ
            </p>
          </div>
        </div>

        <button
          onClick={onViewUrgent}
          className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isOnlyUrgentActive
              ? 'bg-slate-900 text-white'
              : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300/80 shadow-xs'
          }`}
        >
          <span>{isOnlyUrgentActive ? 'แสดงงานทั้งหมด' : 'กรองเฉพาะงานด่วน'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
