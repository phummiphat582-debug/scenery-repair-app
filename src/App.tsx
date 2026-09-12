import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardOverview } from './components/DashboardOverview';
import { TechnicianTasksView } from './components/TechnicianTasksView';
import { NewTicketForm } from './components/NewTicketForm';
import { AllRequestsView } from './components/AllRequestsView';
import { SettingsView } from './components/SettingsView';
import { RequesterPortalView } from './components/RequesterPortalView';
import { RoleLoginModal } from './components/RoleLoginModal';
import { DailyDutyModal } from './components/DailyDutyModal';
import { ConfirmModal } from './components/ConfirmModal';
import { TaskDetailsModal } from './components/TaskDetailsModal';
import { MigrationModal } from './components/MigrationModal';
import { TechnicianRosterModal } from './components/TechnicianRosterModal';
import { FarmMapModal } from './components/FarmMapModal';
import { SOSModal } from './components/SOSModal';
import { PartsModal } from './components/PartsModal';
import { QRScannerModal } from './components/QRScannerModal';
import { Toast } from './components/Toast';
import { ticketService } from './services/ticketService';
import { Ticket, Department, Technician, NavTab, UserRole } from './types';
import confetti from 'canvas-confetti';

export const App: React.FC = () => {
  // User Role: 'requester' (ผู้แจ้ง) | 'technician' (ช่าง / หลังบ้าน)
  const [userRole, setUserRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('scenery_user_role');
    return (saved === 'requester' || saved === 'technician') ? saved : 'requester';
  });

  // Modal for entering technician backend
  const [isRoleLoginOpen, setIsRoleLoginOpen] = useState(false);

  // Navigation (only relevant in technician role)
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  // Core Data
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected ticket for Detail Modal
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Other Modals
  const [isDailyDutyModalOpen, setIsDailyDutyModalOpen] = useState(false);
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [isFarmMapModalOpen, setIsFarmMapModalOpen] = useState(false);
  const [isSOSModalOpen, setIsSOSModalOpen] = useState(false);
  const [isPartsModalOpen, setIsPartsModalOpen] = useState(false);
  const [partsModalTicket, setPartsModalTicket] = useState<Ticket | null>(null);
  const [isQRScannerModalOpen, setIsQRScannerModalOpen] = useState(false);

  // Confirmation Modal for Quick Accept
  const [quickAcceptTicket, setQuickAcceptTicket] = useState<Ticket | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load initial data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [depts, techs, tix] = await Promise.all([
        ticketService.getDepartments(),
        ticketService.getTechnicians(),
        ticketService.getTickets({ statusFilter: 'all', sortOrder: 'fifo' })
      ]);
      setDepartments(depts);
      setTechnicians(techs);
      setTickets(tix);
    } catch (err: any) {
      showToast('โหลดข้อมูลไม่สำเร็จ: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save userRole preference
  const handleSwitchToTechnician = () => {
    setIsRoleLoginOpen(true);
  };

  const handleRoleLoginSuccess = () => {
    setIsRoleLoginOpen(false);
    setUserRole('technician');
    localStorage.setItem('scenery_user_role', 'technician');
    showToast('เข้าสู่ระบบหลังบ้าน / ทีมช่าง เรียบร้อย 🛠️', 'success');
  };

  const handleSwitchToRequester = () => {
    setUserRole('requester');
    localStorage.setItem('scenery_user_role', 'requester');
    showToast('สลับไปยังหน้าผู้แจ้งซ่อม เรียบร้อย 👤', 'info');
  };

  const handleToggleRole = () => {
    if (userRole === 'requester') {
      handleSwitchToTechnician();
    } else {
      handleSwitchToRequester();
    }
  };

  // Urgent count
  const urgentCount = useMemo(() => {
    return tickets.filter(
      t => (t.priority === 'critical' || t.priority === 'high' || t.isOverdue) &&
      t.status !== 'completed' &&
      t.status !== 'cancelled'
    ).length;
  }, [tickets]);

  // Handle open ticket details
  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDetailModalOpen(true);
  };

  // Handle update ticket
  const handleUpdateTicket = async (id: string, updates: Partial<Ticket>) => {
    await ticketService.updateTicket(id, updates);
    if (updates.status === 'completed' || updates.status === 'waiting_inspect') {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
      showToast('ส่งตรวจรับงานซ่อมเรียบร้อย! 🎉');
    } else {
      showToast('อัปเดตข้อมูลงานซ่อมเรียบร้อย');
    }
    loadData();
  };

  // Handle create ticket from NewTicketForm
  const handleCreateTicket = async (ticketData: any) => {
    const created = await ticketService.createTicket(ticketData);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    showToast(`ส่งใบแจ้งซ่อม #${created.requestId} สำเร็จ!`);
    await loadData();
    if (userRole === 'technician') {
      setTimeout(() => {
        setCurrentTab('all-requests');
      }, 1200);
    }
  };

  // Handle quick assign
  const handleQuickAssign = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDetailModalOpen(true);
  };

  // Handle open parts modal
  const handleOpenPartsModal = (ticket?: Ticket) => {
    setPartsModalTicket(ticket || selectedTicket || tickets[0]);
    setIsPartsModalOpen(true);
  };

  // Handle clear all tickets (Clean Slate)
  const handleClearAllTickets = async () => {
    await ticketService.clearAllTickets();
    await loadData();
    showToast('ล้างรายการแจ้งซ่อมทั้งหมดเรียบร้อยแล้ว (ระบบเริ่มต้นแบบคลีน)', 'info');
  };

  // Handle QR code scan result
  const handleQRScanResult = (code: string) => {
    showToast(`สแกน QR Code สำเร็จ: ${code}`, 'info');
    const matched = tickets.find(t => t.machineCode === code || t.location.includes(code));
    if (matched) {
      handleSelectTicket(matched);
    } else {
      if (userRole === 'technician') {
        setCurrentTab('new-request');
      }
    }
  };

  return (
    <div className="min-h-screen bg-surface font-body-md text-body-md text-on-surface flex flex-col selection:bg-primary-fixed selection:text-on-primary-fixed">
      
      {/* 1. Header (Fixed top) */}
      <Header
        currentTab={currentTab}
        userRole={userRole}
        onSwitchRole={handleToggleRole}
        onSelectRole={(role) => {
          if (role === 'technician') {
            if (userRole !== 'technician') handleSwitchToTechnician();
          } else {
            handleSwitchToRequester();
          }
        }}
        urgentCount={urgentCount}
        onOpenNotifications={() => {
          if (userRole === 'technician') setCurrentTab('all-requests');
        }}
        onBack={() => setCurrentTab('dashboard')}
        showBack={userRole === 'technician' && currentTab !== 'dashboard'}
      />

      {/* 2. Main Content Container */}
      <main className={`flex-1 w-full pt-28 md:pt-20 flex flex-col ${userRole === 'technician' ? 'pb-28' : 'pb-10'}`}>
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-3 text-primary">
            <span className="material-symbols-outlined text-[48px] animate-spin">sync</span>
            <span className="font-label-lg font-semibold">กำลังโหลดข้อมูลระบบฟาร์ม...</span>
          </div>
        ) : (
          <>
            {/* ROLE 1: REQUESTER (1 Clean Page dedicated for general staff) */}
            {userRole === 'requester' && (
              <RequesterPortalView
                tickets={tickets}
                departments={departments}
                technicians={technicians}
                onSubmitTicket={handleCreateTicket}
                onSelectTicket={handleSelectTicket}
                onOpenQRScanner={() => setIsQRScannerModalOpen(true)}
                onSwitchToTechnician={handleSwitchToTechnician}
                onDataChanged={loadData}
              />
            )}

            {/* ROLE 2: TECHNICIAN & SUPERVISOR (Backend Views) */}
            {userRole === 'technician' && (
              <>
                {currentTab === 'dashboard' && (
                  <DashboardOverview
                    tickets={tickets}
                    departments={departments}
                    technicians={technicians}
                    onSelectTicket={handleSelectTicket}
                    onQuickAssign={handleQuickAssign}
                    onOpenQRScanner={() => setIsQRScannerModalOpen(true)}
                    onOpenFarmMap={() => setIsFarmMapModalOpen(true)}
                    onRefresh={loadData}
                  />
                )}

                {currentTab === 'technician' && (
                  <TechnicianTasksView
                    tickets={tickets}
                    technicians={technicians}
                    onSelectTicket={handleSelectTicket}
                    onUpdateTicketStatus={handleUpdateTicket}
                    onOpenFarmMap={() => setIsFarmMapModalOpen(true)}
                    onOpenSOSModal={() => setIsSOSModalOpen(true)}
                    onOpenPartsModal={handleOpenPartsModal}
                  />
                )}

                {currentTab === 'new-request' && (
                  <NewTicketForm
                    departments={departments}
                    onSubmit={handleCreateTicket}
                    onCancel={() => setCurrentTab('dashboard')}
                    onOpenQRScanner={() => setIsQRScannerModalOpen(true)}
                  />
                )}

                {currentTab === 'all-requests' && (
                  <AllRequestsView
                    tickets={tickets}
                    departments={departments}
                    onSelectTicket={handleSelectTicket}
                    onQuickAccept={(ticket) => {
                      setQuickAcceptTicket(ticket);
                    }}
                  />
                )}

                {currentTab === 'settings' && (
                  <SettingsView
                    onOpenMigration={() => setIsMigrationModalOpen(true)}
                    onOpenRoster={() => setIsRosterModalOpen(true)}
                    onOpenDailyDuty={() => setIsDailyDutyModalOpen(true)}
                    onClearAllTickets={handleClearAllTickets}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* 3. Bottom Navigation Bar (Shown ONLY in Technician / Backend mode) */}
      {userRole === 'technician' && (
        <Navigation
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          technicianPendingCount={urgentCount}
        />
      )}

      {/* 4. Modals & Dialogs */}
      <RoleLoginModal
        isOpen={isRoleLoginOpen}
        onClose={() => setIsRoleLoginOpen(false)}
        onSuccess={handleRoleLoginSuccess}
      />

      <DailyDutyModal
        isOpen={isDailyDutyModalOpen}
        onClose={() => setIsDailyDutyModalOpen(false)}
        technicians={technicians}
        onDutyChanged={loadData}
      />

      <TaskDetailsModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedTicket(null);
        }}
        ticket={selectedTicket}
        technicians={technicians}
        onUpdateTicket={handleUpdateTicket}
        onOpenPartsModal={handleOpenPartsModal}
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

      <FarmMapModal
        isOpen={isFarmMapModalOpen}
        onClose={() => setIsFarmMapModalOpen(false)}
      />

      <SOSModal
        isOpen={isSOSModalOpen}
        onClose={() => setIsSOSModalOpen(false)}
      />

      <PartsModal
        isOpen={isPartsModalOpen}
        onClose={() => setIsPartsModalOpen(false)}
        ticket={partsModalTicket}
      />

      <QRScannerModal
        isOpen={isQRScannerModalOpen}
        onClose={() => setIsQRScannerModalOpen(false)}
        onScanResult={handleQRScanResult}
      />

      {/* Quick Accept Confirmation Modal */}
      {quickAcceptTicket && (
        <ConfirmModal
          isOpen={!!quickAcceptTicket}
          title="ยืนยันการรับงานซ่อม"
          message={`คุณต้องการรับงาน #${quickAcceptTicket.requestId} ("${quickAcceptTicket.title}") เข้าสู่สถานะกำลังดำเนินการ ใช่หรือไม่?`}
          confirmText="ยืนยันรับงาน"
          cancelText="ยกเลิก"
          confirmVariant="primary"
          onConfirm={async () => {
            const activeTech = technicians.find(t => t.isOnDutyToday)?.name || technicians[0]?.name || 'ช่างสมชาย (หัวหน้าช่าง)';
            const activePhone = technicians.find(t => t.isOnDutyToday)?.phone || technicians[0]?.phone || '081-234-5678';
            await handleUpdateTicket(quickAcceptTicket.id, {
              status: 'in_progress',
              technicianName: activeTech,
              technicianPhone: activePhone
            });
            setQuickAcceptTicket(null);
          }}
          onCancel={() => setQuickAcceptTicket(null)}
        />
      )}

      {/* Toast Notification */}
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
