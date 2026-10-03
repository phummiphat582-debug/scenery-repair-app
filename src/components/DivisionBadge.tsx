import React from 'react';
import { DivisionId } from '../types';
import { getDivisionInfo } from '../data/divisionData';

interface DivisionBadgeProps {
  division?: DivisionId | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const DivisionBadge: React.FC<DivisionBadgeProps> = ({
  division,
  size = 'md',
  showIcon = true,
  className = ''
}) => {
  const info = getDivisionInfo(division);

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-bold',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold'
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-lg font-medium shadow-xs shrink-0 ${info.badgeClass} ${sizeClasses} ${className}`}
      title={info.description}
    >
      {showIcon && (
        <span className="text-xs shrink-0">
          {info.id === '84' ? '🛠️' : info.id === '85' ? '🏗️' : '🎨'}
        </span>
      )}
      <span>{info.name}</span>
    </span>
  );
};
