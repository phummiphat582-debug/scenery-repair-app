import React from 'react';
import { Clock, MapPin, User, CheckCircle, AlertTriangle, Zap, Wrench, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { Ticket, Department } from '../types';

interface TicketCardProps {
  ticket: Ticket;
  departmentInfo?: Department;
  onOpenEdit: (ticket: Ticket) => void;
  onQuickAccept: (ticket: Ticket) => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  departmentInfo,
  onOpenEdit,
  onQuickAccept
}) => {
  // Priority styles
  const priorityConfig = {
    critical: { label: '🚨 ด่วนที่สุด', bg: 'bg-rose-100 text-rose-800 border-rose-200' },
    high: { label: '⚡ ด่วนมาก', bg: 'bg-amber-100 text-amber-800 border-amber-200' },
    normal: { label: '🟡 ปกติ', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
    low: { label: '🟢 วางแผน', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  }[ticket.priority] || { label: ticket.priority, bg: 'bg-slate-100 text-slate-700' };

  // Status styles
  const statusConfig: Record<string, { label: string; border: string; badge: string }> = {
    pending: { label: 'รอดำเนินการ', border: 'border-l-amber-500', badge: 'bg-amber-100 text-amber-800' },
    assigned: { label: 'รับงานแล้ว', border: 'border-l-sky-500', badge: 'bg-sky-100 text-sky-800' },
    in_progress: { label: 'กำลังดำเนินการ', border: 'border-l-blue-600', badge: 'bg-blue-100 text-blue-800' },
    waiting_parts: { label: 'รออะไหล่', border: 'border-l-purple-600', badge: 'bg-purple-100 text-purple-800' },
    completed: { label: 'เสร็จสิ้น', border: 'border-l-emerald-500', badge: 'bg-emerald-100 text-emerald-800' },
    cancelled: { label: 'ยกเลิก', border: 'border-l-rose-500', badge: 'bg-rose-100 text-rose-800' },
  };

  const statusStyle = statusConfig[ticket.status] || statusConfig.pending;

  return (
    <article className={`bg-white rounded-2xl border border-slate-200/90 border-l-4 ${statusStyle.border} scenery-card-shadow scenery-card-hover p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden`}>
      
      <div>
        {/* Top Queue Indicator & Waiting Duration */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {ticket.queueNumber && ticket.status !== 'completed' && ticket.status !== 'cancelled' && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                ticket.isOverdue
                  ? 'bg-rose-600 text-white animate-pulse'
                  : ticket.queueNumber === 1
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-800 text-white'
              }`}>
                {ticket.queueNumber === 1 ? '🏆 คิวที่ 1' : `คิวที่ ${ticket.queueNumber}`}
              </span>
            )}

            {/* Waiting Time Badge */}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${
              ticket.isOverdue
                ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200'
                : 'bg-slate-100 text-slate-600'
            }`}>
              <Clock className="w-3 h-3" />
              <span>{ticket.waitingDurationText}</span>
              {ticket.isOverdue && <span className="text-rose-600">(ค้างเกิน 3 วัน)</span>}
            </span>
          </div>

          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${priorityConfig.bg}`}>
            {priorityConfig.label}
          </span>
        </div>

        {/* Request ID & Department Tag */}
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1">
          <span className="font-mono font-semibold">{ticket.requestId}</span>
          <span 
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold"
            style={{ 
              backgroundColor: `${departmentInfo?.color || '#0f766e'}15`,
              color: departmentInfo?.color || '#0f766e'
            }}
          >
            <span>{departmentInfo?.icon || '📌'}</span>
            <span>{ticket.department}</span>
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug my-1 hover:text-teal-700 transition-colors">
          {ticket.title}
        </h3>

        {/* Description snippet if any */}
        {ticket.description && (
          <p className="text-xs text-slate-600 line-clamp-2 my-1.5 leading-relaxed font-light">
            {ticket.description}
          </p>
        )}

        {/* Meta Info: Location & Requester */}
        <div className="grid grid-cols-1 gap-1 my-2 py-2 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-none" />
            <span className="truncate"><strong>สถานที่:</strong> {ticket.location}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <User className="w-3.5 h-3.5 text-slate-400 flex-none" />
            <span className="truncate"><strong>ผู้แจ้ง:</strong> {ticket.requesterName}</span>
          </div>
          {ticket.technicianName && (
            <div className="flex items-center gap-1.5 truncate text-teal-800">
              <Wrench className="w-3.5 h-3.5 text-teal-600 flex-none" />
              <span className="truncate"><strong>ช่าง:</strong> {ticket.technicianName}</span>
            </div>
          )}
        </div>

        {/* Request Image Link */}
        {ticket.requestImageUrl && ticket.requestImageUrl !== '-' && (
          <div className="mb-2">
            <a
              href={ticket.requestImageUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline bg-teal-50 px-2 py-1 rounded-md"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>ดูรูปที่ผู้แจ้งแนบ</span>
            </a>
          </div>
        )}
      </div>

      {/* Card Actions Footer */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${statusStyle.badge}`}>
          {statusStyle.label}
        </span>

        <div className="flex items-center gap-1.5">
          {ticket.status === 'pending' && (
            <button
              onClick={() => onQuickAccept(ticket)}
              className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
              title="รับงานและปรับเป็นกำลังทำทันที"
            >
              <Zap className="w-3 h-3" />
              <span>รับงาน</span>
            </button>
          )}

          <button
            onClick={() => onOpenEdit(ticket)}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
          >
            <span>จัดการงาน</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </article>
  );
};
