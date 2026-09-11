import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { DepartmentTabs } from './components/DepartmentTabs';
import { UrgentAlertBanner } from './components/UrgentAlertBanner';
import { QueueControls } from './components/QueueControls';
import { TicketList } from './components/TicketList';
import { DepartmentBoard } from './components/DepartmentBoard';
import { NewTicketModal } from './components/NewTicketModal';
import { EditTicketModal } from './components/EditTicketModal';
import { MigrationModal } from './components/MigrationModal';
import { DashboardView } from './components/DashboardView';
import { TechnicianRosterModal } from './components/TechnicianRosterModal';
import { Toast } from './components/Toast';
import { ticketService } from './services/ticketService';
import { Ticket, Department, Technician, ViewMode, SortOrder } from './types';
import confetti from 'canvas-confetti';

export const App: React.FC = () => {
  // Data state
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & View state
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [onlyUrgent, setOnlyUrgent] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('fifo');
  const [viewMode, setViewMode] = useState<ViewMode>('queue');
  const [isDashboardOpen, setIsDashboardOpen] = useState<boolean>(false);

  // Modals state
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load Initial Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [depts, techs, tix] = await Promise.all([
        ticketService.getDepartments(),
        ticketService.getTechnicians(),
        ticketService.getTickets({
          department: selectedDepartment,
          statusFilter,
          onlyUrgent,
          searchQuery,
          sortOrder
        })
      ]);
      setDepartments(depts);
      setTechnicians(techs);
      setTickets(tix);
    } catch (e: any) {
      showToast('โหลดข้อมูลไม่สำเร็จ: ' + e.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDepartment, statusFilter, onlyUrgent, searchQuery, sortOrder]);

  // Urgent tickets for alert banner
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

  // Handlers
  const handleCreateTicket = async (ticketData: any) => {
    const created = await ticketService.createTicket(ticketData);
    showToast(`สร้างใบแจ้งซ่อม ${created.requestId} สำเร็จ!`);
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
    loadData();
  };

  const handleUpdateTicket = async (id: string, updates: Partial<Ticket>) => {
    await ticketService.updateTicket(id, updates);
    if (updates.status === 'completed') {
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.7 } });
      showToast('ปิดงานซ่อมเรียบร้อย! 🎉');
    } else {
      showToast('อัปเดตข้อมูลงานซ่อมเรียบร้อย');
    }
    loadData();
  };

  const handleQuickAccept = async (ticket: Ticket) => {
    await ticketService.updateTicket(ticket.id, {
      status: 'in_progress',
      technicianName: ticket.technicianName || (technicians[0]?.name || 'ช่างเวรประจำวัน'),
      remark: 'รับงานแล้ว กำลังเข้าตรวจสอบสถานที่'
    });
    showToast(`รับงาน ${ticket.requestId} เรียบร้อยแล้ว (สถานะ: กำลังซ่อม)`);
    loadData();
  };

  const handleOpenEdit = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setIsEditModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Prompt']">
      
      {/* 1. Header */}
      <Header
        onOpenNewTicket={() => setIsNewTicketModalOpen(true)}
        onOpenMigration={() => setIsMigrationModalOpen(true)}
        onOpenRoster={() => setIsRosterModalOpen(true)}
        onRefresh={loadData}
        onToggleDashboard={() => setIsDashboardOpen(!isDashboardOpen)}
        isDashboardOpen={isDashboardOpen}
        urgentCount={urgentTickets.length}
      />

      {/* 2. Department Separation Tabs */}
      <DepartmentTabs
        departments={departments}
        selectedDepartment={selectedDepartment}
        onSelectDepartment={setSelectedDepartment}
        departmentCounts={departmentCounts}
        totalActiveCount={totalActiveCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        
        {/* Urgent Task Alert Ribbon */}
        <UrgentAlertBanner
          urgentTickets={urgentTickets}
          onViewUrgent={() => setOnlyUrgent(!onlyUrgent)}
          isOnlyUrgentActive={onlyUrgent}
        />

        {isDashboardOpen ? (
          /* Executive Dashboard View */
          <DashboardView
            tickets={tickets}
            departments={departments}
            technicians={technicians}
            onOpenEdit={handleOpenEdit}
          />
        ) : (
          <>
            {/* Queue & Filter Controls */}
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

            {/* List or Board View */}
            {viewMode === 'queue' ? (
              <TicketList
                tickets={tickets}
                departments={departments}
                onOpenEdit={handleOpenEdit}
                onQuickAccept={handleQuickAccept}
              />
            ) : (
              <DepartmentBoard
                tickets={tickets}
                departments={departments}
                onOpenEdit={handleOpenEdit}
                onQuickAccept={handleQuickAccept}
              />
            )}
          </>
        )}

      </main>

      {/* Modals */}
      <NewTicketModal
        isOpen={isNewTicketModalOpen}
        onClose={() => setIsNewTicketModalOpen(false)}
        departments={departments}
        onSubmit={handleCreateTicket}
      />

      <EditTicketModal
        ticket={editingTicket}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTicket(null);
        }}
        technicians={technicians}
        onUpdate={handleUpdateTicket}
      />

      <MigrationModal
        isOpen={isMigrationModalOpen}
        onClose={() => setIsMigrationModalOpen(false)}
        tickets={tickets}
        onDataChanged={loadData}
      />

      <TechnicianRosterModal
        isOpen={isRosterModalOpen}
        onClose={() => setIsRosterModalOpen(false)}
        technicians={technicians}
        onRosterChanged={loadData}
      />

      {/* Toast Feedback */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

    </div>
  );
};
