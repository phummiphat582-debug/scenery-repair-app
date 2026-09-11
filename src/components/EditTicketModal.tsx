import React, { useState } from 'react';
import { X, Wrench, Clock, MapPin, User, CheckCircle, AlertTriangle, Send } from 'lucide-react';
import { Ticket, Technician, TicketStatus, Priority } from '../types';

interface EditTicketModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  technicians: Technician[];
  onUpdate: (id: string, updates: Partial<Ticket>) => Promise<void>;
}

export const EditTicketModal: React.FC<EditTicketModalProps> = ({
  ticket,
  isOpen,
  onClose,
  technicians,
  onUpdate
}) => {
  if (!isOpen || !ticket) return null;

  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [priority, setPriority] = useState<Priority>(ticket.priority);
  const [technicianName, setTechnicianName] = useState(ticket.technicianName || '');
  const [repairResult, setRepairResult] = useState(ticket.repairResult || '');
  const [remark, setRemark] = useState(ticket.remark || '');
  const [resultImageUrl, setResultImageUrl] = useState(ticket.resultImageUrl || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'completed' && !repairResult.trim()) {
      alert('กรุณาระบุผลการซ่อม/วิธีแก้ไขก่อนปิดงานเสร็จสิ้น');
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate(ticket.id, {
        status,
        priority,
        technicianName: technicianName.trim(),
        repairResult: repairResult.trim(),
        remark: remark.trim(),
        resultImageUrl: resultImageUrl.trim() || '-'
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="scenery-gradient text-white px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-teal-300" />
              <h3 className="font-bold text-base sm:text-lg">บันทึกผลการซ่อมและอัปเดตงาน</h3>
            </div>
            <p className="text-xs text-teal-100 mt-0.5 font-mono">{ticket.requestId} · {ticket.department}</p>
          </div>
          <button onClick={onClose} className="text-teal-100 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ticket Summary Box */}
        <div className="bg-slate-50 border-b border-slate-200 p-5 space-y-2 text-xs text-slate-700">
          <div className="font-bold text-sm text-slate-900">{ticket.title}</div>
          <div className="grid grid-cols-2 gap-2 text-slate-600">
            <div>📍 <strong>สถานที่:</strong> {ticket.location}</div>
            <div>👤 <strong>ผู้แจ้ง:</strong> {ticket.requesterName}</div>
            <div>⏱️ <strong>เวลารอคิว:</strong> {ticket.waitingDurationText}</div>
            <div>📅 <strong>วันที่แจ้ง:</strong> {new Date(ticket.createdAt).toLocaleDateString('th-TH')}</div>
          </div>
          {ticket.description && (
            <div className="text-slate-600 pt-1 border-t border-slate-200/80">
              <strong>รายละเอียด:</strong> {ticket.description}
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Status & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                สถานะงาน (Status) *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TicketStatus)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:border-teal-600"
              >
                <option value="pending">⏳ รอดำเนินการ</option>
                <option value="assigned">📋 รับงานแล้ว</option>
                <option value="in_progress">🔧 กำลังดำเนินการ</option>
                <option value="waiting_parts">📦 รออะไหล่</option>
                <option value="completed">✅ เสร็จสิ้น (ปิดงาน)</option>
                <option value="cancelled">❌ ยกเลิก</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ระดับความเร่งด่วน (Priority)
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:border-teal-600"
              >
                <option value="critical">🚨 ด่วนที่สุด</option>
                <option value="high">⚡ ด่วนมาก</option>
                <option value="normal">🟡 ปกติ</option>
                <option value="low">🟢 วางแผนล่วงหน้า</option>
              </select>
            </div>
          </div>

          {/* Technician Assignment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ช่างผู้รับผิดชอบ (Assigned Technician)
            </label>
            <select
              value={technicianName}
              onChange={(e) => setTechnicianName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:border-teal-600"
            >
              <option value="">-- เลือกช่างผู้รับผิดชอบ --</option>
              {technicians.filter(t => t.status === 'active').map(t => (
                <option key={t.id} value={t.name}>
                  {t.name} ({t.role})
                </option>
              ))}
            </select>
          </div>

          {/* Repair Result */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ผลการซ่อม / การตรวจพบ (Repair Findings & Action)
            </label>
            <textarea
              rows={3}
              value={repairResult}
              onChange={(e) => setRepairResult(e.target.value)}
              placeholder="ระบุสาเหตุที่พบและวิธีที่ทำการแก้ไข (จำเป็นต้องระบุหากเลือกเสร็จสิ้น)..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:border-teal-600"
            />
          </div>

          {/* Remark */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              หมายเหตุเพิ่มเติม
            </label>
            <textarea
              rows={2}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="เช่น รออะไหล่เข้าช่วงบ่าย, ลูกค้านัดเวลาทดสอบ..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:border-teal-600"
            />
          </div>

          {/* Result Image URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              แนบรูปรอยซ่อมเสร็จสิ้น (Result Image URL)
            </label>
            <input
              type="url"
              value={resultImageUrl}
              onChange={(e) => setResultImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:border-teal-600"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-900/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลและอัปเดต'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
