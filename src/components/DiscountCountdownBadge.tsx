import { useEffect, useState } from 'react';
import { Clock, Flame } from 'lucide-react';
import { Product } from '../types/store';
import {
  calculateDiscountPercent,
  getEffectiveProductPrice,
  isDiscountActive,
  parseDiscountDateToMs,
} from '../utils/catalogLogic';

interface DiscountCountdownBadgeProps {
  product: Product;
  className?: string;
  variant?: 'card' | 'banner' | 'detail' | 'compact';
  showDiscountPercent?: boolean;
}

export function DiscountCountdownBadge({
  product,
  className = '',
  variant = 'card',
  showDiscountPercent = true,
}: DiscountCountdownBadgeProps) {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    // Update every 1 second for active countdown
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const active = isDiscountActive(product, now);
  const endDateStr = (product.discountEndDate || '').trim();

  if (!active) return null;

  const effectivePrice = getEffectiveProductPrice(product, now);
  const discountPct = calculateDiscountPercent(product.originalPrice, effectivePrice);

  const endMs = parseDiscountDateToMs(endDateStr, 'end');

  // If discount has no valid end date, render standard discount percentage badge
  if (!endDateStr || endMs === null) {
    if (!showDiscountPercent) return null;
    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#0284C7] text-white px-2.5 py-1 text-xs font-extrabold shadow-md border border-white/20 backdrop-blur-md ${className}`}
      >
        <Flame className="h-3.5 w-3.5 text-amber-300 shrink-0" aria-hidden="true" />
        <span>خصم <bdi className="font-num">{discountPct}%</bdi></span>
      </div>
    );
  }

  const remainingMs = endMs - now.getTime();

  // If expired right now, don't render countdown
  if (remainingMs <= 0) {
    return null;
  }

  const totalSecs = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSecs / (3600 * 24));
  const hours = Math.floor((totalSecs % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  const isUrgent = remainingMs < 24 * 3600 * 1000; // Less than 24 hours
  const isSuperUrgent = remainingMs < 3600 * 1000; // Less than 1 hour

  const pad = (n: number) => String(n).padStart(2, '0');

  // Variant: COMPACT (for mobile grid cards)
  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex flex-col gap-0.5 rounded-xl px-2 py-1 text-[10px] font-extrabold border shadow-sm backdrop-blur-md transition-all ${
          isUrgent
            ? 'bg-gradient-to-r from-amber-950/90 via-rose-950/90 to-red-900/90 text-amber-200 border-amber-500/50'
            : 'bg-[#0B2354]/90 text-white border-white/25'
        } ${className}`}
      >
        {showDiscountPercent && (
          <div className="flex items-center justify-between gap-1 text-[10px] font-black border-b border-white/15 pb-0.5">
            <span className="inline-flex items-center gap-0.5 text-amber-300">
              <Flame className="h-3 w-3 text-amber-400" />
              <span>-{discountPct}%</span>
            </span>
            <span className="text-[9px] text-slate-200">ينتهي خلال:</span>
          </div>
        )}
        <div className="font-num font-extrabold flex items-center justify-center gap-0.5 dir-ltr tracking-tight text-[10.5px]">
          {days > 0 && <span>{pad(days)}ي : </span>}
          <span>{pad(hours)}س : </span>
          <span>{pad(minutes)}د : </span>
          <span className="text-amber-300">{pad(seconds)}ث</span>
        </div>
      </div>
    );
  }

  // Variant: DETAIL / BANNER (for product detail modal, sheet, and spotlight carousel)
  if (variant === 'detail' || variant === 'banner') {
    return (
      <div
        className={`rounded-2xl p-3.5 sm:p-4 border backdrop-blur-xl shadow-xl transition-all ${
          isSuperUrgent
            ? 'bg-gradient-to-r from-red-950/90 via-rose-900/90 to-amber-950/90 border-rose-500/60 text-white shadow-rose-900/30 ring-1 ring-rose-500/30'
            : isUrgent
              ? 'bg-gradient-to-r from-amber-950/90 via-orange-950/90 to-[#0B2354]/90 border-amber-500/50 text-white'
              : 'bg-gradient-to-r from-[#0B2354]/95 via-[#0E264A]/95 to-[#0B2354]/95 border-white/20 text-white'
        } ${className}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/40">
              <Flame className="h-4 w-4 text-amber-400 animate-pulse" aria-hidden="true" />
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-white">
              🔥 خصم مفعّل <bdi className="font-num text-amber-300">{discountPct}%</bdi>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#BAE6FD]">
            <Clock className="h-3.5 w-3.5 text-[#38BDF8]" aria-hidden="true" />
            <span>
              {isSuperUrgent
                ? '⚡ تنبيه: ينتهي الخصم قريباً جداً!'
                : isUrgent
                  ? '⏳ ينتهي الخصم اليوم:'
                  : 'ينتهي العرض خلال:'}
            </span>
          </div>
        </div>

        {/* Dynamic Days / Hours / Minutes / Seconds Grid */}
        <div className="grid grid-cols-4 gap-2 pt-2.5 text-center dir-ltr">
          <div className="rounded-xl bg-black/40 border border-white/10 p-1.5 sm:p-2">
            <span className="font-num text-base sm:text-lg font-black text-white block">
              {pad(days)}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-300 block">أيام</span>
          </div>
          <div className="rounded-xl bg-black/40 border border-white/10 p-1.5 sm:p-2">
            <span className="font-num text-base sm:text-lg font-black text-white block">
              {pad(hours)}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-300 block">ساعات</span>
          </div>
          <div className="rounded-xl bg-black/40 border border-white/10 p-1.5 sm:p-2">
            <span className="font-num text-base sm:text-lg font-black text-white block">
              {pad(minutes)}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-300 block">دقائق</span>
          </div>
          <div className="rounded-xl bg-black/40 border border-amber-400/40 p-1.5 sm:p-2 bg-amber-500/10">
            <span className="font-num text-base sm:text-lg font-black text-amber-300 block animate-pulse">
              {pad(seconds)}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-amber-200 block">ثواني</span>
          </div>
        </div>
      </div>
    );
  }

  // Default Variant: CARD (for standard desktop & mobile product cards)
  return (
    <div
      className={`rounded-xl p-2 sm:p-2.5 border backdrop-blur-md shadow-lg transition-all ${
        isUrgent
          ? 'bg-gradient-to-r from-amber-950/95 via-rose-950/95 to-red-950/95 border-amber-500/50 text-white'
          : 'bg-[#0B2354]/90 border-white/25 text-white'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-1.5 text-[11px] font-bold border-b border-white/15 pb-1 mb-1">
        <span className="inline-flex items-center gap-1 text-white">
          <Flame className="h-3.5 w-3.5 text-amber-400 shrink-0" aria-hidden="true" />
          <span>خصم <bdi className="font-num text-amber-300">{discountPct}%</bdi></span>
        </span>
        <span className="text-[10px] text-slate-300 font-medium">ينتهي خلال:</span>
      </div>

      <div className="font-num text-xs font-black flex items-center justify-center gap-1 dir-ltr tracking-tight text-white">
        {days > 0 && (
          <>
            <span className="bg-black/30 px-1.5 py-0.5 rounded border border-white/10">
              {pad(days)} يوم
            </span>
            <span>:</span>
          </>
        )}
        <span className="bg-black/30 px-1.5 py-0.5 rounded border border-white/10">
          {pad(hours)} ساعة
        </span>
        <span>:</span>
        <span className="bg-black/30 px-1.5 py-0.5 rounded border border-white/10">
          {pad(minutes)} دقيقة
        </span>
        <span>:</span>
        <span className="bg-black/30 px-1.5 py-0.5 rounded border border-amber-400/30 text-amber-300 font-bold">
          {pad(seconds)} ثانية
        </span>
      </div>
    </div>
  );
}
