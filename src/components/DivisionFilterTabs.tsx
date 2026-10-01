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
    if (divId === 'all') return activeTickets.length;
    return activeTickets.filter(t => (t.division || '84') === divId).length;
  };

  return (
    <div className={`flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none ${className}`}>
      {/* All Divisions Tab */}
      <button
        type="button"
        onClick={() => onSelectDivision('all')}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs ${
          selectedDivision === 'all'
            ? 'bg-primary text-white shadow-sm ring-2 ring-primary/20'
            : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
        }`}
      >
        <span className="material-symbols-outlined text-[16px]">domain</span>
        <span>ทุกสายงาน</span>
        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
          selectedDivision === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
        }`}>
          {getCount('all')}
        </span>
      </button>

      {/* 3 Main Divisions */}
      {DIVISION_LIST.map((div) => {
        const isSelected = selectedDivision === div.id;
        const count = getCount(div.id);

        return (
          <button
            key={div.id}
            type="button"
            onClick={() => onSelectDivision(div.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs ${
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
