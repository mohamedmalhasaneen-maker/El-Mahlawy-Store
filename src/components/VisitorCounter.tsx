import { useEffect, useState } from 'react';
import { Users, Info, Loader2 } from 'lucide-react';
import { recordUniqueDeviceVisit, subscribeToVisitorStats } from '../utils/visitorTracker';

interface VisitorCounterProps {
  className?: string;
  showIcon?: boolean;
}

export function VisitorCounter({ className = '', showIcon = true }: VisitorCounterProps) {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void recordUniqueDeviceVisit();

    const unsubscribeStats = subscribeToVisitorStats((newCount) => {
      setCount(newCount);
      setLoading(false);
    });

    return () => {
      unsubscribeStats();
    };
  }, []);

  if (loading) {
    return (
      <div className={`inline-flex items-center gap-1.5 text-xs text-slate-400 ${className}`}>
        <Loader2 className="h-3 w-3 animate-spin text-[#38BDF8]" />
        <span>جاري تحميل إحصائيات الزوار...</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl bg-[#0E264A]/80 dark:bg-[#081830]/90 border border-[#1E3F73] px-3 py-1.5 text-xs font-bold text-slate-200 shadow-xs ${className}`}
      title="يُحسب كل جهاز فريد مرة واحدة ضمن عداد زوار المتجر."
    >
      {showIcon && <Users className="h-3.5 w-3.5 text-[#38BDF8] shrink-0" aria-hidden="true" />}
      <span>
        إجمالي الزوار الفعليين للموقع:{' '}
        <span className="font-num font-extrabold text-[#38BDF8]">
          {count !== null ? count.toLocaleString('ar-EG') : 'غير متاح'}
        </span>
      </span>
      <Info className="h-3 w-3 text-slate-400 shrink-0 opacity-75 hover:opacity-100" aria-hidden="true" />
    </div>
  );
}
