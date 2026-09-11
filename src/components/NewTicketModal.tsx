import React, { useState } from 'react';
import { X, Plus, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { Department, Priority, Ticket } from '../types';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  onSubmit: (ticketData: Omit<Ticket, 'id' | 'requestId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  isOpen,
  onClose,
  departments,
  onSubmit
}) => {
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState(departments[0]?.name || 'คาเฟ่ & F&B');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [requesterPhone, setRequesterPhone] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [requestImageUrl, setRequestImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim() || !requesterName.trim()) {
      alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        department,
        location: location.trim(),
        description: description.trim(),
        requesterName: requesterName.trim(),
        requesterPhone: requesterPhone.trim(),
        priority,
        status: 'pending',
        requestImageUrl: requestImageUrl.trim() || '-'
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="scenery-gradient text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-base sm:text-lg">สร้างใบแจ้งซ่อมใหม่ (New Repair Ticket)</h3>
          </div>
          <button onClick={onClose} className="text-teal-100 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Priority Level */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              ระดับความเร่งด่วน (Priority) *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'critical', label: '🚨 ด่วนที่สุด', desc: 'หยุดชะงัก/อันตราย', color: 'border-rose-500 bg-rose-50 text-rose-800' },
                { id: 'high', label: '⚡ ด่วนมาก', desc: 'กระทบลูกค้า', color: 'border-amber-500 bg-amber-50 text-amber-800' },
                { id: 'normal', label: '🟡 ปกติ', desc: 'ซ่อมตามรอบ', color: 'border-slate-400 bg-slate-50 text-slate-800' },
                { id: 'low', label: '🟢 วางแผน', desc: 'งานระยะยาว', color: 'border-emerald-500 bg-emerald-50 text-emerald-800' },
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id as Priority)}
                  className={`p-2.5 rounded-xl border-2 text-center text-xs font-bold transition-all cursor-pointer ${
                    priority === p.id ? p.color + ' ring-2 ring-teal-600/30' : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <div>{p.label}</div>
                  <div className="text-[10px] font-normal opacity-80 mt-0.5">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              แผนก / ส่วนงานที่รับผิดชอบ *
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:border-teal-600"
            >
              {departments.map(d => (
                <option key={d.id} value={d.name}>
                  {d.icon} {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              เรื่อง / อาการที่ต้องการแจ้งซ่อม *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น แอร์มีน้ำหยด, ท่อประปารั่ว, ไฟดับ 2 ต้น..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:border-teal-600"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              สถานที่ / จุดเกิดเหตุ *
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="เช่น วิลล่า 104, ห้องอาหารชั้น 2, ลานป้อนอาหารแกะ..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:border-teal-600"
            />
          </div>

          {/* Requester Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชื่อผู้แจ้ง *
              </label>
              <input
                type="text"
                required
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                placeholder="เช่น คุณกรรณิการ์ (แม่บ้าน)"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:border-teal-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                เบอร์โทรติดต่อ
              </label>
              <input
                type="tel"
                value={requesterPhone}
                onChange={(e) => setRequesterPhone(e.target.value)}
                placeholder="08x-xxx-xxxx"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:border-teal-600"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              รายละเอียดเพิ่มเติม
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุอาการผิดปกติ สิ่งที่สังเกตพบ หรือเวลาที่สะดวกให้ช่างเข้าตรวจสอบ..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:border-teal-600"
            />
          </div>

          {/* Photo URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              แนบลิงก์รูปภาพ (URL หรือ Google Drive)
            </label>
            <input
              type="url"
              value={requestImageUrl}
              onChange={(e) => setRequestImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/... หรือลิงก์ภาพ"
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
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-900/20 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'กำลังบันทึก...' : '✅ บันทึกและเข้าสู่คิวงาน'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
