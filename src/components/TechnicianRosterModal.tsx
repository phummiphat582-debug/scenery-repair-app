import React, { useState } from 'react';
import { X, Users, UserPlus, Trash2, Phone, AlertTriangle, CheckCircle2, Edit3, Save, RotateCcw, Camera, Upload, Image } from 'lucide-react';
import { Technician, DivisionId } from '../types';
import { ticketService } from '../services/ticketService';
import { DIVISION_LIST, getDivisionInfo, getTechnicianDivision } from '../data/divisionData';
import { DivisionBadge } from './DivisionBadge';
import { compressImage } from '../lib/imageCompress';

interface TechnicianRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  technicians: Technician[];
  onRosterChanged: () => void;
}

const DIVISION_ROLES: Record<DivisionId, string[]> = {
  '84': [
    'ช่างไฟฟ้า/แอร์',
    'ช่างประปา/สุขาภิบาล',
    'ช่างยนต์/เครื่องจักร',
    'ช่างไอที/เครือข่าย',
    'ช่างปั๊มน้ำ/ระบบสูบน้ำ',
    'อู่ซ่อมภายนอก'
  ],
  '85': [
    'ช่างโครงสร้าง/เชื่อมเหล็ก',
    'ช่างปูน/เทพื้น',
    'ช่างไม้/อาคาร',
    'ช่างหลังคา/ฝ้า',
    'ช่างรั้วคอกสัตว์',
    'ช่างต่อเติมอาคาร'
  ],
  '86': [
    'ช่างเพ้นท์/ทาสี',
    'ช่างป้ายสื่อสาร/สติ๊กเกอร์',
    'ช่างศิลป์/ตกแต่งฟาร์ม',
    'ช่างพร็อพถ่ายรูป',
    'ช่างประติมากรรม/ปูนปั้น',
    'ช่างจัดสวนภูมิทัศน์ศิลป์'
  ]
};

export const TechnicianRosterModal: React.FC<TechnicianRosterModalProps> = ({
  isOpen,
  onClose,
  technicians,
  onRosterChanged
}) => {
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState<'all' | DivisionId>('all');
  const [newName, setNewName] = useState('');
  const [newDivision, setNewDivision] = useState<DivisionId>('84');
  const [newRole, setNewRole] = useState('ช่างไฟฟ้า/แอร์');
  const [newPhone, setNewPhone] = useState('');
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Editing state for an individual technician
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDivision, setEditDivision] = useState<DivisionId>('84');
  const [editRole, setEditRole] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handlePhotoFile = async (file: File, callback: (dataUrl: string) => void) => {
    try {
      const compressed = await compressImage(file, 200, 200, 0.7);
      if (compressed) callback(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) callback(e.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDirectPhotoUpload = async (tech: Technician, file: File) => {
    try {
      const url = await compressImage(file, 200, 200, 0.7);
      if (url) {
        await ticketService.updateTechnician(tech.id, { avatarUrl: url });
        showToast(`อัปเดตรูปถ่ายของ "${tech.name}" เรียบร้อย 📸`);
        onRosterChanged();
      }
    } catch (err) {
      console.warn('Avatar compression failed:', err);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || isSubmitting) return;

    const addedName = newName.trim();
    const targetDivision = newDivision;

    try {
      setIsSubmitting(true);
      await ticketService.addTechnician({
        name: addedName,
        role: newRole.trim() || 'ช่างซ่อมบำรุง',
        phone: newPhone.trim(),
        avatarUrl: newAvatarUrl || '',
        departmentId: targetDivision
      });

      setNewName('');
      setNewPhone('');
      setNewAvatarUrl('');
      setSelectedDivisionFilter(targetDivision);
      showToast(`เพิ่มช่าง "${addedName}" ในแผนก ${getDivisionInfo(targetDivision).name} สำเร็จ 👷‍♂️`);
      onRosterChanged();
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการบันทึกช่าง: ' + (err?.message || 'กรุณาลองใหม่อีกครั้ง'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (t: Technician) => {
    setEditingId(t.id);
    setEditName(t.name);
    setEditRole(t.role);
    setEditPhone(t.phone || '');
    setEditAvatarUrl(t.avatarUrl || '');
    setEditDivision(getTechnicianDivision(t));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditRole('');
    setEditPhone('');
    setEditAvatarUrl('');
  };

  const saveEdit = async (t: Technician) => {
    if (!editName.trim()) {
      alert('กรุณากรอกชื่อช่าง');
      return;
    }

    await ticketService.updateTechnician(t.id, {
      name: editName.trim(),
      role: editRole.trim() || 'ช่างซ่อมบำรุง',
      phone: editPhone.trim(),
      avatarUrl: editAvatarUrl || '',
      departmentId: editDivision
    });

    setEditingId(null);
    showToast(`บันทึกข้อมูลช่าง "${editName.trim()}" สำเร็จ ✅`);
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

            {/* Division / Department Selector */}
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                สังกัดแผนก / สายงาน *
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {DIVISION_LIST.map(div => {
                  const isSel = newDivision === div.id;
                  return (
                    <button
                      key={div.id}
                      type="button"
                      onClick={() => {
                        setNewDivision(div.id);
                        if (DIVISION_ROLES[div.id]?.length) {
                          setNewRole(DIVISION_ROLES[div.id][0]);
                        }
                      }}
                      className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center text-center gap-1 border ${
                        isSel
                          ? `${div.badgeClass} ring-2 ring-primary/40 font-bold shadow-xs scale-[1.02]`
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{div.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                ความเชี่ยวชาญ / หน้าที่ ({getDivisionInfo(newDivision).shortName})
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(DIVISION_ROLES[newDivision] || []).map(role => (
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

            <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
              <div className="relative group shrink-0">
                {newAvatarUrl ? (
                  <div className="relative">
                    <img 
                      src={newAvatarUrl} 
                      alt="Preview" 
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-primary shadow-xs" 
                    />
                    <button
                      type="button"
                      onClick={() => setNewAvatarUrl('')}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] shadow-xs cursor-pointer"
                      title="ลบรูป"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label 
                    htmlFor="new-tech-avatar-file"
                    className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-300 hover:border-primary bg-slate-50 hover:bg-primary/5 flex flex-col items-center justify-center cursor-pointer transition-colors text-slate-400 hover:text-primary"
                    title="คลิกเพื่อถ่ายรูปหรือเลือกรูปช่าง"
                  >
                    <Camera className="w-5 h-5 mb-0.5" />
                    <span className="text-[9px] font-medium">เพิ่มรูปถ่าย</span>
                  </label>
                )}
                <input
                  id="new-tech-avatar-file"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handlePhotoFile(f, setNewAvatarUrl);
                  }}
                />
              </div>
              <div className="flex-1 w-full space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-primary" />
                    รูปถ่ายประจำตัวช่าง (ถ่ายจากกล้อง หรือเลือกไฟล์)
                  </span>
                  {newAvatarUrl && (
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> ได้รูปแล้ว
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label 
                    htmlFor="new-tech-avatar-file"
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5 text-primary" />
                    <span>ถ่ายรูป / อัปโหลด</span>
                  </label>
                  <input
                    type="text"
                    placeholder="หรือวางลิงก์รูปภาพ (URL)..."
                    value={newAvatarUrl}
                    onChange={(e) => setNewAvatarUrl(e.target.value)}
                    className="flex-1 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !newName.trim()}
              className="w-full py-2.5 bg-primary hover:bg-primary-container text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังบันทึกข้อมูล...' : 'บันทึกเพิ่มรายชื่อช่าง'}</span>
            </button>
          </form>

          {/* Technicians List Header & Division Filter Tabs */}
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800">
                รายชื่อช่างในระบบ ({technicians.length} ท่าน)
              </h4>
              <span className="text-[11px] text-slate-500">กรองแยกตามแผนกหรือกดแก้ไขข้อมูล</span>
            </div>

            {/* Division Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedDivisionFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  selectedDivisionFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ทั้งหมด ({technicians.length})
              </button>
              {DIVISION_LIST.map(div => {
                const count = technicians.filter(t => getTechnicianDivision(t) === div.id).length;
                const isSelected = selectedDivisionFilter === div.id;
                return (
                  <button
                    key={div.id}
                    type="button"
                    onClick={() => setSelectedDivisionFilter(div.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-white text-primary shadow-xs ring-1 ring-primary/20'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{div.name}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-primary-fixed text-primary' : 'bg-slate-200 text-slate-700'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Technicians List */}
          <div className="space-y-2.5 pr-1">
            {(() => {
              const filteredTechnicians = selectedDivisionFilter === 'all'
                ? technicians
                : technicians.filter(t => getTechnicianDivision(t) === selectedDivisionFilter);

              if (filteredTechnicians.length === 0) {
                return (
                  <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    ไม่มีรายชื่อช่างในหมวดนี้ กรุณาเพิ่มช่างด้านบน
                  </div>
                );
              }

              return filteredTechnicians.map(t => {
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

                      {/* Edit Division / Department */}
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 block mb-1">สังกัดแผนก / สายงาน</label>
                        <div className="grid grid-cols-3 gap-1.5 mb-1.5">
                          {DIVISION_LIST.map(div => {
                            const isSel = editDivision === div.id;
                            return (
                              <button
                                key={div.id}
                                type="button"
                                onClick={() => {
                                  setEditDivision(div.id);
                                  if (DIVISION_ROLES[div.id]?.length) {
                                    setEditRole(DIVISION_ROLES[div.id][0]);
                                  }
                                }}
                                className={`p-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center border ${
                                  isSel
                                    ? `${div.badgeClass} ring-2 ring-primary/40 font-bold shadow-xs scale-[1.02]`
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                {div.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                          ตำแหน่ง / หน้าที่ ({getDivisionInfo(editDivision).shortName})
                        </label>
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {(DIVISION_ROLES[editDivision] || []).map(r => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setEditRole(r)}
                              className={`px-2 py-0.5 rounded-lg text-[9px] font-medium transition-all cursor-pointer ${
                                editRole === r
                                  ? 'bg-primary text-white shadow-xs font-bold'
                                  : 'bg-white border border-slate-200 text-slate-600 hover:border-primary/40'
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none focus:border-primary"
                        />
                      </div>

                      {/* Edit photo upload */}
                      <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200">
                        <div className="relative shrink-0">
                          {editAvatarUrl ? (
                            <div className="relative">
                              <img 
                                src={editAvatarUrl} 
                                alt={editName} 
                                className="w-12 h-12 rounded-xl object-cover border-2 border-primary shadow-xs" 
                              />
                              <button
                                type="button"
                                onClick={() => setEditAvatarUrl('')}
                                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[9px] shadow-xs cursor-pointer"
                                title="ลบรูป"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold text-xs">
                              {editName.slice(0, 1) || 'ช'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="text-[10px] font-semibold text-slate-600">เปลี่ยนรูปถ่ายช่าง</div>
                          <div className="flex items-center gap-2">
                            <label 
                              htmlFor={`edit-avatar-${t.id}`}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 shrink-0"
                            >
                              <Camera className="w-3.5 h-3.5 text-primary" />
                              <span>เลือกรูปใหม่</span>
                            </label>
                            <input
                              id={`edit-avatar-${t.id}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handlePhotoFile(f, setEditAvatarUrl);
                              }}
                            />
                            <input
                              type="text"
                              placeholder="หรือวาง URL รูป..."
                              value={editAvatarUrl}
                              onChange={(e) => setEditAvatarUrl(e.target.value)}
                              className="flex-1 p-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-primary"
                            />
                          </div>
                        </div>
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
                        <div className="relative group shrink-0">
                          {t.avatarUrl ? (
                            <img 
                              src={t.avatarUrl} 
                              alt={t.name} 
                              className={`w-11 h-11 rounded-2xl object-cover border-2 shadow-xs transition-transform group-hover:scale-105 ${
                                t.status === 'active' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200 opacity-60'
                              }`} 
                            />
                          ) : (
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shadow-xs ${
                              t.status === 'active' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'
                            }`}>
                              {t.name.slice(4, 5) || t.name.slice(0, 1) || 'ช'}
                            </div>
                          )}
                          <label 
                            htmlFor={`quick-avatar-${t.id}`}
                            className="absolute inset-0 bg-slate-900/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white shadow-xs"
                            title="คลิกเพื่อเปลี่ยนรูปถ่ายทันที"
                          >
                            <Camera className="w-4 h-4" />
                          </label>
                          <input 
                            id={`quick-avatar-${t.id}`}
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleDirectPhotoUpload(t, file);
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm truncate flex items-center gap-1.5 flex-wrap">
                            <span>{t.name}</span>
                            <DivisionBadge division={getTechnicianDivision(t)} size="sm" />
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
              });
            })()}
          </div>

        </div>

      </div>
    </div>
  );
};
