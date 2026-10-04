import React, { useState, useEffect } from 'react';
import { Ticket, PartItem } from '../types';
import { compressImage } from '../lib/imageCompress';
import { 
  CheckCircle2, 
  X, 
  Camera, 
  Image as ImageIcon, 
  Trash2, 
  Plus, 
  Wrench, 
  Package, 
  AlertCircle, 
  Sparkles, 
  MapPin, 
  UploadCloud, 
  Check 
} from 'lucide-react';

interface CompleteWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket | null;
  onConfirmComplete: (
    ticketId: string,
    data: {
      diagnosticReason: string;
      actionSteps: string;
      repairResult: string;
      parts: PartItem[];
      resultImageUrl?: string;
    }
  ) => Promise<void>;
}

const COMMON_ROOT_CAUSES = [
  'สายไฟขาด/หลวม/ไหม้',
  'ท่ออุดตัน/รั่วซึม',
  'ซีลยางเสื่อมสภาพ',
  'ปั๊มน้ำ/มอเตอร์ขัดข้อง',
  'หลอดไฟขาด/หมดอายุ',
  'สวิตช์/เบรกเกอร์ทริป',
  'ก๊อกน้ำรั่วซึม',
  'กลไกติดขัด/ฝืด',
  'อุปกรณ์เสื่อมตามอายุการใช้งาน'
];

const COMMON_SOLUTIONS = [
  'เปลี่ยนอะไหล่ใหม่และทดสอบระบบ',
  'เดินสายไฟใหม่พร้อมพันเทปฉนวน',
  'ลอกท่อและทำความสะอาดขจัดสิ่งอุดตัน',
  'เปลี่ยนซีลยางและขันยึดแน่น',
  'เปลี่ยนหลอดไฟใหม่และวัดแรงดันไฟ',
  'ปรับตั้งระดับและหล่อลื่นกลไก',
  'ซ่อมแซมจุดเชื่อมต่อและทดสอบใช้งานปกติ'
];

const QUICK_PARTS = [
  { name: 'หลอดไฟ LED', unit: 'หลอด' },
  { name: 'สายไฟ VAF', unit: 'เมตร' },
  { name: 'ท่อ PVC 4 หุน', unit: 'ท่อน' },
  { name: 'ข้อต่อตรง/ข้องอ PVC', unit: 'ตัว' },
  { name: 'ซีลยางกันซึม', unit: 'ชิ้น' },
  { name: 'เทปพันสายไฟ', unit: 'ม้วน' },
  { name: 'เบรกเกอร์ 16A', unit: 'ตัว' },
  { name: 'ก๊อกน้ำสแตนเลส', unit: 'ตัว' },
  { name: 'กาวประสานท่อ', unit: 'กระป๋อง' }
];

export const CompleteWorkModal: React.FC<CompleteWorkModalProps> = ({
  isOpen,
  onClose,
  ticket,
  onConfirmComplete
}) => {
  const [diagnosticReason, setDiagnosticReason] = useState<string>('');
  const [actionSteps, setActionSteps] = useState<string>('');
  const [hasParts, setHasParts] = useState<boolean>(false);
  const [partsList, setPartsList] = useState<Array<{
    id: string;
    name: string;
    quantity: number;
    unit: string;
    cost: number;
  }>>([]);
  const [resultImageUrl, setResultImageUrl] = useState<string>('');
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (isOpen && ticket) {
      setDiagnosticReason(ticket.diagnosticReason || '');
      setActionSteps(ticket.actionSteps || '');
      setResultImageUrl(ticket.resultImageUrl || '');
      setHasParts(Array.isArray(ticket.parts) && ticket.parts.length > 0);
      setPartsList(
        Array.isArray(ticket.parts) && ticket.parts.length > 0
          ? ticket.parts.map(p => ({
              id: p.id || 'part-' + Math.random().toString(36).slice(2, 6),
              name: p.name,
              quantity: p.quantity || 1,
              unit: 'ชิ้น',
              cost: p.cost || 0
            }))
          : []
      );
      setErrorMessage('');
      setIsSubmitting(false);
      setIsProcessingImage(false);
    }
  }, [isOpen, ticket?.id]);

  if (!isOpen || !ticket) return null;

  const handleAddPartItem = (defaultName = '', defaultUnit = 'ชิ้น') => {
    setHasParts(true);
    setPartsList(prev => [
      ...prev,
      {
        id: 'part-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        name: defaultName,
        quantity: 1,
        unit: defaultUnit,
        cost: 0
      }
    ]);
  };

  const handleUpdatePart = (id: string, field: string, value: any) => {
    setPartsList(prev =>
      prev.map(p => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleRemovePart = (id: string) => {
    setPartsList(prev => prev.filter(p => p.id !== id));
  };

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    try {
      const compressed = await compressImage(file, 1200, 1200, 0.75);
      setResultImageUrl(compressed);
    } catch (err: any) {
      alert('ไม่สามารถประมวลผลรูปภาพได้: ' + (err?.message || 'เกิดข้อผิดพลาด'));
    } finally {
      setIsProcessingImage(false);
      e.target.value = '';
    }
  };

  const handleAddCauseSuggestion = (chip: string) => {
    if (!diagnosticReason.trim()) {
      setDiagnosticReason(chip);
    } else if (!diagnosticReason.includes(chip)) {
      setDiagnosticReason(diagnosticReason + ', ' + chip);
    }
  };

  const handleAddSolutionSuggestion = (chip: string) => {
    if (!actionSteps.trim()) {
      setActionSteps(chip);
    } else if (!actionSteps.includes(chip)) {
      setActionSteps(actionSteps + ', ' + chip);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosticReason.trim()) {
      setErrorMessage('กรุณาระบุ "สาเหตุของปัญหา"');
      return;
    }
    if (!actionSteps.trim()) {
      setErrorMessage('กรุณาระบุ "วิธีแก้ไขปัญหา / การดำเนินการ"');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      // Clean up parts
      const validParts: PartItem[] = hasParts
        ? partsList
            .filter(p => p.name.trim())
            .map(p => ({
              id: p.id,
              name: p.unit ? `${p.name.trim()} (${p.quantity} ${p.unit})` : p.name.trim(),
              code: 'PART-' + Date.now().toString().slice(-4),
              quantity: Number(p.quantity) || 1,
              cost: Number(p.cost) || 0
            }))
        : [];

      // Combine human-readable repairResult
      const partsSummary = validParts.length > 0
        ? validParts.map(p => `• ${p.name}${p.cost > 0 ? ` (${p.cost} บาท)` : ''}`).join('\n')
        : 'ไม่มีการเปลี่ยนอะไหล่';

      const fullResultText = [
        `สาเหตุ: ${diagnosticReason.trim()}`,
        `วิธีแก้ไข: ${actionSteps.trim()}`,
        `อะไหล่ที่เปลี่ยน: ${partsSummary}`
      ].join('\n');

      await onConfirmComplete(ticket.id, {
        diagnosticReason: diagnosticReason.trim(),
        actionSteps: actionSteps.trim(),
        repairResult: fullResultText,
        parts: validParts,
        resultImageUrl: resultImageUrl || undefined
      });

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'บันทึกจบงานไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl bg-surface-container-lowest rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-700 via-teal-700 to-teal-800 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg leading-tight">
                บันทึกเสร็จสิ้นงานซ่อม (จบงาน)
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                ลงสาเหตุปัญหา วิธีแก้ไข อะไหล่ที่เปลี่ยน และภาพหลังแก้ไข
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4.5">
          
          {/* Ticket Context Banner */}
          <div className="p-3.5 bg-surface-container-low rounded-2xl border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-extrabold text-primary bg-primary-fixed/40 px-2.5 py-0.5 rounded-md">
                  #{ticket.requestId}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface">
                  {ticket.department}
                </span>
              </div>
              {ticket.technicianName && (
                <span className="text-xs font-semibold text-primary">
                  ช่าง: <strong>{ticket.technicianName}</strong>
                </span>
              )}
            </div>

            <h4 className="font-bold text-sm text-on-surface">
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
          </div>

          {/* 1. Root Cause (สาเหตุของปัญหา) */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-on-surface flex items-center gap-1.5">
              <span>🔍 1. สาเหตุของปัญหา</span>
              <span className="text-red-500">*</span>
            </label>
            
            {/* Quick chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-wrap">
              {COMMON_ROOT_CAUSES.map(cause => (
                <button
                  key={cause}
                  type="button"
                  onClick={() => handleAddCauseSuggestion(cause)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface border border-slate-200/80 cursor-pointer transition-colors shrink-0"
                >
                  + {cause}
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              value={diagnosticReason}
              onChange={(e) => setDiagnosticReason(e.target.value)}
              placeholder="เช่น สายไฟขาดใน, ข้อต่อท่อน้ำแตกร้าวเนื่องจากแรงดัน, ซีลยางกรอบหมดอายุ..."
              className="w-full px-3.5 py-2.5 bg-surface-container-low border border-slate-200 rounded-2xl text-xs sm:text-sm text-on-surface outline-none focus:border-primary focus:bg-surface-container-lowest transition-all"
              required
            />
          </div>

          {/* 2. Repair Solution (วิธีแก้ไขปัญหา) */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-on-surface flex items-center gap-1.5">
              <span>🛠️ 2. วิธีการแก้ไข / การดำเนินการ</span>
              <span className="text-red-500">*</span>
            </label>

            {/* Quick chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-wrap">
              {COMMON_SOLUTIONS.map(sol => (
                <button
                  key={sol}
                  type="button"
                  onClick={() => handleAddSolutionSuggestion(sol)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface border border-slate-200/80 cursor-pointer transition-colors shrink-0"
                >
                  + {sol}
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              value={actionSteps}
              onChange={(e) => setActionSteps(e.target.value)}
              placeholder="เช่น ทำการตัดต่อสายไฟใหม่และพันเทปฉนวนกันน้ำ, เปลี่ยนท่อและข้อต่อใหม่ พร้อมทดสอบการไหลของน้ำ..."
              className="w-full px-3.5 py-2.5 bg-surface-container-low border border-slate-200 rounded-2xl text-xs sm:text-sm text-on-surface outline-none focus:border-primary focus:bg-surface-container-lowest transition-all"
              required
            />
          </div>

          {/* 3. Replaced Parts (อะไหล่ที่เปลี่ยน) */}
          <div className="space-y-2.5 p-3.5 bg-surface-container-low/60 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-extrabold text-on-surface flex items-center gap-1.5 cursor-pointer">
                <Package className="w-4 h-4 text-primary" />
                <span>3. อะไหล่หรืออุปกรณ์ที่เปลี่ยน</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  if (!hasParts) {
                    handleAddPartItem();
                  } else {
                    setHasParts(false);
                    setPartsList([]);
                  }
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  hasParts
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {hasParts ? '✓ มีการเปลี่ยนอะไหล่' : '+ มีเปลี่ยนอะไหล่'}
              </button>
            </div>

            {hasParts && (
              <div className="space-y-2.5 pt-1">
                {/* Quick Add Common Parts */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  <span className="text-[11px] text-on-surface-variant font-medium shrink-0">แตะเพิ่มด่วน:</span>
                  {QUICK_PARTS.map(qp => (
                    <button
                      key={qp.name}
                      type="button"
                      onClick={() => handleAddPartItem(qp.name, qp.unit)}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white border border-slate-200 text-primary hover:bg-primary-fixed/20 shrink-0 cursor-pointer"
                    >
                      + {qp.name}
                    </button>
                  ))}
                </div>

                {/* Parts dynamic list */}
                {partsList.map((part, index) => (
                  <div key={part.id} className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-400 w-5 text-center">
                      {index + 1}.
                    </span>

                    <input
                      type="text"
                      value={part.name}
                      onChange={(e) => handleUpdatePart(part.id, 'name', e.target.value)}
                      placeholder="ชื่ออะไหล่ / อุปกรณ์..."
                      className="flex-1 min-w-[120px] px-2.5 py-1.5 bg-surface-container-low border border-slate-200 rounded-lg text-xs text-on-surface outline-none focus:border-primary"
                    />

                    <div className="flex items-center gap-1 w-24">
                      <input
                        type="number"
                        min="1"
                        value={part.quantity}
                        onChange={(e) => handleUpdatePart(part.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-12 px-1.5 py-1.5 bg-surface-container-low border border-slate-200 rounded-lg text-xs text-center font-bold text-on-surface outline-none"
                      />
                      <input
                        type="text"
                        value={part.unit}
                        onChange={(e) => handleUpdatePart(part.id, 'unit', e.target.value)}
                        placeholder="หน่วย"
                        className="w-12 px-1 py-1.5 bg-surface-container-low border border-slate-200 rounded-lg text-xs text-center text-on-surface outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemovePart(part.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                      title="ลบรายการนี้"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => handleAddPartItem()}
                  className="w-full py-2 bg-white hover:bg-slate-50 border border-dashed border-primary/50 text-primary rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มรายการอะไหล่อื่นๆ</span>
                </button>
              </div>
            )}
          </div>

          {/* 4. After Repair Photo (รูปภาพหลังแก้ไข) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-on-surface flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-primary" />
                <span>4. รูปภาพหลังแก้ไข (หลักฐานงานซ่อมเสร็จ)</span>
              </label>
              <span className="text-[11px] text-on-surface-variant font-normal">
                (ถ่ายสดหรือเลือกจากอัลบั้ม)
              </span>
            </div>

            {/* Hidden native file inputs */}
            <input
              id="complete-work-camera-input"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageCapture}
              className="hidden"
            />
            <input
              id="complete-work-gallery-input"
              type="file"
              accept="image/*"
              onChange={handleImageCapture}
              className="hidden"
            />

            {resultImageUrl ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-slate-900 group shadow-sm">
                <img
                  src={resultImageUrl}
                  alt="หลักฐานหลังซ่อมเสร็จ"
                  className="w-full h-48 sm:h-56 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-3">
                  <span className="text-white text-xs font-bold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-400" />
                    แนบรูปหลักฐานเรียบร้อยแล้ว
                  </span>
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="complete-work-camera-input"
                      className="px-2.5 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>ถ่ายใหม่</span>
                    </label>
                    <label
                      htmlFor="complete-work-gallery-input"
                      className="px-2.5 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>เลือกใหม่</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setResultImageUrl('')}
                      className="p-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl transition-all cursor-pointer active:scale-95"
                      title="ลบรูปนี้"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Option 1: Live Camera */}
                  <label
                    htmlFor="complete-work-camera-input"
                    className="p-4 border-2 border-dashed border-slate-300 hover:border-primary rounded-2xl bg-surface-container-low hover:bg-primary/5 flex flex-col items-center justify-center gap-2 text-on-surface-variant transition-all cursor-pointer active:scale-98 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 flex items-center justify-center transition-transform">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold text-on-surface block">
                        เปิดกล้องถ่ายสด
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        ถ่ายด้วยกล้องมือถือ
                      </span>
                    </div>
                  </label>

                  {/* Option 2: Gallery / Album */}
                  <label
                    htmlFor="complete-work-gallery-input"
                    className="p-4 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl bg-surface-container-low hover:bg-emerald-50 flex flex-col items-center justify-center gap-2 text-on-surface-variant transition-all cursor-pointer active:scale-98 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 group-hover:scale-110 flex items-center justify-center transition-transform">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold text-on-surface block">
                        เลือกจากอัลบั้ม
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        คลังรูปภาพในเครื่อง
                      </span>
                    </div>
                  </label>
                </div>

                {isProcessingImage && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-primary animate-pulse">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>กำลังบีบอัดและประมวลผลรูปภาพ กรุณารอสักครู่...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
            >
              ย้อนกลับ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isProcessingImage}
              className="flex-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังบันทึกจบงาน...' : 'ยืนยันปิดงานซ่อม (จบงาน) ✅'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
