import React from 'react';
import { Search, LayoutGrid, ListFilter, ArrowUpDown, Clock, Zap, Table } from 'lucide-react';
import { ViewMode, SortOrder, TicketStatus } from '../types';

interface QueueControlsProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  statusCounts?: Record<string, number>;
  onlyUrgent: boolean;
  onToggleUrgent: () => void;
}

export const QueueControls: React.FC<QueueControlsProps> = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortOrder,
  onSortOrderChange,
  statusFilter,
  onStatusFilterChange,
  statusCounts,
  onlyUrgent,
  onToggleUrgent
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
      <div className="flex flex-col gap-3">
        
        {/* Top Controls: Search + View Switcher + Sort */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ค้นหาชื่องาน, เลขที่, สถานที่, ผู้แจ้ง..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto justify-between sm:justify-end">
            
            {/* View Mode Toggle: Table vs Cards vs Board */}
            <div className="inline-flex p-1 bg-slate-200/80 rounded-xl">
              <button
                onClick={() => onViewModeChange('table')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-primary font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="มุมมองตารางคิวงาน (ดูง่ายเข้าใจง่าย)"
              >
                <Table className="w-3.5 h-3.5" />
                <span>ตารางคิวงาน</span>
              </button>

              <button
                onClick={() => onViewModeChange('queue')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'queue'
                    ? 'bg-white text-primary font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="มุมมองการ์ดคิวงาน"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>การ์ดคิวงาน</span>
              </button>

              <button
                onClick={() => onViewModeChange('department_board')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'department_board'
                    ? 'bg-white text-primary font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="มุมมองบอร์ดแยกแผนก"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>บอร์ดแผนก</span>
              </button>
            </div>

            {/* FIFO Sort Toggle Button */}
            <select
              value={sortOrder}
              onChange={(e) => onSortOrderChange(e.target.value as SortOrder)}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-teal-600 shadow-xs cursor-pointer"
            >
              <option value="fifo">⏱️ แจ้งก่อนขึ้นก่อน (FIFO)</option>
              <option value="lifo">🕒 ล่าสุดขึ้นก่อน (LIFO)</option>
              <option value="priority">🚨 ความด่วนขึ้นก่อน</option>
            </select>

          </div>
        </div>

        {/* Status Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => onStatusFilterChange('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex-none flex items-center gap-1.5 ${
              statusFilter === 'all'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>📋 ทั้งหมด</span>
            {statusCounts?.all !== undefined && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                statusFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {statusCounts.all}
              </span>
            )}
          </button>

          <button
            onClick={() => onStatusFilterChange('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex-none flex items-center gap-1.5 ${
              statusFilter === 'active'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>🔥 งานรอซ่อม</span>
            {statusCounts?.active !== undefined && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                statusFilter === 'active' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {statusCounts.active}
              </span>
            )}
          </button>

          <button
            onClick={() => onStatusFilterChange('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex-none flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100/70'
            }`}
          >
            <span>⏳ รอรับงาน</span>
            {statusCounts?.pending !== undefined && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                statusFilter === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-900'
              }`}>
                {statusCounts.pending}
              </span>
            )}
          </button>

          <button
            onClick={() => onStatusFilterChange('in_progress')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex-none flex items-center gap-1.5 ${
              statusFilter === 'in_progress'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100/70'
            }`}
          >
            <span>🔧 กำลังซ่อม</span>
            {statusCounts?.in_progress !== undefined && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                statusFilter === 'in_progress' ? 'bg-white/20 text-white' : 'bg-blue-200 text-blue-900'
              }`}>
                {statusCounts.in_progress}
              </span>
            )}
          </button>

          <button
            onClick={() => onStatusFilterChange('waiting_parts')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex-none flex items-center gap-1.5 ${
              statusFilter === 'waiting_parts'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100/70'
            }`}
          >
            <span>📦 รออะไหล่</span>
            {statusCounts?.waiting_parts !== undefined && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                statusFilter === 'waiting_parts' ? 'bg-white/20 text-white' : 'bg-purple-200 text-purple-900'
              }`}>
                {statusCounts.waiting_parts}
              </span>
            )}
          </button>

          <button
            onClick={() => onStatusFilterChange('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex-none flex items-center gap-1.5 ${
              statusFilter === 'completed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100/70'
            }`}
          >
            <span>✅ เสร็จสิ้น</span>
            {statusCounts?.completed !== undefined && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                statusFilter === 'completed' ? 'bg-white/20 text-white' : 'bg-emerald-200 text-emerald-900'
              }`}>
                {statusCounts.completed}
              </span>
            )}
          </button>

          <button
            onClick={() => onStatusFilterChange('cancelled')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex-none flex items-center gap-1.5 ${
              statusFilter === 'cancelled'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-rose-50 text-rose-900 border border-rose-200 hover:bg-rose-100/70'
            }`}
          >
            <span>🚫 ยกเลิกแล้ว</span>
            {statusCounts?.cancelled !== undefined && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                statusFilter === 'cancelled' ? 'bg-white/20 text-white' : 'bg-rose-200 text-rose-900'
              }`}>
                {statusCounts.cancelled}
              </span>
            )}
          </button>

          {/* Urgent Toggle Button */}
          <button
            onClick={onToggleUrgent}
            className={`ml-auto px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex-none flex items-center gap-1 ${
              onlyUrgent
                ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-300'
                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>เฉพาะงานด่วน</span>
          </button>
        </div>

      </div>
    </div>
  );
};
