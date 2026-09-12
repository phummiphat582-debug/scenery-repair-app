import React, { useState } from 'react';
import { Lock, ShieldCheck, KeyRound, X, Wrench } from 'lucide-react';

interface RoleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RoleLoginModal: React.FC<RoleLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // Default PIN: 1234 or bypass
    if (pin === '1234' || pin === '9999' || pin === '0000') {
      setError(false);
      setPin('');
      onSuccess();
    } else {
      setError(true);
    }
  };

  const handleQuickBypass = () => {
    setError(false);
    setPin('');
    onSuccess();
  };

  const handleNumClick = (n: string) => {
    if (pin.length < 4) {
      const next = pin + n;
      setPin(next);
      if (next.length === 4) {
        if (next === '1234' || next === '9999' || next === '0000') {
          setTimeout(() => {
            setError(false);
            setPin('');
            onSuccess();
          }, 150);
        } else {
          setError(true);
        }
      }
    }
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-surface-container-lowest w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-primary to-primary-container text-white flex flex-col items-center text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-3 shadow-inner">
            <Wrench className="w-7 h-7 text-secondary-fixed" />
          </div>

          <h3 className="text-lg font-bold">เข้าสู่ระบบหลังบ้าน / ทีมช่าง</h3>
          <p className="text-xs text-primary-fixed mt-1">
            สำหรับช่างและหัวหน้างานจัดการคิวงานและภาพรวมฟาร์ม
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-semibold text-on-surface-variant">
              กรอกรหัส PIN ช่าง (รหัสเริ่มต้น: <strong className="text-primary font-mono">1234</strong>)
            </span>
            
            {/* PIN Dots */}
            <div className="flex items-center gap-3 my-2">
              {[0, 1, 2, 3].map(idx => {
                const filled = pin.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full transition-all ${
                      filled
                        ? 'bg-primary scale-110 shadow-sm'
                        : 'border-2 border-outline-variant bg-surface-container'
                    }`}
                  />
                );
              })}
            </div>

            {error && (
              <span className="text-xs text-error font-semibold animate-shake">
                รหัส PIN ไม่ถูกต้อง (ลองใช้ 1234)
              </span>
            )}
          </div>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2.5 w-full max-w-[240px]">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => handleNumClick(num)}
                className="h-12 rounded-2xl bg-surface-container-low hover:bg-surface-container-high text-on-surface font-bold text-lg flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-12 rounded-2xl bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant text-xs font-bold flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            >
              ล้าง
            </button>
            <button
              type="button"
              onClick={() => handleNumClick('0')}
              className="h-12 rounded-2xl bg-surface-container-low hover:bg-surface-container-high text-on-surface font-bold text-lg flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => setPin(p => p.slice(0, -1))}
              className="h-12 rounded-2xl bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant text-xs font-bold flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            >
              ลบ
            </button>
          </div>

          {/* Quick Demo Bypass Button */}
          <div className="w-full pt-2 flex flex-col gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleQuickBypass}
              className="w-full py-2.5 bg-primary-fixed/40 hover:bg-primary-fixed text-primary rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>เข้าสู่ระบบทันที (กดคลิกเดียวสำหรับทดสอบ)</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
