import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Smartphone, CheckCircle } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone mode (installed)
    const checkStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(checkStandalone);

    // 2. Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // 3. Check session dismissal
    const isDismissed = sessionStorage.getItem('scenery_pwa_dismissed') === 'true';
    if (isDismissed) setDismissed(true);

    // 4. Listen for Chrome/Edge/Android beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setTimeout(() => setIsInstalled(false), 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowIosGuide(false);
    sessionStorage.setItem('scenery_pwa_dismissed', 'true');
  };

  // If already installed or dismissed, do not render banner
  if (isStandalone || dismissed) {
    return null;
  }

  // Only show if prompt is available OR on iOS
  const canShowPrompt = Boolean(deferredPrompt) || (isIos && !isStandalone);
  if (!canShowPrompt && !isInstalled) {
    return null;
  }

  return (
    <>
      {/* Success Notification */}
      {isInstalled && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <CheckCircle className="w-5 h-5 text-emerald-300" />
          <span className="text-xs sm:text-sm font-bold">ติดตั้งแอปแจ้งซ่อม Scenery Farm ลงบนเครื่องเรียบร้อยแล้ว!</span>
        </div>
      )}

      {/* Floating PWA Install Banner */}
      {!dismissed && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-fade-in">
          <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-3xl shadow-2xl border border-teal-500/30 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-600/30 border border-teal-400/40 flex items-center justify-center p-2 shrink-0">
                  <img src="./app-icon-512.png" alt="โลโก้ Scenery Farm" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <span>ติดตั้งแอปบนมือถือ</span>
                    <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full font-semibold border border-teal-400/30">
                      PWA
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-300 line-clamp-1">
                    เปิดใช้งานได้ทันทีจากหน้าจอโฮม ไม่ต้องเปิดเว็บ
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
                title="ปิด"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* iOS Guide Modal / Popup */}
            {showIosGuide ? (
              <div className="bg-slate-800/90 rounded-2xl p-3 text-xs text-slate-200 space-y-2 border border-slate-700">
                <p className="font-bold text-teal-300 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" /> วิธีติดตั้งบน iPhone / iPad:
                </p>
                <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] text-slate-300">
                  <li>
                    แตะที่ปุ่ม <Share className="w-3.5 h-3.5 inline text-teal-400 mx-0.5" /> <strong>แชร์ (Share)</strong> ที่แถบด้านล่าง Safari
                  </li>
                  <li>
                    เลื่อนลงมาแล้วเลือก <PlusSquare className="w-3.5 h-3.5 inline text-teal-400 mx-0.5" /> <strong>"เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen)</strong>
                  </li>
                  <li>แตะปุ่ม <strong>"เพิ่ม" (Add)</strong> ที่มุมขวาบน</li>
                </ol>
                <button
                  type="button"
                  onClick={() => setShowIosGuide(false)}
                  className="w-full mt-1 py-1.5 text-center text-teal-400 font-bold hover:underline"
                >
                  เข้าใจแล้ว
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="flex-1 py-2.5 px-4 bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{isIos ? 'ดูวิธีติดตั้งบน iPhone' : '📲 ติดตั้งแอปลงเครื่อง'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  ไว้คราวหลัง
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// Standalone Install Button to place inside Headers / Navbars
export const PwaInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const checkStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(checkStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIos(/iphone|ipad|ipod/.test(userAgent));

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  if (isStandalone) return null;

  const handleClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
          className || 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200'
        }`}
        title="ติดตั้งแอปลงบนอุปกรณ์"
      >
        <Download className="w-3.5 h-3.5 text-teal-600" />
        <span className="hidden sm:inline">ติดตั้งแอป</span>
      </button>

      {/* iOS or Manual Install Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 border border-slate-100 animate-scale-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 p-1 flex items-center justify-center">
                  <img src="./app-icon-512.png" alt="โลโก้ Scenery Farm" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">ติดตั้งแอปแจ้งซ่อม</h4>
                  <p className="text-[11px] text-slate-500">Scenery Vintage Farm</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIos ? (
              <div className="bg-slate-50 rounded-2xl p-3.5 text-xs text-slate-700 space-y-2 border border-slate-200">
                <p className="font-bold text-teal-800 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-teal-600" /> วิธีติดตั้งบน iPhone / iPad:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 pl-1 text-[11px] text-slate-600 leading-relaxed">
                  <li>
                    แตะที่ปุ่ม <Share className="w-3.5 h-3.5 inline text-teal-600 mx-0.5" /> <strong>แชร์ (Share)</strong> ด้านล่าง Safari
                  </li>
                  <li>
                    เลือก <PlusSquare className="w-3.5 h-3.5 inline text-teal-600 mx-0.5" /> <strong>"เพิ่มไปยังหน้าจอโฮม"</strong>
                  </li>
                  <li>แตะปุ่ม <strong>"เพิ่ม"</strong> ที่มุมขวาบน</li>
                </ol>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl p-3.5 text-xs text-slate-700 space-y-2 border border-slate-200">
                <p className="font-bold text-slate-800">วิธีติดตั้งบนเบราว์เซอร์:</p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  คลิกที่ไอคอนติดตั้งแอป <Download className="w-3 h-3 inline text-teal-600" /> ที่แถบ URL ด้านบนของเบราว์เซอร์ Chrome หรือ Edge เพื่อติดตั้งแอปลงบนเครื่องได้ทันที
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              รับทราบ
            </button>
          </div>
        </div>
      )}
    </>
  );
};
