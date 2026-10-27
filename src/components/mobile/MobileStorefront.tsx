import { useEffect, useState } from 'react';
import {
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  LayoutDashboard,
  MapPin,
  Menu,
  MessageCircle,
  RotateCcw,
  Search,
  ShoppingBag,
  Truck,
  Wrench,
  X,
} from 'lucide-react';
import { PARTNER_INFO, Product, SortOption, STORE_INFO } from '../../types/store';
import {
  calculateDiscountPercent,
  calculateSavingsAmount,
  findProductByShareParam,
  formatPriceEgp,
} from '../../utils/catalogLogic';
import { ProductImage } from '../ProductImage';
import { MobileMenuDrawer } from './MobileMenuDrawer';
import { MobileOrderSheet } from './MobileOrderSheet';
import { MobileProductCard } from './MobileProductCard';
import { MobileProductSheet } from './MobileProductSheet';

interface MobileStorefrontProps {
  products: Product[];
  filteredProducts: Product[];
  discountedProducts: Product[];
  isLoadingProducts: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onAdminButtonClick: () => void;
  publicOrigin?: string;
  initialProductId?: string | null;
  onConsumeInitialProduct?: () => void;
}

const MOBILE_STORE_OFFERINGS = [
  'عرض المنتجات والأجهزة المتاحة مع صورها ومواصفاتها.',
  'استعراض أحدث الموديلات والأسعار والعروض الحقيقية.',
  'مساعدة العملاء على اختيار المنتج الأنسب لاحتياجاتهم.',
  'استقبال الاستفسارات والطلبات مباشرة عبر واتساب الأعمال.',
];

const MOBILE_PARTNER_SERVICES = [
  'أنظمة المنزل الذكي (Smart Home) والتحكم في الإضاءة',
  'توريد وتركيب كاميرات المراقبة وأنظمة الستالايت',
  'أنظمة إنذار الحريق (Fire Alarm) والتحكم في الدخول (Access Control)',
  'خدمات الصيانة والدعم الفني والضمان وما بعد البيع',
];

export function MobileStorefront({
  products,
  filteredProducts,
  discountedProducts,
  isLoadingProducts,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  onAdminButtonClick,
  publicOrigin,
  initialProductId,
  onConsumeInitialProduct,
}: MobileStorefrontProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null);
  const [orderProduct, setOrderProduct] = useState<Product | null>(null);
  const [showAllPartnerInfo, setShowAllPartnerInfo] = useState(false);

  useEffect(() => {
    if (!initialProductId || products.length === 0) return;
    if (typeof window !== 'undefined' && window.innerWidth >= 768) return;
    const matched = findProductByShareParam(products, initialProductId);
    if (matched) {
      setDetailsProduct(matched);
      onConsumeInitialProduct?.();
    }
  }, [initialProductId, products, onConsumeInitialProduct]);

  const scrollToSection = (sectionId: string) => {
    if (sectionId === 'mobile-top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div id="mobile-top" className="flex min-h-dvh flex-col bg-white text-[#0B1F3A] md:hidden">
      {/* 1. Simple Sticky Mobile Top Bar (<= 56px, safe-area top, <= 15% viewport height) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#D8EEFB] pt-[env(safe-area-inset-top)]">
        <div className="flex h-14 items-center justify-between gap-2 px-3.5">
          <a
            href="#mobile-top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex min-w-0 items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-[#1D4ED8] rounded-lg"
          >
            <img
              src="/logo.png"
              alt={STORE_INFO.storeName}
              className="h-9 w-9 rounded-xl object-contain shadow-xs shrink-0 bg-white"
            />

            <div className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-extrabold text-[#0B1F3A]">
                {STORE_INFO.storeName}
              </span>
              <span className="block truncate text-[11px] font-bold text-[#0284C7]">
                <bdi>{STORE_INFO.storeSubtitle}</bdi>
              </span>
            </div>
          </a>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="فتح القائمة الرئيسية"
            aria-expanded={drawerOpen}
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] text-[#0B1F3A] active:scale-95 transition-transform cursor-pointer"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      <main className="flex-1">
        {/* 2. Clear Easy-to-Use Mobile Search Bar */}
        <section aria-label="البحث السريع في المتجر" className="px-3.5 pt-3 pb-2.5 bg-white">
          <div className="relative flex items-center">
            <label htmlFor="mobile-store-search" className="sr-only">
              ابحث عن منتج في المحلاوي ستور
            </label>
            <Search
              className="pointer-events-none absolute right-3.5 h-4.5 w-4.5 text-[#0284C7]"
              aria-hidden="true"
            />
            <input
              id="mobile-store-search"
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ابحث عن منتج، جهاز، أو ماركة..."
              className="w-full min-h-[46px] rounded-2xl bg-[#F2FAFF] border border-[#CBE7FA] pr-10 pl-11 py-2.5 text-sm font-semibold text-[#0B1F3A] placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:outline-2 focus:outline-[#1D4ED8]"
            />
            {isSearching && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="مسح البحث"
                className="absolute left-1 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-500 hover:text-[#0B1F3A] cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </section>

        {/* 3. Compact Royal-to-Sky Blue Welcome Banner */}
        {!isSearching && (
          <section aria-label="ترحيب المحلاوي ستور" className="px-3.5 pb-4">
            <div className="rounded-2xl bg-gradient-to-br from-[#0B2354] via-[#1D4ED8] to-[#0284C7] p-4 text-white shadow-[0_8px_22px_rgba(29,78,216,0.16)]">
              <p className="text-[11px] font-bold text-[#BAE6FD]">
                {STORE_INFO.storeName} · <bdi>{STORE_INFO.storeSubtitle}</bdi>
              </p>

              <h1
                className="mt-1 text-lg min-[380px]:text-xl font-extrabold leading-snug text-white"
                style={{ textWrap: 'balance' }}
              >
                {STORE_INFO.tagline}
              </h1>

              <p className="mt-1.5 text-xs text-[#E0F2FE]/95 leading-relaxed">
                استعرض أحدث الأجهزة والمواصفات والأسعار مع الشحن لجميع محافظات مصر والتوصيل داخل
                شرم الشيخ.
              </p>

              <div className="mt-3.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollToSection('mobile-products-section')}
                  className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-white px-3.5 py-2 text-xs font-extrabold text-[#0B2354] active:scale-[0.98] transition-transform whitespace-nowrap cursor-pointer"
                >
                  تصفح المنتجات
                </button>

                <a
                  href={STORE_INFO.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-white/15 border border-white/25 px-3.5 py-2 text-xs font-bold text-white whitespace-nowrap"
                >
                  <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>واتساب الأعمال</span>
                </a>
              </div>
            </div>
          </section>
        )}

        {/* 4. Product Offers & Discounts Section */}
        {!isSearching && discountedProducts.length > 0 && (
          <section
            id="mobile-offers-section"
            aria-labelledby="mobile-offers-heading"
            className="px-3.5 py-4 bg-[#F2FAFF] border-y border-[#D8EEFB]"
          >
            <div className="flex items-baseline justify-between gap-2 mb-3">
              <h2
                id="mobile-offers-heading"
                className="text-base font-extrabold text-[#0B1F3A]"
              >
                عروض وخصومات المنتجات
              </h2>
              <span className="text-[11px] font-bold text-[#0284C7] shrink-0">
                {discountedProducts.length === 1
                  ? 'عرض مميز مفعّل'
                  : `${discountedProducts.length} عروض متاحة`}
              </span>
            </div>

            <div
              className={
                discountedProducts.length === 1
                  ? 'block'
                  : 'flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 no-scrollbar'
              }
            >
              {discountedProducts.map((offer) => {
                const pct = calculateDiscountPercent(offer.originalPrice, offer.price);
                const savings = calculateSavingsAmount(offer.originalPrice, offer.price);

                return (
                  <article
                    key={offer.id}
                    className={`rounded-2xl bg-white border border-[#CBE7FA] p-3 flex items-center gap-3 ${
                      discountedProducts.length > 1
                        ? 'w-[86vw] max-w-[330px] shrink-0 snap-start'
                        : 'w-full'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setDetailsProduct(offer)}
                      aria-label={`تفاصيل عرض ${offer.name}`}
                      className="relative h-22 w-22 shrink-0 rounded-xl bg-[#F2FAFF] border border-[#E1F2FE] p-1.5 overflow-hidden cursor-pointer"
                    >
                      <span className="font-num absolute top-1 right-1 z-20 rounded bg-[#0B2354] px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                        -{pct}%
                      </span>
                      <ProductImage
                        src={offer.images[0]}
                        alt={offer.name}
                        containerClassName="h-full w-full rounded-lg bg-[#F2FAFF]"
                      />
                    </button>

                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-[#0284C7] truncate">
                        {offer.brand} · وفر{' '}
                        <bdi className="font-num">{formatPriceEgp(savings)}</bdi> ج.م
                      </p>

                      <button
                        type="button"
                        onClick={() => setDetailsProduct(offer)}
                        className="mt-0.5 block w-full text-right cursor-pointer"
                      >
                        <h3 className="text-sm font-extrabold text-[#0B1F3A] leading-snug line-clamp-1">
                          {offer.name}
                        </h3>
                      </button>

                      <div className="mt-1 flex flex-wrap items-baseline gap-1.5">
                        <span className="font-num text-base font-extrabold text-[#1D4ED8]">
                          {formatPriceEgp(offer.price)}
                        </span>
                        <span className="text-[11px] font-bold text-[#0F294A]">ج.م</span>
                        <span className="font-num text-[11px] text-slate-400 line-through">
                          {formatPriceEgp(offer.originalPrice)} ج.م
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setOrderProduct(offer)}
                        aria-label={`طلب عرض ${offer.name}`}
                        className="mt-2 inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl bg-[#1D4ED8] active:scale-[0.98] px-3 py-2 text-xs font-extrabold text-white whitespace-nowrap cursor-pointer"
                      >
                        <ShoppingBag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>طلب العرض الآن</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* 5. Responsive Mobile Products Grid (1 col at 320px, 2 cols at 350px+) */}
        <section
          id="mobile-products-section"
          aria-labelledby="mobile-catalog-heading"
          className="px-3.5 py-5 bg-white"
        >
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <div className="min-w-0">
              <h2
                id="mobile-catalog-heading"
                className="text-base min-[380px]:text-lg font-extrabold text-[#0B1F3A] truncate"
              >
                {isSearching ? 'نتائج البحث' : 'شبكة المنتجات'}
              </h2>
              <p className="text-[11px] font-semibold text-slate-500">
                {isLoadingProducts && products.length === 0
                  ? 'جاري تحميل المنتجات...'
                  : `${filteredProducts.length} منتج متاح للعرض`}
              </p>
            </div>

            {products.length > 0 && (
              <div className="relative flex items-center shrink-0">
                <label htmlFor="mobile-sort-select" className="sr-only">
                  ترتيب المنتجات
                </label>
                <ArrowUpDown
                  className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-[#1D4ED8]"
                  aria-hidden="true"
                />
                <select
                  id="mobile-sort-select"
                  value={sortBy}
                  onChange={(e) => onSortChange(e.target.value as SortOption)}
                  className="min-h-[44px] rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] pr-7 pl-2.5 py-2 text-xs font-bold text-[#0F294A] focus:bg-white focus:outline-2 focus:outline-[#1D4ED8] cursor-pointer"
                >
                  <option value={SortOption.NEWEST}>الأحدث</option>
                  <option value={SortOption.PRICE_ASC}>الأقل سعرًا</option>
                  <option value={SortOption.PRICE_DESC}>الأعلى سعرًا</option>
                  <option value={SortOption.DISCOUNT_DESC}>الأعلى خصمًا</option>
                </select>
              </div>
            )}
          </div>

          {isLoadingProducts && products.length === 0 ? (
            <div
              aria-label="جاري تحميل المنتجات"
              className="grid grid-cols-1 min-[350px]:grid-cols-2 gap-3"
            >
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-white border border-[#D8EEFB] p-2.5 space-y-2.5"
                >
                  <div className="aspect-square w-full rounded-xl bg-[#F2FAFF] animate-pulse" />
                  <div className="h-3 w-1/3 rounded bg-[#E8F4FD] animate-pulse" />
                  <div className="h-4 w-4/5 rounded bg-[#E8F4FD] animate-pulse" />
                  <div className="h-11 w-full rounded-xl bg-[#E8F4FD] animate-pulse mt-2" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-2xl bg-[#F2FAFF] border border-[#D8EEFB] p-6 text-center">
              {isSearching ? (
                <>
                  <p className="text-sm font-extrabold text-[#0B1F3A] mb-1.5">
                    لا توجد منتجات مطابقة لـ «{searchQuery.trim()}»
                  </p>
                  <p className="text-xs text-slate-600 mb-4">
                    جرّب كلمة بحث أخرى أو استعرض جميع منتجات المحلاوي ستور.
                  </p>
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-4 py-2.5 text-xs font-extrabold text-white whitespace-nowrap cursor-pointer"
                  >
                    <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>عرض كل المنتجات</span>
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm font-extrabold text-[#0B1F3A] mb-1.5">
                    يتم تحديث قائمة المنتجات والأجهزة باستمرار
                  </p>
                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                    تواصل معنا عبر واتساب الأعمال للاستفسار عن أحدث الموديلات والأسعار والتوافر.
                  </p>
                  <a
                    href={STORE_INFO.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-4 py-2.5 text-xs font-extrabold text-white whitespace-nowrap"
                  >
                    <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>تواصل عبر واتساب الأعمال</span>
                  </a>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 min-[350px]:grid-cols-2 gap-3">
              {filteredProducts.map((product) => (
                <MobileProductCard
                  key={product.id}
                  product={product}
                  onOpenDetails={(p) => setDetailsProduct(p)}
                  onOrderProduct={(p) => setOrderProduct(p)}
                />
              ))}
            </div>
          )}
        </section>

        {/* 6. Shipping, Delivery & Store / Infinity Corp Services */}
        <section
          id="mobile-shipping-section"
          aria-labelledby="mobile-shipping-heading"
          className="px-3.5 py-6 bg-[#F2FAFF] border-t border-[#D8EEFB] space-y-4"
        >
          <div>
            <p className="text-[11px] font-bold text-[#0284C7]">خدمة التوصيل والشحن</p>
            <h2
              id="mobile-shipping-heading"
              className="text-base min-[380px]:text-lg font-extrabold text-[#0B1F3A]"
            >
              معلومات الشحن والتوصيل
            </h2>
          </div>

          {/* Shipping & Local Delivery Highlights */}
          <div className="rounded-2xl bg-white border border-[#D8EEFB] p-4 space-y-3.5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] text-[#1D4ED8]">
                <Truck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-[#0B1F3A]">
                  شحن لجميع محافظات مصر
                </h3>
                <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                  نوفّر شحنًا منظمًا وتغليفًا آمنًا لكافة المحافظات مع تأكيد تفاصيل الطلب والتكلفة
                  مباشرة عبر واتساب.
                </p>
              </div>
            </div>

            <div className="border-t border-[#EBF6FE] pt-3.5 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] text-[#0284C7]">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-[#0B1F3A]">
                  توصيل سريع داخل شرم الشيخ
                </h3>
                <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                  مقرنا في {STORE_INFO.address} مع خدمة توصيل سريعة ومباشرة داخل مدينة شرم الشيخ.
                </p>
              </div>
            </div>
          </div>

          {/* Store Offerings & Infinity Corp Partnership Card */}
          <div
            id="mobile-infinity-corp"
            className="rounded-2xl bg-white border border-[#D8EEFB] p-4 space-y-3"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] text-[#1D4ED8]">
                <Wrench className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-[#0284C7]">
                  تكامل المنتجات والحلول الفنية
                </p>
                <h3 className="text-sm font-extrabold text-[#0B1F3A] leading-snug">
                  المحلاوي ستور × <bdi>{PARTNER_INFO.partnerName}</bdi>
                </h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  يعرض المحلاوي ستور أحدث الأجهزة والموديلات، بينما تتولى{' '}
                  <bdi className="font-bold text-[#0B1F3A]">{PARTNER_INFO.partnerName}</bdi> (شريك
                  النجاح) خدمات الأنظمة الذكية والتركيب والصيانة والدعم الفني.
                </p>
              </div>
            </div>

            {showAllPartnerInfo && (
              <div className="pt-2 border-t border-[#EBF6FE] space-y-3">
                <div>
                  <p className="text-xs font-extrabold text-[#0B1F3A] mb-1.5">
                    ماذا يقدم المحلاوي ستور؟
                  </p>
                  <ul className="space-y-1.5">
                    {MOBILE_STORE_OFFERINGS.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed"
                      >
                        <CheckCircle2
                          className="h-3.5 w-3.5 text-[#0284C7] shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-extrabold text-[#0B1F3A] mb-1.5">
                    خدمات <bdi>Infinity Corp</bdi> التقنية:
                  </p>
                  <ul className="space-y-1.5">
                    {MOBILE_PARTNER_SERVICES.map((srv) => (
                      <li
                        key={srv}
                        className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed"
                      >
                        <CheckCircle2
                          className="h-3.5 w-3.5 text-[#1D4ED8] shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>{srv}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowAllPartnerInfo((prev) => !prev)}
              aria-expanded={showAllPartnerInfo}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] px-3 py-2 text-xs font-bold text-[#0F294A] cursor-pointer"
            >
              <span>
                {showAllPartnerInfo
                  ? 'إخفاء تفاصيل الخدمات'
                  : 'عرض خدمات المتجر وشريك النجاح Infinity Corp'}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-[#1D4ED8] transition-transform ${
                  showAllPartnerInfo ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>
          </div>
        </section>
      </main>

      {/* 7. Mobile Contact Information & Footer (with bottom safe-area inset) */}
      <footer
        id="mobile-footer-contact"
        className="bg-[#0B1F3A] text-white px-4 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
      >
        <div className="space-y-5">
          {/* Brand Summary */}
          <div>
            <p className="text-base font-extrabold text-white">
              {STORE_INFO.storeName} <span className="text-[#38BDF8]">|</span>{' '}
              <bdi className="text-[#BAE6FD]">{STORE_INFO.storeSubtitle}</bdi>
            </p>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed">{STORE_INFO.tagline}</p>
            <p className="mt-1.5 text-xs text-[#BAE6FD] flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{STORE_INFO.address}</span>
            </p>
          </div>

          {/* El Mahlawy Store Official Contact Buttons */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-[#7DD3FC]">تواصل مع المحلاوي ستور</p>
            <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2">
              <a
                href={STORE_INFO.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] px-3 py-2.5 text-xs font-extrabold text-white whitespace-nowrap"
              >
                <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  واتساب <bdi className="font-num">{STORE_INFO.primaryPhone}</bdi>
                </span>
              </a>

              <a
                href={STORE_INFO.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/15 px-3 py-2.5 text-xs font-bold text-white whitespace-nowrap"
              >
                <ExternalLink className="h-4 w-4 text-[#38BDF8] shrink-0" aria-hidden="true" />
                <span>صفحة <bdi>Facebook</bdi></span>
              </a>
            </div>
          </div>

          {/* Infinity Corp Partner Official Contact Buttons */}
          <div className="space-y-2 border-t border-white/10 pt-4">
            <p className="text-xs font-bold text-[#7DD3FC]">
              شركاء النجاح | <bdi>{PARTNER_INFO.partnerName}</bdi> للأنظمة الذكية والتركيبات
            </p>
            <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2">
              <a
                href={PARTNER_INFO.orderWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/15 px-3 py-2.5 text-xs font-bold text-white whitespace-nowrap"
              >
                <MessageCircle className="h-4 w-4 text-[#38BDF8] shrink-0" aria-hidden="true" />
                <span>
                  واتساب <bdi className="font-num">{PARTNER_INFO.orderPhones[0]}</bdi>
                </span>
              </a>

              <a
                href={PARTNER_INFO.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/15 px-3 py-2.5 text-xs font-bold text-white whitespace-nowrap"
              >
                <ExternalLink className="h-4 w-4 text-[#38BDF8] shrink-0" aria-hidden="true" />
                <span>فيسبوك <bdi>Infinity Corp</bdi></span>
              </a>
            </div>
          </div>

          {/* Copyright & Admin Trigger */}
          <div className="border-t border-white/10 pt-4 flex items-center justify-between gap-2 text-[11px] text-slate-400">
            <span className="truncate">
              © {new Date().getFullYear()} {STORE_INFO.storeName}
            </span>
            <button
              type="button"
              onClick={onAdminButtonClick}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-300 hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-[#38BDF8]" aria-hidden="true" />
              <span>لوحة الإدارة</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Navigation Slide-Over Drawer */}
      <MobileMenuDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigateSection={scrollToSection}
        onAdminClick={onAdminButtonClick}
        hasDiscountOffers={discountedProducts.length > 0}
      />

      {/* Mobile Product Details Bottom Sheet */}
      <MobileProductSheet
        product={detailsProduct}
        onClose={() => setDetailsProduct(null)}
        onOrderProduct={(p) => setOrderProduct(p)}
        publicOrigin={publicOrigin}
      />

      {/* Mobile Dedicated WhatsApp Order Bottom Sheet */}
      <MobileOrderSheet
        product={orderProduct}
        onClose={() => setOrderProduct(null)}
        publicOrigin={publicOrigin}
      />
    </div>
  );
}
