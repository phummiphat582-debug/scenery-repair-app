import React, { useState } from 'react';
import { X, Users, UserPlus, CheckCircle, Ban } from 'lucide-react';
import { Technician } from '../types';
import { ticketService } from '../services/ticketService';

interface TechnicianRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  technicians: Technician[];
  onRosterChanged: () => void;
}

export const TechnicianRosterModal: React.FC<TechnicianRosterModalProps> = ({
  isOpen,
  onClose,
  technicians,
  onRosterChanged
}) => {
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('ช่างซ่อมบำรุง');

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    await ticketService.setTechnicianStatus(newName.trim(), 'active');
    setNewName('');
    onRosterChanged();
  };

  const handleToggle = async (t: Technician) => {
    const nextStatus = t.status === 'active' ? 'inactive' : 'active';
    await ticketService.setTechnicianStatus(t.name, nextStatus);
    onRosterChanged();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="scenery-gradient text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-300" />
            <h3 className="font-bold text-base sm:text-lg">จัดการรายชื่อทีมช่าง (Technician Roster)</h3>
          </div>
          <button onClick={onClose} className="text-teal-100 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          
          {/* Add Technician Form */}
          <form onSubmit={handleAdd} className="space-y-2 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-teal-700" />
              <span>เพิ่มช่างผู้รับผิดชอบใหม่</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="ระบุชื่อช่าง..."
                className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-teal-600"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                + เพิ่ม
              </button>
            </div>
          </form>

          {/* Technicians List */}
          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {technicians.map(t => (
              <div 
                key={t.id}
                className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{t.name}</div>
                  <div className="text-[11px] text-slate-500 font-light">{t.role}</div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle(t)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    t.status === 'active'
                      ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                  }`}
                >
                  {t.status === 'active' ? '🟢 ใช้งาน' : '⚪ ปิดใช้งาน'}
                </button>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};
