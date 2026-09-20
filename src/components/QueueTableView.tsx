import React, { useState } from 'react';
import { Ticket, Department, Technician } from '../types';
import { Phone, CheckCircle2, Clock, Wrench, AlertTriangle, ChevronRight, Eye } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface QueueTableViewProps {
  tickets: Ticket[];
  departments: Department[];
  technicians?: Technician[];
  onSelectTicket: (ticket: Ticket) => void;
  onQuickAccept?: (ticket: Ticket) => void;
}

export const QueueTableView: React.FC<QueueTableViewProps> = ({
  tickets,
  departments,
  technicians,
  onSelectTicket,
  onQuickAccept
}) => {
  const [callConfirmTech, setCallConfirmTech] = useState<{ name: string; phone: string } | null>(null);

  const deptMap = React.useMemo(() => {
    const map = new Map<string, Department>();
    departments.forEach(d => map.set(d.name, d));
    return map;
  }, [departments]);

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'critical':
        return <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[11px] font-extrabold border border-red-200">ด่วนวิกฤต</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[11px] font-bold border border-orange-200">ด่วนสูง</span>;
      case 'normal':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold border border-emerald-200">ปกติ</span>;
      case 'low':
      default:
        return <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">ไม่ด่วน</span>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-300">🟡 รอรับงาน</span>;
      case 'assigned':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 text-[11px] font-bold border border-blue-300">🔵 มอบหมายแล้ว</span>;
      case 'in_progress':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-300">🟢 กำลังซ่อม</span>;
      case 'waiting_parts':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-800 text-[11px] font-bold border border-orange-300">🟠 รออะไหล่</span>;
      case 'waiting_inspect':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 text-[11px] font-bold border border-purple-300">🟣 รอตรวจรับ</span>;
      case 'completed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 text-[11px] font-bold border border-teal-300">✅ เสร็จสิ้น</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">❌ ยกเลิก</span>;
      default:
        return <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px]">{s}</span>;
    }
  };

  if (tickets.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="bg-surface-container-lowest border border-dashed border-slate-300 rounded-3xl p-12 max-w-md mx-auto flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-primary-fixed/40 text-primary flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-on-surface">
            ยังไม่มีรายการงานซ่อมในระบบ
          </h3>
          <p className="text-xs text-on-surface-variant">
            เมื่อมีผู้แจ้งซ่อมเข้ามา งานจะมาปรากฏในตารางคิวนี้ทันที
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="bg-surface-container-lowest border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        
        {/* Responsive Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-container-low border-b border-slate-200 text-on-surface-variant font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 text-center w-16">คิวที่</th>
                <th className="py-3.5 px-4 w-32">รหัส / วันที่</th>
                <th className="py-3.5 px-4 w-44">แผนก & สถานที่</th>
                <th className="py-3.5 px-4 min-w-[200px]">ปัญหาที่แจ้งซ่อม</th>
                <th className="py-3.5 px-4 text-center w-28">ความเร่งด่วน</th>
                <th className="py-3.5 px-4 min-w-[180px]">ช่างผู้รับผิดชอบ & เบอร์โทร</th>
                <th className="py-3.5 px-4 text-center w-32">สถานะงาน</th>
                <th className="py-3.5 px-4 text-right w-28">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.map((ticket, idx) => {
                const isPending = ticket.status === 'pending';
                const queueNo = ticket.queueNumber || (idx + 1);

                return (
                  <tr 
                    key={ticket.id}
                    className="hover:bg-surface-container-low/60 transition-colors group cursor-pointer"
                    onClick={() => onSelectTicket(ticket)}
                  >
                    {/* คิวที่ */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs ${
                        ticket.priority === 'critical'
                          ? 'bg-red-600 text-white shadow-xs'
                          : isPending
                          ? 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold'
                          : 'bg-surface-container-high text-on-surface'
                      }`}>
                        #{queueNo}
                      </span>
                    </td>

                    {/* รหัส & วันที่ */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-primary text-xs">
                        {ticket.requestId}
                      </div>
                      <div className="text-[11px] text-on-surface-variant mt-0.5">
                        {new Date(ticket.createdAt).toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>

                    {/* แผนก & สถานที่ */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-on-surface truncate max-w-[170px]">
                        {ticket.department}
                      </div>
                      <div className="text-[11px] text-on-surface-variant truncate max-w-[170px] mt-0.5">
                        📍 {ticket.location}
                      </div>
                    </td>

                    {/* ปัญหาที่แจ้งซ่อม */}
                    <td className="py-3.5 px-4">
                      {ticket.category && (
                        <div className="mb-1">
                          <span className="px-2 py-0.5 rounded-md bg-primary-fixed/40 text-primary font-bold text-[10px]">
                            {ticket.category}
                          </span>
                        </div>
                      )}
                      <div className="font-bold text-on-surface text-xs line-clamp-1 group-hover:text-primary transition-colors">
                        {ticket.title}
                      </div>
                      <div className="text-[11px] text-on-surface-variant line-clamp-1 mt-0.5">
                        {ticket.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        ผู้แจ้ง: {ticket.requesterName} {ticket.requesterPhone && `(${ticket.requesterPhone})`}
                      </div>
                    </td>

                    {/* ความเร่งด่วน */}
                    <td className="py-3.5 px-4 text-center">
                      {getPriorityBadge(ticket.priority)}
                    </td>

                    {/* ช่างผู้รับผิดชอบ & เบอร์โทร */}
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      {ticket.technicianName ? (
                        <div className="flex items-center gap-2.5">
                          {(() => {
                            const tech = technicians?.find(t => t.name.toLowerCase() === ticket.technicianName?.toLowerCase());
                            if (tech?.avatarUrl) {
                              return (
                                <img 
                                  src={tech.avatarUrl} 
                                  alt={tech.name} 
                                  className="w-8 h-8 rounded-full object-cover border border-primary/30 shrink-0 shadow-xs" 
                                />
                              );
                            }
                            return (
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                {ticket.technicianName.slice(4, 5) || ticket.technicianName.slice(0, 1) || 'ช'}
                              </div>
                            );
                          })()}
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-on-surface text-xs truncate">
                              {ticket.technicianName}
                            </span>
                            {ticket.technicianPhone ? (
                              <button
                                type="button"
                                onClick={() => setCallConfirmTech({ name: ticket.technicianName!, phone: ticket.technicianPhone! })}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary-fixed/40 px-2 py-0.5 rounded-full hover:bg-primary hover:text-white transition-colors w-fit cursor-pointer active:scale-95 mt-0.5"
                                title="กดโทรออกหาช่าง"
                              >
                                <Phone className="w-2.5 h-2.5" />
                                <span>{ticket.technicianPhone}</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400">(ยังไม่มีเบอร์)</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-amber-700 font-semibold text-[11px]">
                          ยังไม่ได้มอบหมาย
                        </span>
                      )}
                    </td>

                    {/* สถานะงาน */}
                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(ticket.status)}
                    </td>

                    {/* การจัดการ */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {isPending && onQuickAccept && (
                          <button
                            type="button"
                            onClick={() => onQuickAccept(ticket)}
                            className="px-2.5 py-1.5 bg-primary hover:bg-primary-container text-white rounded-lg font-bold text-[11px] shadow-xs cursor-pointer active:scale-95 transition-all"
                            title="กดรับงานเข้าคิวทันที"
                          >
                            รับงาน
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onSelectTicket(ticket)}
                          className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
                          title="เปิดดูรายละเอียดใบงาน"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* Phone Call Confirmation Modal */}
      {callConfirmTech && (
        <ConfirmModal
          isOpen={!!callConfirmTech}
          title="ยืนยันการโทรออก"
          message={`คุณต้องการโทรติดต่อ "${callConfirmTech.name}" ที่หมายเลข ${callConfirmTech.phone} ใช่หรือไม่?`}
          confirmText="โทรออกทันที"
          cancelText="ยกเลิก"
          confirmVariant="primary"
          onConfirm={() => {
            window.location.href = `tel:${callConfirmTech.phone}`;
            setCallConfirmTech(null);
          }}
          onCancel={() => setCallConfirmTech(null)}
        />
      )}
    </div>
  );
};
