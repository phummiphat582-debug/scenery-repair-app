import React, { useState, useMemo } from 'react';
import { Ticket, Department, Technician } from '../types';
import { NewTicketForm } from './NewTicketForm';
import { DailyDutyModal } from './DailyDutyModal';
import { ConfirmModal } from './ConfirmModal';
import { Phone, Search, Wrench, Clock, CheckCircle2, ChevronRight, User, MapPin, Plus, Shield, CalendarCheck, AlertTriangle, ListOrdered, ClipboardList, ArrowRightLeft, X, Building2 } from 'lucide-react';
import { DivisionBadge } from './DivisionBadge';
import { DivisionFilterTabs } from './DivisionFilterTabs';

interface RequesterPortalViewProps {
  tickets: Ticket[];
  departments: Department[];
  technicians: Technician[];
  onSubmitTicket: (data: any) => Promise<void>;
  onSelectTicket?: (ticket: Ticket) => void;
  onOpenQRScanner?: () => void;
  onSwitchToTechnician: () => void;
  onDataChanged?: () => void;
}

export const RequesterPortalView: React.FC<RequesterPortalViewProps> = ({
  tickets,
  departments,
  technicians,
  onSubmitTicket,
  onSelectTicket,
  onOpenQRScanner,
  onSwitchToTechnician,
  onDataChanged
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'queue' | 'track'>('create');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState<string>('84');
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [myDepartment, setMyDepartment] = useState<string>(() => {
    return localStorage.getItem('scenery_selected_dept') || '';
  });
  const [isChangingDept, setIsChangingDept] = useState(false);
  const [deptSearchText, setDeptSearchText] = useState('');
  const [isDutyModalOpen, setIsDutyModalOpen] = useState(false);

  // Call confirmation modal
  const [callConfirmTech, setCallConfirmTech] = useState<{ name: string; phone: string } | null>(null);

  const handleSelectDepartment = (deptName: string) => {
    setMyDepartment(deptName);
    try {
      localStorage.setItem('scenery_selected_dept', deptName);
    } catch {}
    setIsChangingDept(false);
  };

  const currentDeptObj = useMemo(() => {
    return departments.find(d => d.name === myDepartment);
  }, [departments, myDepartment]);

  const myDeptTickets = useMemo(() => {
    return myDepartment ? tickets.filter(t => t.department === myDepartment) : [];
  }, [tickets, myDepartment]);

  // Technicians on duty today
  const onDutyTechs = useMemo(() => {
    return technicians.filter(t => t.isOnDutyToday !== false && t.status === 'active');
  }, [technicians]);

  // Filter tickets for tracking (strictly for selected department)
  const filteredTickets = useMemo(() => {
    if (!myDepartment) return [];

    return tickets.filter(t => {
      // Strictly only tickets of myDepartment
      if (t.department !== myDepartment) {
        return false;
      }

      if (selectedDivisionFilter !== 'all' && (t.division || '84') !== selectedDivisionFilter) {
        return false;
      }

      const matchSearch = 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.requestId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.requesterName.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (filterStatus === 'active') {
        return t.status !== 'completed' && t.status !== 'cancelled';
      }
      if (filterStatus === 'pending') return t.status === 'pending' || t.status === 'assigned';
      if (filterStatus === 'in_progress') return t.status === 'in_progress' || t.status === 'waiting_parts';
      if (filterStatus === 'completed') return t.status === 'completed' || t.status === 'waiting_inspect';
      if (filterStatus === 'cancelled') return t.status === 'cancelled';
      return t.status !== 'completed' && t.status !== 'cancelled';
    });
  }, [tickets, searchQuery, filterStatus, selectedDivisionFilter, myDepartment]);

  const departmentQueues = useMemo(() => {
    const activeTickets = tickets
      .filter(t => t.status !== 'completed' && t.status !== 'cancelled')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return departments.map(department => ({
      department,
      tickets: activeTickets.filter(ticket => ticket.department === department.name)
    }));
  }, [tickets, departments]);

  const departmentQueueNumbers = useMemo(() => {
    const counters = new Map<string, number>();
    const numbers = new Map<string, number>();
    [...tickets]
      .filter(t => t.status !== 'completed' && t.status !== 'cancelled')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .forEach(ticket => {
        const next = (counters.get(ticket.department) || 0) + 1;
        counters.set(ticket.department, next);
        numbers.set(ticket.id, next);
      });
    return numbers;
  }, [tickets]);

  const statusFlow = [
    { key: 'pending', label: 'รอรับงาน' },
    { key: 'assigned', label: 'รับงานแล้ว' },
    { key: 'in_progress', label: 'กำลังซ่อม' },
    { key: 'waiting_inspect', label: 'รอตรวจรับ' },
    { key: 'completed', label: 'เสร็จสิ้น' }
  ];

  const statusStepIndex = (status: string) => {
    if (status === 'waiting_parts') return 2;
    if (status === 'waiting_inspect') return 3;
    if (status === 'completed') return 4;
    if (status === 'in_progress') return 2;
    if (status === 'assigned') return 1;
    return 0;
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: 'รอรับงาน', color: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'assigned':
        return { text: 'มอบหมายแล้ว', color: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'in_progress':
        return { text: 'กำลังซ่อมบำรุง', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'waiting_parts':
        return { text: 'รออะไหล่', color: 'bg-orange-100 text-orange-800 border-orange-300' };
      case 'waiting_inspect':
        return { text: 'รอตรวจรับ', color: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'completed':
        return { text: 'ซ่อมเสร็จสิ้น', color: 'bg-teal-100 text-teal-800 border-teal-300' };
      default:
        return { text: status, color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const getTechPhone = (ticket: Ticket): string => {
    if (ticket.technicianPhone) return ticket.technicianPhone;
    if (ticket.technicianName) {
      const found = technicians.find(t => t.name.toLowerCase() === ticket.technicianName?.toLowerCase());
      if (found?.phone) return found.phone;
    }
    return '';
  };

  const handleCallClick = (e: React.MouseEvent, name: string, phone: string) => {
    e.preventDefault();
    setCallConfirmTech({ name, phone });
  };

  const executeCall = () => {
    if (callConfirmTech?.phone) {
      window.location.href = `tel:${callConfirmTech.phone}`;
    }
    setCallConfirmTech(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 space-y-5 animate-in fade-in duration-200">
      
      {/* 1. Welcoming & Role Banner */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-primary via-primary to-primary-container text-white rounded-3xl shadow-lg border border-primary-fixed/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
          <Wrench className="w-48 h-48 text-white" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              ระบบแจ้งซ่อม • Scenery Farm
            </h1>
            <p className="text-xs sm:text-sm text-primary-fixed mt-1 max-w-xl leading-relaxed">
              สำหรับพนักงานทุกแผนก (คาเฟ่, วิลล่า, โรงแกะ, กิจกรรม ฯลฯ) ส่งใบแจ้งซ่อม ตรวจสอบรายชื่อช่างที่มาปฏิบัติงานวันนี้ โทรติดต่อช่าง และติดตามสถานะงานซ่อม
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onSwitchToTechnician}
              className="self-start sm:self-auto px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border border-white/25 shadow-sm cursor-pointer active:scale-95"
            >
              <Shield className="w-4 h-4 text-secondary-fixed" />
              <span>ระบบช่าง 🔒</span>
            </button>
            <span className="text-[11px] text-primary-fixed/80">
              *หน้ารับงานของทีมช่างแยกอยู่อีกส่วน
            </span>
          </div>
        </div>
      </div>

      {/* 2. On-Duty Technicians Today (ช่างที่มาทำงานวันนี้) */}
      <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base shadow-xs">
              👷‍♂️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm sm:text-base text-on-surface">
                  ทีมช่างที่เข้าเวร / มาปฏิบัติงานวันนี้
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold border border-emerald-300">
                  🟢 {onDutyTechs.length} ท่าน
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                พร้อมแก้ไขปัญหาหน้างาน สามารถกดปุ่มโทรติดต่อหาช่างแต่ละท่านได้ทันที
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDutyModalOpen(true)}
            className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-primary rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            title="สำหรับช่างเช็คชื่อเข้าเวรหรืออัปเดตเบอร์โทร"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-primary" />
            <span>ช่างอัปเดตเวรวันนี้</span>
          </button>
        </div>

        {/* Technicians Grid */}
        {onDutyTechs.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
            ยังไม่มีช่างลงชื่อเข้าเวรวันนี้ — ช่างสามารถกดปุ่ม "ช่างอัปเดตเวรวันนี้" ด้านบนเพื่อเช็คชื่อ
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {onDutyTechs.map(tech => (
              <div
                key={tech.id}
                className="p-3 bg-surface-container-low rounded-2xl border border-emerald-200/80 flex items-center justify-between gap-2.5 hover:shadow-xs transition-shadow"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {tech.avatarUrl ? (
                    <img 
                      src={tech.avatarUrl} 
                      alt={tech.name} 
                      className="w-11 h-11 rounded-2xl object-cover border-2 border-emerald-500 ring-2 ring-emerald-100 shrink-0 shadow-xs" 
                    />
                  ) : (
                    <span className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                      {tech.name.slice(4, 5) || tech.name.slice(0, 1) || 'ช'}
                    </span>
                  )}
                  <div className="min-w-0">
                    <span className="font-bold text-xs sm:text-sm text-on-surface truncate block">
                      {tech.name}
                    </span>
                    <span className="text-[11px] text-on-surface-variant truncate block">
                      {tech.role}
                    </span>
                  </div>
                </div>

                {/* Call Button with Confirmation */}
                {tech.phone ? (
                  <button
                    type="button"
                    onClick={(e) => handleCallClick(e, tech.name, tech.phone!)}
                    className="px-3 py-1.5 bg-primary hover:bg-primary-container text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 shadow-xs active:scale-95 cursor-pointer"
                    title={`โทรหา ${tech.name} (${tech.phone})`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>โทร</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-400 shrink-0">(ไม่มีเบอร์)</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2.5 Active Department Banner */}
      <div className="bg-surface-container-lowest rounded-2xl border border-slate-200/90 p-3 sm:p-3.5 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base shrink-0 border border-primary/20">
            {currentDeptObj?.icon || '🏢'}
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
              {myDepartment ? 'แผนกของคุณ' : 'ยังไม่ได้เลือกแผนก'}
            </div>
            <div className="font-extrabold text-xs sm:text-sm text-on-surface truncate flex items-center gap-2">
              <span className="truncate">{myDepartment || 'แตะเพื่อระบุแผนกของคุณ'}</span>
              {myDepartment && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                  {myDeptTickets.length} งาน
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsChangingDept(true);
            setActiveSubTab('track');
          }}
          className="px-3 py-1.5 bg-surface-container hover:bg-primary hover:text-white text-on-surface-variant rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>{myDepartment ? 'เปลี่ยนแผนก' : 'เลือกแผนก'}</span>
        </button>
      </div>

      {/* 3. Top Segmented Tabs: create, department queues, tracking */}
      <div className="grid grid-cols-3 gap-1.5 bg-surface-container-low p-1.5 rounded-2xl border border-slate-200 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveSubTab('create')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'create'
              ? 'bg-primary text-white shadow-md'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>แจ้งซ่อม</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('queue')}
          className={`flex-1 py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'queue'
              ? 'bg-primary text-white shadow-md'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          <span>คิวแต่ละแผนก</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('track')}
          className={`flex-1 py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'track'
              ? 'bg-primary text-white shadow-md'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{myDepartment ? 'งานแผนกคุณ' : 'งานแจ้งซ่อม'}</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
            activeSubTab === 'track' ? 'bg-white text-primary' : 'bg-surface-container-highest text-on-surface'
          }`}>
            {myDepartment ? myDeptTickets.length : '-'}
          </span>
        </button>
      </div>

      {/* 4. Sub-Tab 1: Create New Ticket Form */}
      {activeSubTab === 'create' && (
        <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <NewTicketForm
            departments={departments}
            defaultDepartment={myDepartment}
            onSubmit={async (ticketData) => {
              await onSubmitTicket(ticketData);
              if (ticketData.department) {
                handleSelectDepartment(ticketData.department);
              }
              setActiveSubTab('track');
            }}
            onCancel={() => setActiveSubTab('track')}
            onOpenQRScanner={onOpenQRScanner}
          />
        </div>
      )}

      {/* 5. Sub-Tab 2: Department Queues */}
      {activeSubTab === 'queue' && (
        <div className="space-y-4">
          <div className="bg-surface-container-lowest rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-on-surface">คิวงานซ่อมแยกตามแผนก</h2>
              <p className="text-xs text-on-surface-variant mt-1">ดูงานที่กำลังรอรับงานหรือกำลังดำเนินการของแต่ละแผนกได้ทันที</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {departmentQueues.map(({ department, tickets: queueTickets }) => (
              <div key={department.id} className="bg-surface-container-lowest rounded-3xl border border-slate-200 p-4 shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: `${department.color}18` }}>
                      {department.icon}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm truncate">{department.name}</h3>
                      <p className="text-[11px] text-on-surface-variant">คิวที่กำลังดำเนินการ</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-primary-fixed text-primary text-xs font-extrabold shrink-0">
                    {queueTickets.length} งาน
                  </span>
                </div>

                {queueTickets.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
                    ยังไม่มีงานค้างในคิวแผนกนี้
                  </div>
                ) : (
                  <div className="space-y-2">
                    {queueTickets.slice(0, 4).map(ticket => {
                      const badge = statusLabel(ticket.status);
                      return (
                        <button
                          key={ticket.id}
                          type="button"
                          onClick={() => {
                            handleSelectDepartment(ticket.department);
                            setActiveSubTab('track');
                          }}
                          className="w-full text-left rounded-2xl bg-surface-container-low hover:bg-surface-container p-3 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[11px] font-extrabold text-primary">คิว #{departmentQueueNumbers.get(ticket.id) || '-'}</span>
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${badge.color}`}>{badge.text}</span>
                          </div>
                          <p className="font-bold text-xs mt-1 line-clamp-1">{ticket.title}</p>
                          <p className="text-[11px] text-on-surface-variant mt-0.5 line-clamp-1">{ticket.location}</p>
                        </button>
                      );
                    })}
                    {queueTickets.length > 4 && (
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectDepartment(department.name);
                          setActiveSubTab('track');
                        }}
                        className="w-full text-center text-xs text-primary font-bold py-1 cursor-pointer"
                      >
                        ดูอีก {queueTickets.length - 4} งานในแผนกนี้ →
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Sub-Tab 3: Track Tickets List */}
      {activeSubTab === 'track' && (
        <div className="space-y-4">
          {(!myDepartment || isChangingDept) ? (
            /* Department Selection Picker */
            <div className="bg-surface-container-lowest rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-5">
              <div className="text-center max-w-md mx-auto space-y-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl shadow-inner border border-primary/20">
                  🏢
                </div>
                <h3 className="font-extrabold text-base sm:text-lg text-on-surface">
                  เลือกแผนกของคุณเพื่อดูงานแจ้งซ่อม
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  เลือกแผนกของท่านเพื่อดูรายการแจ้งซ่อมของแผนกตนเอง ระบบจะจดจำไว้ตลอดการใช้งาน
                </p>
                {isChangingDept && myDepartment && (
                  <button
                    type="button"
                    onClick={() => setIsChangingDept(false)}
                    className="text-xs text-primary hover:underline font-bold cursor-pointer inline-flex items-center gap-1 mt-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>ยกเลิก (คงไว้ที่ "{myDepartment}")</span>
                  </button>
                )}
              </div>

              {/* Department Search Input */}
              <div className="relative max-w-md mx-auto">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-on-surface-variant" />
                <input
                  type="text"
                  value={deptSearchText}
                  onChange={(e) => setDeptSearchText(e.target.value)}
                  placeholder="พิมพ์ค้นหาชื่อแผนก เช่น ฟร้อน, อาหาร, แม่บ้าน, สโตร์..."
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-slate-200 rounded-2xl text-xs sm:text-sm text-on-surface outline-none focus:border-primary focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary shadow-xs"
                />
              </div>

              {/* Department Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                {departments
                  .filter(d =>
                    !deptSearchText.trim() ||
                    d.name.toLowerCase().includes(deptSearchText.toLowerCase()) ||
                    d.id.toLowerCase().includes(deptSearchText.toLowerCase())
                  )
                  .map(dept => {
                    const deptActiveCount = tickets.filter(
                      t => t.department === dept.name && t.status !== 'completed' && t.status !== 'cancelled'
                    ).length;
                    const isSelected = dept.name === myDepartment;

                    return (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => handleSelectDepartment(dept.name)}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'border-primary bg-primary/10 ring-2 ring-primary/30 shadow-xs'
                            : 'border-slate-200 bg-surface-container-low hover:border-primary/50 hover:bg-surface-container shadow-xs active:scale-[0.98]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 border border-slate-200/50"
                            style={{ backgroundColor: `${dept.color}18` }}
                          >
                            {dept.icon}
                          </span>
                          <div className="min-w-0">
                            <div className="font-bold text-xs sm:text-sm text-on-surface truncate">
                              {dept.name}
                            </div>
                            <div className="text-[11px] text-on-surface-variant">
                              {deptActiveCount > 0 ? (
                                <span className="text-amber-600 font-semibold">{deptActiveCount} งานกำลังซ่อม</span>
                              ) : (
                                'ไม่มีงานค้าง'
                              )}
                            </div>
                          </div>
                        </div>

                        <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-primary' : 'text-slate-400'}`} />
                      </button>
                    );
                  })}
              </div>
            </div>
          ) : (
            /* Selected Department Tickets View */
            <div className="space-y-4">
              {/* Department Header & Quick Switcher */}
              <div className="bg-surface-container-lowest p-4 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
                    style={{ backgroundColor: `${currentDeptObj?.color || '#3b82f6'}18` }}
                  >
                    {currentDeptObj?.icon || '🏢'}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-extrabold text-sm sm:text-base text-on-surface truncate">
                      งานแจ้งซ่อมของ "{myDepartment}"
                    </h2>
                    <p className="text-[11px] text-on-surface-variant">
                      มีงานทั้งหมด {myDeptTickets.length} รายการ (กำลังซ่อม {myDeptTickets.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length} รายการ)
                    </p>
                  </div>
                </div>

                {/* Quick Switch Dropdown & Change Button */}
                <div className="flex items-center gap-2">
                  <select
                    value={myDepartment}
                    onChange={(e) => handleSelectDepartment(e.target.value)}
                    className="h-[38px] px-3 bg-surface-container-low border border-slate-200 rounded-xl text-xs font-bold text-on-surface outline-none focus:border-primary shadow-xs cursor-pointer"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setIsChangingDept(true)}
                    className="h-[38px] px-3 bg-surface-container-low hover:bg-surface-container text-on-surface-variant rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
                    title="เลือกดูแผนกอื่น"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">เปลี่ยนแผนก</span>
                  </button>
                </div>
              </div>

              {/* Division Filter Tabs (Scoped to myDeptTickets) */}
              <div className="bg-surface-container-lowest p-2 rounded-2xl border border-slate-200 shadow-xs">
                <DivisionFilterTabs
                  selectedDivision={selectedDivisionFilter}
                  onSelectDivision={setSelectedDivisionFilter}
                  tickets={myDeptTickets}
                />
              </div>

              {/* Search & Status Pills Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-on-surface-variant" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหารหัสใบแจ้ง, ปัญหา หรือสถานที่..."
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-slate-200 rounded-2xl text-xs sm:text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-xs"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {[
                    { id: 'active', label: 'งานรอซ่อม', count: myDeptTickets.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length },
                    { id: 'pending', label: 'รอรับงาน', count: myDeptTickets.filter(t => t.status === 'pending' || t.status === 'assigned').length },
                    { id: 'in_progress', label: 'กำลังซ่อม', count: myDeptTickets.filter(t => t.status === 'in_progress' || t.status === 'waiting_parts').length },
                    { id: 'completed', label: 'เสร็จสิ้น', count: myDeptTickets.filter(t => t.status === 'completed' || t.status === 'waiting_inspect').length },
                    { id: 'cancelled', label: 'ยกเลิก', count: myDeptTickets.filter(t => t.status === 'cancelled').length },
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilterStatus(f.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                        filterStatus === f.id
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      <span>{f.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                        filterStatus === f.id ? 'bg-white/20 text-white' : 'bg-surface-container-highest text-on-surface'
                      }`}>
                        {f.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tickets Cards List */}
              {filteredTickets.length === 0 ? (
                <div className="p-12 text-center bg-surface-container-lowest rounded-3xl border border-dashed border-slate-200 text-on-surface-variant flex flex-col items-center gap-3">
                  <Clock className="w-10 h-10 text-slate-300" />
                  <span className="text-sm font-semibold">
                    ยังไม่มีรายการแจ้งซ่อมของ "{myDepartment}" {filterStatus === 'completed' ? 'ที่เสร็จสิ้น' : 'ในหมวดนี้'}
                  </span>
                  <p className="text-xs text-slate-400 max-w-sm">
                    เมื่อแผนก {myDepartment} ส่งใบแจ้งซ่อม รายการจะแสดงสถานะ คิวงาน และชื่อช่างผู้รับผิดชอบตรงนี้
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('create')}
                    className="mt-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-container cursor-pointer shadow-xs"
                  >
                    + แจ้งซ่อมงานใหม่
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5">
                  {filteredTickets.map((ticket, idx) => {
                const sBadge = statusLabel(ticket.status);
                const techPhone = getTechPhone(ticket);
                const isAssigned = !!ticket.technicianName;
                const assignedTech = isAssigned
                  ? technicians.find(t => t.name.toLowerCase() === ticket.technicianName?.toLowerCase())
                  : null;
                const queueNum = departmentQueueNumbers.get(ticket.id) || (idx + 1);
                const progressIndex = statusStepIndex(ticket.status);

                return (
                  <div
                    key={ticket.id}
                    className="p-4 sm:p-5 bg-surface-container-lowest rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col gap-3.5"
                  >
                    {/* Top Row: Request ID, Date, Status */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-extrabold text-primary bg-primary-fixed/40 px-2.5 py-1 rounded-full">
                          #{ticket.requestId}
                        </span>
                        <DivisionBadge division={ticket.division} size="sm" />
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          คิวที่ #{queueNum}
                        </span>
                        {ticket.category && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary-fixed/30 text-primary border border-primary/20">
                            {ticket.category}
                          </span>
                        )}
                        <span className="text-[11px] text-on-surface-variant">
                          {new Date(ticket.createdAt).toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${sBadge.color}`}>
                          {sBadge.text}
                        </span>
                        {ticket.priority === 'critical' && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 animate-pulse">
                            วิกฤต
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Title and Location */}
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-on-surface">
                        {ticket.title}
                      </h3>
                      {ticket.description && (
                        <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
                          {ticket.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-on-surface-variant flex-wrap">
                        <span className="flex items-center gap-1 font-semibold text-on-surface">
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                          {ticket.location}
                        </span>
                        <span>•</span>
                        <span className="font-medium text-primary">{ticket.department}</span>
                        <span>•</span>
                        <span>ผู้แจ้ง: {ticket.requesterName}</span>
                      </div>
                    </div>

                    {/* Repair Progress Timeline */}
                    <div className="rounded-2xl bg-surface-container-low p-4 border border-slate-200/60 overflow-x-auto overflow-y-hidden overscroll-y-none touch-pan-x" style={{ touchAction: 'pan-x' }}>
                      <div className="flex items-center justify-between gap-1.5">
                        {statusFlow.map((flow, flowIndex) => (
                          <React.Fragment key={flow.key}>
                            <div className="flex flex-col items-center gap-1 min-w-0">
                              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${
                                flowIndex <= progressIndex ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'
                              }`}>
                                {flowIndex < progressIndex ? '✓' : flowIndex + 1}
                              </span>
                              <span className={`text-[11px] sm:text-xs text-center leading-tight whitespace-nowrap ${flowIndex <= progressIndex ? 'text-primary font-bold' : 'text-slate-500'}`}>
                                {flow.label}
                              </span>
                            </div>
                            {flowIndex < statusFlow.length - 1 && (
                              <span className={`h-1 flex-1 rounded-full mb-4 ${flowIndex < progressIndex ? 'bg-primary' : 'bg-slate-200'}`} />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    {/* Technician Contact Box */}
                    <div className="p-3 bg-surface-container-low rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-200/60">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {assignedTech?.avatarUrl ? (
                          <img 
                            src={assignedTech.avatarUrl} 
                            alt={ticket.technicianName || ''} 
                            className="w-10 h-10 rounded-xl object-cover border-2 border-primary/40 shrink-0 shadow-xs" 
                          />
                        ) : (
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isAssigned ? 'bg-primary text-white shadow-xs' : 'bg-slate-200 text-slate-500'
                          }`}>
                            <Wrench className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-on-surface truncate">
                            {isAssigned ? (
                              <span>ช่างผู้รับผิดชอบ: <strong className="text-primary">{ticket.technicianName}</strong></span>
                            ) : (
                              <span className="text-amber-700">กำลังรอศูนย์ซ่อมจัดคิวช่าง</span>
                            )}
                          </div>
                          <div className="text-[11px] text-on-surface-variant truncate">
                            {isAssigned 
                              ? `เบอร์ติดต่อตรง: ${techPhone}` 
                              : 'ศูนย์ซ่อมบำรุงส่วนกลาง The Scenery Farm'}
                          </div>
                        </div>
                      </div>

                      {/* Direct Phone Call Button with Confirmation */}
                      {techPhone ? (
                        <button
                          type="button"
                          onClick={(e) => handleCallClick(e, ticket.technicianName || 'ศูนย์ซ่อมส่วนกลาง', techPhone)}
                          className="self-start sm:self-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-container text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
                          title="กดเพื่อโทรออกทันที"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>โทรหาช่าง: {techPhone}</span>
                        </button>
                      ) : (
                        <span className="self-start sm:self-auto text-xs font-semibold text-slate-400">ยังไม่มีเบอร์โทรช่าง</span>
                      )}
                    </div>

                    {/* Repair Remarks / Progress */}
                    {ticket.repairResult && (
                      <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex flex-col gap-1">
                        <span className="font-bold flex items-center gap-1 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          บันทึกความคืบหน้าการซ่อม:
                        </span>
                        <p className="text-slate-700">{ticket.repairResult}</p>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )}

      {/* Daily Duty Attendance Modal */}
      <DailyDutyModal
        isOpen={isDutyModalOpen}
        onClose={() => setIsDutyModalOpen(false)}
        technicians={technicians}
        onDutyChanged={() => {
          if (onDataChanged) onDataChanged();
        }}
      />

      {/* Phone Call Confirmation Modal */}
      {callConfirmTech && (
        <ConfirmModal
          isOpen={!!callConfirmTech}
          title="ยืนยันการโทรออก"
          message={`คุณต้องการโทรติดต่อ "${callConfirmTech.name}" ที่หมายเลข ${callConfirmTech.phone} ใช่หรือไม่?`}
          confirmText="โทรออกทันที"
          cancelText="ยกเลิก"
          confirmVariant="primary"
          onConfirm={executeCall}
          onCancel={() => setCallConfirmTech(null)}
        />
      )}

    </div>
  );
};
