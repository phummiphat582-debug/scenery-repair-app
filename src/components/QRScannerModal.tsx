import React, { useState } from 'react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (result: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onScanResult }) => {
  if (!isOpen) return null;

  const [simulatedCode, setSimulatedCode] = useState('PUMP-ZONE-A-01');

  const handleSimulate = (code: string) => {
    onScanResult(code);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface rounded-3xl p-6 shadow-2xl flex flex-col gap-4 border border-slate-200 text-center">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
            สแกน QR Code ประจำจุดซ่อม
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Mock Viewfinder */}
        <div className="w-full aspect-square bg-slate-950 rounded-2xl relative overflow-hidden flex items-center justify-center">
          <div className="w-48 h-48 border-2 border-primary rounded-xl relative animate-pulse flex items-center justify-center">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-tertiary-fixed shadow-[0_0_8px_#85f8c4] animate-[bounce_2s_infinite]"></div>
            <span className="text-white/60 text-xs">จัดวาง QR Code ในกรอบ</span>
          </div>
        </div>

        <p className="font-body-sm text-body-sm text-on-surface-variant">
          หรือเลือกจำลองการสแกนครุภัณฑ์ในฟาร์ม:
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => handleSimulate('COOL-ZONE-C-9921')}
            className="p-2.5 rounded-xl bg-surface-container-low text-xs font-bold text-left hover:bg-surface-container cursor-pointer"
          >
            ⚡ ตู้แช่คาเฟ่ (COOL-ZONE-C-9921)
          </button>
          <button
            onClick={() => handleSimulate('PUMP-ZONE-A-04')}
            className="p-2.5 rounded-xl bg-surface-container-low text-xs font-bold text-left hover:bg-surface-container cursor-pointer"
          >
            💧 ปั๊มน้ำคอกแกะ Pasture C (PUMP-ZONE-A-04)
          </button>
          <button
            onClick={() => handleSimulate('VILLA-AC-V04')}
            className="p-2.5 rounded-xl bg-surface-container-low text-xs font-bold text-left hover:bg-surface-container cursor-pointer"
          >
            🏨 แอร์บ้านพักวิลล่า V-04 (VILLA-AC-V04)
          </button>
        </div>
      </div>
    </div>
  );
};
