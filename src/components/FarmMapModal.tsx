import React from 'react';

interface FarmMapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FarmMapModal: React.FC<FarmMapModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-surface rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        <div className="p-4 bg-surface-container-lowest flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">map</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              แผนผังและพิกัดแปลงฟาร์ม The Scenery
            </h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center text-on-surface-variant hover:bg-surface-container rounded-full cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex flex-col gap-3">
          <div className="relative rounded-2xl overflow-hidden shadow-inner border border-slate-200">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDZU-ne5ehqWpSGs8mW9y2uRvE-fVEVC-1YsKhjjlK09kl11dfP7UsQU-qBaMfDw7tGVNdj4SIWMgEjfuafhUhG9PqQ7nGx6SQdoi4PatuZy_Vmxtf32hFOmaQZWt1Xx2Dx7Sd5Pit8pwuODeqdIrqpFDsVCmAXKplGIrbQsj7XkszaBNS1yzCqPf57a_AEfMId-10TrPM4cXR3rC8QZpIOKfKckjpsXhWDxnuZ1IBrCtnzLpGKVxOsdQ"
              alt="Farm Map"
              className="w-full h-64 object-cover"
            />
            <div className="absolute top-3 left-3 bg-primary/90 text-on-primary px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm shadow">
              พิกัด: อ.สวนผึ้ง จ.ราชบุรี
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-surface-container-low border border-slate-200">
              <span className="font-bold block text-primary">โซน A • โรงแกะ & ลานกิจกรรม</span>
              <span className="text-on-surface-variant">คอกอนุบาล, รางน้ำ, อาคาร 1-4</span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-container-low border border-slate-200">
              <span className="font-bold block text-secondary">โซน B • คาเฟ่ & เบเกอรี่</span>
              <span className="text-on-surface-variant">ครัวร้อน, ห้องเย็น, เบเกอรี่ช็อป</span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-container-low border border-slate-200">
              <span className="font-bold block text-primary">โซน C • วิลล่า & รีสอร์ท</span>
              <span className="text-on-surface-variant">บ้านพัก V1-V12, สระน้ำ, ห้องแม่บ้าน</span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-container-low border border-slate-200">
              <span className="font-bold block text-on-surface">ช็อปช่างกลาง & โรงพัสดุ</span>
              <span className="text-on-surface-variant">ศูนย์วิทยุ, สโตร์อะไหล่, รถบริการ</span>
            </div>
          </div>

          <button
            onClick={() => {
              window.open('https://maps.google.com/?q=The+Scenery+Vintage+Farm+Suan+Phueng', '_blank');
            }}
            className="w-full h-12 rounded-xl bg-primary text-on-primary font-bold flex items-center justify-center gap-2 shadow cursor-pointer mt-1"
          >
            <span className="material-symbols-outlined text-[20px]">near_me</span>
            <span>เปิด Google Maps นำทางจริง</span>
          </button>
        </div>
      </div>
    </div>
  );
};
