import { useState } from 'react';
import { Download, Sparkles, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'navbar' | 'mobile' | 'banner';
  iconOnly?: boolean;
}

export function PWAInstallButton({ className = '', variant = 'navbar', iconOnly = false }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installing, setInstalling] = useState(false);

  if (isInstalled) {
    if (variant === 'banner') {
      return (
        <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-2 text-xs font-bold text-emerald-300">
          <span>✅ التطبيق مثبت على جهازك</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setInstalling(true);
      try {
        await install();
      } finally {
        setInstalling(false);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // General browser fallback guidance
      setShowIOSGuide(true);
    }
  };

  const buttonContent = (
    <>
      <Download className="h-4 w-4 text-[#38BDF8] shrink-0 animate-bounce" aria-hidden="true" />
      <span>تنزيل التطبيق</span>
    </>
  );

  if (variant === 'mobile') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          disabled={installing}
          aria-label="تنزيل التطبيق"
          title="تنزيل التطبيق"
          className={`inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#0284C7] hover:from-[#1E40AF] hover:to-[#0369A1] text-white p-2 shadow-sm active:scale-95 transition-all cursor-pointer ${className}`}
        >
          <Download className="h-4 w-4 text-white shrink-0" aria-hidden="true" />
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="تعليمات تثبيت التطبيق"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowIOSGuide(false);
            }}
          >
            <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#0E264A] p-6 shadow-2xl border border-[#CBE7FA] dark:border-[#1E3F73] text-[#0B1F3A] dark:text-[#F0F9FF] space-y-4">
              <div className="flex items-center justify-between border-b border-[#E8F4FD] dark:border-[#1E3F73] pb-3">
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#1D4ED8] dark:text-[#38BDF8]" />
                  <span>تثبيت المحلاوي ستور</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#153460] text-slate-500 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {isIOS ? (
                <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  <p>لتثبيت التطبيق على جهاز iPhone أو iPad:</p>
                  <ol className="list-decimal list-inside space-y-1.5 font-bold">
                    <li>اضغط على زر المشاركة (Share ⎋) في شريط متصفح Safari.</li>
                    <li>قم بالتمرير لأسفل واضغط على «إضافة إلى الشاشة الرئيسية» (Add to Home Screen).</li>
                    <li>اضغط «إضافة» (Add) لتظهر أيقونة المتجر فوراً على شاشتك الرئيسية!</li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  <p>لتثبيت التطبيق على جهازك:</p>
                  <ol className="list-decimal list-inside space-y-1.5 font-bold">
                    <li>افتح قائمة متصفحك (النقاط الثلاث أعلى اليمين أو اليسار).</li>
                    <li>اختر «تثبيت التطبيق» (Install App) أو «إضافة إلى الشاشة الرئيسية».</li>
                    <li>استمتع بالعمل دون انقطاع وتصفح المتجر بكامل ميزاته!</li>
                  </ol>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full min-h-[44px] rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-extrabold transition-colors cursor-pointer"
              >
                فهمت، شكرًا
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        disabled={installing}
        aria-label="تنزيل التطبيق"
        title="تنزيل التطبيق"
        className={
          iconOnly
            ? `inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#0284C7] hover:from-[#1E40AF] hover:to-[#0369A1] text-white p-2 shadow-sm transition-all active:scale-95 cursor-pointer shrink-0 ${className}`
            : `inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#0284C7] hover:from-[#1E40AF] hover:to-[#0369A1] text-white px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 cursor-pointer shrink-0 ${className}`
        }
      >
        {iconOnly ? (
          <Download className="h-4 w-4 text-white shrink-0" aria-hidden="true" />
        ) : (
          buttonContent
        )}
      </button>

      {showIOSGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="تعليمات تثبيت التطبيق"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowIOSGuide(false);
          }}
        >
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#0E264A] p-6 shadow-2xl border border-[#CBE7FA] dark:border-[#1E3F73] text-[#0B1F3A] dark:text-[#F0F9FF] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8F4FD] dark:border-[#1E3F73] pb-3">
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#1D4ED8] dark:text-[#38BDF8]" />
                <span>تثبيت المحلاوي ستور</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#153460] text-slate-500 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                <p>لتثبيت التطبيق على جهاز iPhone أو iPad:</p>
                <ol className="list-decimal list-inside space-y-1.5 font-bold">
                  <li>اضغط على زر المشاركة (Share ⎋) في شريط متصفح Safari.</li>
                  <li>قم بالتمرير لأسفل واضغط على «إضافة إلى الشاشة الرئيسية» (Add to Home Screen).</li>
                  <li>اضغط «إضافة» (Add) لتظهر أيقونة المتجر فوراً على شاشتك الرئيسية!</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                <p>لتثبيت التطبيق على جهازك:</p>
                <ol className="list-decimal list-inside space-y-1.5 font-bold">
                  <li>افتح قائمة متصفحك (النقاط الثلاث أعلى اليمين أو اليسار).</li>
                  <li>اختر «تثبيت التطبيق» (Install App) أو «إضافة إلى الشاشة الرئيسية».</li>
                  <li>استمتع بالعمل دون انقطاع وتصفح المتجر بكامل ميزاته!</li>
                </ol>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full min-h-[44px] rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-extrabold transition-colors cursor-pointer"
            >
              فهمت، شكرًا
            </button>
          </div>
        </div>
      )}
    </>
  );
}
