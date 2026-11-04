import { useEffect, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Loader2,
  MessageSquareHeart,
  Send,
  Sparkles,
  Star,
  ThumbsDown,
  ThumbsUp,
  User,
} from 'lucide-react';
import {
  RatingStats,
  SiteReviewDoc,
  subscribeToApprovedSiteReviews,
  subscribeToRatingStats,
  submitSiteReview,
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
  const [reviews, setReviews] = useState<SiteReviewDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // New Review Submission Form State
  const [formName, setFormName] = useState('');
  const [formComment, setFormComment] = useState('');
  const [formStars, setFormStars] = useState(5);
  const [formHoverStars, setFormHoverStars] = useState(0);
  const [formRecommend, setFormRecommend] = useState<boolean>(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState<string | null>(null);
  const [reviewErrorMessage, setReviewErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubStats = subscribeToRatingStats((data) => {
      setStats(data);
      setLoading(false);
    });

    const unsubReviews = subscribeToApprovedSiteReviews((list) => {
      setReviews(list);
    });

    return () => {
      unsubStats();
      unsubReviews();
    };
  }, []);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingReview) return;

    setReviewErrorMessage(null);
    setReviewSuccessMessage(null);

    try {
      setSubmittingReview(true);
      const res = await submitSiteReview(formName, formComment, formStars, formRecommend);
      if (res.success) {
        setReviewSuccessMessage(res.message);
        setFormName('');
        setFormComment('');
        setFormStars(5);
        setFormRecommend(true);
      }
    } catch (err: any) {
      setReviewErrorMessage(
        err?.message || 'تعذر إرسال التعليق حاليًا؛ يرجى التحقق من الاتصال والمحاولة مجددًا.'
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-xs text-slate-300">
        <Loader2 className="h-6 w-6 animate-spin text-[#38BDF8] ml-2.5" />
        <span>جاري تحميل آراء وتقييمات عملائنا...</span>
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

  // Calculate true average from approved reviews if available, or combine
  const approvedReviewsCount = reviews.length;
  const approvedStarsSum = reviews.reduce((acc, r) => acc + r.stars, 0);
  const effectiveAverage =
    approvedReviewsCount > 0
      ? Number((approvedStarsSum / approvedReviewsCount).toFixed(1))
      : s.averageRating;
  const effectiveTotal = Math.max(s.totalCount, approvedReviewsCount);

  return (
    <div
      className={`mx-auto max-w-6xl rounded-3xl backdrop-blur-2xl ${
        isDark
          ? 'bg-[#0E264A]/70 text-white border-white/15'
          : 'bg-[#0B2354]/85 text-white border-white/20'
      } border shadow-[0_16px_48px_0_rgba(0,0,0,0.45)] p-6 sm:p-10 space-y-10 transition-colors ${className}`}
    >
      {/* 1. Header Banner (Straight Horizontal Bar from Right to Left without curves or waves) */}
      <div className="rounded-none bg-gradient-to-l from-[#081830] via-[#0F3057] to-[#081830] border-y border-white/25 px-5 sm:px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-inner">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1 text-xs font-extrabold text-[#7DD3FC] border border-white/15">
            <MessageSquareHeart className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
            <span>آراء وتقييمات عملائنا</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            آراء وتقييمات عملائنا 🌟
          </h3>
          <p className="text-xs sm:text-sm text-[#BAE6FD]/90 max-w-2xl leading-relaxed">
            رأيكم هو أساس تطوير تجربتنا وتقديم أفضل خدمة لجميع عملائنا في شرم الشيخ ومصر.
          </p>
        </div>

        {/* Rating Prominent Display & Action */}
        <div className="flex items-center gap-4 shrink-0 bg-white/10 border border-white/15 rounded-2xl px-5 py-3 backdrop-blur-md">
          <div className="text-left">
            <div className="flex items-baseline gap-1.5">
              <span className="font-num text-3xl font-extrabold text-[#38BDF8]">
                {effectiveAverage > 0 ? effectiveAverage.toFixed(1) : '5.0'}
              </span>
              <span className="text-xs text-slate-300 font-bold">من 5</span>
            </div>
            <div className="flex items-center gap-0.5 text-amber-400 mt-0.5">
              {[1, 2, 3, 4, 5].map((starIdx) => (
                <Star
                  key={starIdx}
                  className={`h-3.5 w-3.5 ${
                    starIdx <= Math.round(effectiveAverage || 5)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-600'
                  }`}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>

          <div className="h-10 w-px bg-white/20 mx-1" />

          {onOpenRatingModal && (
            <button
              type="button"
              onClick={onOpenRatingModal}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-white hover:bg-[#F0F9FF] text-[#0B1F3A] active:scale-95 px-4 py-2 text-xs font-extrabold shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="h-4 w-4 text-[#1D4ED8]" aria-hidden="true" />
              <span>قيّم تجربتك</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Statistics Card & Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Star Breakdown Bars (Glassmorphism) */}
        <div className="lg:col-span-6 rounded-2xl bg-white/10 dark:bg-white/5 border border-white/20 p-6 flex flex-col justify-between gap-5 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/15">
            <h4 className="text-base font-extrabold text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#38BDF8]" aria-hidden="true" />
              <span>تحليل توزيع التقييمات</span>
            </h4>
            <span className="text-xs font-bold text-[#BAE6FD]">
              {effectiveTotal.toLocaleString('ar-EG')} تقييم معتمد
            </span>
          </div>

          {/* Star Breakdown Bars */}
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((starNum) => {
              const count = s.starCounts[starNum as 1 | 2 | 3 | 4 | 5] || 0;
              const pct = s.starPercentages[starNum as 1 | 2 | 3 | 4 | 5] || 0;
              return (
                <div key={starNum} className="flex items-center gap-3 text-xs">
                  <span className="font-num font-extrabold text-white w-12 shrink-0 flex items-center gap-1">
                    <span>{starNum}</span>
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" aria-hidden="true" />
                  </span>

                  <div className="flex-1 h-3 rounded-full bg-black/40 border border-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full transition-all duration-700 shadow-sm"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <span className="font-num text-xs font-bold text-slate-200 w-24 text-left shrink-0">
                    {count.toLocaleString('ar-EG')} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Recommendation Percentage Card (Glassmorphism) */}
        <div className="lg:col-span-6 rounded-2xl bg-white/10 dark:bg-white/5 border border-white/20 p-6 flex flex-col justify-between gap-5 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/15">
            <h4 className="text-base font-extrabold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-400" aria-hidden="true" />
              <span>معدل رضا وتوصية العملاء</span>
            </h4>
            <span className="text-xs font-bold text-emerald-400">
              {s.recommendYesPercent}% يوصون بالمتجر
            </span>
          </div>

          <div className="space-y-4 my-auto">
            {/* Recommenders: Yes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-white">
                <span className="inline-flex items-center gap-1.5 text-emerald-300">
                  <ThumbsUp className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>يرشحون المحلاوي ستور لأصدقائهم</span>
                </span>
                <span className="font-num font-extrabold text-emerald-300">
                  {s.recommendYes.toLocaleString('ar-EG')} ({s.recommendYesPercent}%)
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-black/40 border border-white/10 overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-700 shadow-sm"
                  style={{ width: `${s.recommendYesPercent}%` }}
                />
              </div>
            </div>

            {/* Non-recommenders: No */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-white">
                <span className="inline-flex items-center gap-1.5 text-rose-300">
                  <ThumbsDown className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>بحاجة لتحسين وتطوير إضافي</span>
                </span>
                <span className="font-num font-extrabold text-slate-300">
                  {s.recommendNo.toLocaleString('ar-EG')} ({s.recommendNoPercent}%)
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-black/40 border border-white/10 overflow-hidden">
                <div
                  className="h-full bg-slate-500 rounded-full transition-all duration-700 shadow-sm"
                  style={{ width: `${s.recommendNoPercent}%` }}
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-300 pt-3 border-t border-white/15 leading-relaxed font-medium">
            تعتمد هذه المؤشرات على تجارب العملاء الحقيقية لضمان الشفافية والمصداقية المطلقة لزوارنا.
          </p>
        </div>
      </div>

      {/* 3. Visitor Reviews Cards (Glassmorphism Cards Grid) */}
      <div className="space-y-6 pt-2">
        <div className="flex items-center justify-between pb-3 border-b border-white/15">
          <h4 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#38BDF8]/20 text-[#38BDF8]">
              💬
            </span>
            <span>آراء وتجارب العملاء المعتمدة</span>
          </h4>
          <span className="text-xs font-bold text-[#BAE6FD]">
            {reviews.length} تعليق منشور
          </span>
        </div>

        {reviews.length === 0 ? (
          <div className="rounded-2xl bg-white/5 border border-white/15 p-8 text-center text-xs sm:text-sm text-slate-300 backdrop-blur-md">
            لا توجد تعليقات معتمدة معروضة حالياً. كن أول من يشاركنا رأيه وت تجربتك في النموذج أدناه! ✨
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="rounded-2xl bg-white/10 dark:bg-white/5 border border-white/20 p-6 space-y-4 shadow-2xl backdrop-blur-xl flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:border-white/40"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1D4ED8] to-[#0284C7] text-white font-extrabold text-sm shadow-lg border border-white/20">
                        <User className="h-5 w-5 text-white" aria-hidden="true" />
                      </span>
                      <div>
                        <h5 className="text-sm font-extrabold text-white tracking-wide">
                          {rev.name}
                        </h5>
                        <span className="text-[11px] text-slate-300 font-medium">
                          {rev.createdAt?.toDate ? new Date(rev.createdAt.toDate()).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }) : 'حديثاً'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 text-amber-400 bg-black/30 px-2 py-1 rounded-xl border border-white/10">
                      {[1, 2, 3, 4, 5].map((sIdx) => (
                        <Star
                          key={sIdx}
                          className={`h-3.5 w-3.5 ${
                            sIdx <= rev.stars ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-[#F0F9FF] leading-relaxed font-medium bg-black/20 p-3.5 rounded-xl border border-white/10">
                    «{rev.comment}»
                  </p>
                </div>

                <div className="pt-3 border-t border-white/15 flex items-center justify-between text-xs">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold text-xs ${
                      rev.recommend
                        ? 'bg-emerald-950/75 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-950/75 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {rev.recommend ? '👍 يوصي بالمتجر' : '👎 لا يوصي'}
                  </span>
                  <span className="text-slate-400 text-[11px] font-bold">عميل معتمد للمحلاوي ستور</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Independent Glassmorphism Review Submission Card («قيّم تجربتك معنا» / «شاركنا رأيك في المحلاوي ستور») */}
      <div className="rounded-3xl bg-gradient-to-b from-[#081830]/90 to-[#0B2354]/90 dark:from-[#071326]/90 dark:to-[#0A192F]/90 border border-white/25 p-7 sm:p-9 space-y-6 shadow-[0_16px_48px_0_rgba(0,0,0,0.5)] backdrop-blur-2xl">
        <div className="space-y-2 border-b border-white/15 pb-5">
          <div className="inline-flex items-center gap-2 rounded-lg bg-[#38BDF8]/15 px-3 py-1 text-xs font-extrabold text-[#38BDF8] border border-[#38BDF8]/30">
            <Sparkles className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
            <span>نرحب برأيك ومشاركتك</span>
          </div>
          <h4 className="text-xl sm:text-2xl font-extrabold text-white">
            قيّم تجربتك معنا 💬
          </h4>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            شاركنا تقييمك وانطباعك حول جودة المنتجات، سرعة التوصيل، أو الدعم الفني. رأيك يهمنا ويساعدنا دائماً في الارتقاء بخدماتنا.
          </p>
        </div>

        {reviewSuccessMessage ? (
          <div className="rounded-2xl bg-emerald-950/80 border border-emerald-500/50 p-6 text-center space-y-3 shadow-xl backdrop-blur-md">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" aria-hidden="true" />
            <h5 className="text-base font-extrabold text-emerald-300">تم إرسال تعليقك بنجاح! ❤️</h5>
            <p className="text-xs sm:text-sm text-emerald-200 leading-relaxed max-w-lg mx-auto">
              {reviewSuccessMessage}
            </p>
            <button
              type="button"
              onClick={() => setReviewSuccessMessage(null)}
              className="mt-2 inline-flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 text-xs font-extrabold transition-colors cursor-pointer shadow-md"
            >
              إضافة تقييم أو تعليق آخر
            </button>
          </div>
        ) : (
          <form onSubmit={handleReviewSubmit} className="space-y-5">
            {reviewErrorMessage && (
              <div className="rounded-xl bg-rose-950/80 border border-rose-500/60 p-3.5 text-xs font-bold text-rose-300 shadow-md">
                {reviewErrorMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Name Input */}
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-extrabold text-[#BAE6FD]">
                  الاسم أو الاسم المستعار <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: أحمد محمود (شرم الشيخ)"
                  className="w-full rounded-2xl bg-white/10 border border-white/20 px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-400 focus:border-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]/30 focus:outline-hidden transition-all shadow-inner"
                />
              </div>

              {/* Star Rating Select */}
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-extrabold text-[#BAE6FD]">
                  قيّم تجربتك بالنجوم <span className="text-rose-400">*</span>
                </label>
                <div className="flex items-center gap-2 py-2 dir-ltr justify-start sm:justify-end">
                  {[1, 2, 3, 4, 5].map((starIdx) => {
                    const active = starIdx <= (formHoverStars || formStars);
                    return (
                      <button
                        key={starIdx}
                        type="button"
                        onClick={() => setFormStars(starIdx)}
                        onMouseEnter={() => setFormHoverStars(starIdx)}
                        onMouseLeave={() => setFormHoverStars(0)}
                        aria-label={`تقييم ${starIdx} من 5`}
                        className="p-1 rounded-xl hover:bg-white/15 transition-transform active:scale-125 cursor-pointer"
                      >
                        <Star
                          className={`h-7 w-7 transition-colors ${
                            active
                              ? 'fill-amber-400 text-amber-400 drop-shadow-md'
                              : 'text-slate-500'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Comment Input */}
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-extrabold text-[#BAE6FD]">
                تعليقك أو تجربتك مع المنتجات والخدمة <span className="text-rose-400">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={formComment}
                onChange={(e) => setFormComment(e.target.value)}
                placeholder="اكتب انطباعك عن جودة المنتجات، المعاملة، أو التوصيل..."
                className="w-full rounded-2xl bg-white/10 border border-white/20 p-4 text-xs sm:text-sm text-white placeholder-slate-400 focus:border-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]/30 focus:outline-hidden transition-all shadow-inner resize-none"
              />
            </div>

            {/* Recommendation Checkbox */}
            <div className="flex items-center gap-3 pt-1">
              <input
                type="checkbox"
                id="form-recommend-checkbox"
                checked={formRecommend}
                onChange={(e) => setFormRecommend(e.target.checked)}
                className="h-4.5 w-4.5 rounded-md border-white/30 bg-white/10 text-[#1D4ED8] focus:ring-0 cursor-pointer"
              />
              <label htmlFor="form-recommend-checkbox" className="text-xs sm:text-sm font-bold text-slate-200 cursor-pointer">
                👍 أرشح موقع المحلاوي ستور للأصدقاء والمعارف بكل ثقة
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={submittingReview}
                className="inline-flex min-h-[50px] w-full sm:w-auto items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#1D4ED8] to-[#0284C7] hover:from-[#1E40AF] hover:to-[#0369A1] active:scale-95 px-8 py-3 text-xs sm:text-sm font-extrabold text-white shadow-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {submittingReview ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>جاري إرسال التعليق للمراجعة...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 text-amber-300" aria-hidden="true" />
                    <span>إرسال التعليق والتقييم</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
