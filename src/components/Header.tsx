import React from 'react';
import { Plus, Database, Users, BarChart3, RefreshCw, Layers, ShieldCheck, AlertTriangle } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

interface HeaderProps {
  onOpenNewTicket: () => void;
  onOpenMigration: () => void;
  onOpenRoster: () => void;
  onRefresh: () => void;
  onToggleDashboard: () => void;
  isDashboardOpen: boolean;
  urgentCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewTicket,
  onOpenMigration,
  onOpenRoster,
  onRefresh,
  onToggleDashboard,
  isDashboardOpen,
  urgentCount
}) => {
  return (
    <header className="sticky top-0 z-40 scenery-gradient text-white shadow-lg shadow-teal-950/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          
          {/* Brand & Logo */}
          <div className="flex items-center gap-3 min-w-0">
            <img 
              src="/logo.png" 
              alt="Scenery Vintage Farm" 
              className="h-9 sm:h-12 w-auto object-contain brightness-0 invert" 
            />
            <div className="hidden sm:block border-l border-teal-600/60 pl-3">
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                <span>ระบบแจ้งซ่อมบำรุง</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-200 border border-teal-400/30">
                  V2.0 Pro
                </span>
              </h1>
              <p className="text-xs text-teal-100/80 font-light">
                แยกแผนก · คิวงาน FIFO · ติดตามงานด่วน
              </p>
            </div>
          </div>

          {/* Cloud & Env Badge */}
          <div className="hidden md:flex items-center gap-2 text-xs">
            {isSupabaseConfigured ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Supabase Live</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>Local Storage Mode</span>
              </span>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onOpenNewTicket}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-amber-950 font-semibold text-xs sm:text-sm shadow-md shadow-amber-950/20 transition-all cursor-pointer"
              title="แจ้งซ่อมใหม่"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline">แจ้งซ่อมใหม่</span>
            </button>

            <button
              onClick={onToggleDashboard}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl border text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                isDashboardOpen 
                  ? 'bg-white text-teal-900 border-white shadow-sm' 
                  : 'bg-teal-800/60 hover:bg-teal-700/60 text-teal-50 border-teal-600/60'
              }`}
              title="สถิติภาพรวม"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden md:inline">Dashboard</span>
            </button>

            <button
              onClick={onOpenRoster}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-teal-800/60 hover:bg-teal-700/60 active:scale-95 text-teal-50 border border-teal-600/60 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              title="รายชื่อช่าง"
            >
              <Users className="w-4 h-4" />
              <span className="hidden lg:inline">ทีมช่าง</span>
            </button>

            <button
              onClick={onOpenMigration}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-teal-800/60 hover:bg-teal-700/60 active:scale-95 text-teal-50 border border-teal-600/60 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              title="ย้ายและนำเข้าข้อมูลซ่อม"
            >
              <Database className="w-4 h-4" />
              <span className="hidden xl:inline">ย้ายข้อมูล</span>
            </button>

            <button
              onClick={onRefresh}
              className="p-2 rounded-xl bg-teal-800/60 hover:bg-teal-700/60 active:scale-95 text-teal-50 border border-teal-600/60 transition-all cursor-pointer"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
