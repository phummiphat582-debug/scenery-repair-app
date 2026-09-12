import React from 'react';
import { NavTab } from '../types';

interface HeaderProps {
  currentTab: NavTab;
  onOpenNotifications?: () => void;
  urgentCount?: number;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenNotifications,
  urgentCount = 3,
  subtitle,
  onBack,
  showBack = false
}) => {
  const getSubtext = () => {
    if (subtitle) return subtitle;
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
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm shrink-0 font-semibold">
                ช่าง/หัวหน้า
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
              ระบบแจ้งซ่อมบำรุง • {getSubtext()}
            </span>
          </div>
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center gap-space-xs shrink-0">
          <button
            onClick={onOpenNotifications}
            aria-label="การแจ้งเตือน"
            className="relative w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[24px]">notifications</span>
            {urgentCount > 0 && (
              <span className="absolute top-2 right-2 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-error text-on-error font-label-sm text-[10px] ring-2 ring-surface font-bold">
                {urgentCount}
              </span>
            )}
          </button>

          <div 
            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm cursor-pointer"
            title="คุณสมชาย (หัวหน้าฝ่ายซ่อมบำรุง)"
          >
            <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </div>
        </div>

      </div>
    </header>
  );
};
