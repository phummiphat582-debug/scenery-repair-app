import React, { useState, useMemo } from 'react';
import { Ticket, Department, ViewMode, SortOrder, Technician } from '../types';
import { QueueControls } from './QueueControls';
import { TicketList } from './TicketList';
import { DepartmentBoard } from './DepartmentBoard';
import { UrgentAlertBanner } from './UrgentAlertBanner';
import { QueueTableView } from './QueueTableView';
import { DivisionFilterTabs } from './DivisionFilterTabs';
import { RepairSummaryView } from './RepairSummaryView';
import { BarChart2 } from 'lucide-react';

interface AllRequestsViewProps {
  tickets: Ticket[];
  departments: Department[];
  technicians?: Technician[];
  onSelectTicket: (ticket: Ticket) => void;
  onQuickAccept: (ticket: Ticket) => void;
  onOpenCompleteModal?: (ticket: Ticket) => void;
  onDeleteTicket?: (ticket: Ticket) => void;
}

export const AllRequestsView: React.FC<AllRequestsViewProps> = ({
  tickets,
  departments,
  technicians,
  onSelectTicket,
  onQuickAccept,
  onOpenCompleteModal,
  onDeleteTicket
}) => {
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [onlyUrgent, setOnlyUrgent] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('fifo');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);

  // Urgent tickets for banner (scoped to current division)
  const urgentTickets = useMemo(() => {
    return tickets.filter(t => 
      (selectedDivision === 'all' || (t.division || '84') === selectedDivision) &&
      (t.priority === 'critical' || t.priority === 'high' || t.isOverdue) &&
      t.status !== 'completed' && 
      t.status !== 'cancelled'
    );
  }, [tickets, selectedDivision]);

  // Status counts for QueueControls pills (scoped to selected division)
  const statusCounts = useMemo(() => {
    const divTickets = selectedDivision === 'all'
      ? tickets
      : tickets.filter(t => (t.division || '84') === selectedDivision);

    return {
      all: divTickets.length,
      active: divTickets.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length,
      pending: divTickets.filter(t => t.status === 'pending' || t.status === 'assigned').length,
      in_progress: divTickets.filter(t => t.status === 'in_progress').length,
      waiting_parts: divTickets.filter(t => t.status === 'waiting_parts').length,
      completed: divTickets.filter(t => t.status === 'completed' || t.status === 'waiting_inspect').length,
      cancelled: divTickets.filter(t => t.status === 'cancelled').length
    };
  }, [tickets, selectedDivision]);

  // Filtered & Sorted tickets
  const filteredTickets = useMemo(() => {
    let result = [...tickets];

    if (selectedDivision !== 'all') {
      result = result.filter(t => (t.division || '84') === selectedDivision);
    }

    if (selectedDepartment !== 'all') {
      result = result.filter(t => t.department === selectedDepartment);
    }

    if (statusFilter === 'active') {
      result = result.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
    } else if (statusFilter === 'pending') {
      result = result.filter(t => t.status === 'pending' || t.status === 'assigned');
    } else if (statusFilter === 'in_progress') {
      result = result.filter(t => t.status === 'in_progress');
    } else if (statusFilter === 'waiting_parts') {
      result = result.filter(t => t.status === 'waiting_parts');
    } else if (statusFilter === 'completed') {
      result = result.filter(t => t.status === 'completed' || t.status === 'waiting_inspect');
    } else if (statusFilter === 'cancelled') {
      result = result.filter(t => t.status === 'cancelled');
    }

    if (onlyUrgent) {
      result = result.filter(t => t.priority === 'critical' || t.priority === 'high' || t.isOverdue);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.requestId.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.location.toLowerCase().includes(q) ||
        t.requesterName.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortOrder === 'fifo') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortOrder === 'lifo') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        const pMap = { critical: 4, high: 3, normal: 2, low: 1 };
        return (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
      }
    });

    // Assign queue numbers
    return result.map((t, idx) => ({
      ...t,
      queueNumber: idx + 1
    }));
  }, [tickets, selectedDivision, selectedDepartment, statusFilter, onlyUrgent, searchQuery, sortOrder]);

  return (
    <div className="flex flex-col w-full pb-20">
      
      {/* 0. Division Filter Tabs (84 ซ่อมบำรุง, 85 ก่อสร้าง, 86 งานศิลป์) */}
      <div className="px-4 pt-2 pb-1 bg-surface-container-low/50 border-b border-slate-200/60 flex items-center justify-between gap-2 flex-wrap">
        <DivisionFilterTabs
          selectedDivision={selectedDivision}
          onSelectDivision={setSelectedDivision}
          tickets={tickets}
        />
        <button
          type="button"
          onClick={() => setIsSummaryModalOpen(true)}
          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 ml-auto"
          title="ดูสรุปรายงานการซ่อมภาพรวมและสถิติแยกแผนก พร้อมพิมพ์ PDF"
        >
          <BarChart2 className="w-3.5 h-3.5 text-emerald-700" />
          <span>📊 สรุปรายงาน / พิมพ์ PDF</span>
        </button>
      </div>

      {/* 1. Urgent Task Alert Ribbon */}
      <UrgentAlertBanner
        urgentTickets={urgentTickets}
        onViewUrgent={() => setOnlyUrgent(!onlyUrgent)}
        isOnlyUrgentActive={onlyUrgent}
      />

      {/* 3. Controls */}
      <QueueControls
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusCounts={statusCounts}
        onlyUrgent={onlyUrgent}
        onToggleUrgent={() => setOnlyUrgent(!onlyUrgent)}
      />

      {/* 4. Table, Cards or Board View */}
      {viewMode === 'table' ? (
        <QueueTableView
          tickets={filteredTickets}
          departments={departments}
          technicians={technicians}
          onSelectTicket={onSelectTicket}
          onQuickAccept={onQuickAccept}
          onOpenCompleteModal={onOpenCompleteModal}
          onDeleteTicket={onDeleteTicket}
        />
      ) : viewMode === 'queue' ? (
        <TicketList
          tickets={filteredTickets}
          departments={departments}
          onOpenEdit={onSelectTicket}
          onQuickAccept={onQuickAccept}
          onOpenCompleteModal={onOpenCompleteModal}
          onDeleteTicket={onDeleteTicket}
        />
      ) : (
        <DepartmentBoard
          tickets={filteredTickets}
          departments={departments}
          onOpenEdit={onSelectTicket}
          onQuickAccept={onQuickAccept}
          onOpenCompleteModal={onOpenCompleteModal}
          onDeleteTicket={onDeleteTicket}
        />
      )}

      {/* Repair Summary Modal (สำหรับดูรายงานและพิมพ์ PDF จากหน้ารายการ) */}
      {isSummaryModalOpen && (
        <RepairSummaryView
          tickets={tickets}
          departments={departments}
          technicians={technicians}
          isModal={true}
          onClose={() => setIsSummaryModalOpen(false)}
        />
      )}

    </div>
  );
};
