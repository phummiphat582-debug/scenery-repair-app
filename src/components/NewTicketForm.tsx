import React, { useState, useEffect, useRef } from 'react';
import { Department, Priority, Ticket, DivisionId } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { compressImage } from '../lib/imageCompress';
import { DIVISION_LIST, getDivisionInfo } from '../data/divisionData';
import { DivisionBadge } from './DivisionBadge';
import { 
  Wrench, 
  Check, 
  User, 
  ChevronUp, 
  ChevronDown,
  Edit3, 
  ArrowLeft, 
  ArrowRight, 
  Users, 
  CheckCircle2, 
  MapPin, 
  FileText, 
  Camera, 
  Plus, 
  X, 
  Clock, 
  AlertTriangle, 
  AlertOctagon, 
  ShieldCheck, 
  CheckSquare, 
  Info, 
  Loader2, 
  Send, 
  Bookmark,
  Building2,
  Phone,
  Image as ImageIcon
} from 'lucide-react';

// Quick issue tags tailored per division
const DIVISION_QUICK_TAGS: Record<DivisionId, string[]> = {
  '84': ['ไฟดับ/ไฟช็อต', 'แอร์ไม่เย็น/น้ำหยด', 'ท่อแตก/ประปารั่ว', 'ชักโครกตัน/กดไม่ลง', 'ปั๊มน้ำไม่ทำงาน', 'ไฟทางเดินดับ', 'อินเทอร์เน็ตหลุด', 'รถกอล์ฟสตาร์ทไม่ติด'],
  '85': ['หลังคารั่ว/กระเบื้องแตก', 'ผนังแตกร้าว', 'พื้นทรุด/กระเบื้องร่อน', 'รั้วสัตว์ชำรุด/พัง', 'ประตู/หน้าต่างตกราง', 'รางระบายน้ำอุดตัน', 'ต่อเติมโครงสร้าง'],
  '86': ['ป้ายบอกทางชำรุด', 'เพ้นท์สีผนังลอก', 'พร็อพถ่ายรูปเสียหาย', 'ซุ้มดอกไม้ชำรุด', 'ป้ายโลโก้หลุด', 'งานตกแต่งตามเทศกาล', 'ฉากกิจกรรมเวที']
};

interface NewTicketFormProps {
  departments: Department[];
  onSubmit: (ticketData: any) => Promise<void>;
  onCancel?: () => void;
  onOpenQRScanner?: () => void;
  defaultDepartment?: string;
  tickets?: Ticket[];
  onViewQueue?: () => void;
}

export const NewTicketForm: React.FC<NewTicketFormProps> = ({
  departments,
  onSubmit,
  onCancel,
  onOpenQRScanner,
  defaultDepartment,
  tickets = [],
  onViewQueue
}) => {
  // Form States - Clean slate with localStorage prefill for speed
  const [step, setStep] = useState<number>(1);
  const [requesterName, setRequesterName] = useState(() => {
    try {
      const val = localStorage.getItem('scenery_requester_name') || '';
      if (val.includes('าดสดส')) {
        localStorage.removeItem('scenery_requester_name');
        return '';
      }
      return val;
    } catch {
      return '';
    }
  });
  const [requesterPhone, setRequesterPhone] = useState(() => {
    try {
      return localStorage.getItem('scenery_requester_phone') || '';
    } catch {
      return '';
    }
  });
  const [department, setDepartment] = useState(() => {
    try {
      return defaultDepartment || localStorage.getItem('scenery_selected_dept') || departments[0]?.name || '0 ฟร้อน';
    } catch {
      return defaultDepartment || departments[0]?.name || '0 ฟร้อน';
    }
  });

  const prevDefaultDeptRef = useRef(defaultDepartment);
  useEffect(() => {
    if (defaultDepartment && defaultDepartment !== prevDefaultDeptRef.current) {
      prevDefaultDeptRef.current = defaultDepartment;
      setDepartment(defaultDepartment);
    }
  }, [defaultDepartment]);

  const handleRequesterNameChange = (val: string) => {
    setRequesterName(val);
    try {
      localStorage.setItem('scenery_requester_name', val);
    } catch {}
  };

  const handleRequesterPhoneChange = (val: string) => {
    setRequesterPhone(val);
    try {
      localStorage.setItem('scenery_requester_phone', val);
    } catch {}
  };

  const handleDepartmentChange = (val: string) => {
    setDepartment(val);
    try {
      localStorage.setItem('scenery_selected_dept', val);
    } catch {}
  };

  const deptPendingTickets = React.useMemo(() => {
    if (!department) return [];
    return tickets
      .filter(t => t.department === department && t.status !== 'completed' && t.status !== 'cancelled')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [tickets, department]);

  const allPendingTicketsCount = React.useMemo(() => {
    return tickets.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length;
  }, [tickets]);

  const [selectedDivision, setSelectedDivision] = useState<DivisionId>('84');
  const [specificLocation, setSpecificLocation] = useState('');

  const [problemDetail, setProblemDetail] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');

  const [photos, setPhotos] = useState<Array<{ url: string; time: string; label: string }>>([]);

  const [allowPowerCut, setAllowPowerCut] = useState(true);
  const [allowNotification, setAllowNotification] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [submittedRequestId, setSubmittedRequestId] = useState('');
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<any>(null);

  const handleDivisionSelect = (divId: DivisionId) => {
    setSelectedDivision(divId);
  };

  const appendTag = (tagName: string) => {
    setProblemDetail(prev => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} #${tagName}` : `#${tagName}`;
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const compressedUrl = await compressImage(file, 800, 800, 0.65);
        if (compressedUrl) {
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          setPhotos(prev => [
            ...prev,
            { url: compressedUrl, time: timeStr, label: file.name.slice(0, 10) }
          ]);
        }
      } catch (err) {
        console.warn('Failed to compress image:', err);
      }
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const validateRequester = () => {
    if (!department.trim()) {
      alert('กรุณาเลือกแผนกของผู้แจ้ง');
      return false;
    }
    if (!requesterName.trim()) {
      alert('กรุณากรอกชื่อผู้แจ้ง');
      return false;
    }
    if (!requesterPhone.trim()) {
      alert('กรุณากรอกเบอร์ติดต่อของผู้แจ้ง');
      return false;
    }
    return true;
  };

  const validateDetails = () => {
    if (!specificLocation.trim()) {
      alert('กรุณาระบุจุด/ห้อง/สถานที่เกิดเหตุ');
      return false;
    }
    if (!problemDetail.trim()) {
      alert('กรุณากรอกรายละเอียดอาการผิดปกติ');
      return false;
    }
    return true;
  };

  const goToStep = (targetStep: number) => {
    if (targetStep <= step) {
      setStep(targetStep);
      return;
    }
    if (targetStep >= 2 && !validateRequester()) return;
    if (targetStep >= 3 && !validateDetails()) return;
    setStep(Math.min(targetStep, 3));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      goToStep(step + 1);
      return;
    }

    if (!validateRequester() || !validateDetails()) return;

    const divInfo = getDivisionInfo(selectedDivision);
    const locText = specificLocation.trim() || department || 'พื้นที่ฟาร์ม';

    const payload = {
      title: `${divInfo.name}: ${locText}`,
      division: selectedDivision,
      department: department.trim() || departments[0]?.name || '0 ฟร้อน',
      location: locText,
      description: problemDetail.trim(),
      requesterName: requesterName.trim() || 'พนักงานฟาร์ม (ไม่ระบุชื่อ)',
      requesterPhone: requesterPhone.trim(),
      priority,
      status: 'pending',
      requestImageUrl: photos[0]?.url || '-',
      category: divInfo.name
    };

    setPendingPayload(payload);
    setShowConfirmSubmit(true);
  };

  const handleConfirmSubmit = async () => {
    if (!pendingPayload) return;
    setShowConfirmSubmit(false);
    setIsSubmitting(true);
    try {
      await onSubmit(pendingPayload);
      const generatedId = `REQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      setSubmittedRequestId(generatedId);
      setShowSuccessToast(true);

      setTimeout(() => {
        setShowSuccessToast(false);
      }, 4000);
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการส่งข้อมูล: ' + err.message);
    } finally {
      setIsSubmitting(false);
      setPendingPayload(null);
    }
  };

  const handleSaveDraft = () => {
    alert('บันทึกร่างใบแจ้งซ่อมเรียบร้อย สามารถกลับมาแก้ไขหรือส่งต่อได้ในภายหลัง');
  };

  return (
    <div className="flex flex-col w-full pb-12">
      {/* Interactive Form Container */}
      <form
        className="flex flex-col w-full gap-space-md px-margin pb-6"
        id="repairRequestForm"
        onSubmit={handleSubmit}
      >
        {/* Title & Progress Stepper Bar */}
        <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm border border-slate-200/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-headline-sm text-headline-sm text-primary leading-tight font-bold">
                  แบบฟอร์มแจ้งซ่อมด่วน
                </h1>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  ฟาร์ม • อาคาร • อุปกรณ์บริการ
                </p>
              </div>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm shadow-sm font-semibold">
              ขั้นตอน {step} / 3
            </span>
          </div>

          {/* Step Indicator Bubbles */}
          <div className="relative flex items-center justify-between pt-2">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 w-full bg-surface-container-high rounded-full -z-0"></div>
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary-container rounded-full -z-0 transition-all duration-300"
              style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}
            ></div>

            {/* Step 1 */}
            <div
              onClick={() => goToStep(1)}
              className="relative z-10 flex flex-col items-center gap-1 cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-sm text-[12px] shadow-sm">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span className="font-label-sm text-[10px] text-primary font-semibold">1. ผู้แจ้ง</span>
            </div>

            {/* Step 2 */}
            <div
              onClick={() => goToStep(2)}
              className="relative z-10 flex flex-col items-center gap-1 cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-label-sm text-[12px] ring-4 ring-surface-container-lowest shadow-sm font-bold">
                2
              </div>
              <span className="font-label-sm text-[10px] text-secondary font-bold">2. รายละเอียด</span>
            </div>

            {/* Step 3 */}
            <div
              onClick={() => goToStep(3)}
              className="relative z-10 flex flex-col items-center gap-1 cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-label-sm text-[12px]">
                3
              </div>
              <span className="font-label-sm text-[10px] text-on-surface-variant">3. ยืนยันงาน</span>
            </div>
          </div>
        </section>

        {step === 1 && (<>
        {/* Requester Profile Bar */}
        <section className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 flex flex-col gap-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-base text-on-surface">ข้อมูลผู้แจ้งซ่อม</h2>
              <p className="text-xs text-on-surface-variant">เลือกแผนกของคุณเพื่อลงบันทึกในใบงาน</p>
            </div>
          </div>

          {/* 1. Department Selection (Prominent & Clear) */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-md font-bold text-on-surface flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-primary" />
                <span>แผนกที่แจ้งงาน (แผนกของคุณ)</span>
                <span className="text-error font-bold">*</span>
              </span>
              <span className="text-xs text-on-surface-variant font-normal">25 แผนก</span>
            </label>
            <div className="relative">
              <select
                className="w-full h-12 pl-3.5 pr-10 rounded-xl bg-surface-container-low text-on-surface font-bold text-sm border border-slate-300 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 shadow-xs cursor-pointer appearance-none"
                value={department}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                required
              >
                {departments.map(d => (
                  <option key={d.id} value={d.name}>
                    {d.icon ? `${d.icon} ` : ''}{d.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-lg font-semibold mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>ใบแจ้งซ่อมจะถูกส่งในนามแผนก: <strong>{department}</strong></span>
            </div>

            {/* Live Queue Status Preview for selected department */}
            <div className="mt-2 p-3.5 rounded-2xl bg-surface-container-low border border-slate-200/90 shadow-2xs space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    📋
                  </span>
                  <span className="text-xs font-bold text-on-surface">
                    คิวงานแจ้งซ่อมของแผนก "{department}"
                  </span>
                </div>
                {deptPendingTickets.length > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                    ⏳ รอซ่อม {deptPendingTickets.length} คิว
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    🟢 ว่าง ไม่มีงานค้าง
                  </span>
                )}
              </div>

              {deptPendingTickets.length > 0 ? (
                <div className="space-y-1.5 pt-0.5">
                  <p className="text-[11px] text-on-surface-variant">
                    หากส่งแจ้งซ่อมตอนนี้ งานของคุณจะได้รับ <strong className="text-primary font-bold">คิวที่ #{deptPendingTickets.length + 1}</strong> ของแผนกนี้
                  </p>
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {deptPendingTickets.slice(0, 3).map((t, idx) => (
                      <div
                        key={t.id}
                        className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/80 text-[11px] flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-extrabold text-[10px] px-1.5 py-0.2 rounded bg-amber-500 text-white shrink-0">
                            #{idx + 1}
                          </span>
                          <span className="font-mono text-primary font-bold shrink-0">#{t.requestId}</span>
                          <span className="truncate font-medium text-slate-700">{t.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 shrink-0 font-medium">({t.requesterName})</span>
                      </div>
                    ))}
                    {deptPendingTickets.length > 3 && (
                      <div className="text-[10px] text-center text-slate-400 py-0.5">
                        และอีก {deptPendingTickets.length - 3} รายการ...
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-emerald-700 font-medium">
                  🎉 แผนกนี้ไม่มีงานคอยซ่อม หากคุณส่งรายการนี้ จะได้ <strong className="text-emerald-800">คิวที่ #1 ทันที</strong>
                </p>
              )}

              {onViewQueue && (
                <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] flex-wrap gap-2">
                  <span className="text-slate-500">
                    คิวรวมทั้งฟาร์ม: <strong className="text-on-surface font-bold">{allPendingTicketsCount}</strong> งาน
                  </span>
                  <button
                    type="button"
                    onClick={onViewQueue}
                    className="text-primary font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>ดูหน้าคิวงานทั้งหมด</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 2. Requester Name */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-md font-bold text-on-surface flex items-center gap-1.5">
              <User className="w-4 h-4 text-primary" />
              <span>ชื่อผู้แจ้ง</span>
              <span className="text-error font-bold">*</span>
            </label>
            <input
              className="w-full h-12 px-3.5 rounded-xl bg-surface-container-low text-on-surface font-body-md text-sm border border-slate-300 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 shadow-xs"
              placeholder="เช่น สมชาย, พี่แนน, ผู้จัดการร้าน"
              type="text"
              required
              value={requesterName}
              onChange={(e) => handleRequesterNameChange(e.target.value)}
            />
          </div>

          {/* 3. Phone */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-md font-bold text-on-surface flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-primary" />
              <span>เบอร์ติดต่อด่วน</span>
              <span className="text-error font-bold">*</span>
            </label>
            <input
              className="w-full h-12 px-3.5 rounded-xl bg-surface-container-low text-on-surface font-body-md text-sm border border-slate-300 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 shadow-xs"
              placeholder="เช่น 081-234-5678"
              type="tel"
              required
              value={requesterPhone}
              onChange={(e) => handleRequesterPhoneChange(e.target.value)}
            />
          </div>
        </section>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => goToStep(2)}
            className="min-h-[48px] px-6 rounded-xl bg-primary text-white font-bold text-sm flex items-center gap-2 shadow-md cursor-pointer active:scale-95 hover:bg-primary-container"
          >
            ถัดไป: รายละเอียด
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        </>)}

        {step === 2 && (<>
        {/* 3-Division Operational Selector */}
        <section className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm flex flex-col gap-space-sm border-2 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-label-lg text-label-lg text-on-surface flex items-center gap-2 font-bold">
                <Users className="w-5 h-5 text-primary" />
                <span>เลือกสายงานที่รับผิดชอบ</span>
                <span className="text-error font-bold">*</span>
              </label>
              <p className="text-[12px] text-on-surface-variant mt-0.5">
                ระบบจะแยกงานและแจ้งช่างประจำสายงานโดยตรง (84 ซ่อมบำรุง / 85 ก่อสร้าง / 86 งานศิลป์)
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs">
              3 สายงาน
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
            {DIVISION_LIST.map((div) => {
              const isSelected = selectedDivision === div.id;
              return (
                <button
                  key={div.id}
                  type="button"
                  onClick={() => handleDivisionSelect(div.id)}
                  className={`p-3.5 rounded-2xl text-left flex flex-col gap-2 transition-all cursor-pointer border-2 active:scale-98 ${
                    isSelected
                      ? `${div.badgeClass} ring-2 ring-primary/40 shadow-sm font-bold scale-[1.01]`
                      : 'bg-surface-container-low border-slate-200/80 hover:bg-surface-container hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? `${div.accentBg} text-white shadow-xs` : 'bg-surface-container-high text-on-surface-variant'
                      }`}>
                        <span className="text-base">{div.id === '84' ? '🛠️' : div.id === '85' ? '🏗️' : '🎨'}</span>
                      </div>
                      <span className="text-sm font-bold">{div.name}</span>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-85">
                    {div.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Location Section */}
        <section className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm flex flex-col gap-space-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <label className="font-label-lg text-label-lg text-on-surface flex items-center gap-1.5 font-bold">
              <MapPin className="w-5 h-5 text-primary" />
              <span>ระบุสถานที่ / จุดเกิดเหตุ</span>
              <span className="text-error font-bold">*</span>
            </label>
            {onOpenQRScanner && (
              <button
                type="button"
                onClick={onOpenQRScanner}
                className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>สแกน QR จุดซ่อม</span>
              </button>
            )}
          </div>
          <div className="relative flex items-center">
            <MapPin className="w-4 h-4 absolute left-3.5 text-on-surface-variant" />
            <input
              className="w-full h-12 pl-10 pr-4 rounded-xl bg-surface-container-low text-on-surface font-body-md text-sm focus:bg-surface-container-lowest focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 border border-slate-200 transition-all"
              placeholder="เช่น ห้องอาหารครัวหลัก, ห้องน้ำโซนลำธาร, คอกแกะ, อาคารสำนักงาน ฯลฯ"
              required
              type="text"
              value={specificLocation}
              onChange={(e) => setSpecificLocation(e.target.value)}
            />
          </div>
        </section>

        {/* Problem Description & Text Area */}
        <section className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm flex flex-col gap-space-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <label className="font-label-lg text-label-lg text-on-surface flex items-center gap-1.5 font-bold">
              <FileText className="w-5 h-5 text-primary" />
              รายละเอียดอาการผิดปกติ <span className="text-error font-bold">*</span>
            </label>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              {problemDetail.length} ตัวอักษร
            </span>
          </div>

          <div className="relative">
            <textarea
              className="w-full p-3 rounded-xl bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none resize-none leading-relaxed border border-slate-200"
              placeholder="โปรดระบุลักษณะอาการ เช่น เสียงดัง กลิ่นไหม้ รั่วซึม หรือรหัสข้อผิดพลาดบนจอ..."
              required
              rows={3}
              value={problemDetail}
              onChange={(e) => setProblemDetail(e.target.value)}
            />
          </div>

          {/* Dynamic Quick Issue Tags based on Selected Division */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="font-label-sm text-[11px] text-on-surface-variant self-center mr-1 font-semibold">
              แท็กอาการพบบ่อย ({getDivisionInfo(selectedDivision).shortName}):
            </span>
            {(DIVISION_QUICK_TAGS[selectedDivision] || [
              'น้ำหยดนองพื้น',
              'เสียงดังผิดปกติ',
              'ไฟดับ/ช็อต',
              'ชำรุดเสียหาย'
            ]).map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => appendTag(tag)}
                className="px-2.5 py-1 rounded-full bg-surface-container-high hover:bg-primary-fixed hover:text-primary text-on-surface font-label-sm text-[11px] font-medium active:scale-95 transition-all cursor-pointer shadow-2xs border border-slate-200/50"
              >
                + {tag}
              </button>
            ))}
          </div>
        </section>

        {/* Visual Evidence / Photo Upload Section */}
        <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm border border-slate-200/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ImageIcon className="w-5 h-5 text-primary" />
              <span className="font-label-lg text-label-lg text-on-surface font-bold">
                ภาพถ่ายหน้างานจริง
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              แนบแล้ว {photos.length}/4 รูป
            </span>
          </div>

          {/* Photo Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <label className="h-12 rounded-xl bg-surface-container-high text-primary font-label-md text-label-md flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer">
              <Camera className="w-5 h-5" />
              <span>เปิดกล้องถ่ายสด</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </label>

            <label className="h-12 rounded-xl bg-surface-container-low text-on-surface-variant font-label-md text-label-md flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer">
              <Plus className="w-5 h-5" />
              <span>เลือกจากอัลบั้ม</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </label>
          </div>

          {/* Thumbnails Strip */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {photos.map((p, idx) => (
              <div
                key={idx}
                className="relative rounded-lg overflow-hidden aspect-square bg-surface-container group shadow-sm border border-slate-200/50"
              >
                <img className="w-full h-full object-cover" src={p.url} alt={p.label} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-between p-1.5 pointer-events-none">
                  <span className="self-start px-1 rounded bg-black/40 backdrop-blur-sm text-[9px] text-white font-mono">
                    {p.time}
                  </span>
                  <span className="text-[10px] text-white font-medium truncate">{p.label}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  aria-label="ลบรูปภาพ"
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-error text-on-error flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {photos.length < 4 && (
              <label className="rounded-lg aspect-square bg-surface-container-low flex flex-col items-center justify-center gap-1 text-on-surface-variant active:bg-surface-container transition-colors cursor-pointer border-2 border-dashed border-slate-300">
                <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="font-label-sm text-[10px]">เพิ่มรูป</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </label>
            )}
          </div>
        </section>

        {/* Urgency Level Selection */}
        <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm border border-slate-200/40">
          <div className="flex items-center justify-between">
            <label className="font-label-lg text-label-lg text-on-surface flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-5 h-5 text-primary" />
              ระดับความเร่งด่วน <span className="text-error font-bold">*</span>
            </label>
            <span className="font-label-sm text-label-sm text-error font-semibold flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span> ต้องระบุ
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {/* Normal */}
            <label
              className={`urgency-card relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all active:scale-98 ${
                priority === 'normal'
                  ? 'bg-primary-fixed text-on-primary-fixed shadow-sm'
                  : 'bg-surface-container-low'
              }`}
              onClick={() => setPriority('normal')}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
                  <Clock className="w-5 h-5 text-slate-600" />
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    ระดับปกติ (Normal)
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    เข้าซ่อมตามคิวงานปกติ 1 - 3 วัน
                  </span>
                </div>
              </div>
              <input
                type="radio"
                name="urgency"
                checked={priority === 'normal'}
                onChange={() => setPriority('normal')}
                className="w-5 h-5 accent-primary"
              />
            </label>

            {/* Urgent */}
            <label
              className={`urgency-card relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all active:scale-98 ${
                priority === 'high'
                  ? 'bg-secondary-fixed text-on-secondary-fixed shadow-sm'
                  : 'bg-surface-container-low'
              }`}
              onClick={() => setPriority('high')}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                  <AlertTriangle className="w-5 h-5 text-amber-700" />
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    ด่วน (Urgent)
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    เริ่มส่งผลกระทบ ต้องซ่อมภายใน 24 ชม.
                  </span>
                </div>
              </div>
              <input
                type="radio"
                name="urgency"
                checked={priority === 'high'}
                onChange={() => setPriority('high')}
                className="w-5 h-5 accent-secondary"
              />
            </label>

            {/* Critical */}
            <label
              className={`urgency-card relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all active:scale-98 ${
                priority === 'critical'
                  ? 'bg-error-container text-on-error-container shadow-sm'
                  : 'bg-surface-container-low'
              }`}
              onClick={() => setPriority('critical')}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-error text-on-error flex items-center justify-center shadow-sm">
                  <AlertOctagon className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-md text-label-md text-on-error-container font-bold">
                      ด่วนที่สุด / ฉุกเฉิน (Emergency)
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-error text-on-error font-label-sm text-[9px] font-bold">
                      ตรวจใน 2 ชม.
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-error-container/80">
                    กระทบสัตว์ในฟาร์ม, บริการแขก หรือระบบหลัก
                  </span>
                </div>
              </div>
              <input
                type="radio"
                name="urgency"
                checked={priority === 'critical'}
                onChange={() => setPriority('critical')}
                className="w-5 h-5 accent-error"
              />
            </label>
          </div>
        </section>

        {/* Safety Checkboxes */}
        <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-2.5 border border-slate-200/40">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface font-bold">
              ข้อกำหนดเพิ่มเติมเพื่อความปลอดภัย
            </span>
            <ShieldCheck className="w-4 h-4 text-on-surface-variant" />
          </div>

          <label className="flex items-center gap-3 py-1 cursor-pointer">
            <input
              type="checkbox"
              checked={allowPowerCut}
              onChange={(e) => setAllowPowerCut(e.target.checked)}
              className="w-5 h-5 rounded accent-primary text-primary"
            />
            <span className="font-body-sm text-body-sm text-on-surface">
              อนุญาตให้ช่างตัดกระแสไฟ/ปิดวาล์วน้ำหลักได้ทันที
            </span>
          </label>

          <label className="flex items-center gap-3 py-1 cursor-pointer">
            <input
              type="checkbox"
              checked={allowNotification}
              onChange={(e) => setAllowNotification(e.target.checked)}
              className="w-5 h-5 rounded accent-primary text-primary"
            />
            <span className="font-body-sm text-body-sm text-on-surface">
              แจ้งเตือนสถานะความคืบหน้าผ่าน SMS / LINE ของผู้แจ้ง
            </span>
          </label>
        </section>
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="min-h-[48px] px-4 rounded-xl bg-surface-container text-primary font-bold text-sm flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            ผู้แจ้ง
          </button>
          <button
            type="button"
            onClick={() => goToStep(3)}
            className="min-h-[48px] px-5 rounded-xl bg-primary text-white font-bold text-sm flex items-center gap-2 shadow-md cursor-pointer active:scale-95"
          >
            ตรวจสอบงาน
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        </>)}

        {step === 3 && (<>
        <section className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-slate-200 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-primary" />
            <div>
              <h2 className="font-headline-sm text-headline-sm text-primary font-bold">ตรวจสอบและยืนยันงาน</h2>
              <p className="text-xs text-on-surface-variant">ตรวจข้อมูลให้ถูกต้องก่อนส่งเข้าคิวซ่อม</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-surface-container-low p-3">
              <span className="text-xs text-on-surface-variant block">แผนกที่แจ้งงาน</span>
              <strong className="text-primary font-bold text-sm block">{department}</strong>
              <div className="text-xs text-on-surface-variant mt-0.5">{requesterName} • {requesterPhone}</div>
            </div>
            <div className="rounded-xl bg-surface-container-low p-3">
              <span className="text-xs text-on-surface-variant block">สถานที่ / จุดเกิดเหตุ</span>
              <strong className="block text-sm">{specificLocation || 'ไม่ระบุ'}</strong>
            </div>
            <div className="rounded-xl bg-surface-container-low p-3 sm:col-span-2">
              <span className="text-xs text-on-surface-variant block">รายละเอียดอาการ</span>
              <strong className="whitespace-pre-wrap block text-sm">{problemDetail}</strong>
            </div>
            <div className="rounded-xl bg-surface-container-low p-3">
              <span className="text-xs text-on-surface-variant block mb-1">สายงานที่รับผิดชอบ</span>
              <DivisionBadge division={selectedDivision} size="sm" />
            </div>
            <div className="rounded-xl bg-surface-container-low p-3">
              <span className="text-xs text-on-surface-variant block">ความเร่งด่วน</span>
              <strong className="block text-sm">{priority === 'critical' ? 'ด่วนที่สุด / ฉุกเฉิน' : priority === 'high' ? 'ด่วน' : 'ปกติ'}</strong>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800">
            <Info className="w-4 h-4 text-emerald-700 shrink-0" />
            เมื่อยืนยัน ระบบจะออกเลขที่ใบแจ้งและจัดคิวให้แผนกที่เลือกทันที
          </div>
        </section>

        {/* Form Action Footer */}
        <section className="flex flex-col gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => setStep(2)}
            className="min-h-[48px] w-full rounded-xl bg-surface-container text-primary font-bold text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับไปแก้ไขรายละเอียด
          </button>
          <button
            id="submitBtn"
            type="submit"
            disabled={isSubmitting}
            className="min-h-[52px] w-full rounded-xl bg-primary text-on-primary font-headline-sm text-headline-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-transform cursor-pointer hover:bg-primary-container disabled:opacity-75 font-bold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>กำลังนำส่งข้อมูล...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>บันทึกและส่งใบแจ้งซ่อม</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            className="min-h-[48px] w-full rounded-xl bg-surface-container text-primary font-label-lg text-label-lg flex items-center justify-center gap-2 active:bg-surface-container-high transition-colors cursor-pointer font-semibold"
          >
            <Bookmark className="w-4 h-4" />
            <span>บันทึกร่างไว้ก่อน</span>
          </button>

          <p className="text-center font-label-sm text-label-sm text-on-surface-variant pt-1">
            เมื่อส่งคำขอ ศูนย์ซ่อมบำรุง Scenery Farm จะได้รับงานและจ่ายช่างทันที
          </p>
        </section>
        </>)}
      </form>

      {/* Success Toast Modal */}
      {showSuccessToast && (
        <div className="fixed inset-x-4 bottom-24 z-50 transition-all duration-300">
          <div className="bg-primary text-on-primary rounded-xl p-4 shadow-2xl flex items-center gap-3 border border-emerald-400/40">
            <div className="w-10 h-10 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-200" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-headline-sm text-[16px] font-bold">ส่งใบแจ้งซ่อมสำเร็จ!</span>
              <span className="font-body-sm text-body-sm text-primary-fixed truncate">
                หมายเลขงาน: #{submittedRequestId} (รอช่างรับงาน)
              </span>
            </div>
            <button
              onClick={() => setShowSuccessToast(false)}
              className="text-on-primary p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
      {/* Confirmation Modal */}
      {showConfirmSubmit && pendingPayload && (
        <ConfirmModal
          isOpen={showConfirmSubmit}
          title="ยืนยันการส่งใบแจ้งซ่อม"
          message={`คุณต้องการส่งแจ้งซ่อม "${pendingPayload.title}" แผนก "${pendingPayload.department}" ใช่หรือไม่?`}
          confirmText="ยืนยันส่งข้อมูล"
          cancelText="ตรวจสอบอีกครั้ง"
          confirmVariant="primary"
          onConfirm={handleConfirmSubmit}
          onCancel={() => setShowConfirmSubmit(false)}
        />
      )}
    </div>
  );
};
