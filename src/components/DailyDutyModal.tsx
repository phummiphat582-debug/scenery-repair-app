import React, { useState } from 'react';
import { Technician } from '../types';
import { ticketService } from '../services/ticketService';
import { X, Users, CheckCircle2, Phone, Save, Edit3, ShieldAlert, Camera } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface DailyDutyModalProps {
  isOpen: boolean;
  onClose: () => void;
  technicians: Technician[];
  onDutyChanged: () => void;
}

export const DailyDutyModal: React.FC<DailyDutyModalProps> = ({
  isOpen,
  onClose,
  technicians,
  onDutyChanged
}) => {
  if (!isOpen) return null;

  // Local state of duties
  const [dutyMap, setDutyMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    technicians.forEach(t => {
      map[t.id] = t.isOnDutyToday ?? (t.status === 'active');
    });
    return map;
  });

  const [editingPhoneId, setEditingPhoneId] = useState<string | null>(null);
  const [editingPhoneValue, setEditingPhoneValue] = useState<string>('');

  // Confirmation state
  const [confirmData, setConfirmData] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const toggleDuty = (techId: string, current: boolean, techName: string) => {
    setConfirmData({
      isOpen: true,
      title: 'ยืนยันการเปลี่ยนสถานะเวร',
      message: `คุณต้องการเปลี่ยนสถานะของ "${techName}" เป็น "${!current ? 'มาทำงานวันนี้ 🟢' : 'หยุดงาน / พักเวร ⚪'}" ใช่หรือไม่?`,
      onConfirm: async () => {
        setDutyMap(prev => ({ ...prev, [techId]: !current }));
        await ticketService.setTechnicianDuty(techId, !current);
        setConfirmData(null);
        onDutyChanged();
      }
    });
  };

  const handleSetAll = (status: boolean) => {
    const actionText = status ? 'เปิดมาทำงานทุกคน' : 'ตั้งค่าหยุดทุกคน';
    setConfirmData({
      isOpen: true,
      title: `ยืนยัน${actionText}`,
      message: `คุณต้องการ${actionText} สำหรับช่างทั้งหมด ${technicians.length} ท่าน ใช่หรือไม่?`,
      onConfirm: async () => {
        const nextMap: Record<string, boolean> = {};
        technicians.forEach(t => { nextMap[t.id] = status; });
        setDutyMap(nextMap);
        await ticketService.bulkSetDuty(nextMap);
        setConfirmData(null);
        onDutyChanged();
      }
    });
  };

  const startEditPhone = (t: Technician) => {
    setEditingPhoneId(t.id);
    setEditingPhoneValue(t.phone || '');
  };

  const saveEditPhone = async (tech: Technician) => {
    if (!editingPhoneValue.trim()) {
      alert('กรุณากรอกเบอร์โทร');
      return;
    }
    await ticketService.updateTechnician(tech.id, { phone: editingPhoneValue.trim() });
    setEditingPhoneId(null);
    onDutyChanged();
  };

  const handleDirectPhotoUpload = (tech: Technician, file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      if (e.target?.result) {
        const url = e.target.result as string;
        await ticketService.updateTechnician(tech.id, { avatarUrl: url });
        onDutyChanged();
      }
    };
    reader.readAsDataURL(file);
  };

  const onDutyCount = Object.values(dutyMap).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-container text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-secondary-fixed" />
            </div>
            <div>
              <h3 className="font-bold text-base">อัปเดตเวรช่างวันนี้ (Daily Duty)</h3>
              <p className="text-xs text-primary-fixed">
                เช็คชื่อช่างที่มาปฏิบัติงานวันนี้ เพื่อให้ผู้แจ้งสามารถโทรติดต่อได้ตรงคน
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls Bar */}
        <div className="p-4 bg-surface-container-low border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-on-surface">
              ปฏิบัติงานวันนี้:
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
              🟢 {onDutyCount} / {technicians.length} ท่าน
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleSetAll(true)}
              className="px-2.5 py-1 bg-surface-container-highest hover:bg-surface-container text-primary font-bold text-[11px] rounded-lg cursor-pointer"
            >
              มาทำงานทุกคน
            </button>
            <button
              type="button"
              onClick={() => handleSetAll(false)}
              className="px-2.5 py-1 bg-surface-container-highest hover:bg-surface-container text-slate-600 font-bold text-[11px] rounded-lg cursor-pointer"
            >
              หยุดทุกคน
            </button>
          </div>
        </div>

        {/* Technicians List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {technicians.map(tech => {
            const isOnDuty = dutyMap[tech.id] ?? false;
            const isEditingPhone = editingPhoneId === tech.id;

            return (
              <div
                key={tech.id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2 ${
                  isOnDuty
                    ? 'bg-emerald-50/50 border-emerald-300 shadow-xs'
                    : 'bg-surface-container-lowest border-slate-200 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative group shrink-0">
                      {tech.avatarUrl ? (
                        <img 
                          src={tech.avatarUrl} 
                          alt={tech.name} 
                          className={`w-11 h-11 rounded-2xl object-cover border-2 shadow-xs transition-transform group-hover:scale-105 ${
                            isOnDuty ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-slate-200 opacity-60'
                          }`} 
                        />
                      ) : (
                        <span className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shadow-xs ${
                          isOnDuty ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {tech.name.slice(4, 5) || tech.name.slice(0, 1) || 'ช'}
                        </span>
                      )}
                      <label 
                        htmlFor={`duty-avatar-${tech.id}`}
                        className="absolute inset-0 bg-slate-900/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white shadow-xs"
                        title="คลิกเพื่อเปลี่ยนรูปถ่ายช่าง"
                      >
                        <Camera className="w-4 h-4" />
                      </label>
                      <input 
                        id={`duty-avatar-${tech.id}`}
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleDirectPhotoUpload(tech, file);
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs sm:text-sm text-on-surface truncate flex items-center gap-1.5">
                        <span>{tech.name}</span>
                        {isOnDuty && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            เข้าเวรวันนี้
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-on-surface-variant truncate">
                        {tech.role}
                      </div>
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <button
                    type="button"
                    onClick={() => toggleDuty(tech.id, isOnDuty, tech.name)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-95 shrink-0 ${
                      isOnDuty
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    }`}
                  >
                    {isOnDuty ? '🟢 ปฏิบัติงาน' : '⚪ หยุด / ไม่มา'}
                  </button>
                </div>

                {/* Phone row & quick phone editor */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/40 text-xs">
                  {isEditingPhone ? (
                    <div className="flex items-center gap-1.5 w-full">
                      <input
                        type="tel"
                        value={editingPhoneValue}
                        onChange={(e) => setEditingPhoneValue(e.target.value)}
                        placeholder="เบอร์โทร เช่น 081-xxx-xxxx"
                        className="flex-1 p-1.5 bg-white border border-primary rounded-lg text-xs outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => saveEditPhone(tech)}
                        className="px-2 py-1 bg-primary text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        บันทึก
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingPhoneId(null)}
                        className="px-2 py-1 bg-slate-200 text-slate-600 rounded-lg text-xs cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1 text-on-surface-variant">
                        <Phone className="w-3.5 h-3.5 text-primary" />
                        <span className="font-semibold">{tech.phone || '(ยังไม่ระบุเบอร์)'}</span>
                        <button
                          type="button"
                          onClick={() => startEditPhone(tech)}
                          title="แก้ไขเบอร์โทรศัพท์"
                          className="p-1 text-slate-400 hover:text-primary rounded-md cursor-pointer ml-1"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>

                      {tech.phone && (
                        <a
                          href={`tel:${tech.phone}`}
                          className="text-[11px] font-bold text-primary hover:underline"
                        >
                          กดโทรทดสอบ
                        </a>
                      )}
                    </>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-container-low border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-container cursor-pointer"
          >
            เสร็จสิ้น
          </button>
        </div>

      </div>

      {/* Confirmation Dialog */}
      {confirmData && (
        <ConfirmModal
          isOpen={confirmData.isOpen}
          title={confirmData.title}
          message={confirmData.message}
          confirmText="ยืนยัน"
          cancelText="ยกเลิก"
          confirmVariant="primary"
          onConfirm={confirmData.onConfirm}
          onCancel={() => setConfirmData(null)}
        />
      )}

    </div>
  );
};
