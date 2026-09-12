import React from 'react';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SOSModal: React.FC<SOSModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleTriggerSOS = () => {
    alert('ส่งสัญญาณ SOS ฉุกเฉินไปยังศูนย์วิทยุและหัวหน้าทุกฝ่ายแล้ว!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-red-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl flex flex-col gap-4 border-2 border-error">
        <div className="w-16 h-16 rounded-full bg-error-container text-error flex items-center justify-center mx-auto animate-bounce">
          <span className="material-symbols-outlined text-[36px]">warning</span>
        </div>

        <div className="text-center">
          <h3 className="font-headline-sm text-headline-sm text-error font-bold">
            แจ้งเหตุฉุกเฉินระดับฟาร์ม (SOS)
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            ใช้กรณีเกิดเพลิงไหม้, สัตว์หลุดจากคอก, ไฟฟ้าแรงสูงลัดวงจร หรืออุบัติเหตุที่ต้องรับมือทันที
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={handleTriggerSOS}
            className="w-full h-12 rounded-xl bg-error text-on-error font-headline-sm text-headline-sm font-bold shadow-md cursor-pointer hover:bg-red-700"
          >
            ยืนยันส่งสัญญาณเตือน SOS ทันที
          </button>
          <button
            onClick={() => window.open('tel:032909000')}
            className="w-full h-11 rounded-xl bg-surface-container text-on-surface font-label-md font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">phone</span>
            โทรตรงห้องฉุกเฉิน / วิทยุสื่อสาร
          </button>
          <button
            onClick={onClose}
            className="w-full h-10 text-on-surface-variant font-label-md hover:underline cursor-pointer"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
};
