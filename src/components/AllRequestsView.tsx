import React, { useState, useMemo } from 'react';
import { Ticket, Department, ViewMode, SortOrder } from '../types';
import { DepartmentTabs } from './DepartmentTabs';
import { QueueControls } from './QueueControls';
import { TicketList } from './TicketList';
import { DepartmentBoard } from './DepartmentBoard';
import { UrgentAlertBanner } from './UrgentAlertBanner';

interface AllRequestsViewProps {
  tickets: Ticket[];
  departments: Department[];
  onSelectTicket: (ticket: Ticket) => void;
  onQuickAccept: (ticket: Ticket) => void;
}

export const AllRequestsView: React.FC<AllRequestsViewProps> = ({
  tickets,
  departments,
  onSelectTicket,
  onQuickAccept
}) => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [onlyUrgent, setOnlyUrgent] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('fifo');
  const [viewMode, setViewMode] = useState<ViewMode>('queue');

  // Urgent tickets for banner
  const urgentTickets = useMemo(() => {
    return tickets.filter(t => 
      (t.priority === 'critical' || t.priority === 'high' || t.isOverdue) &&
      t.status !== 'completed' && 
      t.status !== 'cancelled'
    );
  }, [tickets]);

  // Department counts
  const departmentCounts = useMemo(() => {
    const map: Record<string, { total: number; urgent: number }> = {};
    departments.forEach(d => { map[d.name] = { total: 0, urgent: 0 }; });

    tickets.forEach(t => {
      if (t.status !== 'completed' && t.status !== 'cancelled') {
        if (!map[t.department]) map[t.department] = { total: 0, urgent: 0 };
        map[t.department].total++;
        if (t.priority === 'critical' || t.priority === 'high' || t.isOverdue) {
          map[t.department].urgent++;
        }
      }
    });

    return map;
  }, [tickets, departments]);

  const totalActiveCount = useMemo(() => {
    return tickets.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length;
  }, [tickets]);

  // Filtered & Sorted tickets
  const filteredTickets = useMemo(() => {
    let result = [...tickets];

    if (selectedDepartment !== 'all') {
      result = result.filter(t => t.department === selectedDepartment);
    }

    if (statusFilter === 'active') {
      result = result.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
    } else if (statusFilter === 'pending') {
      result = result.filter(t => t.status === 'pending' || t.status === 'assigned');
    } else if (statusFilter === 'in_progress') {
      result = result.filter(t => t.status === 'in_progress' || t.status === 'waiting_parts');
    } else if (statusFilter === 'completed') {
      result = result.filter(t => t.status === 'completed');
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
  }, [tickets, selectedDepartment, statusFilter, onlyUrgent, searchQuery, sortOrder]);

  return (
    <div className="flex flex-col w-full pb-20">
      
      {/* 1. Department Tabs */}
      <DepartmentTabs
        departments={departments}
        selectedDepartment={selectedDepartment}
        onSelectDepartment={setSelectedDepartment}
        departmentCounts={departmentCounts}
        totalActiveCount={totalActiveCount}
      />

      {/* 2. Urgent Task Alert Ribbon */}
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
        onlyUrgent={onlyUrgent}
        onToggleUrgent={() => setOnlyUrgent(!onlyUrgent)}
      />

      {/* 4. List or Board View */}
      {viewMode === 'queue' ? (
        <TicketList
          tickets={filteredTickets}
          departments={departments}
          onOpenEdit={onSelectTicket}
          onQuickAccept={onQuickAccept}
        />
      ) : (
        <DepartmentBoard
          tickets={filteredTickets}
          departments={departments}
          onOpenEdit={onSelectTicket}
          onQuickAccept={onQuickAccept}
        />
      )}

    </div>
  );
};
