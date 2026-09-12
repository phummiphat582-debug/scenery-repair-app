import React, { useState } from 'react';
import { Technician } from '../types';
import { ticketService } from '../services/ticketService';

interface AssignTechnicianModalProps {
  isOpen: boolean;
  onClose: () => void;
  technicians: Technician[];
  currentTechnicianName?: string;
  currentTechnicianPhone?: string;
  onAssign: (techName: string, techPhone?: string) => void;
  onTechnicianCreated?: () => void;
}

export const AssignTechnicianModal: React.FC<AssignTechnicianModalProps> = ({
  isOpen,
  onClose,
  technicians,
  currentTechnicianName,
  currentTechnicianPhone,
  onAssign,
  onTechnicianCreated
}) => {
  if (!isOpen) return null;

  const initialSelected = currentTechnicianName || technicians[0]?.name || '';
  const initialPhone = currentTechnicianPhone || technicians.find(t => t.name === initialSelected)?.phone || '';

  const [selectedName, setSelectedName] = useState(initialSelected);
  const [selectedPhone, setSelectedPhone] = useState(initialPhone);
  const [showAddNew, setShowAddNew] = useState(false);

  // New technician form states
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('ช่างไฟฟ้า/แอร์');
  const [newPhone, setNewPhone] = useState('');
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSelectTech = (t: Technician) => {
    setSelectedName(t.name);
    setSelectedPhone(t.phone || '');
  };

  const handleSave = () => {
    if (!selectedName.trim()) {
      alert('กรุณาเลือกช่างผู้รับผิดชอบ');
      return;
    }
    onAssign(selectedName.trim(), selectedPhone.trim());
    onClose();
  };

  const handleCreateAndSelect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsAdding(true);
    try {
      await ticketService.addTechnician({
        name: newName.trim(),
        role: newRole.trim() || 'ช่างซ่อมบำรุง',
        phone: newPhone.trim(),
        avatarUrl: newAvatarUrl || ''
      });
      setSelectedName(newName.trim());
      setSelectedPhone(newPhone.trim());
      setShowAddNew(false);
      setNewName('');
      setNewPhone('');
      setNewAvatarUrl('');
      if (onTechnicianCreated) {
        onTechnicianCreated();
      }
    } catch (err: any) {
      alert('เพิ่มช่างไม่สำเร็จ: ' + err.message);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg max-h-[90vh] bg-surface-container-lowest rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 flex flex-col gap-4 shadow-2xl overflow-y-auto animate-in slide-in-from-bottom duration-200 border border-slate-200/50">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              กำหนดช่างและเบอร์โทรศัพท์
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              เลือกช่างผู้รับผิดชอบ หรือกำหนดเบอร์โทรติดต่อหน้างาน
            </p>
          </div>
          <button
            className="w-9 h-9 flex items-center justify-center text-on-surface-variant hover:bg-surface-container rounded-full cursor-pointer"
            onClick={onClose}
            type="button"
            aria-label="ปิด"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Selected Tech Phone Direct Editor */}
        <div className="p-3.5 bg-primary-fixed/20 border border-primary-fixed/60 rounded-2xl flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-primary font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              ช่างที่เลือก: {selectedName || '(ยังไม่ระบุ)'}
            </span>
            {selectedPhone && (
              <a
                href={`tel:${selectedPhone}`}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-surface-container-lowest px-2.5 py-1 rounded-full border border-primary/20 shadow-xs hover:bg-primary-fixed/30"
              >
                <span className="material-symbols-outlined text-[14px]">call</span>
                โทรทดสอบ
              </a>
            )}
          </div>
          
          <div>
            <label className="text-[11px] font-semibold text-on-surface-variant block mb-1">
              เบอร์โทรศัพท์ช่าง (ผู้แจ้งจะสามารถกดโทรติดต่อเบอร์นี้ได้โดยตรง)
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[18px]">
                  phone
                </span>
                <input
                  type="tel"
                  value={selectedPhone}
                  onChange={(e) => setSelectedPhone(e.target.value)}
                  placeholder="เช่น 081-234-5678"
                  className="w-full pl-9 pr-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm text-on-surface font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action to show Add New Technician form */}
        <div className="flex items-center justify-between">
          <span className="font-label-md text-label-md font-bold text-on-surface">
            รายชื่อช่างในฟาร์ม ({technicians.length} ท่าน)
          </span>
          <button
            type="button"
            onClick={() => setShowAddNew(!showAddNew)}
            className="text-xs text-primary hover:text-primary-container font-bold flex items-center gap-1 cursor-pointer bg-primary-fixed/30 px-2.5 py-1 rounded-lg"
          >
            <span className="material-symbols-outlined text-[16px]">
              {showAddNew ? 'expand_less' : 'person_add'}
            </span>
            {showAddNew ? 'ซ่อนฟอร์ม' : '+ เพิ่มช่างใหม่'}
          </button>
        </div>

        {/* Add New Technician Inline Form */}
        {showAddNew && (
          <form onSubmit={handleCreateAndSelect} className="p-4 bg-surface-container-low rounded-2xl border border-primary-fixed/40 flex flex-col gap-3 animate-in fade-in duration-150">
            <span className="font-label-sm text-label-sm font-bold text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">badge</span>
              เพิ่มช่างใหม่พร้อมเบอร์โทร
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-medium text-on-surface-variant block mb-1">
                  ชื่อช่าง *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="เช่น ช่างสมหมาย (แอร์)"
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs text-on-surface outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-on-surface-variant block mb-1">
                  เบอร์โทรศัพท์
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="เช่น 089-xxx-xxxx"
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs text-on-surface outline-none focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-on-surface-variant block mb-1">
                หน้าที่ / ฝ่าย
              </label>
              <input
                type="text"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                placeholder="เช่น ช่างไฟฟ้าและเครื่องทำความเย็น"
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs text-on-surface outline-none focus:border-primary"
              />
            </div>

            {/* Avatar upload */}
            <div className="flex items-center gap-2.5 bg-surface-container-lowest p-2 rounded-xl border border-outline-variant">
              {newAvatarUrl ? (
                <img src={newAvatarUrl} alt="Preview" className="w-10 h-10 rounded-xl object-cover border border-primary shadow-xs" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
                </div>
              )}
              <label className="text-xs text-primary font-bold cursor-pointer hover:underline">
                เลือกรูปถ่ายช่าง (จากกล้อง/ไฟล์)
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        if (ev.target?.result) setNewAvatarUrl(ev.target.result as string);
                      };
                      reader.readAsDataURL(f);
                    }
                  }}
                />
              </label>
              {newAvatarUrl && (
                <button type="button" onClick={() => setNewAvatarUrl('')} className="ml-auto text-[11px] text-red-500 font-bold cursor-pointer">
                  ลบรูป
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isAdding}
              className="w-full py-2 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-sm hover:bg-primary-container cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>{isAdding ? 'กำลังบันทึก...' : 'บันทึกและเลือกช่างท่านนี้ทันที'}</span>
            </button>
          </form>
        )}

        {/* Technicians list */}
        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
          {technicians.map((t, idx) => {
            const isAssigned = selectedName === t.name;
            return (
              <div
                key={t.id || idx}
                onClick={() => handleSelectTech(t)}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                  isAssigned
                    ? 'bg-primary-fixed/40 border-primary text-primary shadow-xs'
                    : 'bg-surface-container-low border-transparent hover:bg-surface-container text-on-surface'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {t.avatarUrl ? (
                    <img 
                      src={t.avatarUrl} 
                      alt={t.name} 
                      className={`w-10 h-10 rounded-xl object-cover border-2 shrink-0 shadow-xs ${
                        isAssigned ? 'border-primary ring-2 ring-primary/30' : 'border-slate-200'
                      }`} 
                    />
                  ) : (
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-headline-sm shrink-0 ${
                      isAssigned ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface'
                    }`}>
                      {t.name.slice(4, 5) || t.name.slice(0, 1) || 'ช'}
                    </span>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-lg text-label-lg font-bold truncate">{t.name}</span>
                    <div className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant flex-wrap">
                      <span className="truncate">{t.role}</span>
                      {t.phone ? (
                        <span className="text-primary font-medium flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[13px]">phone</span>
                          {t.phone}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">(ยังไม่มีเบอร์)</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {isAssigned ? (
                    <span
                      className="material-symbols-outlined text-primary text-[22px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-surface-container-highest text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-container-high">
                      เลือก
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Save Button */}
        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <button
            className="flex-1 h-12 rounded-xl bg-surface-container text-on-surface font-label-md text-label-md font-bold hover:bg-surface-container-high cursor-pointer transition-colors"
            onClick={onClose}
            type="button"
          >
            ยกเลิก
          </button>
          <button
            className="flex-2 h-12 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold shadow-md hover:bg-primary-container cursor-pointer transition-all flex items-center justify-center gap-2"
            onClick={handleSave}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
            บันทึกการมอบหมายช่าง
          </button>
        </div>

      </div>
    </div>
  );
};
