import { useEffect, useState } from 'react';
import { MessageCircle, Minus, Plus, X } from 'lucide-react';
import { Product } from '../../types/store';
import {
  buildWhatsAppOrderUrl,
  calculateDiscountPercent,
  formatPriceEgp,
  isDiscountActive,
} from '../../utils/catalogLogic';
import { useMobileOverlay } from '../../utils/useMobileOverlay';
import { ProductImage } from '../ProductImage';

interface MobileOrderSheetProps {
  product: Product | null;
  onClose: () => void;
  publicOrigin?: string;
}

export function MobileOrderSheet({
  product,
  onClose,
  publicOrigin,
}: MobileOrderSheetProps) {
  const [selectedOption, setSelectedOption] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  useMobileOverlay(Boolean(product), onClose, 'mobile-whatsapp-order');

  useEffect(() => {
    if (product) {
      setSelectedOption(product.options[0] || '');
      setQuantity(1);
      setNotes('');
    }
  }, [product]);

  if (!product) return null;

  const hasDiscount = isDiscountActive(product);
  const discountPct = hasDiscount
    ? calculateDiscountPercent(product.originalPrice, product.price)
    : 0;
  const totalAmount = product.price * quantity;

  const whatsappOrderUrl = buildWhatsAppOrderUrl({
    product,
    selectedOption,
    quantity,
    notes,
    baseOrigin: publicOrigin,
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-order-sheet-title"
      className="fixed inset-0 z-50 md:hidden flex items-end justify-center bg-[#081A33]/60 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-sheet-up w-full max-h-[90dvh] rounded-t-3xl bg-white border-t border-[#CBE7FA] flex flex-col overflow-hidden shadow-2xl">
        {/* Sheet Header */}
        <div className="shrink-0 pt-2.5 pb-2 px-4 border-b border-[#E8F4FD] bg-white">
          <div
            aria-hidden="true"
            className="w-10 h-1.5 rounded-full bg-slate-300 mx-auto mb-2"
          />
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2
                id="mobile-order-sheet-title"
                className="text-base font-extrabold text-[#0B1F3A]"
              >
                طلب المنتج عبر <bdi>WhatsApp</bdi>
              </h2>
              <p className="text-[11px] text-slate-500">
                راجع تفاصيل طلبك وأضف الكمية أو أي ملاحظات قبل الإرسال
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق نافذة الطلب"
              className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] text-[#0B1F3A] active:scale-95 transition-transform cursor-pointer"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Scrollable Order Form Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3.5 space-y-4">
          {/* Selected Product Thumbnail, Name & Price */}
          <div className="flex items-center gap-3 rounded-2xl bg-[#F2FAFF] border border-[#CBE7FA] p-3">
            <ProductImage
              src={product.images[0]}
              alt={product.name}
              containerClassName="h-18 w-18 shrink-0 rounded-xl bg-white border border-[#D8EEFB] p-1.5"
              className="h-full w-full"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-[#0284C7] truncate">
                {product.brand}
                {hasDiscount ? ` · خصم ${discountPct}%` : ''}
              </p>
              <h3 className="text-sm font-extrabold text-[#0B1F3A] leading-snug line-clamp-2">
                {product.name}
              </h3>
              <div className="mt-1 flex flex-wrap items-baseline gap-1.5">
                <span className="font-num text-base font-extrabold text-[#1D4ED8]">
                  {formatPriceEgp(product.price)}
                </span>
                <span className="text-xs font-bold text-[#0F294A]">ج.م</span>
                {hasDiscount && (
                  <span className="font-num text-xs text-slate-400 line-through">
                    {formatPriceEgp(product.originalPrice)} ج.م
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Product Options Selector (if product has options) */}
          {product.options.length > 0 && (
            <div>
              <p className="text-xs font-extrabold text-[#0F294A] mb-2">اختر الخيار المطلوب:</p>
              <div className="flex flex-wrap gap-2">
                {product.options.map((opt) => {
                  const selected = selectedOption === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSelectedOption(opt)}
                      className={`min-h-[44px] rounded-xl px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer ${
                        selected
                          ? 'bg-[#1D4ED8] text-white border border-[#1D4ED8]'
                          : 'bg-[#F2FAFF] text-[#0F294A] border border-[#CBE7FA]'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Stepper */}
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-white border border-[#D8EEFB] px-3.5 py-2.5">
            <div>
              <p className="text-xs font-extrabold text-[#0B1F3A]">الكمية المطلوبة</p>
              <p className="text-[11px] text-slate-500">حدد عدد القطع المطلوبة</p>
            </div>

            <div className="inline-flex items-center rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] p-0.5">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="تقليل الكمية"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[#0B1F3A] active:bg-white transition-colors cursor-pointer"
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="font-num min-w-[36px] text-center text-base font-extrabold text-[#0B1F3A]">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(25, q + 1))}
                aria-label="زيادة الكمية"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[#0B1F3A] active:bg-white transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Optional Customer Notes */}
          <div>
            <label
              htmlFor="mobile-whatsapp-notes"
              className="block text-xs font-extrabold text-[#0B1F3A] mb-1.5"
            >
              ملاحظات إضافية أو عنوان التوصيل (اختياري)
            </label>
            <textarea
              id="mobile-whatsapp-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: التوصيل داخل شرم الشيخ (الرويسات)، أو اكتب المحافظة وأي تفاصيل إضافية..."
              className="w-full rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] px-3.5 py-2.5 text-xs sm:text-sm text-[#0B1F3A] placeholder:text-slate-400 focus:bg-white focus:outline-2 focus:outline-[#1D4ED8] resize-none"
            />
          </div>
        </div>

        {/* Sticky Bottom Send Order CTA */}
        <div className="shrink-0 border-t border-[#D8EEFB] bg-white px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-600">الإجمالي التقديري ({quantity} قطعة):</span>
            <span className="font-num text-base font-extrabold text-[#0B1F3A]">
              {formatPriceEgp(totalAmount)} ج.م
            </span>
          </div>

          <a
            href={whatsappOrderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] active:scale-[0.98] px-4 py-3 text-sm font-extrabold text-white shadow-sm transition-all whitespace-nowrap"
          >
            <MessageCircle className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
            <span>إرسال الطلب عبر <bdi>WhatsApp</bdi></span>
          </a>
        </div>
      </div>
    </div>
  );
}
