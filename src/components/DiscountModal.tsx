import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Calendar, Check, Loader2, Percent, RotateCcw, Tag, X } from 'lucide-react';
import { DiscountQuickUpdatePayload, formatCloudErrorForDeveloper } from '../lib/firebase';
import { DiscountType, Product } from '../types/store';
import {
  computeDiscountPricing,
  formatPriceEgp,
  getDiscountScheduleStatus,
  roundCurrency,
} from '../utils/catalogLogic';
import { ProductImage } from './ProductImage';

interface DiscountModalProps {
  product: Product | null;
  onClose: () => void;
  onSaveDiscount: (
    productId: string,
    payload: DiscountQuickUpdatePayload,
    successMessage: string
  ) => Promise<void>;
}

export function DiscountModal({ product, onClose, onSaveDiscount }: DiscountModalProps) {
  const [basePriceInput, setBasePriceInput] = useState<string>('');
  const [discountEnabled, setDiscountEnabled] = useState<boolean>(true);
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [discountValueInput, setDiscountValueInput] = useState<string>('10');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!product) return;
    const initialBase =
      product.originalPrice && product.originalPrice > 0 ? product.originalPrice : product.price;
    setBasePriceInput(String(roundCurrency(initialBase)));
    setDiscountEnabled(true);

    const existingType: DiscountType = product.discountType === 'fixed' ? 'fixed' : 'percentage';
    setDiscountType(existingType);

    if (product.discountEnabled) {
      if (product.discountValue && product.discountValue > 0) {
        setDiscountValueInput(String(roundCurrency(product.discountValue)));
      } else if (existingType === 'fixed') {
        setDiscountValueInput(String(roundCurrency(Math.max(0, initialBase - product.price))));
      } else {
        const inferredPct =
          initialBase > 0 ? Math.round(((initialBase - product.price) / initialBase) * 100) : 10;
        setDiscountValueInput(String(Math.max(1, inferredPct)));
      }
    } else {
      setDiscountValueInput(
        product.discountValue && product.discountValue > 0 ? String(product.discountValue) : '10'
      );
    }

    setStartDate(product.discountStartDate || '');
    setEndDate(product.discountEndDate || '');
    setErrorMsg(null);
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [product, saving, onClose]);

  const calculation = useMemo(() => {
    const parsedBase = Number(basePriceInput);
    const parsedVal = Number(discountValueInput);
    return computeDiscountPricing({
      basePrice: parsedBase,
      discountEnabled,
      discountType,
      discountValue: parsedVal,
      discountStartDate: startDate,
      discountEndDate: endDate,
    });
  }, [basePriceInput, discountEnabled, discountType, discountValueInput, startDate, endDate]);

  if (!product) return null;

  const schedulePreviewStatus = calculation.valid
    ? getDiscountScheduleStatus({
        discountEnabled,
        originalPrice: calculation.originalPrice,
        price: calculation.price,
        discountStartDate: startDate,
        discountEndDate: endDate,
      })
    : 'disabled';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!calculation.valid) {
      setErrorMsg(calculation.errors[0] || 'بيانات الخصم غير صالحة.');
      return;
    }

    setSaving(true);
    try {
      const cleanVal = discountEnabled ? roundCurrency(Number(discountValueInput)) : 0;
      await onSaveDiscount(
        product.id,
        {
          price: calculation.price,
          originalPrice: calculation.originalPrice,
          discountEnabled,
          discountType,
          discountValue: cleanVal,
          discountStartDate: discountEnabled ? startDate.trim() : '',
          discountEndDate: discountEnabled ? endDate.trim() : '',
        },
        discountEnabled
          ? `تم حفظ وتفعيل الخصم على «${product.name}» بنجاح في قاعدة البيانات السحابية.`
          : `تم إيقاف الخصم على «${product.name}» والعودة للسعر الأساسي بنجاح.`
      );
      onClose();
    } catch (err) {
      setErrorMsg(formatCloudErrorForDeveloper(err, 'حفظ إعدادات الخصم'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancelDiscountToBase = async () => {
    setErrorMsg(null);
    const parsedBase = roundCurrency(Number(basePriceInput));
    if (!Number.isFinite(parsedBase) || parsedBase <= 0) {
      setErrorMsg('يرجى التأكد من صحة السعر الأساسي قبل إلغاء الخصم.');
      return;
    }

    setSaving(true);
    try {
      await onSaveDiscount(
        product.id,
        {
          price: parsedBase,
          originalPrice: parsedBase,
          discountEnabled: false,
          discountType: 'percentage',
          discountValue: 0,
          discountStartDate: '',
          discountEndDate: '',
        },
        `تم إلغاء الخصم عن «${product.name}» وإعادة السعر الأساسي (${formatPriceEgp(parsedBase)} ج.م) فورًا.`
      );
      onClose();
    } catch (err) {
      setErrorMsg(formatCloudErrorForDeveloper(err, 'إلغاء الخصم'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="discount-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="w-full max-w-xl rounded-2xl bg-[#141414] border border-[#D4AF37]/45 text-gray-100 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#D4AF37]/25 bg-[#0B0B0B]">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1A1A1A] border border-[#D4AF37]/40 text-[#D4AF37]">
              <Tag className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id="discount-modal-title" className="text-base sm:text-lg font-extrabold text-white truncate">
                إعداد الخصم على المنتج
              </h2>
              <p className="text-xs text-gray-400 truncate">{product.name}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="إغلاق نافذة إعداد الخصم"
            className="inline-flex min-h-[42px] min-w-[42px] items-center justify-center rounded-xl bg-[#1A1A1A] border border-[#D4AF37]/30 text-gray-300 hover:text-white hover:border-[#D4AF37] transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Product Summary Row */}
          <div className="flex items-center gap-3.5 pb-4 border-b border-white/10">
            <ProductImage
              src={product.images[0]}
              alt={product.name}
              containerClassName="h-16 w-16 shrink-0 rounded-xl bg-[#0B0B0B] border border-[#D4AF37]/25 p-1.5"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white truncate">{product.name}</p>
              <p className="text-xs text-gray-400 mt-0.5 tabular-nums">
                السعر المسجل حاليًا: {formatPriceEgp(product.price)} ج.م
                {product.discountEnabled && product.originalPrice > product.price
                  ? ` · قبل الخصم: ${formatPriceEgp(product.originalPrice)} ج.م`
                  : ''}
              </p>
            </div>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl bg-[#0F4C5C]/20 border border-[#0F4C5C] px-4 py-3 text-xs sm:text-sm font-semibold text-[#A0D2EB]"
            >
              <AlertCircle className="h-4 w-4 text-[#38BDF8] shrink-0 mt-0.5" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Enable / Disable Toggle */}
          <div className="flex items-center justify-between gap-4 py-1">
            <div>
              <p className="text-sm font-bold text-white">حالة الخصم على المنتج</p>
              <p className="text-xs text-gray-400">
                {discountEnabled
                  ? 'الخصم مفعّل — سيظهر السعر القديم مشطوبًا والسعر الجديد للزوار'
                  : 'الخصم متوقف — سيظهر السعر الأساسي فقط دون شطب'}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={discountEnabled}
              onClick={() => setDiscountEnabled((prev) => !prev)}
              className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-extrabold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                discountEnabled
                  ? 'bg-[#D4AF37] text-[#0B0B0B] border-[#D4AF37]'
                  : 'bg-[#0B0B0B] text-gray-300 border-white/20 hover:border-[#D4AF37]/50'
              }`}
            >
              {discountEnabled ? 'خصم مفعّل' : 'خصم متوقف'}
            </button>
          </div>

          {/* Base Price Input */}
          <div>
            <label htmlFor="discount-base-price" className="block text-xs font-bold text-[#D4AF37] mb-1.5">
              السعر الأساسي قبل الخصم (ج.م) *
            </label>
            <input
              id="discount-base-price"
              type="number"
              min="0.01"
              max="1000000"
              step="0.01"
              required
              dir="ltr"
              value={basePriceInput}
              onChange={(e) => setBasePriceInput(e.target.value)}
              className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-[#D4AF37]/35 px-3.5 py-2.5 text-sm font-bold text-white text-right tabular-nums focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          {discountEnabled && (
            <>
              {/* Discount Type Segmented Control */}
              <div>
                <span className="block text-xs font-bold text-[#D4AF37] mb-1.5">نوع الخصم</span>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#0B0B0B] border border-white/10">
                  <button
                    type="button"
                    onClick={() => setDiscountType('percentage')}
                    className={`min-h-[42px] rounded-lg px-3 py-2 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                      discountType === 'percentage'
                        ? 'bg-[#0F4C5C] text-white'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    <Percent className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>نسبة مئوية (%)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('fixed')}
                    className={`min-h-[42px] rounded-lg px-3 py-2 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                      discountType === 'fixed'
                        ? 'bg-[#0F4C5C] text-white'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    <Tag className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>مبلغ ثابت (ج.م)</span>
                  </button>
                </div>
              </div>

              {/* Discount Value */}
              <div>
                <label
                  htmlFor="discount-value-input"
                  className="block text-xs font-bold text-[#D4AF37] mb-1.5"
                >
                  {discountType === 'percentage'
                    ? 'قيمة نسبة الخصم (%) — من 0.01% إلى أقل من 100% *'
                    : 'قيمة مبلغ الخصم الثابت (ج.م) — أقل من السعر الأساسي *'}
                </label>
                <div className="relative">
                  <input
                    id="discount-value-input"
                    type="number"
                    min="0.01"
                    max={discountType === 'percentage' ? '99.99' : basePriceInput || '1000000'}
                    step="0.01"
                    required={discountEnabled}
                    dir="ltr"
                    value={discountValueInput}
                    onChange={(e) => setDiscountValueInput(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-[#D4AF37]/35 pl-14 pr-3.5 py-2.5 text-sm font-bold text-white text-right tabular-nums focus:outline-none focus:border-[#D4AF37]"
                  />
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#D4AF37]">
                    {discountType === 'percentage' ? '%' : 'ج.م'}
                  </span>
                </div>
              </div>

              {/* Optional Start & End Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="discount-start-date"
                      className="text-xs font-bold text-gray-300 flex items-center gap-1.5"
                    >
                      <Calendar className="h-3.5 w-3.5 text-[#D4AF37]" aria-hidden="true" />
                      <span>تاريخ بداية الخصم (اختياري)</span>
                    </label>
                    {startDate && (
                      <button
                        type="button"
                        onClick={() => setStartDate('')}
                        className="text-[11px] text-[#D4AF37] hover:underline cursor-pointer"
                      >
                        مسح
                      </button>
                    )}
                  </div>
                  <input
                    id="discount-start-date"
                    type="date"
                    dir="ltr"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3 py-2 text-xs sm:text-sm text-white tabular-nums focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="discount-end-date"
                      className="text-xs font-bold text-gray-300 flex items-center gap-1.5"
                    >
                      <Calendar className="h-3.5 w-3.5 text-[#D4AF37]" aria-hidden="true" />
                      <span>تاريخ نهاية الخصم (اختياري)</span>
                    </label>
                    {endDate && (
                      <button
                        type="button"
                        onClick={() => setEndDate('')}
                        className="text-[11px] text-[#D4AF37] hover:underline cursor-pointer"
                      >
                        مسح
                      </button>
                    )}
                  </div>
                  <input
                    id="discount-end-date"
                    type="date"
                    dir="ltr"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3 py-2 text-xs sm:text-sm text-white tabular-nums focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </>
          )}

          {/* Live Calculation Summary */}
          <div className="rounded-xl bg-[#0B0B0B] border border-[#D4AF37]/30 p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>السعر الأساسي:</span>
              <span className="font-bold text-gray-200 tabular-nums">
                {formatPriceEgp(calculation.originalPrice)} ج.م
              </span>
            </div>

            {discountEnabled && (
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>قيمة التوفير للعميل:</span>
                <span className="font-bold text-[#D4AF37] tabular-nums">
                  {calculation.valid
                    ? `${formatPriceEgp(calculation.savings)} ج.م (${calculation.discountPercent}%)`
                    : '—'}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-xs sm:text-sm font-bold text-white">السعر النهائي للعميل:</span>
              <span className="text-lg sm:text-xl font-extrabold text-[#D4AF37] tabular-nums">
                {calculation.valid ? `${formatPriceEgp(calculation.price)} ج.م` : 'بيانات غير صالحة'}
              </span>
            </div>

            {!calculation.valid && calculation.errors[0] && (
              <p className="text-xs text-[#A0D2EB] font-semibold pt-1">{calculation.errors[0]}</p>
            )}

            {calculation.valid && discountEnabled && (
              <p className="text-xs text-gray-400 pt-1">
                حالة العرض الآن:{' '}
                <strong className="text-white">
                  {schedulePreviewStatus === 'active' && 'مفعّل ويظهر للزوار فور الحفظ'}
                  {schedulePreviewStatus === 'scheduled' &&
                    `مجدول — سيبدأ ظهور الخصم تلقائيًا يوم ${startDate}`}
                  {schedulePreviewStatus === 'expired' &&
                    `تاريخ النهاية (${endDate}) قد مضى — سيعرض المتجر السعر الأساسي تلقائيًا`}
                </strong>
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
            <button
              type="submit"
              disabled={saving || !calculation.valid}
              className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] disabled:opacity-50 px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white border border-[#D4AF37]/60 transition-colors whitespace-nowrap cursor-pointer"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
              )}
              <span>{saving ? 'جاري الحفظ السحابي...' : 'حفظ إعدادات الخصم'}</span>
            </button>

            {product.discountEnabled && (
              <button
                type="button"
                disabled={saving}
                onClick={handleCancelDiscountToBase}
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#0B0B0B] hover:bg-[#1E1E1E] border border-[#D4AF37]/40 px-4 py-2.5 text-xs sm:text-sm font-bold text-[#D4AF37] transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>إلغاء الخصم فورًا</span>
              </button>
            )}

            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-[#1A1A1A] hover:bg-[#242424] border border-white/15 px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-300 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              إغلاق
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
