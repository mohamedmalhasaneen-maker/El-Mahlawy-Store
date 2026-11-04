import { useEffect, useState } from 'react';
import {
  BarChart3,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  HeartHandshake,
  Loader2,
  MessageSquareHeart,
  Star,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from 'lucide-react';
import { SiteConfig } from '../../utils/siteConfig';
import {
  RatingDoc,
  RatingStats,
  SiteReviewDoc,
  deleteSiteReview,
  subscribeToAllRatings,
  subscribeToAllSiteReviews,
  subscribeToRatingStats,
  updateReviewStatus,
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
  const [siteReviews, setSiteReviews] = useState<SiteReviewDoc[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const [showRatingsSection, setShowRatingsSection] = useState<boolean>(
    siteConfig.showRatingsSection !== false
  );
  const [savingConfig, setSavingConfig] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

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

    const unsubReviews = subscribeToAllSiteReviews((list) => {
      setSiteReviews(list);
      setLoadingReviews(false);
    });

    return () => {
      unsubStats();
      unsubList();
      unsubReviews();
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

  const handleApprove = async (id: string) => {
    try {
      setActionMessage(null);
      await updateReviewStatus(id, 'approved');
      setActionMessage('تمت الموافقة على التعليق وعرضه بنجاح.');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      setActionMessage('تعذر تحديث حالة التعليق.');
    }
  };

  const handleReject = async (id: string) => {
    try {
      setActionMessage(null);
      await updateReviewStatus(id, 'rejected');
      setActionMessage('تم رفض التعليق.');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      setActionMessage('تعذر تحديث حالة التعليق.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التعليق نهائياً؟')) return;
    try {
      setActionMessage(null);
      await deleteSiteReview(id);
      setActionMessage('تم حذف التعليق بنجاح.');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      setActionMessage('تعذر حذف التعليق.');
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

  // Calculate true average from approved reviews only
  const approvedReviews = siteReviews.filter((r) => r.status === 'approved');
  const approvedStarsSum = approvedReviews.reduce((sum, r) => sum + r.stars, 0);
  const trueApprovedAverage = approvedReviews.length > 0 ? (approvedStarsSum / approvedReviews.length).toFixed(1) : s.averageRating.toFixed(1);

  return (
    <div className="space-y-6 text-white">
      {/* Header & Section Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/25">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg bg-[#0F4C5C]/20 border border-[#D4AF37] px-3 py-1 text-xs font-bold text-[#D4AF37] mb-1.5">
            <HeartHandshake className="h-3.5 w-3.5 text-[#D4AF37]" aria-hidden="true" />
            <span>لوحة تحكم إحصائيات التقييمات والتعليقات</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            إدارة تعليقات وتقييمات زوار الموقع
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            مراجعة التعليقات الجديدة، الموافقة عليها، أو رفضها لضمان جودة المحتوى المعروض للزوار.
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

      {actionMessage && (
        <div className="rounded-xl bg-[#0F4C5C]/30 border border-[#D4AF37]/50 p-3 text-xs font-bold text-[#D4AF37]">
          {actionMessage}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Ratings */}
        <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/25 p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>إجمالي التقييمات السريعة</span>
            <MessageSquareHeart className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
            {s.totalCount.toLocaleString('ar-EG')}
          </p>
          <p className="text-xs text-gray-400">
            تقييمات المتصفح الفريدة في النظام.
          </p>
        </div>

        {/* Average Rating */}
        <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/25 p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>متوسط التقييم المعتمد</span>
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#D4AF37] tabular-nums">
            {trueApprovedAverage} / 5.0
          </p>
          <p className="text-xs text-gray-400">
            {approvedReviews.length} تعليق معتمد للمتجر.
          </p>
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
            {s.recommendYes.toLocaleString('ar-EG')} شخص
          </p>
        </div>

        {/* Pending Reviews Count */}
        <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/25 p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>تعليقات بانتظار المراجعة</span>
            <Clock className="h-4 w-4 text-amber-400" aria-hidden="true" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-400 tabular-nums">
            {siteReviews.filter((r) => r.status === 'pending').length}
          </p>
          <p className="text-xs text-gray-400">
            تعليقات جديدة لم تُعتمد بعد.
          </p>
        </div>
      </div>

      {/* Visitor Comments & Moderation Section */}
      <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/25 p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <MessageSquareHeart className="h-5 w-5 text-[#D4AF37]" aria-hidden="true" />
            <span>إدارة تعليقات الزوار (مراجعة واعتماد)</span>
          </h3>
          <span className="text-xs text-gray-400 font-bold">
            إجمالي {siteReviews.length} تعليق مسجل
          </span>
        </div>

        {loadingReviews ? (
          <div className="flex items-center justify-center p-8 text-xs text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37] ml-2" />
            <span>جاري تحميل التعليقات...</span>
          </div>
        ) : siteReviews.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">
            لا توجد تعليقات مرسلة من الزوار حتى الآن.
          </p>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {siteReviews.map((rev) => (
              <div
                key={rev.id}
                className="rounded-xl bg-[#0B0B0B] border border-white/10 p-4 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1D4ED8] text-white font-bold text-xs">
                      {rev.name ? rev.name.slice(0, 1) : 'ز'}
                    </span>
                    <div>
                      <h4 className="text-sm font-extrabold text-white">{rev.name}</h4>
                      <span className="text-[10px] text-gray-400">
                        {rev.createdAt?.toDate ? new Date(rev.createdAt.toDate()).toLocaleString('ar-EG') : 'قيد المعالجة'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        rev.status === 'approved'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                          : rev.status === 'rejected'
                          ? 'bg-rose-950/60 text-rose-400 border border-rose-800'
                          : 'bg-amber-950/60 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {rev.status === 'approved' ? 'معتمد ومنشور' : rev.status === 'rejected' ? 'مرفوض' : 'بانتظار الموافقة'}
                    </span>

                    {/* Star Rating */}
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[1, 2, 3, 4, 5].map((sIdx) => (
                        <Star
                          key={sIdx}
                          className={`h-3 w-3 ${
                            sIdx <= rev.stars ? 'fill-amber-400 text-amber-400' : 'text-gray-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-gray-200 leading-relaxed bg-white/5 p-3 rounded-lg">
                  «{rev.comment}»
                </p>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                  <span className={rev.recommend ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {rev.recommend ? '👍 يرشح المتجر' : '👎 لا يرشح المتجر'}
                  </span>

                  <div className="flex items-center gap-2">
                    {rev.status !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => handleApprove(rev.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 font-bold transition-colors cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>موافقة ونشر</span>
                      </button>
                    )}

                    {rev.status !== 'rejected' && (
                      <button
                        type="button"
                        onClick={() => handleReject(rev.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 font-bold transition-colors cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>رفض</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(rev.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 font-bold transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
