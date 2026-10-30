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
      <div className="flex items-center justify-center p-8 text-xs text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin text-[#38BDF8] ml-2" />
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
      className={`mx-auto max-w-5xl rounded-3xl bg-[#0B2354] dark:bg-[#071326] text-white border ${
        isDark ? 'border-[#D4AF37]/35' : 'border-[#1E3F73]'
      } p-6 sm:p-8 space-y-6 shadow-2xl transition-colors ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold text-[#7DD3FC] border border-white/15">
            <MessageSquareHeart className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
            <span>آراء وانطباعات الزوار</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white">
            الزوار بيقولوا إيه عن الموقع؟
          </h3>
          <p className="text-xs sm:text-sm text-[#BAE6FD]/90 max-w-2xl leading-relaxed">
            إحصائيات حقيقية ومحدثة مباشرة استنادًا إلى تقييمات وتجارب زوار موقع المحلاوي ستور.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenRatingModal}
          className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-white hover:bg-[#F0F9FF] text-[#0B1F3A] active:scale-95 px-6 py-3 text-sm font-extrabold shadow-xl transition-all cursor-pointer whitespace-nowrap shrink-0"
        >
          <Sparkles className="h-4 w-4 text-[#1D4ED8]" aria-hidden="true" />
          <span>{hasRated ? 'عرض تقييمي للموقع' : 'شاركنـا رأيك وتقييمك'}</span>
        </button>
      </div>

      {/* Grid: Average & Star Breakdown + Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left/Top Column: Average & Stars */}
        <div className="lg:col-span-5 rounded-2xl bg-white/6 border border-white/10 p-5 sm:p-6 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#BAE6FD]">متوسط التقييم العام</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-num text-3xl sm:text-4xl font-extrabold leading-none text-[#38BDF8]">
                  {s.averageRating.toFixed(1)}
                </span>
                <span className="text-xs text-slate-300 font-bold">من 5 نجوم</span>
              </div>
            </div>

            <div className="text-left">
              <div className="flex items-center gap-1 text-amber-400 mb-1">
                {[1, 2, 3, 4, 5].map((starIdx) => (
                  <Star
                    key={starIdx}
                    className={`h-4 w-4 ${
                      starIdx <= Math.round(s.averageRating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-600'
                    }`}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <p className="text-[11px] font-bold text-slate-300">
                استنادًا إلى <span className="font-num text-[#38BDF8] font-extrabold">{s.totalCount.toLocaleString('ar-EG')}</span> تقييمًا مسجلًا
              </p>
            </div>
          </div>

          {/* Star Breakdown Bars */}
          <div className="space-y-2 pt-4 border-t border-white/10">
            {[5, 4, 3, 2, 1].map((starNum) => {
              const count = s.starCounts[starNum as 1 | 2 | 3 | 4 | 5] || 0;
              const pct = s.starPercentages[starNum as 1 | 2 | 3 | 4 | 5] || 0;
              return (
                <div key={starNum} className="flex items-center gap-3 text-xs">
                  <span className="font-num font-extrabold text-white w-10 shrink-0 flex items-center gap-1">
                    <span>{starNum}</span>
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" aria-hidden="true" />
                  </span>

                  <div className="flex-1 h-2 rounded-full bg-black/30 overflow-hidden">
                    <svg aria-hidden="true" className="block h-full w-full">
                      <rect
                        width={`${pct}%`}
                        height="100%"
                        rx="999"
                        className="fill-amber-400 transition-all duration-500"
                      />
                    </svg>
                  </div>

                  <span className="font-num text-xs font-bold text-slate-300 w-20 text-left shrink-0">
                    {count.toLocaleString('ar-EG')} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right/Bottom Column: Recommendation Stats */}
        <div className="lg:col-span-7 rounded-2xl bg-white/6 border border-white/10 p-5 sm:p-6 flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <h4 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
              <span>هل يرشح الزوار موقع المحلاوي ستور للآخرين؟</span>
            </h4>

            {/* Recommenders: Yes */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-white">
                <span className="inline-flex items-center gap-1.5 text-emerald-400">
                  <ThumbsUp className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>بيرشّحوا الموقع للأصدقاء</span>
                </span>
                <span className="font-num font-extrabold text-emerald-400 shrink-0">
                  {s.recommendYes.toLocaleString('ar-EG')} شخص ({s.recommendYesPercent}%)
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-black/30 overflow-hidden">
                <svg aria-hidden="true" className="block h-full w-full">
                  <rect
                    width={`${s.recommendYesPercent}%`}
                    height="100%"
                    rx="999"
                    className="fill-emerald-400 transition-all duration-500"
                  />
                </svg>
              </div>
            </div>

            {/* Non-recommenders: No */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-white">
                <span className="inline-flex items-center gap-1.5 text-rose-400">
                  <ThumbsDown className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>مش بيرشّحوا الموقع</span>
                </span>
                <span className="font-num font-extrabold text-slate-300 shrink-0">
                  {s.recommendNo.toLocaleString('ar-EG')} شخص ({s.recommendNoPercent}%)
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-black/30 overflow-hidden">
                <svg aria-hidden="true" className="block h-full w-full">
                  <rect
                    width={`${s.recommendNoPercent}%`}
                    height="100%"
                    rx="999"
                    className="fill-slate-500 transition-all duration-500"
                  />
                </svg>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-300 pt-3 border-t border-white/10 leading-relaxed font-medium">
            {s.totalCount > 0
              ? `إجمالي النسبة المحسوبة بناءً على ${s.totalCount.toLocaleString('ar-EG')} تقييمًا مسجلًا من عملاء وزوار الموقع.`
              : 'لم يتم تسجيل أي توصيات حتى الآن؛ كن أول من يقيم التجربة!'}
          </p>
        </div>
      </div>
    </div>
  );
}
