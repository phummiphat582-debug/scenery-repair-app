import React from 'react';
import { DivisionId, Ticket } from '../types';
import { DIVISION_LIST } from '../data/divisionData';

interface DivisionFilterTabsProps {
  selectedDivision: string; // 'all' | '84' | '85' | '86'
  onSelectDivision: (division: string) => void;
  tickets?: Ticket[];
  className?: string;
}

export const DivisionFilterTabs: React.FC<DivisionFilterTabsProps> = ({
  selectedDivision,
  onSelectDivision,
  tickets = [],
  className = ''
}) => {
  // Compute counts for active tickets
  const activeTickets = tickets.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
  
  const getCount = (divId: string) => {
    return activeTickets.filter(t => (t.division || '84') === divId).length;
  };

  return (
    <div className={`grid grid-cols-3 gap-2 overflow-x-auto pb-1 scrollbar-none ${className}`}>
      {/* 3 Main Divisions (84 ซ่อมบำรุง, 85 ก่อสร้าง, 86 งานศิลป์) */}
      {DIVISION_LIST.map((div) => {
        const isSelected = selectedDivision === div.id;
        const count = getCount(div.id);

        return (
          <button
            key={div.id}
            type="button"
            onClick={() => onSelectDivision(div.id)}
            className={`px-2 sm:px-3 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer shadow-xs truncate ${
              isSelected
                ? `${div.accentBg} text-white shadow-sm ring-2 ring-offset-1`
                : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{div.icon}</span>
            <span>{div.name}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
              isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
