import React from 'react';
import { Ticket, Department } from '../types';
import { TicketCard } from './TicketCard';
import { Building2, AlertCircle } from 'lucide-react';

interface DepartmentBoardProps {
  tickets: Ticket[];
  departments: Department[];
  onOpenEdit: (ticket: Ticket) => void;
  onQuickAccept: (ticket: Ticket) => void;
}

export const DepartmentBoard: React.FC<DepartmentBoardProps> = ({
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

  // Group active tickets by department
  const ticketsByDept = React.useMemo(() => {
    const groups: Record<string, Ticket[]> = {};
    departments.forEach(d => { groups[d.name] = []; });

    tickets.forEach(ticket => {
      if (!groups[ticket.department]) groups[ticket.department] = [];
      groups[ticket.department].push(ticket);
    });

    return groups;
  }, [tickets, departments]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map(dept => {
          const deptTickets = ticketsByDept[dept.name] || [];
          const urgentCount = deptTickets.filter(t => t.priority === 'critical' || t.priority === 'high' || t.isOverdue).length;

          return (
            <div 
              key={dept.id}
              className="bg-slate-100/70 border border-slate-200 rounded-2xl p-4 flex flex-col h-full"
            >
              {/* Department Lane Header */}
              <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{dept.icon}</span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{dept.name}</h3>
                    <p className="text-[11px] text-slate-500 font-light truncate max-w-[170px]">{dept.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {urgentCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold text-[10px] animate-pulse">
                      🚨 {urgentCount} ด่วน
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-slate-800 font-bold text-xs border border-slate-200">
                    {deptTickets.length}
                  </span>
                </div>
              </div>

              {/* Lane Tickets List */}
              <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[700px] pr-1">
                {deptTickets.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs bg-white/60 rounded-xl border border-dashed border-slate-200">
                    ไม่มีงานค้างในแผนกนี้
                  </div>
                ) : (
                  deptTickets.map(ticket => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      departmentInfo={dept}
                      onOpenEdit={onOpenEdit}
                      onQuickAccept={onQuickAccept}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
