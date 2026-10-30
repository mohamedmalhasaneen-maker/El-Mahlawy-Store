import { useEffect, useState } from 'react';
import {
  MessageSquareHeart,
  Star,
  ThumbsDown,
  ThumbsUp,
  Sparkles,
  BarChart3,
  Loader2,
} from 'lucide-react';
import {
  RatingStats,
  subscribeToRatingStats,
  isLocalRatingSubmitted,
} from '../utils/ratingSystem';

interface RatingStatsDisplayProps {
  onOpenRatingModal?: () => void;
  className?: string;
  compact?: boolean;
  isDark?: boolean;
}

export function RatingStatsDisplay({
  onOpenRatingModal,
  className = '',
  compact = false,
  isDark = false,
}: RatingStatsDisplayProps) {
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasRated, setHasRated] = useState(false);

  useEffect(() => {
    setHasRated(isLocalRatingSubmitted());
    const unsubscribe = subscribeToRatingStats((data) => {
      setStats(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 text-xs text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin text-[#38BDF8] ml-2" />
        <span>جاري تحميل آراء وتقييمات زوار المتجر...</span>
      </div>
    );
  }

  const s = stats || {
    totalCount: 0,
    totalStars: 0,
    averageRating: 0,
    recommendYes: 0,
    recommendNo: 0,
    recommendYesPercent: 0,
    recommendNoPercent: 0,
    starCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    starPercentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };

  return (
    <div
      className={`mx-auto max-w-4xl rounded-2xl bg-[#F2FAFF] dark:bg-[#081830] border border-[#CBE7FA] dark:border-[#163663] p-3.5 sm:p-4 space-y-3 transition-colors ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-[#D8EEFB] dark:border-[#1E3F73]">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#1D4ED8]/10 dark:bg-[#38BDF8]/10 px-2.5 py-0.5 text-[11px] font-extrabold text-[#1D4ED8] dark:text-[#38BDF8] mb-1">
            <MessageSquareHeart className="h-3 w-3" aria-hidden="true" />
            <span>آراء وانطباعات الزوار</span>
          </div>
          <h3 className="text-sm sm:text-base font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF]">
            الزوار بيقولوا إيه عن الموقع؟
          </h3>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
            إحصائيات حقيقية محدثة مباشرة استنادًا إلى تقييمات زوار موقع المحلاوي ستور.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenRatingModal}
          className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] active:scale-95 px-3.5 py-1.5 text-xs font-extrabold text-white shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-center"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
          <span>{hasRated ? 'عرض تقييمي للموقع' : 'شاركنـا رأيك وتقييمك'}</span>
        </button>
      </div>

      {/* Grid: Recommendation Metrics & Star Summary Side-by-Side */}
      <div className="grid grid-cols-1 min-[560px]:grid-cols-2 gap-3 sm:gap-3.5 items-stretch">
        {/* Card 1: Recommendation Stats (بيرشحوا / مش بيرشحوا) */}
        <div className="rounded-xl bg-white dark:bg-[#0E264A] border border-[#CBE7FA] dark:border-[#1E3F73] p-3 sm:p-3.5 flex flex-col justify-between gap-2.5">
          <div className="space-y-2.5">
            <h4 className="text-xs sm:text-[13px] font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF] flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-[#1D4ED8] dark:text-[#38BDF8] shrink-0" aria-hidden="true" />
              <span>توصيات الزوار لأصدقائهم</span>
            </h4>

            {/* Recommenders: Yes */}
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-[#0B1F3A] dark:text-[#F0F9FF]">
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <ThumbsUp className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>بيرشّحوا الموقع للأصدقاء</span>
                </span>
                <span className="font-num font-extrabold text-emerald-600 dark:text-emerald-400 shrink-0">
                  {s.recommendYes.toLocaleString('ar-EG')} شخص ({s.recommendYesPercent}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#E2F3FE] dark:bg-[#081830] overflow-hidden">
                <svg aria-hidden="true" className="block h-full w-full">
                  <rect
                    width={`${s.recommendYesPercent}%`}
                    height="100%"
                    rx="999"
                    className="fill-emerald-500 transition-all duration-500"
                  />
                </svg>
              </div>
            </div>

            {/* Non-recommenders: No */}
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-[#0B1F3A] dark:text-[#F0F9FF]">
                <span className="inline-flex items-center gap-1 text-rose-500 dark:text-rose-400">
                  <ThumbsDown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>مش بيرشّحوا الموقع</span>
                </span>
                <span className="font-num font-extrabold text-slate-500 dark:text-slate-400 shrink-0">
                  {s.recommendNo.toLocaleString('ar-EG')} شخص ({s.recommendNoPercent}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#E2F3FE] dark:bg-[#081830] overflow-hidden">
                <svg aria-hidden="true" className="block h-full w-full">
                  <rect
                    width={`${s.recommendNoPercent}%`}
                    height="100%"
                    rx="999"
                    className="fill-slate-400 dark:fill-slate-600 transition-all duration-500"
                  />
                </svg>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-[#E8F4FD] dark:border-[#1E3F73]">
            {s.totalCount > 0
              ? `إجمالي النسبة المحسوبة من مجموع ${s.totalCount.toLocaleString('ar-EG')} تقييمًا مسجلًا.`
              : 'لم يتم تسجيل أي توصيات حتى الآن؛ كن أول من يقيم التجربة!'}
          </p>
        </div>

        {/* Card 2: Star Average & Tier Distribution */}
        <div className="rounded-xl bg-white dark:bg-[#0E264A] border border-[#CBE7FA] dark:border-[#1E3F73] p-3 sm:p-3.5 flex flex-col justify-between gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs sm:text-[13px] font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF]">
                متوسط التقييم العام
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-num text-xl sm:text-2xl font-extrabold leading-none text-[#1D4ED8] dark:text-[#38BDF8]">
                  {s.averageRating.toFixed(1)}
                </span>
                <span className="text-[11px] text-slate-400 font-bold">من 5 نجوم</span>
              </div>
            </div>

            <div className="text-left">
              <div className="flex items-center gap-0.5 text-amber-400">
                {[1, 2, 3, 4, 5].map((starIdx) => (
                  <Star
                    key={starIdx}
                    className={`h-3.5 w-3.5 ${
                      starIdx <= Math.round(s.averageRating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                استنادًا إلى <span className="font-num text-[#1D4ED8] dark:text-[#38BDF8] font-extrabold">{s.totalCount.toLocaleString('ar-EG')}</span> تقييمًا
              </p>
            </div>
          </div>

          {/* Star Breakdown Bars (5 stars down to 1 star) */}
          <div className="space-y-1 pt-1.5 border-t border-[#E8F4FD] dark:border-[#1E3F73]">
            {[5, 4, 3, 2, 1].map((starNum) => {
              const count = s.starCounts[starNum as 1 | 2 | 3 | 4 | 5] || 0;
              const pct = s.starPercentages[starNum as 1 | 2 | 3 | 4 | 5] || 0;
              return (
                <div key={starNum} className="flex items-center gap-2 text-[11px]">
                  <span className="font-num font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF] w-9 shrink-0 flex items-center gap-0.5">
                    <span>{starNum}</span>
                    <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400 shrink-0" aria-hidden="true" />
                  </span>

                  <div className="flex-1 h-1.5 rounded-full bg-[#E2F3FE] dark:bg-[#081830] overflow-hidden">
                    <svg aria-hidden="true" className="block h-full w-full">
                      <rect
                        width={`${pct}%`}
                        height="100%"
                        rx="999"
                        className="fill-amber-400 transition-all duration-500"
                      />
                    </svg>
                  </div>

                  <span className="font-num text-[10px] font-bold text-slate-500 dark:text-slate-400 w-14 text-left shrink-0">
                    {count.toLocaleString('ar-EG')} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
