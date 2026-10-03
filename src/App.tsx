import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardOverview } from './components/DashboardOverview';
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
import { SOSModal } from './components/SOSModal';
import { PartsModal } from './components/PartsModal';
import { QRScannerModal } from './components/QRScannerModal';
import { Toast } from './components/Toast';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { TechnicianPushPrompt } from './components/TechnicianPushPrompt';
import { ticketService } from './services/ticketService';
import { oneSignalService } from './services/oneSignalService';
import { Ticket, Department, Technician, NavTab, UserRole } from './types';
import confetti from 'canvas-confetti';
import { RotateCw, Trash2 } from 'lucide-react';

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
  const [tickets, setTickets] = useState<Ticket[]>(() => ticketService.getCachedData().tickets);
  const [departments, setDepartments] = useState<Department[]>(() => ticketService.getCachedData().departments);
  const [technicians, setTechnicians] = useState<Technician[]>(() => ticketService.getCachedData().technicians);
  const [isLoading, setIsLoading] = useState(false);

  // Selected ticket for Detail Modal
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Other Modals
  const [isDailyDutyModalOpen, setIsDailyDutyModalOpen] = useState(false);
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [isSOSModalOpen, setIsSOSModalOpen] = useState(false);
  const [isPartsModalOpen, setIsPartsModalOpen] = useState(false);
  const [partsModalTicket, setPartsModalTicket] = useState<Ticket | null>(null);
  const [isQRScannerModalOpen, setIsQRScannerModalOpen] = useState(false);

  // Quick Delete confirmation with PIN 1234
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
  const [deletePin, setDeletePin] = useState('');
  const [deletePinError, setDeletePinError] = useState('');
  const [isDeletingTicket, setIsDeletingTicket] = useState(false);

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

  const loadDataSilently = async () => {
    try {
      const [depts, techs, tix] = await Promise.all([
        ticketService.getDepartments(),
        ticketService.getTechnicians(),
        ticketService.getTickets({ statusFilter: 'all', sortOrder: 'fifo' })
      ]);
      setDepartments(depts);
      setTechnicians(techs);
      setTickets(tix);
    } catch (err) {
      console.warn('Real-time background sync error:', err);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = ticketService.subscribe(() => {
      loadDataSilently();
    });
    return () => unsubscribe();
  }, []);

  // Save userRole preference
  const handleSwitchToTechnician = () => {
    setIsRoleLoginOpen(true);
  };

  const handleRoleLoginSuccess = () => {
    setIsRoleLoginOpen(false);
    setUserRole('technician');
    localStorage.setItem('scenery_user_role', 'technician');
    void oneSignalService.setTechnicianRole(true);
    showToast('เข้าสู่ระบบหลังบ้าน / ทีมช่าง เรียบร้อย 🛠️', 'success');
  };

  const handleSwitchToRequester = () => {
    setUserRole('requester');
    localStorage.setItem('scenery_user_role', 'requester');
    void oneSignalService.setTechnicianRole(false);
    showToast('สลับไปยังหน้าผู้แจ้งซ่อม เรียบร้อย 👤', 'info');
  };

  const handleToggleRole = () => {
    if (userRole === 'requester') {
      handleSwitchToTechnician();
    } else {
      handleSwitchToRequester();
    }
  };

  const [isSyncing, setIsSyncing] = useState(false);

  // Urgent count
  const urgentCount = useMemo(() => {
    return tickets.filter(
      t => (t.priority === 'critical' || t.priority === 'high' || t.isOverdue) &&
      t.status !== 'completed' &&
      t.status !== 'cancelled'
    ).length;
  }, [tickets]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await ticketService.manualSync();
      await loadData();
      showToast('ซิงค์ข้อมูลกับฐานข้อมูลกลางสำเร็จ 🟢 (ข้อมูลล่าสุดแล้ว)', 'success');
    } catch {
      showToast('ซิงค์ข้อมูลไม่สำเร็จ กรุณาตรวจสอบสัญญาณเน็ต', 'error');
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  // Handle open ticket details
  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDetailModalOpen(true);
  };

  // Handle update ticket
  const handleUpdateTicket = async (id: string, updates: Partial<Ticket>) => {
    const updated = await ticketService.updateTicket(id, updates);
    const targetRequestId = updated?.requestId || id;
    if (updates.status === 'completed') {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
      showToast(`🎉 ปิดงานซ่อม #${targetRequestId} เรียบร้อย! สามารถดูรายการได้ที่แท็บ "เสร็จสิ้น"`, 'success');
    } else if (updates.status === 'in_progress') {
      showToast(`🟢 รับงานซ่อม #${targetRequestId} เรียบร้อย! ปรับสถานะเป็น "กำลังซ่อม"`, 'success');
    } else if (updates.status === 'cancelled') {
      showToast(`🚫 ยกเลิกใบงาน #${targetRequestId} เรียบร้อย! สามารถดูรายการได้ที่แท็บ "ยกเลิกแล้ว"`, 'info');
    } else if (updates.status === 'waiting_parts') {
      showToast(`📦 บันทึกขอเบิก/รออะไหล่สำหรับใบงาน #${targetRequestId} เรียบร้อย!`, 'info');
    } else {
      showToast(`อัปเดตข้อมูลใบงาน #${targetRequestId} เรียบร้อย`);
    }
    await loadData();
  };

  const handleDeleteTicket = async (id: string) => {
    const target = tickets.find(t => t.id === id || t.requestId === id);
    const reqId = target?.requestId || id;
    await ticketService.deleteTicket(id);
    setIsDetailModalOpen(false);
    setSelectedTicket(null);
    await loadData();
    showToast(`🗑️ ลบรายการ #${reqId} ออกจากฐานข้อมูลเรียบร้อยแล้ว`, 'info');
  };

  const handleRequestDeleteTicket = (ticket: Ticket) => {
    setTicketToDelete(ticket);
    setDeletePin('');
    setDeletePinError('');
  };

  const handleConfirmDeletePin = async () => {
    if (!ticketToDelete) return;
    if (deletePin !== '1234') {
      setDeletePinError('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      return;
    }
    setIsDeletingTicket(true);
    try {
      await handleDeleteTicket(ticketToDelete.id);
      setTicketToDelete(null);
      setDeletePin('');
      setDeletePinError('');
    } finally {
      setIsDeletingTicket(false);
    }
  };

  // Handle create ticket from NewTicketForm
  const handleCreateTicket = async (ticketData: any) => {
    const created = await ticketService.createTicket(ticketData);
    void oneSignalService.notifyTechnicians(created);
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
    const matched = tickets.find(t => t.location.includes(code) || t.title.includes(code));
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
        onRefresh={handleManualSync}
        isSyncing={isSyncing}
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
            <RotateCw className="w-10 h-10 animate-spin text-primary" />
            <span className="font-label-lg font-semibold">กำลังโหลดข้อมูลระบบฟาร์ม...</span>
          </div>
        ) : (
          <>
            {userRole === 'technician' && <TechnicianPushPrompt />}
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
                    onRefresh={loadData}
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
                    technicians={technicians}
                    onSelectTicket={handleSelectTicket}
                    onQuickAccept={(ticket) => {
                      setQuickAcceptTicket(ticket);
                    }}
                    onDeleteTicket={handleRequestDeleteTicket}
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
        onDeleteTicket={handleDeleteTicket}
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
            const activeTech = technicians.find(t => t.isOnDutyToday)?.name || technicians[0]?.name || '';
            const activePhone = technicians.find(t => t.isOnDutyToday)?.phone || technicians[0]?.phone || '';
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

      {/* Quick Delete PIN 1234 Modal */}
      {ticketToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-rose-200 animate-in zoom-in-95 duration-150" role="dialog" aria-modal="true">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6 text-rose-700" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold">ยืนยันการลบรายการแจ้งซ่อม</h3>
                <p className="text-sm text-slate-600 mt-0.5">#{ticketToDelete.requestId} - {ticketToDelete.title}</p>
              </div>
            </div>
            <label className="block mt-5 text-sm font-bold text-slate-700" htmlFor="quick-delete-pin">
              ใส่รหัสผ่าน 4 หลัก เพื่อลบรายการ:
            </label>
            <input
              id="quick-delete-pin"
              type="password"
              inputMode="numeric"
              autoFocus
              value={deletePin}
              onChange={(e) => { setDeletePin(e.target.value); setDeletePinError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleConfirmDeletePin(); }}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-xl tracking-[0.4em] text-center font-bold outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
              placeholder="••••"
              maxLength={4}
            />
            {deletePinError && <p className="mt-2 text-sm font-semibold text-rose-600 text-center">{deletePinError}</p>}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => { setTicketToDelete(null); setDeletePin(''); setDeletePinError(''); }}
                className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                disabled={isDeletingTicket}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDeletePin()}
                className="flex-1 rounded-xl bg-rose-600 py-3 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60 cursor-pointer shadow-xs"
                disabled={isDeletingTicket}
              >
                {isDeletingTicket ? 'กำลังลบ...' : 'ยืนยันลบรายการ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* PWA Installation Floating Banner & Helper */}
      <PwaInstallPrompt />

    </div>
  );
};
