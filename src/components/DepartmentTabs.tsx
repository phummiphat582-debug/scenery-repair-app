import React from 'react';
import { Department } from '../types';
import { Building2 } from 'lucide-react';

interface DepartmentTabsProps {
  departments: Department[];
  selectedDepartment: string;
  onSelectDepartment: (deptName: string) => void;
  departmentCounts: Record<string, { total: number; urgent: number }>;
  totalActiveCount: number;
}

export const DepartmentTabs: React.FC<DepartmentTabsProps> = ({
  departments,
  selectedDepartment,
  onSelectDepartment,
  departmentCounts,
  totalActiveCount
}) => {
  return (
    <div className="bg-white border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          
          {/* Tab: All Departments */}
          <button
            onClick={() => onSelectDepartment('all')}
            className={`flex-none inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              selectedDepartment === 'all'
                ? 'bg-teal-700 text-white shadow-sm shadow-teal-900/20'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>ทุกแผนก</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
              selectedDepartment === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {totalActiveCount}
            </span>
          </button>

          {/* Department Pills */}
          {departments.map(dept => {
            const counts = departmentCounts[dept.name] || { total: 0, urgent: 0 };
            const isSelected = selectedDepartment === dept.name;

            return (
              <button
                key={dept.id}
                onClick={() => onSelectDepartment(dept.name)}
                className={`flex-none inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-teal-700 text-white shadow-sm shadow-teal-900/20'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{dept.icon}</span>
                <span>{dept.name}</span>
                
                {counts.total > 0 && (
                  <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {counts.total}
                  </span>
                )}

                {counts.urgent > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" title="มีงานด่วนในแผนกนี้" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
