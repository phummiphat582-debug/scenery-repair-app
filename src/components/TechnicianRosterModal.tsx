import React, { useState } from 'react';
import { X, Users, UserPlus, Trash2, Phone, AlertTriangle, CheckCircle2, Edit3, Save, RotateCcw } from 'lucide-react';
import { Technician } from '../types';
import { ticketService } from '../services/ticketService';

interface TechnicianRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  technicians: Technician[];
  onRosterChanged: () => void;
}

const COMMON_ROLES = [
  'ช่างไฟฟ้า/แอร์',
  'ช่างยนต์/เครื่องจักร',
  'ช่างประปา/สุขาภิบาล',
  'ช่างไม้ อาคาร/สี',
  'ช่างไอที/เครือข่าย',
  'อู่ซ่อมภายนอก',
];

export const TechnicianRosterModal: React.FC<TechnicianRosterModalProps> = ({
  isOpen,
  onClose,
  technicians,
  onRosterChanged
}) => {
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('ช่างไฟฟ้า/แอร์');
  const [newPhone, setNewPhone] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Editing state for an individual technician
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editPhone, setEditPhone] = useState('');

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    await ticketService.addTechnician({
      name: newName.trim(),
      role: newRole.trim() || 'ช่างซ่อมบำรุง',
      phone: newPhone.trim()
    });

    setNewName('');
    setNewPhone('');
    showToast(`เพิ่มช่าง "${newName.trim()}" ในระบบเรียบร้อย`);
    onRosterChanged();
  };

  const startEdit = (t: Technician) => {
    setEditingId(t.id);
    setEditName(t.name);
    setEditRole(t.role);
    setEditPhone(t.phone || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditRole('');
    setEditPhone('');
  };

  const saveEdit = async (t: Technician) => {
    if (!editName.trim()) {
      alert('กรุณากรอกชื่อช่าง');
      return;
    }

    await ticketService.updateTechnician(t.id, {
      name: editName.trim(),
      role: editRole.trim() || 'ช่างซ่อมบำรุง',
      phone: editPhone.trim()
    });

    setEditingId(null);
    showToast(`บันทึกข้อมูลช่าง "${editName.trim()}" สำเร็จ`);
    onRosterChanged();
  };

  const handleDelete = async (tech: Technician) => {
    await ticketService.deleteTechnician(tech.id);
    setConfirmDeleteId(null);
    showToast(`ลบช่าง "${tech.name}" ออกจากระบบเรียบร้อย`);
    onRosterChanged();
  };

  const handleToggle = async (t: Technician) => {
    const nextStatus = t.status === 'active' ? 'inactive' : 'active';
    await ticketService.setTechnicianStatus(t.name, nextStatus);
    onRosterChanged();
  };

  const activeCount = technicians.filter(t => t.status === 'active').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-container text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-secondary-fixed" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">จัดการรายชื่อและเบอร์โทรช่าง</h3>
              <p className="text-xs text-white/80">กำหนดชื่อ เบอร์โทรติดต่อ และความเชี่ยวชาญของช่างแต่ละท่าน</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2 flex items-center gap-2 text-xs text-emerald-800 font-medium shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Add Technician Form */}
          <form onSubmit={handleAdd} className="space-y-3 p-4 bg-slate-50/90 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-primary" />
                <span>+ เพิ่มช่างใหม่และเบอร์โทรศัพท์</span>
              </div>
              <span className="text-[11px] text-slate-600">
                พร้อมรับงาน <strong className="text-primary">{activeCount}</strong>/{technicians.length} ท่าน
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  ชื่อ-นามสกุล หรือชื่อเรียกช่าง *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="เช่น ช่างสมหมาย (ไฟฟ้า)..."
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  เบอร์โทรศัพท์ (มีปุ่มโทรออกด่วน) *
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="เช่น 081-234-5678"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                ความเชี่ยวชาญ / หน้าที่
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {COMMON_ROLES.map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setNewRole(role)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer ${
                      newRole === role
                        ? 'bg-primary text-white shadow-xs font-bold'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-primary/40'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                placeholder="หรือระบุหน้าที่เอง เช่น ช่างสุขาภิบาล..."
                className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-primary hover:bg-primary-container text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>บันทึกเพิ่มรายชื่อช่าง</span>
            </button>
          </form>

          {/* Technicians List Header */}
          <div className="flex items-center justify-between pt-1">
            <h4 className="text-xs font-bold text-slate-800">
              รายชื่อช่างทั้งหมดในระบบ ({technicians.length} ท่าน)
            </h4>
            <span className="text-[11px] text-slate-500">กดแก้ไขเพื่อเปลี่ยนเบอร์หรือข้อมูล</span>
          </div>

          {/* Technicians List */}
          <div className="space-y-2.5 pr-1">
            {technicians.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                ยังไม่มีรายชื่อช่างในระบบ กรุณาเพิ่มช่างด้านบน
              </div>
            ) : (
              technicians.map(t => {
                const isEditing = editingId === t.id;

                if (isEditing) {
                  return (
                    <div
                      key={t.id}
                      className="p-3.5 bg-primary-fixed/20 border-2 border-primary rounded-2xl flex flex-col gap-2.5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primary flex items-center gap-1">
                          <Edit3 className="w-3.5 h-3.5" />
                          แก้ไขข้อมูลช่าง
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => saveEdit(t)}
                            className="px-2.5 py-1 bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-primary-container cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                            บันทึก
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="px-2 py-1 bg-white border border-slate-300 text-slate-600 rounded-lg text-xs hover:bg-slate-50 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">ชื่อช่าง</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">เบอร์โทรศัพท์</label>
                          <input
                            type="tel"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder="08x-xxx-xxxx"
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none focus:border-primary"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">ตำแหน่ง / หน้าที่</label>
                        <input
                          type="text"
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  );
                }

                return (
                  <div 
                    key={t.id}
                    className="p-3.5 bg-white border border-slate-200 rounded-2xl flex flex-col gap-2 hover:border-slate-300 transition-all shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          t.status === 'active' ? 'bg-primary text-white shadow-xs' : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}>
                          {t.name.slice(4, 5) || t.name.slice(0, 1) || 'ช'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm truncate flex items-center gap-1.5">
                            <span>{t.name}</span>
                            {t.status === 'active' && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap mt-0.5">
                            <span>{t.role}</span>
                            {t.phone ? (
                              <a
                                href={`tel:${t.phone}`}
                                className="text-primary font-semibold flex items-center gap-1 bg-primary-fixed/40 px-2 py-0.5 rounded-full hover:bg-primary hover:text-white transition-colors"
                                title="กดเพื่อโทรออก"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{t.phone}</span>
                              </a>
                            ) : (
                              <span className="text-slate-400 text-[10px]">(ไม่มีเบอร์โทร)</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Edit button */}
                        <button
                          type="button"
                          onClick={() => startEdit(t)}
                          title={`แก้ไขข้อมูล ${t.name}`}
                          className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Toggle status button */}
                        <button
                          type="button"
                          onClick={() => handleToggle(t)}
                          title={t.status === 'active' ? 'คลิกเพื่อปิดรับงาน' : 'คลิกเพื่อเปิดรับงาน'}
                          className={`px-2 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
                            t.status === 'active'
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {t.status === 'active' ? '🟢 พร้อม' : '⚪ พัก'}
                        </button>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(t.id)}
                          title={`ลบ ${t.name} ออกจากระบบ`}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Inline Delete Confirmation */}
                    {confirmDeleteId === t.id && (
                      <div className="p-3 bg-red-50/90 border border-red-200 rounded-xl flex items-center justify-between gap-2 text-xs text-red-900 animate-in fade-in duration-100">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>ยืนยันการลบ <strong>"{t.name}"</strong>?</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDelete(t)}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[11px] shadow-xs cursor-pointer"
                          >
                            ยืนยันลบ
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-[11px] cursor-pointer"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
