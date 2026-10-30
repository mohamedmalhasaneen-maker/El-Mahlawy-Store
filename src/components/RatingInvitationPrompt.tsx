import { Sparkles, X } from 'lucide-react';
import { setRatingPromptDismissedInSession } from '../utils/activityTracker';

interface RatingInvitationPromptProps {
  isOpen: boolean;
  onOpenRatingModal: () => void;
  onClose: () => void;
}

export function RatingInvitationPrompt({
  isOpen,
  onOpenRatingModal,
  onClose,
}: RatingInvitationPromptProps) {
  if (!isOpen) return null;

  const handleLater = () => {
    setRatingPromptDismissedInSession();
    onClose();
  };

  const handleAccept = () => {
    onClose();
    onOpenRatingModal();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="دعوة لتقييم تجربة الموقع"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-sheet-up"
    >
      <div className="rounded-3xl bg-white dark:bg-[#0E264A] border-2 border-[#1D4ED8] dark:border-[#38BDF8] p-5 shadow-2xl text-[#0B1F3A] dark:text-[#F0F9FF] space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1D4ED8]/10 dark:bg-[#38BDF8]/15 text-[#1D4ED8] dark:text-[#38BDF8]">
              <Sparkles className="h-5 w-5 text-amber-400 animate-pulse-slow" aria-hidden="true" />
            </span>
            <h4 className="text-sm font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF] leading-snug">
              خلصت جولتك في الموقع؟ 😊
            </h4>
          </div>

          <button
            type="button"
            onClick={handleLater}
            aria-label="إغلاق التنبيه"
            className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-xl bg-[#F2FAFF] dark:bg-[#081830] text-slate-400 hover:text-[#0B1F3A] dark:hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
          يهمنا نعرف رأيك في تجربتك، تقييمك هيساعدنا نطوّر خدماتنا ونقدم لك تجربة أفضل.
        </p>

        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleAccept}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1D4ED8] hover:bg-[#1E40AF] active:scale-95 px-4 py-2.5 text-xs font-extrabold text-white shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="h-4 w-4 text-amber-300" aria-hidden="true" />
            <span>قيّم تجربتك</span>
          </button>

          <button
            type="button"
            onClick={handleLater}
            className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-[#F2FAFF] dark:bg-[#081830] hover:bg-[#E2F3FE] dark:hover:bg-[#153666] border border-[#CBE7FA] dark:border-[#1E3F73] px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            <span>لاحقًا</span>
          </button>
        </div>
      </div>
    </div>
  );
}
