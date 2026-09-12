import React, { useState } from 'react';
import { Technician } from '../types';

interface AssignTechnicianModalProps {
  isOpen: boolean;
  onClose: () => void;
  technicians: Technician[];
  currentTechnicianName?: string;
  onAssign: (techName: string) => void;
}

export const AssignTechnicianModal: React.FC<AssignTechnicianModalProps> = ({
  isOpen,
  onClose,
  technicians,
  currentTechnicianName,
  onAssign
}) => {
  if (!isOpen) return null;

  const [selected, setSelected] = useState(currentTechnicianName || technicians[0]?.name || 'ช่างอนุรักษ์ ยอดช่าง');

  const handleSave = () => {
    onAssign(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center p-0">
      <div className="w-full max-w-lg max-h-[85vh] bg-surface-container-lowest rounded-t-3xl p-gutter flex flex-col gap-4 shadow-2xl overflow-y-auto animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between pb-1">
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
            จัดการทีมช่างผู้รับผิดชอบ
          </h3>
          <button
            className="w-9 h-9 flex items-center justify-center text-on-surface-variant hover:bg-surface-container rounded-full cursor-pointer"
            onClick={onClose}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <p className="font-body-sm text-body-sm text-on-surface-variant -mt-2">
          เลือกช่างผู้เชี่ยวชาญเพิ่มเติมเพื่อสนับสนุนหน้างานหรือโอนถ่ายงาน
        </p>

        {/* Technicians list */}
        <div className="flex flex-col gap-2.5">
          {technicians.map((t, idx) => {
            const isAssigned = selected === t.name;
            return (
              <div
                key={t.id || idx}
                onClick={() => setSelected(t.name)}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                  isAssigned
                    ? 'bg-primary-fixed/40 border-primary-fixed text-primary'
                    : 'bg-surface-container-low border-transparent hover:bg-surface-container text-on-surface'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-headline-sm">
                    {t.name.slice(4, 5) || 'ช'}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-label-lg text-label-lg font-bold">{t.name}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {t.role} • {isAssigned ? 'ผู้รับผิดชอบหลัก (ปัจจุบัน)' : 'ว่าง'}
                    </span>
                  </div>
                </div>

                {isAssigned ? (
                  <span
                    className="material-symbols-outlined text-primary text-[22px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-surface-container-highest text-on-surface font-label-sm text-label-sm font-semibold">
                    เลือก
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <button
          className="w-full h-12 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold mt-2 shadow-md hover:bg-primary-container cursor-pointer"
          onClick={handleSave}
          type="button"
        >
          บันทึกการมอบหมาย
        </button>
      </div>
    </div>
  );
};
