import { useEffect, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
import { getCategoryName } from '../constants/categories';
import { buildProductImageAlt } from '../utils/seo';
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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfImageSrc, setPdfImageSrc] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (product) {
      setActiveImageIndex(0);
      setSelectedOption(product.options[0] || '');
      setQuantity(1);
      setDownloadedSheet(false);
      setCopied(false);
      setPdfImageSrc('');
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

  const fallbackTextDownload = () => {
    const content = [
      `${siteConfig.storeName}${siteConfig.storeSubtitle ? ` | ${siteConfig.storeSubtitle}` : ''}`,
      '====================================',
      `المنتج: ${product.name}`,
      product.brand ? `الماركة: ${product.brand}` : '',
      product.category ? `القسم: ${getCategoryName(product.category)}` : '',
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
    link.download = `مواصفات_${product.name.replace(/[/\\?%*:|"<>]/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSpecs = async () => {
    if (!pdfRef.current || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      const rawImgUrl = normalizeImageSrc(images[activeImageIndex]);
      let base64Url = rawImgUrl;
      if (rawImgUrl && rawImgUrl.startsWith('http')) {
        try {
          const res = await fetch(rawImgUrl, { mode: 'cors' });
          const blob = await res.blob();
          base64Url = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (imgErr) {
          console.warn('Could not fetch image as base64, using URL:', imgErr);
        }
      }
      setPdfImageSrc(base64Url);
      await new Promise((r) => setTimeout(r, 200));

      const element = pdfRef.current;
      element.style.display = 'block';

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      element.style.display = 'none';

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = 295;

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      const safeName = (product.name || 'product').replace(/[/\\?%*:|"<>]/g, '_');
      pdf.save(`مواصفات_${safeName}.pdf`);

      setDownloadedSheet(true);
      setTimeout(() => setDownloadedSheet(false), 2500);
    } catch (err) {
      console.error('PDF generation error, falling back to text:', err);
      fallbackTextDownload();
      setDownloadedSheet(true);
      setTimeout(() => setDownloadedSheet(false), 2500);
    } finally {
      setIsGeneratingPdf(false);
      if (pdfRef.current) {
        pdfRef.current.style.display = 'none';
      }
    }
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
            {showCategory ? ` · ${getCategoryName(product.category)}` : ''}
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
                  alt={buildProductImageAlt(product, activeImageIndex + 1)}
                  loading="eager"
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

        {/* Hidden PDF Container for html2canvas */}
        <div
          ref={pdfRef}
          style={{
            display: 'none',
            width: '794px',
            direction: 'rtl',
            fontFamily: 'system-ui, sans-serif',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            padding: '32px',
            boxSizing: 'border-box',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #1d4ed8', paddingBottom: '16px', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#1d4ed8', margin: 0 }}>{siteConfig.storeName}</h1>
              {siteConfig.storeSubtitle && (
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#475569', margin: '4px 0 0 0' }}>{siteConfig.storeSubtitle}</p>
              )}
            </div>
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, backgroundColor: '#dbeafe', color: '#1e40af', padding: '4px 12px', borderRadius: '9999px' }}>
                كتالوج المواصفات الرسمية
              </span>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>تاريخ الإصدار: {new Date().toLocaleDateString('ar-EG')}</p>
            </div>
          </div>

          {/* Product Hero Section */}
          <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', alignItems: 'center', backgroundColor: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ width: '192px', height: '192px', flexShrink: 0, backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img
                src={pdfImageSrc || normalizeImageSrc(images[activeImageIndex])}
                alt={product.name}
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                {product.brand && (
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#1d4ed8', backgroundColor: '#eff6ff', padding: '2px 10px', borderRadius: '4px' }}>
                    {product.brand}
                  </span>
                )}
                {showCategory && (
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', backgroundColor: '#f1f5f9', padding: '2px 10px', borderRadius: '4px' }}>
                    {getCategoryName(product.category)}
                  </span>
                )}
                <span style={{ fontSize: '12px', fontWeight: 700, padding: '2px 10px', borderRadius: '4px', backgroundColor: product.inStock ? '#d1fae5' : '#fef3c7', color: product.inStock ? '#065f46' : '#92400e' }}>
                  {product.inStock ? 'متوفر حالياً' : 'غير متوفر'}
                </span>
              </div>

              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0', lineHeight: 1.4 }}>{product.name}</h2>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '24px', fontWeight: 900, color: '#1d4ed8' }}>{formatPriceEgp(effectivePrice)} ج.م</span>
                {hasDiscount && (
                  <span style={{ fontSize: '14px', color: '#94a3b8', textDecoration: 'line-through' }}>{formatPriceEgp(product.originalPrice)} ج.م</span>
                )}
                {hasDiscount && (
                  <span style={{ fontSize: '12px', fontWeight: 700, backgroundColor: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '4px' }}>
                    خصم {discountPct}% (توفير {formatPriceEgp(savings)} ج.م)
                  </span>
                )}
              </div>

              {product.options.length > 0 && (
                <p style={{ fontSize: '12px', color: '#475569', fontWeight: 600, margin: 0 }}>
                  الموديل / الخيارات المتاحة: {product.options.join('، ')}
                </p>
              )}
            </div>
          </div>

          {/* Short & Full Description */}
          {(product.description || product.shortDescription) && (
            <div style={{ marginBottom: '24px', backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e3a8a', margin: '0 0 8px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>الوصف التفصيلي</h3>
              <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>
                {product.description || product.shortDescription}
              </p>
            </div>
          )}

          {/* Technical Specifications */}
          {product.specs.length > 0 && (
            <div style={{ marginBottom: '24px', backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e3a8a', margin: '0 0 12px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>المواصفات الفنية والمميزات</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                {product.specs.map((spec, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '14px', backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    <span style={{ fontWeight: 700, color: '#1d4ed8', minWidth: '24px' }}>{String(idx + 1).padStart(2, '0')}.</span>
                    <span style={{ color: '#1e293b' }}>{spec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
            <div>
              <p style={{ fontWeight: 700, color: '#334155', margin: 0 }}>{siteConfig.storeName} - جميع الحقوق محفوظة</p>
              {siteConfig.whatsappUrl && <p style={{ margin: '2px 0 0 0' }}>للتواصل والطلب عبر واتساب: {siteConfig.whatsappUrl}</p>}
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: 0 }}>موقع المحلاوي ستور الرسمي</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


