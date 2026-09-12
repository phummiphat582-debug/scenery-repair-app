import React, { useState, useMemo } from 'react';
import { Ticket, Department, Technician } from '../types';
import { NewTicketForm } from './NewTicketForm';
import { Phone, Search, Wrench, Clock, CheckCircle2, AlertCircle, AlertTriangle, ChevronRight, User, MapPin, Plus, ListFilter, Shield } from 'lucide-react';

interface RequesterPortalViewProps {
  tickets: Ticket[];
  departments: Department[];
  technicians: Technician[];
  onSubmitTicket: (data: any) => Promise<void>;
  onSelectTicket?: (ticket: Ticket) => void;
  onOpenQRScanner?: () => void;
  onSwitchToTechnician: () => void;
}

export const RequesterPortalView: React.FC<RequesterPortalViewProps> = ({
  tickets,
  departments,
  technicians,
  onSubmitTicket,
  onSelectTicket,
  onOpenQRScanner,
  onSwitchToTechnician
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'track'>('create');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedTicketForDetail, setSelectedTicketForDetail] = useState<Ticket | null>(null);

  // Filter tickets for tracking
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchSearch = 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.requestId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.requesterName.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (filterStatus === 'pending') return t.status === 'pending' || t.status === 'assigned';
      if (filterStatus === 'in_progress') return t.status === 'in_progress' || t.status === 'waiting_parts';
      if (filterStatus === 'completed') return t.status === 'completed' || t.status === 'waiting_inspect';
      return true;
    });
  }, [tickets, searchQuery, filterStatus]);

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
    return '081-234-5678'; // Default farm maintenance hotline
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 space-y-5 animate-in fade-in duration-200">
      
      {/* 1. Welcoming & Role Banner */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-primary to-primary-container text-white rounded-3xl shadow-lg border border-primary-fixed/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
          <Wrench className="w-48 h-48 text-white" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-secondary-fixed text-xs font-bold mb-2">
              <span>👤 หน้าผู้แจ้งซ่อม (Requester Portal)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              ระบบแจ้งซ่อมบำรุง The Scenery Vintage Farm
            </h1>
            <p className="text-xs sm:text-sm text-primary-fixed mt-1 max-w-xl">
              แจ้งปัญหาอุปกรณ์ เครื่องจักร อาคารสถานที่ หรือติดตามสถานะงานซ่อมและโทรติดต่อช่างได้ตลอดเวลา
            </p>
          </div>

          <button
            type="button"
            onClick={onSwitchToTechnician}
            className="self-start sm:self-center px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border border-white/20 shadow-sm cursor-pointer shrink-0 active:scale-95"
          >
            <Shield className="w-4 h-4 text-secondary-fixed" />
            <span>เข้าสู่ระบบช่าง / หลังบ้าน 🛠️</span>
          </button>
        </div>
      </div>

      {/* 2. Top Segmented Tabs: [📝 แจ้งซ่อมใหม่] vs [📋 ติดตามงานของฉัน] */}
      <div className="flex bg-surface-container-low p-1.5 rounded-2xl border border-slate-200 shadow-xs">
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
          <span>แจ้งซ่อมด่วน (New Request)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('track')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'track'
              ? 'bg-primary text-white shadow-md'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>ติดตามงานของฉัน (My Tickets)</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
            activeSubTab === 'track' ? 'bg-white text-primary' : 'bg-surface-container-highest text-on-surface'
          }`}>
            {tickets.length}
          </span>
        </button>
      </div>

      {/* 3. Sub-Tab 1: Create New Ticket Form */}
      {activeSubTab === 'create' && (
        <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <NewTicketForm
            departments={departments}
            onSubmit={async (ticketData) => {
              await onSubmitTicket(ticketData);
              setActiveSubTab('track');
            }}
            onCancel={() => setActiveSubTab('track')}
            onOpenQRScanner={onOpenQRScanner}
          />
        </div>
      )}

      {/* 4. Sub-Tab 2: Track Tickets List */}
      {activeSubTab === 'track' && (
        <div className="space-y-4">
          
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-on-surface-variant" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาด้วยรหัสใบแจ้ง, ปัญหา, หรือสถานที่..."
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-slate-200 rounded-2xl text-xs sm:text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'all', label: 'ทั้งหมด' },
                { id: 'pending', label: 'รอรับงาน' },
                { id: 'in_progress', label: 'กำลังซ่อม' },
                { id: 'completed', label: 'เสร็จสิ้น' },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterStatus(f.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    filterStatus === f.id
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tickets Cards List */}
          {filteredTickets.length === 0 ? (
            <div className="p-12 text-center bg-surface-container-lowest rounded-3xl border border-dashed border-slate-200 text-on-surface-variant flex flex-col items-center gap-3">
              <Clock className="w-10 h-10 text-slate-300" />
              <span className="text-sm font-semibold">ไม่พบรายการแจ้งซ่อมที่ตรงกับเงื่อนไข</span>
              <button
                type="button"
                onClick={() => setActiveSubTab('create')}
                className="mt-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-container cursor-pointer"
              >
                + แจ้งซ่อมงานใหม่
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {filteredTickets.map(ticket => {
                const sBadge = statusLabel(ticket.status);
                const techPhone = getTechPhone(ticket);
                const isAssigned = !!ticket.technicianName;

                return (
                  <div
                    key={ticket.id}
                    className="p-4 sm:p-5 bg-surface-container-lowest rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col gap-3.5"
                  >
                    {/* Top Row: Request ID, Date, Status */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-primary bg-primary-fixed/40 px-2.5 py-1 rounded-full">
                          #{ticket.requestId}
                        </span>
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
                      <div className="flex items-center gap-2 mt-1 text-xs text-on-surface-variant flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                          {ticket.location}
                        </span>
                        <span>•</span>
                        <span>{ticket.department}</span>
                        <span>•</span>
                        <span>ผู้แจ้ง: {ticket.requesterName}</span>
                      </div>
                    </div>

                    {/* Technician Contact Box */}
                    <div className="p-3 bg-surface-container-low rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-200/60">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isAssigned ? 'bg-primary text-white shadow-xs' : 'bg-slate-200 text-slate-500'
                        }`}>
                          <Wrench className="w-4 h-4" />
                        </div>
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

                      {/* Direct Phone Call Button */}
                      <a
                        href={`tel:${techPhone}`}
                        className="self-start sm:self-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-container text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
                        title="กดเพื่อโทรออกทันที"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>โทรหาช่าง: {techPhone}</span>
                      </a>
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
  );
};
