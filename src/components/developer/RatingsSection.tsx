import { useEffect, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Eye,
  EyeOff,
  HeartHandshake,
  Loader2,
  MessageSquareHeart,
  Save,
  Star,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import { SiteConfig } from '../../utils/siteConfig';
import {
  RatingDoc,
  RatingStats,
  subscribeToAllRatings,
  subscribeToRatingStats,
} from '../../utils/ratingSystem';

interface RatingsSectionProps {
  siteConfig: SiteConfig;
  onSaveSiteConfig: (updates: Partial<SiteConfig>) => Promise<void>;
}

export function RatingsSection({
  siteConfig,
  onSaveSiteConfig,
}: RatingsSectionProps) {
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [ratingsList, setRatingsList] = useState<RatingDoc[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingList, setLoadingList] = useState(true);

  const [showRatingsSection, setShowRatingsSection] = useState<boolean>(
    siteConfig.showRatingsSection !== false
  );
  const [savingConfig, setSavingConfig] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setShowRatingsSection(siteConfig.showRatingsSection !== false);
  }, [siteConfig.showRatingsSection]);

  useEffect(() => {
    const unsubStats = subscribeToRatingStats((data) => {
      setStats(data);
      setLoadingStats(false);
    });

    const unsubList = subscribeToAllRatings((list) => {
      setRatingsList(list);
      setLoadingList(false);
    });

    return () => {
      unsubStats();
      unsubList();
    };
  }, []);

  const handleToggleVisibility = async () => {
    const updated = !showRatingsSection;
    setShowRatingsSection(updated);
    setSavingConfig(true);
    setSaveSuccess(false);

    try {
      await onSaveSiteConfig({ showRatingsSection: updated });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('[DeveloperRatings] Save error:', err);
      setShowRatingsSection(!updated);
    } finally {
      setSavingConfig(false);
    }
  };

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
    <div className="space-y-6 text-white">
      {/* Header & Section Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/25">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg bg-[#0F4C5C]/20 border border-[#D4AF37] px-3 py-1 text-xs font-bold text-[#D4AF37] mb-1.5">
            <HeartHandshake className="h-3.5 w-3.5 text-[#D4AF37]" aria-hidden="true" />
            <span>لوحة تحكم إحصائيات التقييمات</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            إدارة تقييمات وآراء زوار الموقع
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            إحصائيات حقيقية وتحليلات تفصيلية مستندة إلى التقييمات الموثقة عبر معرّف المتصفح الفريد.
          </p>
        </div>

        {/* Section Visibility Switch */}
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>تم حفظ الإعداد</span>
            </span>
          )}

          <button
            type="button"
            disabled={savingConfig}
            onClick={handleToggleVisibility}
            className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-extrabold transition-colors cursor-pointer disabled:opacity-50 ${
              showRatingsSection
                ? 'bg-[#0F4C5C] hover:bg-[#0A3D4A] border-[#D4AF37] text-white'
                : 'bg-[#1A1A1A] hover:bg-[#252525] border-gray-700 text-gray-400'
            }`}
          >
            {savingConfig ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" />
            ) : showRatingsSection ? (
              <Eye className="h-4 w-4 text-[#D4AF37]" />
            ) : (
              <EyeOff className="h-4 w-4 text-gray-400" />
            )}
            <span>
              {showRatingsSection ? 'قسم التقييمات ظاهر بالمتجر' : 'قسم التقييمات مخفي من المتجر'}
            </span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Ratings */}
        <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/25 p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>إجمالي التقييمات</span>
            <MessageSquareHeart className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
            {s.totalCount.toLocaleString('ar-EG')}
          </p>
          <p className="text-xs text-gray-400">
            تقييمات فريدة عبر معرّف المتصفح (Browser ID).
          </p>
        </div>

        {/* Average Rating */}
        <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/25 p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>متوسط النجوم</span>
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#D4AF37] tabular-nums">
            {s.averageRating.toFixed(1)} / 5.0
          </p>
          <div className="flex items-center gap-1 text-amber-400 pt-0.5">
            {[1, 2, 3, 4, 5].map((idx) => (
              <Star
                key={idx}
                className={`h-3.5 w-3.5 ${
                  idx <= Math.round(s.averageRating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-gray-700'
                }`}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>

        {/* Recommenders % */}
        <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/25 p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>يرشحون الموقع</span>
            <ThumbsUp className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tabular-nums">
            {s.recommendYesPercent}%
          </p>
          <p className="text-xs text-gray-400 tabular-nums">
            {s.recommendYes.toLocaleString('ar-EG')} شخص من إجمالي {s.totalCount.toLocaleString('ar-EG')}
          </p>
        </div>

        {/* Non-recommenders % */}
        <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/25 p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>لا يرشحون الموقع</span>
            <ThumbsDown className="h-4 w-4 text-rose-400" aria-hidden="true" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-400 tabular-nums">
            {s.recommendNoPercent}%
          </p>
          <p className="text-xs text-gray-400 tabular-nums">
            {s.recommendNo.toLocaleString('ar-EG')} شخص
          </p>
        </div>
      </div>

      {/* Star Tier Distribution */}
      <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/25 p-5 space-y-4">
        <h3 className="text-base font-extrabold text-white flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[#D4AF37]" aria-hidden="true" />
          <span>توزيع تقييمات النجوم</span>
        </h3>

        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((starNum) => {
            const count = s.starCounts[starNum as 1 | 2 | 3 | 4 | 5] || 0;
            const pct = s.starPercentages[starNum as 1 | 2 | 3 | 4 | 5] || 0;
            return (
              <div key={starNum} className="flex items-center gap-3 text-xs sm:text-sm">
                <span className="font-num font-extrabold text-white w-14 shrink-0 flex items-center gap-1">
                  <span>{starNum}</span>
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" aria-hidden="true" />
                </span>

                <div className="flex-1 h-3 rounded-full bg-[#0B0B0B] border border-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#D4AF37] to-amber-300 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <span className="font-num text-xs font-bold text-gray-300 w-24 text-left shrink-0">
                  {count.toLocaleString('ar-EG')} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Individual Ratings Feed */}
      <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/25 p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <MessageSquareHeart className="h-5 w-5 text-[#D4AF37]" aria-hidden="true" />
            <span>آخر التقييمات المسجلة حديثًا</span>
          </h3>
          <span className="text-xs text-gray-400 font-bold">
            {ratingsList.length} تقييم في العرض
          </span>
        </div>

        {loadingList ? (
          <div className="flex items-center justify-center p-8 text-xs text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37] ml-2" />
            <span>جاري تحميل سجل التقييمات...</span>
          </div>
        ) : ratingsList.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">
            لا توجد تقييمات فردية مسجلة بعد.
          </p>
        ) : (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 no-scrollbar">
            {ratingsList.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#0B0B0B] border border-white/10 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((idx) => (
                      <Star
                        key={idx}
                        className={`h-3.5 w-3.5 ${
                          idx <= item.stars
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-700'
                        }`}
                        aria-hidden="true"
                      />
                    ))}
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[11px] ${
                      item.recommend
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                        : 'bg-rose-950/60 text-rose-400 border border-rose-800/50'
                    }`}
                  >
                    {item.recommend ? (
                      <>
                        <ThumbsUp className="h-3 w-3" />
                        <span>يرشّح</span>
                      </>
                    ) : (
                      <>
                        <ThumbsDown className="h-3 w-3" />
                        <span>لا يرشّح</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="text-left font-num text-[11px] text-gray-400">
                  <span className="font-mono text-gray-500">
                    ID: {item.id.slice(0, 12)}...
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
