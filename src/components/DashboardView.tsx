import React from 'react';
import { Ticket, Department, Technician } from '../types';
import { CheckCircle2, Clock, AlertTriangle, Building2, Wrench, ShieldAlert, Zap, TrendingUp } from 'lucide-react';

interface DashboardViewProps {
  tickets: Ticket[];
  departments: Department[];
  technicians: Technician[];
  onOpenEdit: (ticket: Ticket) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tickets,
  departments,
  technicians,
  onOpenEdit
}) => {
  // Statistics
  const total = tickets.length;
  const pending = tickets.filter(t => t.status === 'pending').length;
  const inProgress = tickets.filter(t => t.status === 'assigned' || t.status === 'in_progress').length;
  const waitingParts = tickets.filter(t => t.status === 'waiting_parts').length;
  const completed = tickets.filter(t => t.status === 'completed').length;
  const critical = tickets.filter(t => t.priority === 'critical' && t.status !== 'completed' && t.status !== 'cancelled').length;
  const overdue = tickets.filter(t => t.isOverdue).length;

  // Department Distribution
  const deptStats = React.useMemo(() => {
    const counts: Record<string, { total: number; active: number; completed: number }> = {};
    departments.forEach(d => { counts[d.name] = { total: 0, active: 0, completed: 0 }; });

    tickets.forEach(t => {
      if (!counts[t.department]) counts[t.department] = { total: 0, active: 0, completed: 0 };
      counts[t.department].total++;
      if (t.status === 'completed') counts[t.department].completed++;
      else if (t.status !== 'cancelled') counts[t.department].active++;
    });

    return counts;
  }, [tickets, departments]);

  // Technician Distribution
  const techStats = React.useMemo(() => {
    const counts: Record<string, { active: number; completed: number }> = {};
    technicians.forEach(t => { counts[t.name] = { active: 0, completed: 0 }; });

    tickets.forEach(t => {
      if (t.technicianName) {
        if (!counts[t.technicianName]) counts[t.technicianName] = { active: 0, completed: 0 };
        if (t.status === 'completed') counts[t.technicianName].completed++;
        else if (t.status !== 'cancelled') counts[t.technicianName].active++;
      }
    });

    return counts;
  }, [tickets, technicians]);

  // Overdue tickets (> 3 days)
  const overdueTickets = tickets.filter(t => t.isOverdue);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 scenery-card-shadow text-center">
          <div className="text-2xl sm:text-3xl font-bold text-teal-800">{total}</div>
          <div className="text-xs font-semibold text-slate-500 mt-1">งานทั้งหมด</div>
        </div>
        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 scenery-card-shadow text-center">
          <div className="text-2xl sm:text-3xl font-bold text-rose-700">{critical + overdue}</div>
          <div className="text-xs font-semibold text-rose-800 mt-1">งานด่วน/ค้างเกิน</div>
        </div>
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 scenery-card-shadow text-center">
          <div className="text-2xl sm:text-3xl font-bold text-amber-700">{pending}</div>
          <div className="text-xs font-semibold text-amber-800 mt-1">รอดำเนินการ</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 scenery-card-shadow text-center">
          <div className="text-2xl sm:text-3xl font-bold text-blue-700">{inProgress}</div>
          <div className="text-xs font-semibold text-blue-800 mt-1">กำลังดำเนินการ</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200 scenery-card-shadow text-center">
          <div className="text-2xl sm:text-3xl font-bold text-purple-700">{waitingParts}</div>
          <div className="text-xs font-semibold text-purple-800 mt-1">รออะไหล่</div>
        </div>
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 scenery-card-shadow text-center">
          <div className="text-2xl sm:text-3xl font-bold text-emerald-700">{completed}</div>
          <div className="text-xs font-semibold text-emerald-800 mt-1">เสร็จสิ้นแล้ว</div>
        </div>
      </div>

      {/* Grid: Department Breakdown & Technician Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Department Workload */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 scenery-card-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-700" />
              <span>ภาระงานแยกตามแผนก (Department Breakdown)</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">9 แผนกหลัก</span>
          </div>

          <div className="space-y-3">
            {departments.map(d => {
              const stat = deptStats[d.name] || { total: 0, active: 0, completed: 0 };
              const percent = total ? Math.round((stat.total / total) * 100) : 0;

              return (
                <div key={d.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <span>{d.icon}</span>
                      <span>{d.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-teal-700 font-bold">{stat.active} งานค้าง</span>
                      <span className="text-slate-400">/</span>
                      <span className="text-slate-500">{stat.completed} เสร็จ</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                    <div 
                      className="h-full bg-teal-600 rounded-l-full" 
                      style={{ width: `${percent}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Technician Workload */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 scenery-card-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <Wrench className="w-4 h-4 text-teal-700" />
              <span>การกระจายงานทีมช่าง (Technician Allocation)</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">{technicians.length} คน</span>
          </div>

          <div className="space-y-3">
            {technicians.map(t => {
              const stat = techStats[t.name] || { active: 0, completed: 0 };

              return (
                <div key={t.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800">{t.name}</div>
                    <div className="text-[11px] text-slate-500">{t.role}</div>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <span className="px-2 py-1 rounded-md bg-teal-100 text-teal-800 font-bold">
                      {stat.active} งานค้าง
                    </span>
                    <span className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                      {stat.completed} เสร็จ
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Overdue Tickets List (> 3 days) */}
      <div className="bg-white p-5 rounded-3xl border border-rose-200 scenery-card-shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-rose-900 text-sm sm:text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>งานค้างเกินกำหนด (FIFO Overdue &gt; 3 วัน)</span>
          </h3>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white">
            {overdueTickets.length} งาน
          </span>
        </div>

        {overdueTickets.length === 0 ? (
          <div className="p-6 text-center text-emerald-700 font-bold text-xs bg-emerald-50 rounded-2xl border border-emerald-200">
            🎉 ยอดเยี่ยมมาก! ไม่มีงานค้างเกิน 3 วันในระบบเลย
          </div>
        ) : (
          <div className="space-y-2">
            {overdueTickets.map(t => (
              <div 
                key={t.id} 
                onClick={() => onOpenEdit(t)}
                className="p-3.5 bg-rose-50/70 hover:bg-rose-100/70 border border-rose-200 rounded-xl flex items-center justify-between text-xs cursor-pointer transition-colors"
              >
                <div>
                  <div className="font-bold text-slate-900">{t.requestId} · {t.title}</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">🏢 {t.department} · 📍 {t.location}</div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-rose-700 bg-white px-2 py-1 rounded-md border border-rose-200">
                    ⏱️ รอมาแล้ว {t.ageDays} วัน
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
