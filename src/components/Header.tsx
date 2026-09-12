import React from 'react';
import { NavTab, UserRole } from '../types';

interface HeaderProps {
  currentTab: NavTab;
  userRole?: UserRole;
  onSwitchRole?: () => void;
  onOpenNotifications?: () => void;
  urgentCount?: number;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  userRole = 'technician',
  onSwitchRole,
  onOpenNotifications,
  urgentCount = 3,
  subtitle,
  onBack,
  showBack = false
}) => {
  const getSubtext = () => {
    if (subtitle) return subtitle;
    if (userRole === 'requester') return 'หน้าผู้แจ้งซ่อม (Requester Portal)';
    switch (currentTab) {
      case 'dashboard':
        return 'Dashboard Overview';
      case 'technician':
        return 'Technician Tasks';
      case 'new-request':
        return 'New Request';
      case 'all-requests':
        return 'All Requests & Queues';
      case 'settings':
        return 'Settings & Data Sync';
      default:
        return 'Scenery Farm Maintenance';
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-surface/85 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-slate-200/40">
      <div className="h-20 px-margin flex items-center justify-between gap-space-sm max-w-7xl mx-auto">
        
        {/* Left Side */}
        <div className="flex items-center gap-space-sm min-w-0">
          {showBack && onBack ? (
            <button
              onClick={onBack}
              aria-label="ย้อนกลับ"
              className="w-10 h-10 flex items-center justify-center text-on-surface rounded-full hover:bg-surface-container-high transition-colors shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
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
              <span className="font-headline-sm text-headline-sm text-primary tracking-tight truncate leading-tight uppercase font-bold">
                SCENERY FARM
              </span>
              
              {/* Role Indicator Pill */}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-[11px] shrink-0 font-bold ${
                userRole === 'requester'
                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                  : 'bg-secondary-fixed text-on-secondary-fixed'
              }`}>
                {userRole === 'requester' ? '👤 ผู้แจ้งซ่อม' : '🛠️ ช่าง/หัวหน้า'}
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
              {getSubtext()}
            </span>
          </div>
        </div>

        {/* Right Side Icons & Role Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Quick Role Switcher Button */}
          {onSwitchRole && (
            <button
              onClick={onSwitchRole}
              type="button"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                userRole === 'requester'
                  ? 'bg-primary text-white hover:bg-primary-container'
                  : 'bg-surface-container-high hover:bg-surface-variant text-on-surface'
              }`}
              title={userRole === 'requester' ? 'เข้าสู่ระบบช่าง/หลังบ้าน' : 'สลับไปหน้าผู้แจ้ง'}
            >
              <span className="material-symbols-outlined text-[16px]">
                {userRole === 'requester' ? 'lock' : 'person'}
              </span>
              <span className="hidden sm:inline">
                {userRole === 'requester' ? 'เข้าสู่ระบบช่าง' : 'หน้าผู้แจ้ง'}
              </span>
            </button>
          )}

          {/* Notifications (only active in technician role) */}
          {userRole === 'technician' && (
            <button
              onClick={onOpenNotifications}
              aria-label="การแจ้งเตือน"
              className="relative w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              {urgentCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-error text-on-error font-label-sm text-[10px] ring-2 ring-surface font-bold">
                  {urgentCount}
                </span>
              )}
            </button>
          )}

          <div 
            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm cursor-pointer"
            title={userRole === 'requester' ? 'ผู้ใช้งานทั่วไป / แผนกในฟาร์ม' : 'คุณสมชาย (หัวหน้าฝ่ายซ่อมบำรุง)'}
          >
            <span className="material-symbols-outlined text-on-primary text-[18px]">
              {userRole === 'requester' ? 'person_outline' : 'engineering'}
            </span>
          </div>
        </div>

      </div>
    </header>
  );
};
