import { useEffect, useState } from 'react';
import {
  ArrowUpDown,
  MapPin,
  Menu,
  MessageCircle,
  RotateCcw,
  Search,
  ShoppingBag,
  Truck,
  X,
} from 'lucide-react';
import { useSiteConfig } from '../../contexts/SiteConfigContext';
import { Product, SortOption } from '../../types/store';
import {
  calculateDiscountPercent,
  calculateSavingsAmount,
  findProductByShareParam,
  formatPriceEgp,
  getEffectiveProductPrice,
} from '../../utils/catalogLogic';
import { ProductImage } from '../ProductImage';
import { Footer } from '../Footer';
import { ThemeToggle } from '../ThemeToggle';
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
  onNavigateAbout?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  publicOrigin?: string;
  initialProductId?: string | null;
  onConsumeInitialProduct?: () => void;
}

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
  onNavigateAbout,
  isDark = false,
  onToggleTheme,
  publicOrigin,
  initialProductId,
  onConsumeInitialProduct,
}: MobileStorefrontProps) {
  const siteConfig = useSiteConfig();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null);
  const [orderProduct, setOrderProduct] = useState<Product | null>(null);

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
    if (sectionId === 'mobile-top' || sectionId === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div
      id="mobile-top"
      className="flex min-h-dvh flex-col bg-white dark:bg-[#071326] text-[#0B1F3A] dark:text-[#F0F9FF] md:hidden"
    >
      {/* 1. Simple Sticky Mobile Top Bar (<= 56px, safe-area top, <= 15% viewport height) */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#081A33]/95 backdrop-blur-md border-b border-[#D8EEFB] dark:border-[#163663] pt-[env(safe-area-inset-top)]">
        <div className="flex h-14 items-center justify-between gap-2 px-3.5">
          <a
            href="#mobile-top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 min-w-0 focus-visible:outline-2 focus-visible:outline-[#1D4ED8] rounded-lg"
            title={siteConfig.storeName}
          >
            <img
              src="/logo.png"
              alt={siteConfig.storeName}
              referrerPolicy="no-referrer"
              className="h-9 w-9 rounded-xl object-contain shadow-xs shrink-0 bg-white"
            />
            <span className="text-sm font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF] truncate">
              {siteConfig.storeName}
            </span>
          </a>

          <div className="flex items-center gap-1.5 shrink-0">
            {onToggleTheme && <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />}

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="فتح القائمة الرئيسية"
              aria-expanded={drawerOpen}
              className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl bg-[#F2FAFF] dark:bg-[#0E264A] border border-[#CBE7FA] dark:border-[#1E3F73] text-[#0B1F3A] dark:text-[#E0F2FE] active:scale-95 transition-transform cursor-pointer"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {siteConfig.announcementText.trim() && (
          <div className="bg-[#0B2354] px-3.5 py-2 text-center text-xs font-bold text-[#E0F2FE]">
            {siteConfig.announcementText.trim()}
          </div>
        )}

        {/* 2. Clear Easy-to-Use Mobile Search Bar */}
        <section
          aria-label="البحث السريع في المتجر"
          className="px-3.5 pt-3 pb-2.5 bg-white dark:bg-[#071326]"
        >
          <div className="relative flex items-center">
            <label htmlFor="mobile-store-search" className="sr-only">
              ابحث عن منتج في {siteConfig.storeName}
            </label>
            <Search
              className="pointer-events-none absolute right-3.5 h-4.5 w-4.5 text-[#0284C7] dark:text-[#38BDF8]"
              aria-hidden="true"
            />
            <input
              id="mobile-store-search"
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ابحث عن منتج، جهاز، أو ماركة..."
              className="w-full min-h-[46px] rounded-2xl bg-[#F2FAFF] dark:bg-[#0E264A] border border-[#CBE7FA] dark:border-[#1E3F73] pr-10 pl-11 py-2.5 text-sm font-semibold text-[#0B1F3A] dark:text-[#F0F9FF] placeholder:font-normal placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#081830] focus:outline-2 focus:outline-[#1D4ED8]"
            />
            {isSearching && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="مسح البحث"
                className="absolute left-1 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-500 hover:text-[#0B1F3A] dark:hover:text-[#F0F9FF] cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </section>

        {/* 3. Compact Royal-to-Sky Blue Welcome Banner */}
        {!isSearching && (
          <section aria-label={`ترحيب ${siteConfig.storeName}`} className="px-3.5 pb-4">
            <div className="rounded-2xl bg-gradient-to-br from-[#0B2354] via-[#1D4ED8] to-[#0284C7] p-4 text-white shadow-[0_8px_22px_rgba(29,78,216,0.16)]">
              <p className="text-[11px] font-bold text-[#BAE6FD]">
                {siteConfig.storeName}
                {siteConfig.storeSubtitle ? (
                  <>
                    {' '}
                    · <bdi>{siteConfig.storeSubtitle}</bdi>
                  </>
                ) : null}
              </p>

              <h1
                className="mt-1 text-lg min-[380px]:text-xl font-extrabold leading-snug text-white"
                style={{ textWrap: 'balance' }}
              >
                {siteConfig.tagline}
              </h1>

              {siteConfig.shippingSummary && (
                <p className="mt-1.5 text-xs text-[#E0F2FE]/95 leading-relaxed">
                  {siteConfig.shippingSummary}
                </p>
              )}

              <div className="mt-3.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollToSection('mobile-products-section')}
                  className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-white px-3.5 py-2 text-xs font-extrabold text-[#0B2354] active:scale-[0.98] transition-transform whitespace-nowrap cursor-pointer"
                >
                  تصفح المنتجات
                </button>

                <a
                  href={siteConfig.whatsappUrl}
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
        {!isSearching && siteConfig.showOffersSection && discountedProducts.length > 0 && (
          <section
            id="mobile-offers-section"
            aria-labelledby="mobile-offers-heading"
            className="px-3.5 py-4 bg-[#F2FAFF] dark:bg-[#081830] border-y border-[#D8EEFB] dark:border-[#163663]"
          >
            <div className="flex items-baseline justify-between gap-2 mb-3">
              <h2
                id="mobile-offers-heading"
                className="text-base font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF]"
              >
                عروض وخصومات المنتجات
              </h2>
              <span className="text-[11px] font-bold text-[#0284C7] dark:text-[#38BDF8] shrink-0">
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
                const effectivePrice = getEffectiveProductPrice(offer);
                const pct = calculateDiscountPercent(offer.originalPrice, effectivePrice);
                const savings = calculateSavingsAmount(offer.originalPrice, effectivePrice);

                return (
                  <article
                    key={offer.id}
                    className={`rounded-2xl bg-white dark:bg-[#0E264A] border border-[#CBE7FA] dark:border-[#1E3F73] p-3 flex items-center gap-3 ${
                      discountedProducts.length > 1
                        ? 'w-[86vw] max-w-[330px] shrink-0 snap-start'
                        : 'w-full'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setDetailsProduct(offer)}
                      aria-label={`تفاصيل عرض ${offer.name}`}
                      className="relative h-22 w-22 shrink-0 rounded-xl bg-[#F2FAFF] dark:bg-[#081830] border border-[#E1F2FE] dark:border-[#1E3F73] p-1.5 overflow-hidden cursor-pointer"
                    >
                      <span className="font-num absolute top-1 right-1 z-20 rounded bg-[#0B2354] dark:bg-[#1D4ED8] px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                        -{pct}%
                      </span>
                      <ProductImage
                        src={offer.images[0]}
                        alt={offer.name}
                        containerClassName="h-full w-full rounded-lg bg-[#F2FAFF] dark:bg-[#081830]"
                      />
                    </button>

                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-[#0284C7] dark:text-[#38BDF8] truncate">
                        {offer.brand ? `${offer.brand} · ` : ''}وفر{' '}
                        <bdi className="font-num">{formatPriceEgp(savings)}</bdi> ج.م
                      </p>

                      <button
                        type="button"
                        onClick={() => setDetailsProduct(offer)}
                        className="mt-0.5 block w-full text-right cursor-pointer"
                      >
                        <h3 className="text-sm font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF] leading-snug line-clamp-1">
                          {offer.name}
                        </h3>
                      </button>

                      <div className="mt-1 flex flex-wrap items-baseline gap-1.5">
                        <span className="font-num text-base font-extrabold text-[#1D4ED8] dark:text-[#38BDF8]">
                          {formatPriceEgp(effectivePrice)}
                        </span>
                        <span className="text-[11px] font-bold text-[#0F294A] dark:text-[#E0F2FE]">
                          ج.م
                        </span>
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
          className="px-3.5 py-5 bg-white dark:bg-[#071326]"
        >
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <div className="min-w-0">
              <h2
                id="mobile-catalog-heading"
                className="text-base min-[380px]:text-lg font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF] truncate"
              >
                {isSearching ? 'نتائج البحث' : 'شبكة المنتجات'}
              </h2>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
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
                  className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-[#1D4ED8] dark:text-[#38BDF8]"
                  aria-hidden="true"
                />
                <select
                  id="mobile-sort-select"
                  value={sortBy}
                  onChange={(e) => onSortChange(e.target.value as SortOption)}
                  className="min-h-[44px] rounded-xl bg-[#F2FAFF] dark:bg-[#0E264A] border border-[#CBE7FA] dark:border-[#1E3F73] pr-7 pl-2.5 py-2 text-xs font-bold text-[#0F294A] dark:text-[#E0F2FE] focus:bg-white dark:focus:bg-[#081830] focus:outline-2 focus:outline-[#1D4ED8] cursor-pointer"
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
                  className="rounded-2xl bg-white dark:bg-[#0E264A] border border-[#D8EEFB] dark:border-[#1E3F73] p-2.5 space-y-2.5"
                >
                  <div className="aspect-square w-full rounded-xl bg-[#F2FAFF] dark:bg-[#081830] animate-pulse" />
                  <div className="h-3 w-1/3 rounded bg-[#E8F4FD] dark:bg-[#1E3F73] animate-pulse" />
                  <div className="h-4 w-4/5 rounded bg-[#E8F4FD] dark:bg-[#1E3F73] animate-pulse" />
                  <div className="h-11 w-full rounded-xl bg-[#E8F4FD] dark:bg-[#1E3F73] animate-pulse mt-2" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-2xl bg-[#F2FAFF] dark:bg-[#0E264A] border border-[#D8EEFB] dark:border-[#1E3F73] p-6 text-center">
              {isSearching ? (
                <>
                  <p className="text-sm font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF] mb-1.5">
                    لا توجد منتجات مطابقة لـ «{searchQuery.trim()}»
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
                    جرّب كلمة بحث أخرى أو استعرض جميع منتجات {siteConfig.storeName}.
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
                  <p className="text-sm font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF] mb-1.5">
                    يتم تحديث قائمة المنتجات والأجهزة باستمرار
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                    تواصل معنا عبر واتساب الأعمال للاستفسار عن أحدث الموديلات والأسعار والتوافر.
                  </p>
                  <a
                    href={siteConfig.whatsappUrl}
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
                  publicOrigin={publicOrigin}
                />
              ))}
            </div>
          )}
        </section>

        {/* 6. Shipping & Delivery Section */}
        {siteConfig.showShippingSection && (
          <section
            id="mobile-shipping-section"
            aria-labelledby="mobile-shipping-heading"
            className="px-3.5 py-6 bg-[#F2FAFF] dark:bg-[#081830] border-t border-[#D8EEFB] dark:border-[#163663] space-y-4"
          >
            <div>
              <p className="text-[11px] font-bold text-[#0284C7] dark:text-[#38BDF8]">
                خدمة التوصيل والشحن
              </p>
              <h2
                id="mobile-shipping-heading"
                className="text-base min-[380px]:text-lg font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF]"
              >
                معلومات الشحن والتوصيل
              </h2>
            </div>

            <div className="rounded-2xl bg-white dark:bg-[#0E264A] border border-[#D8EEFB] dark:border-[#1E3F73] p-4 space-y-3.5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2FAFF] dark:bg-[#081830] border border-[#CBE7FA] dark:border-[#1E3F73] text-[#1D4ED8] dark:text-[#38BDF8]">
                  <Truck className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF]">
                    شحن لجميع محافظات مصر
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {siteConfig.shippingSummary}
                  </p>
                </div>
              </div>

              {siteConfig.address && (
                <div className="border-t border-[#EBF6FE] dark:border-[#1E3F73] pt-3.5 flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2FAFF] dark:bg-[#081830] border border-[#CBE7FA] dark:border-[#1E3F73] text-[#0284C7] dark:text-[#38BDF8]">
                    <MapPin className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF]">
                      موقع المتجر والتوصيل المباشر
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      مقرنا في {siteConfig.address}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* 7. Unified Footer */}
      <Footer onAdminButtonClick={onAdminButtonClick} onNavigateAbout={onNavigateAbout} />

      {/* Mobile Navigation Slide-Over Drawer */}
      <MobileMenuDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigateSection={scrollToSection}
        onNavigateAbout={onNavigateAbout}
        onAdminClick={onAdminButtonClick}
        hasDiscountOffers={discountedProducts.length > 0 && siteConfig.showOffersSection}
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

