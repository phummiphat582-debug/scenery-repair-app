import React from 'react';
import { NavTab } from '../types';

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
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-1 transition-all cursor-pointer ${
            currentTab === 'dashboard'
              ? 'text-primary-container font-bold scale-105'
              : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <span
            className="material-symbols-outlined text-[24px]"
            style={{ fontVariationSettings: currentTab === 'dashboard' ? "'FILL' 1" : "'FILL' 0" }}
          >
            dashboard
          </span>
          <span className="font-label-sm text-label-sm mt-0.5 text-center leading-tight truncate max-w-[64px]">
            ภาพรวม
          </span>
        </button>

        {/* แจ้งซ่อม (Floating center circle button) */}
        <button
          onClick={() => onSelectTab('new-request')}
          className="flex flex-col items-center justify-center min-w-[56px] min-h-[48px] -mt-5 group cursor-pointer focus:outline-none"
        >
          <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-[0_4px_10px_rgba(24,78,56,0.3)] group-active:scale-95 group-hover:bg-primary transition-transform">
            <span className="material-symbols-outlined text-[28px]">add</span>
          </div>
          <span
            className={`font-label-sm text-label-sm mt-1 text-center ${
              currentTab === 'new-request' ? 'text-primary font-bold' : 'text-on-surface-variant font-semibold'
            }`}
          >
            แจ้งซ่อม
          </span>
        </button>

        {/* รายการ */}
        <button
          onClick={() => onSelectTab('all-requests')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-1 transition-all cursor-pointer ${
            currentTab === 'all-requests'
              ? 'text-primary-container font-bold scale-105'
              : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <span
            className="material-symbols-outlined text-[24px]"
            style={{ fontVariationSettings: currentTab === 'all-requests' ? "'FILL' 1" : "'FILL' 0" }}
          >
            assignment
          </span>
          <span className="font-label-sm text-label-sm mt-0.5 text-center leading-tight truncate max-w-[64px]">
            รายการ
          </span>
        </button>

        {/* ตั้งค่า */}
        <button
          onClick={() => onSelectTab('settings')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-1 transition-all cursor-pointer ${
            currentTab === 'settings'
              ? 'text-primary-container font-bold scale-105'
              : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <span
            className="material-symbols-outlined text-[24px]"
            style={{ fontVariationSettings: currentTab === 'settings' ? "'FILL' 1" : "'FILL' 0" }}
          >
            tune
          </span>
          <span className="font-label-sm text-label-sm mt-0.5 text-center leading-tight truncate max-w-[64px]">
            ตั้งค่า
          </span>
        </button>
      </div>
    </nav>
  );
};
