import { useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  MessageCircle,
  Send,
  Share2,
  ShoppingBag,
  X,
} from 'lucide-react';
import { useSiteConfig } from '../../contexts/SiteConfigContext';
import { Product } from '../../types/store';
import {
  buildProductShareLinks,
  calculateDiscountPercent,
  calculateSavingsAmount,
  formatPriceEgp,
  getEffectiveProductPrice,
  isDiscountActive,
} from '../../utils/catalogLogic';
import { getCategoryName } from '../../constants/categories';
import { useMobileOverlay } from '../../utils/useMobileOverlay';
import { ProductImage } from '../ProductImage';

interface MobileProductSheetProps {
  product: Product | null;
  onClose: () => void;
  onOrderProduct: (product: Product) => void;
  publicOrigin?: string;
}

export function MobileProductSheet({
  product,
  onClose,
  onOrderProduct,
  publicOrigin,
}: MobileProductSheetProps) {
  const siteConfig = useSiteConfig();
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  useMobileOverlay(Boolean(product), onClose, 'mobile-product-details');

  useEffect(() => {
    if (product) {
      setActiveImageIdx(0);
      setShareOpen(false);
      setCopiedLink(false);
    }
  }, [product]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  if (!product) return null;

  const images = product.images.length > 0 ? product.images : [''];
  const hasDiscount = isDiscountActive(product);
  const effectivePrice = getEffectiveProductPrice(product);
  const discountPct = hasDiscount
    ? calculateDiscountPercent(product.originalPrice, effectivePrice)
    : 0;
  const savings = hasDiscount
    ? calculateSavingsAmount(product.originalPrice, effectivePrice)
    : 0;

  const shareLinks = buildProductShareLinks(
    product,
    publicOrigin,
    siteConfig.storeName,
    siteConfig.storeSubtitle
  );

  const goPrevImage = () => {
    setActiveImageIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goNextImage = () => {
    setActiveImageIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const copyUsingFallbackTextarea = (text: string): boolean => {
    try {
      const tempInput = document.createElement('textarea');
      tempInput.value = text;
      tempInput.setAttribute('readonly', '');
      tempInput.style.position = 'fixed';
      tempInput.style.top = '0';
      tempInput.style.opacity = '0';
      document.body.appendChild(tempInput);
      tempInput.focus();
      tempInput.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(tempInput);
      return ok;
    } catch {
      return false;
    }
  };

  const handleCopyProductLink = async () => {
    const linkToCopy = shareLinks.productUrl;
    let copied = false;

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(linkToCopy);
        copied = true;
      } catch {
        copied = copyUsingFallbackTextarea(linkToCopy);
      }
    } else {
      copied = copyUsingFallbackTextarea(linkToCopy);
    }

    if (copied) {
      setCopiedLink(true);
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => {
        setCopiedLink(false);
      }, 2500);
    }
  };

  const handleShareButtonClick = () => {
    const nextOpen = !shareOpen;
    setShareOpen(nextOpen);

    if (
      nextOpen &&
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function'
    ) {
      navigator
        .share({
          title: shareLinks.shareTitle,
          text: shareLinks.shareText,
          url: shareLinks.productUrl,
        })
        .catch(() => {
          // User cancelled native OS share or iframe blocked web-share;
          // the inline social media share links remain open for immediate 1-tap use.
        });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-sheet-product-title"
      className="fixed inset-0 z-50 md:hidden flex items-end justify-center bg-[#081A33]/60 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-sheet-up w-full max-h-[88dvh] rounded-t-3xl bg-white border-t border-[#CBE7FA] flex flex-col overflow-hidden shadow-2xl">
        {/* Grab Handle & Top Header */}
        <div className="shrink-0 pt-2.5 pb-2 px-4 border-b border-[#E8F4FD] bg-white">
          <div
            aria-hidden="true"
            className="w-10 h-1.5 rounded-full bg-slate-300 mx-auto mb-2"
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-[#0284C7] truncate">
              {product.brand || siteConfig.storeName}
              {product.category ? ` · ${getCategoryName(product.category)}` : ''}
              <span aria-hidden="true"> · </span>
              <span className={product.inStock ? 'text-emerald-700' : 'text-amber-700'}>
                {product.inStock ? 'متوفر للطلب' : 'يرجى الاستفسار عن التوفر'}
              </span>
            </p>

            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق تفاصيل المنتج"
              className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] text-[#0B1F3A] active:scale-95 transition-transform cursor-pointer"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Scrollable Details Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4">
          {/* Swipeable & Navigable Image Gallery */}
          <div className="space-y-2.5">
            <div
              onTouchStart={(e) => {
                touchStartXRef.current = e.touches[0]?.clientX ?? null;
              }}
              onTouchEnd={(e) => {
                if (images.length <= 1 || touchStartXRef.current === null) return;
                const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
                const delta = endX - touchStartXRef.current;
                touchStartXRef.current = null;
                if (Math.abs(delta) > 40) {
                  if (delta > 0) {
                    goNextImage();
                  } else {
                    goPrevImage();
                  }
                }
              }}
              className="relative aspect-square max-h-[250px] w-full mx-auto rounded-2xl bg-[#F2FAFF] border border-[#D8EEFB] p-3 flex items-center justify-center overflow-hidden"
            >
              {hasDiscount && (
                <span className="font-num absolute top-2.5 right-2.5 z-20 rounded-md bg-[#0B2354] px-2 py-0.5 text-xs font-extrabold text-white">
                  خصم {discountPct}%
                </span>
              )}

              <ProductImage
                src={images[activeImageIdx]}
                alt={`${product.name} - صورة ${activeImageIdx + 1}`}
                containerClassName="h-full w-full rounded-xl bg-[#F2FAFF]"
                className="max-h-[220px]"
              />

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goPrevImage}
                    aria-label="الصورة السابقة"
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/95 border border-[#CBE7FA] text-[#0B1F3A] shadow-sm cursor-pointer"
                  >
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={goNextImage}
                    aria-label="الصورة التالية"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/95 border border-[#CBE7FA] text-[#0B1F3A] shadow-sm cursor-pointer"
                  >
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 no-scrollbar">
                {images.map((imgUrl, idx) => (
                  <button
                    key={`${imgUrl}-${idx}`}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    aria-label={`عرض الصورة رقم ${idx + 1}`}
                    className={`h-14 w-14 shrink-0 rounded-xl border-2 p-1 transition-all cursor-pointer ${
                      idx === activeImageIdx
                        ? 'border-[#1D4ED8] bg-white'
                        : 'border-[#D8EEFB] bg-[#F2FAFF] opacity-75'
                    }`}
                  >
                    <ProductImage
                      src={imgUrl}
                      alt=""
                      containerClassName="h-full w-full rounded-lg"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title & Pricing */}
          <div>
            <h2
              id="mobile-sheet-product-title"
              className="text-lg font-extrabold text-[#0B1F3A] leading-snug"
            >
              {product.name}
            </h2>

            <div className="mt-3 rounded-2xl bg-[#F2FAFF] border border-[#D8EEFB] p-3.5 flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1.5">
                <span className="font-num text-2xl font-extrabold text-[#1D4ED8]">
                  {formatPriceEgp(effectivePrice)}
                </span>
                <span className="text-xs font-bold text-[#0F294A]">ج.م</span>
                {hasDiscount && (
                  <span className="font-num text-xs font-semibold text-slate-400 line-through mr-1">
                    {formatPriceEgp(product.originalPrice)} ج.م
                  </span>
                )}
              </div>

              {hasDiscount && savings > 0 && (
                <span className="text-xs font-extrabold text-[#0284C7]">
                  توفير <bdi className="font-num">{formatPriceEgp(savings)}</bdi> ج.م
                </span>
              )}
            </div>
          </div>

          {/* Full Description */}
          <div>
            <h3 className="text-xs font-extrabold text-[#0B1F3A] mb-1.5">تفاصيل ووصف المنتج</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {product.description || product.shortDescription || `منتج مختار بعناية من ${siteConfig.storeName}.`}
            </p>
          </div>

          {/* Available Options Preview */}
          {product.options.length > 0 && (
            <div>
              <h3 className="text-xs font-extrabold text-[#0B1F3A] mb-1.5">
                الخيارات المتوفرة عند الطلب
              </h3>
              <p className="text-xs font-semibold text-[#0F294A]">
                {product.options.join(' · ')}
              </p>
            </div>
          )}

          {/* Technical Specifications */}
          {product.specs.length > 0 && (
            <div>
              <h3 className="text-xs font-extrabold text-[#0B1F3A] mb-2">
                المواصفات والتفاصيل الفنية
              </h3>
              <ul className="space-y-1.5 rounded-2xl bg-[#F8FCFF] border border-[#E4F2FC] p-3">
                {product.specs.map((spec, idx) => (
                  <li
                    key={`${spec}-${idx}`}
                    className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed"
                  >
                    <Check
                      className="h-4 w-4 text-[#0284C7] shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{spec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sticky Safe-Area Action Bar + Expandable Social Share Tray */}
        <div className="shrink-0 border-t border-[#D8EEFB] bg-white px-3.5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] space-y-2.5">
          {shareOpen && (
            <div
              role="region"
              aria-label="خيارات مشاركة المنتج عبر التواصل الاجتماعي"
              className="rounded-2xl bg-[#F2FAFF] border border-[#CBE7FA] p-3 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-extrabold text-[#0B1F3A] truncate">
                  إرسال رابط المنتج عبر تطبيقات التواصل
                </p>
                <button
                  type="button"
                  onClick={() => setShareOpen(false)}
                  aria-label="إغلاق خيارات المشاركة"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:text-[#0B1F3A] cursor-pointer"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={shareLinks.whatsappShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-white border border-[#CBE7FA] px-2.5 py-2 text-xs font-bold text-[#0F294A] active:scale-[0.98] transition-transform whitespace-nowrap"
                >
                  <MessageCircle className="h-4 w-4 text-[#1D4ED8] shrink-0" aria-hidden="true" />
                  <span>مشاركة <bdi>WhatsApp</bdi></span>
                </a>

                <a
                  href={shareLinks.facebookShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-white border border-[#CBE7FA] px-2.5 py-2 text-xs font-bold text-[#0F294A] active:scale-[0.98] transition-transform whitespace-nowrap"
                >
                  <ExternalLink className="h-4 w-4 text-[#0284C7] shrink-0" aria-hidden="true" />
                  <span>مشاركة <bdi>Facebook</bdi></span>
                </a>

                <a
                  href={shareLinks.telegramShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-white border border-[#CBE7FA] px-2.5 py-2 text-xs font-bold text-[#0F294A] active:scale-[0.98] transition-transform whitespace-nowrap"
                >
                  <Send className="h-4 w-4 text-[#0284C7] shrink-0" aria-hidden="true" />
                  <span>مشاركة <bdi>Telegram</bdi></span>
                </a>

                <a
                  href={shareLinks.xShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-white border border-[#CBE7FA] px-2.5 py-2 text-xs font-bold text-[#0F294A] active:scale-[0.98] transition-transform whitespace-nowrap"
                >
                  <ExternalLink className="h-4 w-4 text-[#1D4ED8] shrink-0" aria-hidden="true" />
                  <span>منصة <bdi>X</bdi></span>
                </a>
              </div>

              <button
                type="button"
                onClick={() => void handleCopyProductLink()}
                className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-extrabold transition-colors whitespace-nowrap cursor-pointer ${
                  copiedLink
                    ? 'bg-[#0B2354] text-white'
                    : 'bg-white border border-[#CBE7FA] text-[#1D4ED8]'
                }`}
              >
                {copiedLink ? (
                  <>
                    <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>تم نسخ رابط المنتج بنجاح</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>نسخ رابط المنتج المباشر</span>
                  </>
                )}
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const target = product;
                onClose();
                setTimeout(() => onOrderProduct(target), 20);
              }}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] active:scale-[0.98] px-3 py-3 text-xs min-[380px]:text-sm font-extrabold text-white transition-all whitespace-nowrap cursor-pointer"
            >
              <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>طلب عبر <bdi>WhatsApp</bdi></span>
            </button>

            <button
              type="button"
              onClick={handleShareButtonClick}
              aria-expanded={shareOpen}
              className={`inline-flex min-h-[48px] shrink-0 items-center justify-center gap-1.5 rounded-xl border px-3 min-[380px]:px-4 py-3 text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer active:scale-[0.98] ${
                shareOpen
                  ? 'bg-[#E0F2FE] border-[#0284C7] text-[#0B2354]'
                  : 'bg-[#F2FAFF] border-[#CBE7FA] text-[#0F294A] hover:bg-[#E2F3FE]'
              }`}
            >
              <Share2 className="h-4 w-4 text-[#1D4ED8] shrink-0" aria-hidden="true" />
              <span>مشاركة المنتج</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
