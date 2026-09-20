import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  return (
    <div className="fixed bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] sm:w-auto max-w-lg">
      <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white text-sm sm:text-sm font-semibold ${
        type === 'error' ? 'bg-rose-900 border border-rose-700' :
        type === 'info' ? 'bg-blue-900 border border-blue-700' :
        'bg-slate-900 border border-slate-700'
      }`}>
        {type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" /> :
         type === 'info' ? <Info className="w-5 h-5 shrink-0 text-blue-400" /> :
         <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />}
        <span className="leading-snug">{message}</span>
        <button onClick={onClose} className="ml-auto p-1 hover:opacity-80 cursor-pointer shrink-0">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
