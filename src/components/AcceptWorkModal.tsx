import React, { useState, useEffect } from 'react';
import { Ticket, Technician } from '../types';
import { Wrench, X, Check, Phone, User, AlertCircle, Sparkles, Building2, MapPin } from 'lucide-react';

interface AcceptWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket | null;
  technicians: Technician[];
  onConfirmAccept: (ticketId: string, technicianName: string, technicianPhone?: string) => Promise<void>;
}

export const AcceptWorkModal: React.FC<AcceptWorkModalProps> = ({
  isOpen,
  onClose,
  ticket,
  technicians,
  onConfirmAccept
}) => {
  const [selectedTechName, setSelectedTechName] = useState<string>(() => {
    return localStorage.getItem('scenery_technician_name') || '';
  });
  const [selectedTechPhone, setSelectedTechPhone] = useState<string>('');
  const [customTechName, setCustomTechName] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Active technicians (sorted: on-duty first)
  const activeTechs = React.useMemo(() => {
    return technicians
      .filter(t => t.status === 'active')
      .sort((a, b) => {
        if (a.isOnDutyToday && !b.isOnDutyToday) return -1;
        if (!a.isOnDutyToday && b.isOnDutyToday) return 1;
        return a.name.localeCompare(b.name, 'th');
      });
  }, [technicians]);

  // Sync phone when technician is selected
  useEffect(() => {
    if (selectedTechName && !isCustomMode) {
      const match = technicians.find(t => t.name.toLowerCase() === selectedTechName.toLowerCase());
      if (match?.phone) {
        setSelectedTechPhone(match.phone);
      }
    }
  }, [selectedTechName, isCustomMode, technicians]);

  // If no tech selected, default to first on-duty tech or first active tech
  useEffect(() => {
    if (!selectedTechName && activeTechs.length > 0) {
      const defaultTech = activeTechs.find(t => t.isOnDutyToday) || activeTechs[0];
      if (defaultTech) {
        setSelectedTechName(defaultTech.name);
        setSelectedTechPhone(defaultTech.phone || '');
      }
    }
  }, [isOpen, activeTechs, selectedTechName]);

  if (!isOpen || !ticket) return null;

  const handleSelectTech = (tech: Technician) => {
    setIsCustomMode(false);
    setSelectedTechName(tech.name);
    setSelectedTechPhone(tech.phone || '');
    setCustomTechName('');
    setErrorMessage('');
  };

  const handleToggleCustom = () => {
    setIsCustomMode(true);
    setSelectedTechName('');
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = isCustomMode ? customTechName.trim() : selectedTechName.trim();
    if (!finalName) {
      setErrorMessage('กรุณาเลือกหรือระบุชื่อช่างผู้รับงาน');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      try {
        localStorage.setItem('scenery_technician_name', finalName);
      } catch {}

      await onConfirmAccept(ticket.id, finalName, selectedTechPhone.trim());
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการรับงาน');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-surface-container-lowest rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-primary to-primary-container text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg leading-tight">
                รับงานซ่อม (ลงชื่อช่างผู้รับผิดชอบ)
              </h3>
              <p className="text-xs text-primary-fixed mt-0.5">
                ใครก็สามารถรับงานได้ เพียงเลือกลงชื่อของคุณ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Ticket Information Card */}
          <div className="p-3.5 bg-surface-container-low rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-mono text-xs font-extrabold text-primary bg-primary-fixed/40 px-2 py-0.5 rounded-md">
                #{ticket.requestId}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface">
                {ticket.department}
              </span>
            </div>

            <h4 className="font-bold text-sm sm:text-base text-on-surface leading-snug">
              {ticket.title}
            </h4>

            <div className="flex items-center gap-2 text-xs text-on-surface-variant flex-wrap pt-1 border-t border-slate-200/60">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <strong className="text-on-surface">{ticket.location}</strong>
              </span>
              <span>•</span>
              <span>ผู้แจ้ง: {ticket.requesterName}</span>
            </div>

            {ticket.description && (
              <p className="text-xs text-on-surface-variant bg-white/70 p-2 rounded-xl mt-1 border border-slate-100">
                {ticket.description}
              </p>
            )}
          </div>

          {/* Section: Select Technician */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-extrabold text-on-surface flex items-center gap-1.5">
                <User className="w-4 h-4 text-primary" />
                <span>ใครเป็นผู้รับงานนี้? (แตะเลือกชื่อช่าง)</span>
              </label>
              <button
                type="button"
                onClick={handleToggleCustom}
                className={`text-[11px] font-bold cursor-pointer hover:underline ${
                  isCustomMode ? 'text-primary' : 'text-on-surface-variant'
                }`}
              >
                + พิมพ์ชื่อเอง
              </button>
            </div>

            {!isCustomMode ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {activeTechs.map(tech => {
                  const isSelected = selectedTechName.toLowerCase() === tech.name.toLowerCase();
                  return (
                    <button
                      key={tech.id}
                      type="button"
                      onClick={() => handleSelectTech(tech)}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                        isSelected
                          ? 'bg-primary text-white border-primary shadow-xs ring-2 ring-primary/20'
                          : 'bg-surface-container-low hover:bg-surface-container border-slate-200 text-on-surface'
                      }`}
                    >
                      {tech.avatarUrl ? (
                        <img 
                          src={tech.avatarUrl} 
                          alt={tech.name} 
                          className="w-8 h-8 rounded-xl object-cover shrink-0 border border-white/40"
                        />
                      ) : (
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-surface-container-high text-primary'
                        }`}>
                          👷‍♂️
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs truncate">
                          {tech.name}
                        </div>
                        <div className={`text-[10px] truncate ${isSelected ? 'text-white/80' : 'text-on-surface-variant'}`}>
                          {tech.isOnDutyToday ? '🟢 เข้าเวรวันนี้' : tech.role}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 shrink-0 text-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={customTechName}
                  onChange={(e) => setCustomTechName(e.target.value)}
                  placeholder="พิมพ์ชื่อ-นามสกุล ของช่างผู้รับงาน..."
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-slate-200 rounded-xl text-xs sm:text-sm text-on-surface outline-none focus:border-primary focus:bg-surface-container-lowest"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setIsCustomMode(false)}
                  className="text-xs text-primary font-bold hover:underline cursor-pointer"
                >
                  ← กลับไปเลือกจากรายชื่อช่าง
                </button>
              </div>
            )}
          </div>

          {/* Section: Technician Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-on-surface flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-primary" />
              <span>เบอร์โทรติดต่อช่าง (เพื่อให้แผนกโทรประสานงานได้):</span>
            </label>
            <input
              type="tel"
              value={selectedTechPhone}
              onChange={(e) => setSelectedTechPhone(e.target.value)}
              placeholder="เช่น 081-234-5678"
              className="w-full px-3.5 py-2.5 bg-surface-container-low border border-slate-200 rounded-xl text-xs sm:text-sm text-on-surface outline-none focus:border-primary focus:bg-surface-container-lowest"
            />
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-2 py-3 bg-primary hover:bg-primary-container text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <Wrench className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังบันทึกรับงาน...' : 'ยืนยันรับงานซ่อมนี้ 🚀'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
