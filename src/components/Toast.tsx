import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 animate-bounce">
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-white text-xs sm:text-sm font-medium ${
        type === 'error' ? 'bg-rose-900 border border-rose-700' :
        type === 'info' ? 'bg-blue-900 border border-blue-700' :
        'bg-slate-900 border border-slate-700'
      }`}>
        {type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-400" /> :
         type === 'info' ? <Info className="w-4 h-4 text-blue-400" /> :
         <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-80 cursor-pointer">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
