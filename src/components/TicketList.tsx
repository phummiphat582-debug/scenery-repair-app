import React from 'react';
import { Ticket, Department } from '../types';
import { TicketCard } from './TicketCard';
import { CheckCircle2, Wrench } from 'lucide-react';

interface TicketListProps {
  tickets: Ticket[];
  departments: Department[];
  onOpenEdit: (ticket: Ticket) => void;
  onQuickAccept: (ticket: Ticket) => void;
}

export const TicketList: React.FC<TicketListProps> = ({
  tickets,
  departments,
  onOpenEdit,
  onQuickAccept
}) => {
  const deptMap = React.useMemo(() => {
    const map = new Map<string, Department>();
    departments.forEach(d => map.set(d.name, d));
    return map;
  }, [departments]);

  if (!tickets.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 mx-auto flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">ไม่มีรายการงานซ่อมในเงื่อนไขนี้</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ยอดเยี่ยมมาก! ไม่มีงานค้างในแผนกหรือตัวกรองที่เลือก
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {tickets.map(ticket => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            departmentInfo={deptMap.get(ticket.department)}
            onOpenEdit={onOpenEdit}
            onQuickAccept={onQuickAccept}
          />
        ))}
      </div>
    </div>
  );
};
