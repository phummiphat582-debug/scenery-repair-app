import React, { useState } from 'react';
import { Department, Priority, Ticket } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface NewTicketFormProps {
  departments: Department[];
  onSubmit: (ticketData: any) => Promise<void>;
  onCancel?: () => void;
  onOpenQRScanner?: () => void;
}

export const NewTicketForm: React.FC<NewTicketFormProps> = ({
  departments,
  onSubmit,
  onCancel,
  onOpenQRScanner
}) => {
  // Form States - Clean slate without dummy text
  const [step, setStep] = useState<number>(1);
  const [requesterName, setRequesterName] = useState('');
  const [requesterPhone, setRequesterPhone] = useState('');
  const [department, setDepartment] = useState('คาเฟ่ & F&B');
  const [isRequesterDrawerOpen, setIsRequesterDrawerOpen] = useState(true);

  const [selectedZone, setSelectedZone] = useState('C');
  const [specificLocation, setSpecificLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('hvac');

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

  // Zone list
  const zones = [
    { key: 'A', name: 'โซน A • โรงแกะ', icon: 'pets', dept: 'ฟาร์มสัตว์ & กิจกรรม' },
    { key: 'B', name: 'โซน B • ลานกิจกรรม', icon: 'festival', dept: 'ฟาร์มสัตว์ & กิจกรรม' },
    { key: 'C', name: 'โซน C • ร้านอาหาร/คาเฟ่', icon: 'restaurant', dept: 'คาเฟ่ & F&B' },
    { key: 'D', name: 'โซน D • บ้านพักวิลล่า', icon: 'cottage', dept: 'ห้องพัก & วิลล่า' },
    { key: 'HQ', name: 'สำนักงานส่วนกลาง', icon: 'apartment', dept: 'ไอที & ระบบสื่อสาร' }
  ];

  // 8 Standardized Farm Maintenance Work Formats
  const categories = [
    { 
      key: 'electric', 
      title: 'ระบบไฟฟ้า & แสงสว่าง', 
      sub: 'ไฟดับ ปลั๊กไหม้ สปอตไลท์ เบรกเกอร์', 
      icon: 'bolt', 
      dept: 'ไฟฟ้า & แอร์',
      tags: ['ไฟดับทั้งโซน', 'เบรกเกอร์ทริป', 'ปลั๊กไฟช็อต/ไหม้', 'หลอดไฟขาด']
    },
    { 
      key: 'hvac', 
      title: 'ระบบแอร์ & เครื่องเย็น', 
      sub: 'แอร์ไม่เย็น น้ำแอร์หยด ตู้แช่เสีย', 
      icon: 'ac_unit', 
      dept: 'ไฟฟ้า & แอร์',
      tags: ['แอร์ไม่เย็น/มีแต่ลม', 'น้ำแอร์หยดนอง', 'ตู้แช่วัตถุดิบไม่เย็น', 'คอมเพรสเซอร์เสียงดัง']
    },
    { 
      key: 'plumbing', 
      title: 'ระบบประปา & สุขาภิบาล', 
      sub: 'ท่อแตก น้ำไม่ไหล ปั๊มน้ำ ชักโครกตัน', 
      icon: 'water_drop', 
      dept: 'ประปา & สุขาภิบาล',
      tags: ['ท่อประปาแตกน้ำรั่ว', 'น้ำไม่ไหล/ไหลค่อย', 'ปั๊มน้ำไม่ตัด', 'ชักโครก/ท่อตัน']
    },
    { 
      key: 'farm_machinery', 
      title: 'เครื่องจักร & ยานพาหนะ', 
      sub: 'รถแทรกเตอร์ รถกอล์ฟ เครื่องตัดหญ้า', 
      icon: 'agriculture', 
      dept: 'ฟาร์มสัตว์ & กิจกรรม',
      tags: ['สตาร์ทไม่ติด', 'เครื่องยนต์ดับ', 'ระบบไฮดรอลิกรั่ว', 'ยางแบน/โซ่หลุด']
    },
    { 
      key: 'structural', 
      title: 'งานอาคาร โครงสร้าง & สี', 
      sub: 'ประตู หน้าต่าง หลังคารั่ว รั้วคอกแกะ', 
      icon: 'carpenter', 
      dept: 'ซ่อมบำรุงอาคาร & สี',
      tags: ['หลังคารั่วซึม', 'ประตูลูกบิดเสีย', 'รั้วคอกสัตว์ชำรุด', 'พื้น/ทางเดินชำรุด']
    },
    { 
      key: 'it_system', 
      title: 'ไอที POS & กล้องวงจรปิด', 
      sub: 'เครื่อง POS ปริ้นเตอร์บิล Wi-Fi กล้อง', 
      icon: 'router', 
      dept: 'ไอที & ระบบสื่อสาร',
      tags: ['เครื่อง POS ดับ', 'ปริ้นเตอร์ใบเสร็จไม่ออก', 'อินเทอร์เน็ต Wi-Fi หลุด', 'กล้อง CCTV ใช้งานไม่ได้']
    },
    { 
      key: 'landscaping', 
      title: 'งานสวน & ภูมิทัศน์ฟาร์ม', 
      sub: 'สปริงเกอร์ ทางเดินหญ้า กิ่งไม้ล้ม', 
      icon: 'yard', 
      dept: 'ภูมิทัศน์ & สวนดอกไม้',
      tags: ['ระบบสปริงเกอร์รั่ว', 'กิ่งไม้หักขวางทาง', 'ระบบระบายน้ำแปลงหญ้า', 'ดินสไลด์ทรุด']
    },
    { 
      key: 'general', 
      title: 'งานทั่วไป & เบ็ดเตล็ด', 
      sub: 'โต๊ะเก้าอี้ชำรุด ขนย้าย ป้ายบอกทาง', 
      icon: 'handyman', 
      dept: 'คาเฟ่ & F&B',
      tags: ['โต๊ะเก้าอี้ชำรุด', 'ขอแรงช่วยขนย้าย', 'ป้ายบอกทางชำรุด', 'อุปกรณ์บริการแขกเสีย']
    }
  ];

  const handleZoneSelect = (z: typeof zones[0]) => {
    setSelectedZone(z.key);
    setDepartment(z.dept);
  };

  const handleCategorySelect = (cat: typeof categories[0]) => {
    setSelectedCategory(cat.key);
  };

  const appendTag = (tagName: string) => {
    setProblemDetail(prev => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} #${tagName}` : `#${tagName}`;
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          setPhotos(prev => [
            ...prev,
            { url: event.target!.result as string, time: timeStr, label: file.name.slice(0, 10) }
          ]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const validateRequester = () => {
    if (!requesterName.trim()) {
      alert('กรุณากรอกชื่อผู้แจ้ง');
      setIsRequesterDrawerOpen(true);
      return false;
    }
    if (!requesterPhone.trim()) {
      alert('กรุณากรอกเบอร์ติดต่อของผู้แจ้ง');
      setIsRequesterDrawerOpen(true);
      return false;
    }
    if (!department.trim()) {
      alert('กรุณาเลือกแผนกของผู้แจ้ง');
      setIsRequesterDrawerOpen(true);
      return false;
    }
    return true;
  };

  const validateDetails = () => {
    if (!specificLocation.trim()) {
      alert('กรุณาระบุจุด/ห้อง/ตำแหน่งที่เกิดเหตุ');
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

    const zoneObj = zones.find(z => z.key === selectedZone);
    const catObj = categories.find(c => c.key === selectedCategory);
    const locText = specificLocation.trim() || zoneObj?.name || 'พื้นที่ฟาร์ม';

    const payload = {
      title: `${catObj?.title || 'งานซ่อม'}: ${locText}`,
      department: department || zoneObj?.dept || 'คาเฟ่ & F&B',
      location: `${zoneObj?.name || selectedZone} - ${locText}`,
      description: problemDetail.trim(),
      requesterName: requesterName.trim() || 'พนักงานฟาร์ม (ไม่ระบุชื่อ)',
      requesterPhone: requesterPhone.trim() || '081-234-5678',
      priority,
      status: 'pending',
      requestImageUrl: photos[0]?.url || '-',
      zone: zoneObj?.name,
      category: catObj?.title
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
              <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed">
                <span className="material-symbols-outlined text-[20px]">build_circle</span>
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
                <span className="material-symbols-outlined text-[16px]">check</span>
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
        <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-slate-200/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-sm min-w-0">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[22px]">badge</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-label-lg text-label-lg text-on-surface font-bold truncate">
                    {requesterName}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-[10px]">
                    อัตโนมัติ
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  {department} • {requesterPhone}
                </p>
              </div>
            </div>
            <button
              aria-label="แก้ไขข้อมูลผู้แจ้ง"
              className="w-10 h-10 rounded-full bg-surface-container-low text-primary flex items-center justify-center active:scale-95 transition-transform shrink-0 cursor-pointer"
              onClick={() => setIsRequesterDrawerOpen(!isRequesterDrawerOpen)}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isRequesterDrawerOpen ? 'expand_less' : 'edit'}
              </span>
            </button>
          </div>

          {/* Editable fields drawer */}
          {isRequesterDrawerOpen && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-on-surface-variant">ชื่อผู้แจ้ง</label>
                <input
                  className="h-11 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:bg-surface-container-lowest border border-slate-200"
                  type="text"
                  required
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-on-surface-variant">เบอร์ติดต่อด่วน</label>
                <input
                  className="h-11 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:bg-surface-container-lowest border border-slate-200"
                  type="tel"
                  required
                  value={requesterPhone}
                  onChange={(e) => setRequesterPhone(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-on-surface-variant">แผนก</label>
                <select
                  className="h-11 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:bg-surface-container-lowest border border-slate-200"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </section>
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => goToStep(2)}
            className="min-h-[48px] px-5 rounded-xl bg-primary text-white font-bold text-sm flex items-center gap-2 shadow-md cursor-pointer active:scale-95"
          >
            ถัดไป: รายละเอียด
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </div>
        </>)}

        {step === 2 && (<>
        {/* Zone Selection */}
        <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm border border-slate-200/40">
          <div className="flex items-center justify-between">
            <label className="font-label-lg text-label-lg text-on-surface flex items-center gap-1.5 font-bold">
              <span className="material-symbols-outlined text-primary text-[20px]">pin_drop</span>
              เลือกโซนเกิดเหตุ <span className="text-error font-bold">*</span>
            </label>
            <span className="font-label-sm text-label-sm text-on-surface-variant">5 โซนหลัก</span>
          </div>

          {/* Horizontal Zone Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scroll-smooth no-scrollbar">
            {zones.map(z => {
              const isSelected = selectedZone === z.key;
              return (
                <button
                  key={z.key}
                  className={`zone-btn shrink-0 min-h-[48px] px-3.5 py-2 rounded-xl font-label-md text-label-md flex items-center gap-2 active:scale-95 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary-container text-on-primary shadow-sm font-bold'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                  }`}
                  onClick={() => handleZoneSelect(z)}
                  type="button"
                >
                  <span
                    className={`material-symbols-outlined text-[18px] ${
                      isSelected ? 'text-tertiary-fixed' : 'text-on-surface-variant'
                    }`}
                  >
                    {z.icon}
                  </span>
                  <span>{z.name}</span>
                </button>
              );
            })}
          </div>

          {/* Specific Location */}
          <div className="grid grid-cols-1 gap-space-sm mt-1">
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-label-sm text-on-surface-variant">
                ระบุจุด/ห้อง/ตำแหน่งเฉพาะ
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[20px]">
                  storefront
                </span>
                <input
                  className="w-full h-12 pl-10 pr-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none border border-slate-200/50"
                  placeholder="เช่น ซุ้มกาแฟสด, คอกแกะอนุบาล"
                  required
                  type="text"
                  value={specificLocation}
                  onChange={(e) => setSpecificLocation(e.target.value)}
                />
              </div>
            </div>

          </div>
        </section>

        {/* Maintenance Category Selection - รูปแบบงานซ่อมบำรุง */}
        <section className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm flex flex-col gap-space-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-label-lg text-label-lg text-on-surface flex items-center gap-1.5 font-bold">
                <span className="material-symbols-outlined text-primary text-[20px]">category</span>
                รูปแบบงานซ่อมบำรุง <span className="text-error font-bold">*</span>
              </label>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                เลือกรูปแบบงานที่ตรงกับปัญหา เพื่อจ่ายงานให้ช่างเฉพาะทางได้รวดเร็ว
              </p>
            </div>
            <span className="font-label-sm text-xs px-2.5 py-0.5 rounded-full bg-primary-fixed/50 text-primary font-bold">
              8 หมวดหลัก
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
            {categories.map(cat => {
              const isSelected = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  className={`cat-btn p-3 rounded-2xl text-left flex items-start gap-2.5 active:scale-98 transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-primary-fixed/30 border-primary shadow-xs ring-1 ring-primary'
                      : 'bg-surface-container-low border-slate-200/80 hover:bg-surface-container hover:border-slate-300'
                  }`}
                  onClick={() => handleCategorySelect(cat)}
                  type="button"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{cat.icon}</span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`font-bold text-xs sm:text-sm truncate ${
                          isSelected ? 'text-primary' : 'text-on-surface'
                        }`}
                      >
                        {cat.title}
                      </span>
                      {isSelected && (
                        <span className="material-symbols-outlined text-primary text-[16px] shrink-0">
                          check_circle
                        </span>
                      )}
                    </div>
                    <span className="font-normal text-[11px] text-on-surface-variant line-clamp-2 mt-0.5 leading-relaxed">
                      {cat.sub}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Problem Description & Text Area */}
        <section className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm flex flex-col gap-space-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <label className="font-label-lg text-label-lg text-on-surface flex items-center gap-1.5 font-bold">
              <span className="material-symbols-outlined text-primary text-[20px]">notes</span>
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

          {/* Dynamic Quick Issue Tags based on Selected Category */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="font-label-sm text-[11px] text-on-surface-variant self-center mr-1 font-semibold">
              แท็กอาการพบบ่อย:
            </span>
            {(categories.find(c => c.key === selectedCategory)?.tags || [
              'น้ำหยดนองพื้น',
              'เสียงดังผิดปกติ',
              'ไฟดับ/ช็อต',
              'ชำรุดเสียหาย'
            ]).map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => appendTag(tag)}
                className="px-2.5 py-1 rounded-full bg-surface-container-high hover:bg-primary-fixed text-on-surface font-label-sm text-[11px] font-medium active:scale-95 transition-all cursor-pointer shadow-2xs"
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
              <span className="material-symbols-outlined text-primary text-[20px]">photo_library</span>
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
              <span className="material-symbols-outlined text-[20px]">photo_camera</span>
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
              <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
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
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            ))}

            {photos.length < 4 && (
              <label className="rounded-lg aspect-square bg-surface-container-low flex flex-col items-center justify-center gap-1 text-on-surface-variant active:bg-surface-container transition-colors cursor-pointer border-2 border-dashed border-slate-300">
                <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">add</span>
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
              <span className="material-symbols-outlined text-primary text-[20px]">alarm</span>
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
                  <span className="material-symbols-outlined text-[20px]">schedule</span>
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
                  <span className="material-symbols-outlined text-[20px]">priority_high</span>
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
                  <span className="material-symbols-outlined text-[20px]">e911_emergency</span>
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
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">verified_user</span>
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
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            ผู้แจ้ง
          </button>
          <button
            type="button"
            onClick={() => goToStep(3)}
            className="min-h-[48px] px-5 rounded-xl bg-primary text-white font-bold text-sm flex items-center gap-2 shadow-md cursor-pointer active:scale-95"
          >
            ตรวจสอบงาน
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </div>
        </>)}

        {step === 3 && (<>
        <section className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-slate-200 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">fact_check</span>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-primary font-bold">ตรวจสอบและยืนยันงาน</h2>
              <p className="text-xs text-on-surface-variant">ตรวจข้อมูลให้ถูกต้องก่อนส่งเข้าคิวซ่อม</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-surface-container-low p-3"><span className="text-xs text-on-surface-variant block">ผู้แจ้ง</span><strong>{requesterName}</strong><div className="text-xs text-on-surface-variant">{requesterPhone} • {department}</div></div>
            <div className="rounded-xl bg-surface-container-low p-3"><span className="text-xs text-on-surface-variant block">สถานที่</span><strong>{specificLocation}</strong><div className="text-xs text-on-surface-variant">{zones.find(z => z.key === selectedZone)?.name}</div></div>
            <div className="rounded-xl bg-surface-container-low p-3 sm:col-span-2"><span className="text-xs text-on-surface-variant block">รายละเอียดอาการ</span><strong className="whitespace-pre-wrap">{problemDetail}</strong></div>
            <div className="rounded-xl bg-surface-container-low p-3"><span className="text-xs text-on-surface-variant block">ประเภทงาน</span><strong>{categories.find(c => c.key === selectedCategory)?.title}</strong></div>
            <div className="rounded-xl bg-surface-container-low p-3"><span className="text-xs text-on-surface-variant block">ความเร่งด่วน</span><strong>{priority === 'critical' ? 'ด่วนที่สุด / ฉุกเฉิน' : priority === 'high' ? 'ด่วน' : 'ปกติ'}</strong></div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800">
            <span className="material-symbols-outlined text-[18px]">info</span>
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
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
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
                <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
                <span>กำลังนำส่งข้อมูล...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[24px]">send</span>
                <span>บันทึกและส่งใบแจ้งซ่อม</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            className="min-h-[48px] w-full rounded-xl bg-surface-container text-primary font-label-lg text-label-lg flex items-center justify-center gap-2 active:bg-surface-container-high transition-colors cursor-pointer font-semibold"
          >
            <span className="material-symbols-outlined text-[20px]">save_as</span>
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
              <span className="material-symbols-outlined text-[24px]">check_circle</span>
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-headline-sm text-[16px] font-bold">ส่งใบแจ้งซ่อมสำเร็จ!</span>
              <span className="font-body-sm text-body-sm text-primary-fixed truncate">
                หมายเลขงาน: #{submittedRequestId || 'REQ-2026-089'} (รอช่างรับงาน)
              </span>
            </div>
            <button
              onClick={() => setShowSuccessToast(false)}
              className="text-on-primary p-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
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
