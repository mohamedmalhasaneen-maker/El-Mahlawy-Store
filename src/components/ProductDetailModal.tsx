import { useEffect, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  MessageCircle,
  Minus,
  Plus,
  Share2,
  Truck,
  X,
} from 'lucide-react';
import { useSiteConfig } from '../contexts/SiteConfigContext';
import { Product } from '../types/store';
import {
  buildProductShareUrl,
  buildWhatsAppOrderUrl,
  calculateDiscountPercent,
  calculateSavingsAmount,
  formatPriceEgp,
  getEffectiveProductPrice,
  isDiscountActive,
  normalizeImageSrc,
  roundCurrency,
} from '../utils/catalogLogic';
import { ProductImage } from './ProductImage';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  publicOrigin?: string;
}

export function ProductDetailModal({ product, onClose, publicOrigin }: ProductDetailModalProps) {
  const siteConfig = useSiteConfig();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [downloadedSheet, setDownloadedSheet] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (product) {
      setActiveImageIndex(0);
      setSelectedOption(product.options[0] || '');
      setQuantity(1);
      setDownloadedSheet(false);
      setCopied(false);
    }
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [product, onClose]);

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

  const whatsappUrl = buildWhatsAppOrderUrl({
    product,
    selectedOption,
    quantity,
    baseOrigin: publicOrigin,
    whatsappNumber: siteConfig.primaryWhatsApp,
    storeName: siteConfig.storeName,
    storeSubtitle: siteConfig.storeSubtitle,
  });

  const shareUrl = buildProductShareUrl(product.id, publicOrigin);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: product.shortDescription || product.description,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(shareUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Ignore
        }
      }
    }
  };

  const handleDownloadSpecs = () => {
    const content = [
      `${siteConfig.storeName}${siteConfig.storeSubtitle ? ` | ${siteConfig.storeSubtitle}` : ''}`,
      '====================================',
      `المنتج: ${product.name}`,
      product.brand ? `الماركة: ${product.brand}` : '',
      product.category ? `القسم: ${product.category}` : '',
      `السعر الحالي: ${formatPriceEgp(effectivePrice)} ج.م`,
      hasDiscount
        ? `السعر قبل الخصم: ${formatPriceEgp(product.originalPrice)} ج.م (خصم ${discountPct}%)`
        : '',
      `حالة التوفر: ${product.inStock ? 'متوفر' : 'غير متوفر حاليًا'}`,
      '',
      product.description ? 'الوصف التفصيلي:' : '',
      product.description || product.shortDescription,
      '',
      product.specs.length > 0 ? 'المواصفات والمميزات:' : '',
      ...product.specs.map((s) => `- ${s}`),
      '',
      `واتساب الأعمال (${siteConfig.storeName}): ${siteConfig.whatsappUrl}`,
      siteConfig.facebookUrl ? `صفحة Facebook: ${siteConfig.facebookUrl}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${product.id}-specs.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadedSheet(true);
    setTimeout(() => setDownloadedSheet(false), 2500);
  };

  const showCategory = Boolean(product.category && product.category.trim() !== 'عام');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#081A33]/65 backdrop-blur-xs p-0 sm:p-4 lg:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex max-h-[94vh] sm:max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#081A33] border border-[#CBE7FA] dark:border-[#1E3F73] shadow-2xl">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between gap-4 border-b border-[#E2F1FC] dark:border-[#1E3F73] px-5 py-3.5 bg-[#F8FCFF] dark:bg-[#0E264A] shrink-0">
          <p className="text-xs sm:text-sm font-semibold text-[#0284C7] dark:text-[#38BDF8] truncate">
            {product.brand || siteConfig.storeName}
            {showCategory ? ` · ${product.category}` : ''}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق تفاصيل المنتج"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-[#081830] border border-[#CBE7FA] dark:border-[#1E3F73] text-[#0B1F3A] dark:text-[#F0F9FF] hover:bg-[#F2FAFF] dark:hover:bg-[#153460] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-8 items-start">
            {/* Right Column (RTL): Multi-Image Gallery */}
            <div className="lg:col-span-6">
              <div className="relative overflow-hidden rounded-2xl bg-[#F2FAFF] dark:bg-[#081830] border border-[#D8EEFB] dark:border-[#1E3F73]">
                {hasDiscount && (
                  <span className="absolute top-4 right-4 z-20 rounded-lg bg-[#1D4ED8] px-3 py-1 text-xs font-extrabold text-white">
                    خصم <bdi className="font-num">{discountPct}%</bdi>
                  </span>
                )}

                <ProductImage
                  src={images[activeImageIndex]}
                  alt={`${product.name} - صورة ${activeImageIndex + 1}`}
                  showPedestalHalo={true}
                  containerClassName="aspect-square max-h-[420px] w-full p-3 bg-[#F2FAFF] dark:bg-[#081830]"
                  className=""
                />

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
                      }
                      aria-label="الصورة السابقة"
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 dark:bg-[#0E264A]/95 border border-[#CBE7FA] dark:border-[#1E3F73] text-[#0B1F3A] dark:text-[#F0F9FF] shadow-sm hover:bg-[#F2FAFF] dark:hover:bg-[#153460] cursor-pointer"
                    >
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
                      }
                      aria-label="الصورة التالية"
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 dark:bg-[#0E264A]/95 border border-[#CBE7FA] dark:border-[#1E3F73] text-[#0B1F3A] dark:text-[#F0F9FF] shadow-sm hover:bg-[#F2FAFF] dark:hover:bg-[#153460] cursor-pointer"
                    >
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </>
                )}
              </div>

              {/* Gallery Thumbnails */}
              {images.length > 1 && (
                <div
                  role="tablist"
                  aria-label="معرض صور المنتج"
                  className="mt-3 flex items-center gap-2.5 overflow-x-auto pb-1"
                >
                  {images.map((imgUrl, idx) => (
                    <button
                      key={`${imgUrl}-${idx}`}
                      type="button"
                      role="tab"
                      aria-selected={activeImageIndex === idx}
                      aria-label={`عرض الصورة رقم ${idx + 1}`}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 p-1.5 bg-[#F2FAFF] dark:bg-[#081830] transition-colors cursor-pointer ${
                        activeImageIndex === idx
                          ? 'border-[#1D4ED8] bg-white dark:bg-[#0E264A]'
                          : 'border-[#D8EEFB] dark:border-[#1E3F73] opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={normalizeImageSrc(imgUrl)}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-contain rounded-lg"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Left Column (RTL): Contiguous Purchase & Specification Module */}
            <div className="lg:col-span-6 flex flex-col">
              <div className="flex items-center gap-2 text-xs font-bold mb-2">
                <span
                  className={
                    product.inStock
                      ? 'text-[#0284C7] dark:text-[#38BDF8]'
                      : 'text-amber-700 dark:text-amber-400'
                  }
                >
                  {product.inStock
                    ? 'متوفر الآن — جاهز للشحن والتوصيل الفوري'
                    : 'غير متوفر حاليًا — تواصل للحجز المسبق'}
                </span>
              </div>

              <h2
                id="product-modal-title"
                className="text-xl sm:text-2xl font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF] leading-snug mb-4"
              >
                {product.name}
              </h2>

              {/* Price Showcase Block */}
              <div className="rounded-2xl bg-[#F2FAFF] dark:bg-[#0E264A] border border-[#D8EEFB] dark:border-[#1E3F73] p-4 mb-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-num text-2xl sm:text-3xl font-extrabold text-[#1D4ED8] dark:text-[#38BDF8]">
                      {formatPriceEgp(effectivePrice)}
                    </span>
                    <span className="text-sm font-bold text-[#0F294A] dark:text-[#E0F2FE]">
                      جنيه مصري
                    </span>

                    {hasDiscount && (
                      <span className="font-num text-sm sm:text-base text-slate-400 line-through mr-1">
                        {formatPriceEgp(product.originalPrice)} ج.م
                      </span>
                    )}
                  </div>

                  {hasDiscount && (
                    <span className="text-xs sm:text-sm font-bold text-[#0284C7] dark:text-[#38BDF8]">
                      توفير <bdi className="font-num">{formatPriceEgp(savings)}</bdi> ج.م (
                      <bdi className="font-num">{discountPct}%</bdi>)
                    </span>
                  )}
                </div>
              </div>

              {/* Selectable Options / Variants */}
              {product.options.length > 0 && (
                <div className="mb-5">
                  <span className="block text-xs sm:text-sm font-bold text-[#0B1F3A] dark:text-[#F0F9FF] mb-2">
                    اختيار الموديل / اللون:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {product.options.map((opt) => {
                      const active = selectedOption === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setSelectedOption(opt)}
                          className={`min-h-[40px] rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold border transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#1D4ED8] text-white border-[#1D4ED8]'
                              : 'bg-white dark:bg-[#081830] text-[#0F294A] dark:text-[#E0F2FE] border-[#CBE7FA] dark:border-[#1E3F73] hover:bg-[#F2FAFF] dark:hover:bg-[#153460]'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity & Actions Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <span className="text-xs sm:text-sm font-bold text-[#0B1F3A] dark:text-[#F0F9FF]">
                    الكمية:
                  </span>
                  <div className="inline-flex items-center rounded-xl border border-[#CBE7FA] dark:border-[#1E3F73] bg-[#F2FAFF] dark:bg-[#0E264A] p-1">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      aria-label="تقليل الكمية"
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-[#081830] text-[#0B1F3A] dark:text-[#F0F9FF] hover:bg-[#E2F3FE] dark:hover:bg-[#153460] cursor-pointer"
                    >
                      <Minus className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <span className="font-num min-w-[2.25rem] text-center text-sm font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF]">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                      aria-label="زيادة الكمية"
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-[#081830] text-[#0B1F3A] dark:text-[#F0F9FF] hover:bg-[#E2F3FE] dark:hover:bg-[#153460] cursor-pointer"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleShare}
                    className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      copied
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : 'bg-white dark:bg-[#0E264A] border-[#CBE7FA] dark:border-[#1E3F73] text-[#0F294A] dark:text-[#E0F2FE] hover:bg-[#F2FAFF] dark:hover:bg-[#153460]'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                        <span>تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="h-4 w-4 text-[#0284C7] dark:text-[#38BDF8]" aria-hidden="true" />
                        <span>مشاركة</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadSpecs}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-white dark:bg-[#0E264A] border border-[#CBE7FA] dark:border-[#1E3F73] hover:bg-[#F2FAFF] dark:hover:bg-[#153460] px-3 py-1.5 text-xs font-bold text-[#0F294A] dark:text-[#E0F2FE] transition-colors cursor-pointer"
                  >
                    {downloadedSheet ? (
                      <>
                        <Check
                          className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                          aria-hidden="true"
                        />
                        <span>تم التحميل</span>
                      </>
                    ) : (
                      <>
                        <Download
                          className="h-4 w-4 text-[#0284C7] dark:text-[#38BDF8]"
                          aria-hidden="true"
                        />
                        <span>المواصفات</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Detailed Description */}
              {(product.description || product.shortDescription) && (
                <div className="mb-5">
                  <h3 className="text-sm font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF] mb-1.5">
                    الوصف التفصيلي
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {product.description || product.shortDescription}
                  </p>
                </div>
              )}

              {/* Specifications & Features */}
              {product.specs.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF] mb-2.5">
                    المواصفات والمميزات
                  </h3>
                  <ul className="divide-y divide-[#E8F4FD] dark:divide-[#1E3F73] rounded-2xl border border-[#D8EEFB] dark:border-[#1E3F73] bg-[#FAFDFF] dark:bg-[#081830] px-4">
                    {product.specs.map((spec, idx) => (
                      <li
                        key={`${spec}-${idx}`}
                        className="py-2.5 text-xs sm:text-sm text-[#0F294A] dark:text-[#E0F2FE] flex items-start gap-2"
                      >
                        <span className="font-num text-[#0284C7] dark:text-[#38BDF8] font-bold">
                          {String(idx + 1).padStart(2, '0')}.
                        </span>
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {siteConfig.shippingSummary && (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
                  <Truck
                    className="h-4 w-4 text-[#0284C7] dark:text-[#38BDF8] shrink-0"
                    aria-hidden="true"
                  />
                  <span>{siteConfig.shippingSummary}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Non-Overlapping Footer CTA Bar */}
        <div className="border-t border-[#D8EEFB] dark:border-[#1E3F73] bg-white dark:bg-[#081A33] px-5 py-3.5 sm:px-7 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="hidden sm:block">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">
              الإجمالي التقديري للطلب
            </span>
            <span className="font-num text-lg font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF]">
              {formatPriceEgp(roundCurrency(effectivePrice * quantity))} ج.م
            </span>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[48px] flex-1 sm:max-w-md items-center justify-center gap-2.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] px-6 py-3 text-sm sm:text-base font-extrabold text-white shadow-sm transition-colors whitespace-nowrap shrink-0"
          >
            <MessageCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>اطلب الآن عبر واتساب</span>
          </a>
        </div>
      </div>
    </div>
  );
}


