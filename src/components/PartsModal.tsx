import React, { useState } from 'react';
import { Ticket } from '../types';

interface PartsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket?: Ticket | null;
}

export const PartsModal: React.FC<PartsModalProps> = ({ isOpen, onClose, ticket }) => {
  if (!isOpen) return null;

  const [partName, setPartName] = useState('Expansion Valve Danfoss R404A');
  const [partCode, setPartCode] = useState('DF-VLV-404');
  const [quantity, setQuantity] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`บันทึกคำขอเบิกอะไหล่ ${partName} (${quantity} ชิ้น) เรียบร้อยแล้ว ระบบส่งเรื่องไปยังคลังพัสดุกลาง`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl flex flex-col gap-4 border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">inventory_2</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              แบบฟอร์มเบิกอะไหล่ซ่อม
            </h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-on-surface-variant rounded-full hover:bg-slate-100 cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant">สำหรับใบงาน</label>
            <div className="p-2 rounded-lg bg-surface-container-low text-xs font-bold text-primary">
              {ticket ? `#${ticket.requestId}: ${ticket.title}` : 'ระบุใบงานทั่วไป (ศูนย์ซ่อมบำรุง)'}
            </div>
          </div>

          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant">ชื่ออะไหล่ / ชิ้นส่วน</label>
            <input
              type="text"
              required
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              className="w-full h-11 px-3 rounded-lg bg-surface-container-low border border-slate-200 font-body-md text-body-md"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">รหัสอะไหล่ (ถ้ามี)</label>
              <input
                type="text"
                value={partCode}
                onChange={(e) => setPartCode(e.target.value)}
                className="w-full h-11 px-3 rounded-lg bg-surface-container-low border border-slate-200 font-body-md text-body-md font-mono"
              />
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">จำนวน</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full h-11 px-3 rounded-lg bg-surface-container-low border border-slate-200 font-body-md text-body-md"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-12 rounded-xl bg-primary text-on-primary font-bold mt-2 shadow hover:bg-primary-container cursor-pointer"
          >
            ส่งคำขอเบิกอะไหล่เข้าสโตร์
          </button>
        </form>
      </div>
    </div>
  );
};
