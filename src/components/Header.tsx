import React from 'react';
import { NavTab, UserRole } from '../types';
import { PwaInstallButton } from './PwaInstallPrompt';

interface HeaderProps {
  currentTab: NavTab;
  userRole?: UserRole;
  onSwitchRole?: () => void;
  onSelectRole?: (role: UserRole) => void;
  onOpenNotifications?: () => void;
  urgentCount?: number;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  userRole = 'requester',
  onSwitchRole,
  onSelectRole,
  onOpenNotifications,
  urgentCount = 0,
  subtitle,
  onBack,
  showBack = false
}) => {
  const getSubtext = () => {
    if (subtitle) return subtitle;
    if (userRole === 'requester') return 'หน้าแจ้งงานสำหรับแผนก (Department Requester Portal)';
    switch (currentTab) {
      case 'dashboard':
        return 'ภาพรวมระบบ & KPIs งานซ่อม';
      case 'technician':
        return 'แถบงานช่าง & ดำเนินการ';
      case 'new-request':
        return 'เปิดใบแจ้งซ่อมด่วน';
      case 'all-requests':
        return 'ตารางรับงานตามคิว & ทุกรายการ';
      case 'settings':
        return 'ตั้งค่า & อัปเดตเวรช่าง';
      default:
        return 'Scenery Farm Maintenance';
    }
  };

  const handleSelectRole = (targetRole: UserRole) => {
    if (onSelectRole) {
      onSelectRole(targetRole);
    } else if (onSwitchRole && userRole !== targetRole) {
      onSwitchRole();
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl pt-safe shadow-sm border-b border-slate-200/60">
      {/* Top Bar */}
      <div className="h-16 px-margin flex items-center justify-between gap-space-sm max-w-7xl mx-auto">
        
        {/* Left Side: Logo & Portal Info */}
        <div className="flex items-center gap-space-sm min-w-0">
          {showBack && onBack ? (
            <button
              onClick={onBack}
              aria-label="ย้อนกลับ"
              className="w-9 h-9 flex items-center justify-center text-on-surface rounded-full hover:bg-surface-container-high transition-colors shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </button>
          ) : null}

          <img
            alt="Scenery Vintage Farm Maintenance Logo"
            className="h-8 w-auto object-contain shrink-0"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1IxlT28TMknLBnn_CM8URrQlVmuhAhlT7pP9a1Z0J8ytGp9K-u-1njZpLNCYTgDoAlrDPRfOQkK_wee2w6D--19Ds8SOq3Geg_8uH6h_BhNqSAp6QJruTazwYnsk7aI9TX5TlgwX4_mtvmJTRivWlTB0pd-8ILwqE-sFXt6M7taWEcbwXEC_SfbhtQHlHkG0jRPxDapK2uw-bTp6gXA6am_fEG31V0jpYEKCn103FYAScQr7eEcwAKw"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/logo.png';
            }}
          />

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-space-xs">
              <span className="font-headline-sm text-[15px] sm:text-headline-sm text-primary tracking-tight truncate leading-tight uppercase font-extrabold">
                SCENERY FARM
              </span>
              
              {/* Role Indicator Pill */}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-[10px] shrink-0 font-bold ${
                userRole === 'requester'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              }`}>
                {userRole === 'requester' ? '🏢 แผนกที่แจ้งงาน' : '🛠️ ระบบช่างรับงาน'}
              </span>
            </div>
            <span className="font-label-sm text-[11px] text-on-surface-variant truncate">
              {getSubtext()}
            </span>
          </div>
        </div>

        {/* Center / Right: Desktop Portal Switcher */}
        <div className="hidden md:flex items-center bg-surface-container-high p-1 rounded-2xl border border-slate-200 shadow-inner">
          <button
            type="button"
            onClick={() => handleSelectRole('requester')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              userRole === 'requester'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span>🏢 หน้าแจ้งงาน (สำหรับแผนก)</span>
          </button>
          
          <button
            type="button"
            onClick={() => handleSelectRole('technician')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              userRole === 'technician'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span>🛠️ หน้าระบบช่างรับงาน 🔒</span>
          </button>
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center gap-2 shrink-0">
          <PwaInstallButton />
          
          {/* Mobile Switch Button */}
          <button
            onClick={() => handleSelectRole(userRole === 'requester' ? 'technician' : 'requester')}
            type="button"
            className={`md:hidden px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs ${
              userRole === 'requester'
                ? 'bg-primary text-white'
                : 'bg-surface-container-high text-on-surface'
            }`}
            title={userRole === 'requester' ? 'เข้าสู่ระบบช่าง' : 'สลับไปหน้าแผนกแจ้ง'}
          >
            <span className="material-symbols-outlined text-[15px]">
              {userRole === 'requester' ? 'lock' : 'business'}
            </span>
            <span>{userRole === 'requester' ? 'ระบบช่าง' : 'หน้าแผนก'}</span>
          </button>

          {/* Notifications (only active in technician role) */}
          {userRole === 'technician' && (
            <button
              onClick={onOpenNotifications}
              aria-label="การแจ้งเตือน"
              className="relative w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              {urgentCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-error text-on-error font-label-sm text-[10px] ring-2 ring-surface font-bold">
                  {urgentCount}
                </span>
              )}
            </button>
          )}

          <div 
            onClick={() => handleSelectRole(userRole === 'requester' ? 'technician' : 'requester')}
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-xs cursor-pointer ${
              userRole === 'requester' ? 'bg-amber-600 text-white' : 'bg-primary text-white'
            }`}
            title={userRole === 'requester' ? 'ผู้แจ้งซ่อม (แผนกในฟาร์ม)' : 'ฝ่ายซ่อมบำรุง (ทีมช่าง)'}
          >
            <span className="material-symbols-outlined text-[17px]">
              {userRole === 'requester' ? 'business' : 'engineering'}
            </span>
          </div>
        </div>

      </div>

      {/* Mobile Sub-Row: Sticky Dual Portal Switcher */}
      <div className="md:hidden px-3 pb-2 pt-0.5 max-w-7xl mx-auto">
        <div className="flex w-full bg-surface-container-high p-1 rounded-xl border border-slate-200 shadow-inner">
          <button
            type="button"
            onClick={() => handleSelectRole('requester')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              userRole === 'requester'
                ? 'bg-primary text-white shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span>🏢 หน้าแจ้งงาน (แผนก)</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectRole('technician')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              userRole === 'technician'
                ? 'bg-primary text-white shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span>🛠️ ระบบช่างรับงาน 🔒</span>
          </button>
        </div>
      </div>
    </header>
  );
};
