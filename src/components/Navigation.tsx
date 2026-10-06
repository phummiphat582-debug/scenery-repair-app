import React from 'react';
import { NavTab } from '../types';
import { LayoutDashboard, Plus, ClipboardList, Settings, BarChart2 } from 'lucide-react';

interface NavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab
}) => {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-2px_12px_rgba(13,28,46,0.06)] border-t border-slate-200/50">
      <div className="flex items-center justify-around h-20 px-space-xs max-w-lg mx-auto">
        {/* ภาพรวม */}
        <button
          onClick={() => onSelectTab('dashboard')}
          type="button"
          className={`flex flex-col items-center justify-center min-w-[50px] min-h-[48px] py-1 px-1 transition-all cursor-pointer active:scale-95 ${
            currentTab === 'dashboard'
              ? 'text-primary-container font-bold scale-105'
              : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <LayoutDashboard size={22} className={currentTab === 'dashboard' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="font-label-sm text-[11px] mt-0.5 text-center leading-tight truncate max-w-[56px]">
            ภาพรวม
          </span>
        </button>

        {/* รายการ */}
        <button
          onClick={() => onSelectTab('all-requests')}
          type="button"
          className={`flex flex-col items-center justify-center min-w-[50px] min-h-[48px] py-1 px-1 transition-all cursor-pointer active:scale-95 ${
            currentTab === 'all-requests'
              ? 'text-primary-container font-bold scale-105'
              : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <ClipboardList size={22} className={currentTab === 'all-requests' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="font-label-sm text-[11px] mt-0.5 text-center leading-tight truncate max-w-[56px]">
            รายการ
          </span>
        </button>

        {/* แจ้งซ่อม (Floating center circle button) */}
        <button
          onClick={() => onSelectTab('new-request')}
          type="button"
          className="flex flex-col items-center justify-center min-w-[50px] min-h-[48px] -mt-5 group cursor-pointer focus:outline-none"
        >
          <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-[0_4px_10px_rgba(24,78,56,0.3)] group-active:scale-95 group-hover:bg-primary transition-transform">
            <Plus size={26} className="stroke-[2.5]" />
          </div>
          <span
            className={`font-label-sm text-[11px] mt-1 text-center ${
              currentTab === 'new-request' ? 'text-primary font-bold' : 'text-on-surface-variant font-semibold'
            }`}
          >
            แจ้งซ่อม
          </span>
        </button>

        {/* สรุปรายงาน */}
        <button
          onClick={() => onSelectTab('summary')}
          type="button"
          className={`flex flex-col items-center justify-center min-w-[50px] min-h-[48px] py-1 px-1 transition-all cursor-pointer active:scale-95 ${
            currentTab === 'summary'
              ? 'text-primary-container font-bold scale-105'
              : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <BarChart2 size={22} className={currentTab === 'summary' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="font-label-sm text-[11px] mt-0.5 text-center leading-tight truncate max-w-[56px]">
            สรุปรายงาน
          </span>
        </button>

        {/* ตั้งค่า */}
        <button
          onClick={() => onSelectTab('settings')}
          type="button"
          className={`flex flex-col items-center justify-center min-w-[50px] min-h-[48px] py-1 px-1 transition-all cursor-pointer active:scale-95 ${
            currentTab === 'settings'
              ? 'text-primary-container font-bold scale-105'
              : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <Settings size={22} className={currentTab === 'settings' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="font-label-sm text-[11px] mt-0.5 text-center leading-tight truncate max-w-[56px]">
            ตั้งค่า
          </span>
        </button>
      </div>
    </nav>
  );
};
