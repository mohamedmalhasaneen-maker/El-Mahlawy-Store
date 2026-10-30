import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  HeartHandshake,
  Loader2,
  Sparkles,
  Star,
  ThumbsDown,
  ThumbsUp,
  X,
} from 'lucide-react';
import {
  checkDeviceRatingStatus,
  submitVisitorRating,
} from '../utils/ratingSystem';
import { RatingStatsDisplay } from './RatingStatsDisplay';

interface RatingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RatingFormModal({ isOpen, onClose }: RatingFormModalProps) {
  const [stars, setStars] = useState<number>(0);
  const [hoverStars, setHoverStars] = useState<number>(0);
  const [recommend, setRecommend] = useState<boolean | null>(null);

  const [checkingStatus, setCheckingStatus] = useState<boolean>(true);
  const [alreadyRated, setAlreadyRated] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setCheckingStatus(true);
    setErrorMessage(null);

    checkDeviceRatingStatus().then(({ hasRated }) => {
      if (isMounted) {
        setAlreadyRated(hasRated);
        setCheckingStatus(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stars < 1 || recommend === null || submitting) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await submitVisitorRating(stars, recommend);
      if (res.alreadyRated) {
        setAlreadyRated(true);
      } else if (res.success) {
        setSubmittedSuccess(true);
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'تعذر إرسال التقييم حاليًا؛ يرجى التحقق من الاتصال بالإنترنت والمحاولة مجددًا.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = stars >= 1 && recommend !== null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="نموذج تقييم تجربة الموقع"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#081A33]/70 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl bg-white dark:bg-[#0E264A] border border-[#CBE7FA] dark:border-[#1E3F73] p-5 sm:p-7 shadow-2xl overflow-y-auto space-y-6 text-[#0B1F3A] dark:text-[#F0F9FF] transition-colors my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#E8F4FD] dark:border-[#1E3F73]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#1D4ED8]/10 dark:bg-[#38BDF8]/15 text-[#1D4ED8] dark:text-[#38BDF8]">
              <HeartHandshake className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF]">
                تقييم تجربة زوار موقع المحلاوي ستور
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-300">
                رأيك يساهم بشكل مباشر في تطوير خدماتنا وتوفير تجربة أفضل لكل الزوار.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-[#F2FAFF] dark:bg-[#081830] text-slate-500 hover:text-[#0B1F3A] dark:hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {checkingStatus ? (
          <div className="flex items-center justify-center py-10 text-xs text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin text-[#38BDF8] ml-2" />
            <span>جاري التحقق من حالة التقييم...</span>
          </div>
        ) : alreadyRated ? (
          /* Already Rated State */
          <div className="rounded-2xl bg-[#F2FAFF] dark:bg-[#081830] border border-[#CBE7FA] dark:border-[#1E3F73] p-6 text-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto">
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <h4 className="text-base sm:text-lg font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF]">
              شكرًا ليك ❤️ إنت قيّمت الموقع بالفعل، رأيك وصلنا.
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
              نحن نعتمد على معرّف المتصفح لضمان نزاهة وشفافية الإحصائيات ودقتها لجميع الزوار.
            </p>
          </div>
        ) : submittedSuccess ? (
          /* Successfully Submitted State */
          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-6 text-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white mx-auto shadow-md">
              <Sparkles className="h-6 w-6" aria-hidden="true" />
            </div>
            <h4 className="text-base sm:text-lg font-extrabold text-emerald-800 dark:text-emerald-300">
              تم إرسال تقييمك بنجاح! ❤️
            </h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 max-w-md mx-auto leading-relaxed">
              شكراً جزيلاً لوقتك ومشاركتك المفيدة؛ تم تحديث الإحصائيات العامة للمتجر فوراً.
            </p>
          </div>
        ) : (
          /* Interactive Rating Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMessage && (
              <div className="rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 p-3 text-xs font-bold text-rose-700 dark:text-rose-300">
                {errorMessage}
              </div>
            )}

            {/* Question 1: 5 Interactive Stars */}
            <div className="space-y-2.5">
              <label className="block text-sm font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF]">
                السؤال الأول: قيّم تجربتك مع الموقع
              </label>

              <div className="flex items-center gap-2 py-1 dir-ltr">
                {[1, 2, 3, 4, 5].map((starIdx) => {
                  const active = starIdx <= (hoverStars || stars);
                  return (
                    <button
                      key={starIdx}
                      type="button"
                      onClick={() => setStars(starIdx)}
                      onMouseEnter={() => setHoverStars(starIdx)}
                      onMouseLeave={() => setHoverStars(0)}
                      aria-label={`تقييم ${starIdx} من 5`}
                      className="p-1.5 rounded-xl hover:bg-[#F2FAFF] dark:hover:bg-[#081830] transition-transform active:scale-125 cursor-pointer focus:outline-2 focus:outline-[#1D4ED8]"
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          active
                            ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  );
                })}
              </div>

              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 h-4">
                {stars === 1 && '⭐ سيء - نحتاج إلى تحسين كبير'}
                {stars === 2 && '⭐⭐ مقبول - هناك ملاحظات للتحسين'}
                {stars === 3 && '⭐⭐⭐ جيد - تجربة مناسبة'}
                {stars === 4 && '⭐⭐⭐⭐ ممتاز - تجربة رائعة وجيدة'}
                {stars === 5 && '⭐⭐⭐⭐⭐ استثنائي - ممتاز جدًا وفي المستوى المطلوب!'}
              </p>
            </div>

            {/* Question 2: Recommend Choice */}
            <div className="space-y-2.5">
              <label className="block text-sm font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF]">
                السؤال الثاني: هل ترشّح موقعنا لأصدقائك؟
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRecommend(true)}
                  className={`flex min-h-[50px] items-center justify-center gap-2.5 rounded-2xl border-2 px-4 py-3 text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                    recommend === true
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-sm scale-[1.02]'
                      : 'bg-[#F2FAFF] dark:bg-[#081830] border-[#CBE7FA] dark:border-[#1E3F73] text-[#0B1F3A] dark:text-[#F0F9FF] hover:bg-white dark:hover:bg-[#0E264A]'
                  }`}
                >
                  <ThumbsUp className="h-4.5 w-4.5 text-emerald-500" aria-hidden="true" />
                  <span>👍 أيوه، أرشّح الموقع</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRecommend(false)}
                  className={`flex min-h-[50px] items-center justify-center gap-2.5 rounded-2xl border-2 px-4 py-3 text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                    recommend === false
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-800 dark:text-rose-300 shadow-sm scale-[1.02]'
                      : 'bg-[#F2FAFF] dark:bg-[#081830] border-[#CBE7FA] dark:border-[#1E3F73] text-[#0B1F3A] dark:text-[#F0F9FF] hover:bg-white dark:hover:bg-[#0E264A]'
                  }`}
                >
                  <ThumbsDown className="h-4.5 w-4.5 text-rose-500" aria-hidden="true" />
                  <span>👎 لا، مش هأرشّحه</span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!isFormValid || submitting}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:bg-slate-300 dark:disabled:bg-slate-700 active:scale-[0.99] px-5 py-3 text-xs sm:text-sm font-extrabold text-white shadow-md transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>جاري إرسال التقييم...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-300" aria-hidden="true" />
                    <span>إرسال التقييم</span>
                  </>
                )}
              </button>
              {!isFormValid && (
                <p className="text-[11px] font-bold text-slate-400 text-center mt-2">
                  يرجى تحديد عدد النجوم واختيار الإجابة عن التوصية لتفعيل زر الإرسال.
                </p>
              )}
            </div>
          </form>
        )}

        {/* Embedded Public Rating Stats */}
        <RatingStatsDisplay onOpenRatingModal={() => {}} compact />
      </div>
    </div>
  );
}
