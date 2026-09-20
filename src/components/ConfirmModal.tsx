import React from 'react';
import { AlertTriangle, CheckCircle2, HelpCircle, X, AlertOctagon } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger' | 'warning' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  confirmVariant = 'primary',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (confirmVariant) {
      case 'danger':
        return {
          iconBg: 'bg-red-100 text-red-600',
          icon: <AlertOctagon className="w-7 h-7" />,
          button: 'bg-red-600 hover:bg-red-700 text-white'
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-100 text-amber-700',
          icon: <AlertTriangle className="w-7 h-7" />,
          button: 'bg-amber-600 hover:bg-amber-700 text-white'
        };
      case 'success':
        return {
          iconBg: 'bg-emerald-100 text-emerald-700',
          icon: <CheckCircle2 className="w-7 h-7" />,
          button: 'bg-emerald-600 hover:bg-emerald-700 text-white'
        };
      case 'primary':
      default:
        return {
          iconBg: 'bg-primary-fixed text-primary',
          icon: <HelpCircle className="w-7 h-7" />,
          button: 'bg-primary hover:bg-primary-container text-white'
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-surface-container-lowest w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-7 flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className={`w-16 h-16 rounded-2xl ${vStyles.iconBg} flex items-center justify-center shadow-xs`}>
          {vStyles.icon}
        </div>

        <div className="space-y-1">
          <h3 className="text-lg sm:text-xl font-bold text-on-surface">
            {title}
          </h3>
          <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex gap-2.5 w-full pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl text-sm font-bold transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-3 ${vStyles.button} rounded-xl text-sm font-bold transition-all shadow-xs cursor-pointer active:scale-95`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
