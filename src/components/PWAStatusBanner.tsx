import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export function PWAStatusBanner() {
  const { isOnline, syncStatus } = useNetworkStatus();

  if (isOnline && syncStatus === 'connected') {
    return null; // Silent when fully online and settled
  }

  return (
    <>
      {/* Offline Notice Banner (Section 7 exact requirement) */}
      {!isOnline && (
        <aside
          aria-label="تنبيه انقطاع الاتصال بالإنترنت"
          className="bg-amber-500 dark:bg-amber-600 text-slate-950 px-4 py-2.5 text-center text-xs sm:text-sm font-extrabold shadow-md z-40 sticky top-14 md:top-16 transition-all"
        >
          <div className="mx-auto max-w-7xl flex items-center justify-center gap-2">
            <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>أنت تتصفح النسخة المحفوظة من المتجر. ستتم مزامنة البيانات عند عودة الاتصال.</span>
          </div>
        </aside>
      )}

      {/* Floating Connectivity Badge */}
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-2xl bg-[#081A33]/95 dark:bg-[#0E264A]/95 text-white border border-white/25 px-3.5 py-2 shadow-2xl backdrop-blur-md text-xs font-extrabold transition-all">
        {isOnline ? (
          syncStatus === 'syncing' ? (
            <>
              <RefreshCw className="h-4 w-4 text-sky-400 animate-spin shrink-0" aria-hidden="true" />
              <span>جارٍ تحديث البيانات...</span>
            </>
          ) : (
            <>
              <Wifi className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>متصل بالإنترنت</span>
            </>
          )
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-amber-400 shrink-0 animate-pulse" aria-hidden="true" />
            <span>تعمل دون اتصال</span>
          </>
        )}
      </div>
    </>
  );
}
