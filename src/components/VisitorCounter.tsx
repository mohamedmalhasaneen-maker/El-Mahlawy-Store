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
      <div className={`inline-flex items-center gap-1.5 text-xs text-[#0284C7] dark:text-[#38BDF8] font-bold ${className}`}>
        <Loader2 className="h-3 w-3 animate-spin text-[#38BDF8] ml-2" />
        <span>جاري تحميل إحصائيات الزوار...</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl bg-[#0E264A]/80 dark:bg-[#081830]/90 border border-[#1E3F73] px-3 py-1.5 text-xs font-bold text-slate-200 shadow-xs ${className}`}
      title="يُحسب كل جهاز فريد مرة واحدة ضمن عداد زوار المتجر."
    >
      {showIcon && <Users className="h-3.5 w-3.5 text-[#38BDF8] dark:text-[#D4AF37] shrink-0" aria-hidden="true" />}
      <span>
        إجمالي الزوار الفعليين للموقع:{' '}
        <span className="font-num font-extrabold text-[#38BDF8] dark:text-[#F59E0B]">
          {count !== null ? count.toLocaleString('ar-EG') : 'غير متاح'}
        </span>
      </span>
      <Info className="h-3 w-3 text-[#38BDF8] dark:text-[#D4AF37] shrink-0 opacity-85 hover:opacity-100" aria-hidden="true" />
    </div>
  );
}
