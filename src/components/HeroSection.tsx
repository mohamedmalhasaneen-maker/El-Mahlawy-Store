import {
  ArrowDownLeft,
  CheckCircle2,
  Cpu,
  Layers,
  MessageCircle,
  Search,
  X,
} from 'lucide-react';
import { useSiteConfig } from '../contexts/SiteConfigContext';
import { Product } from '../types/store';
import { FeaturedSpotlightCarousel } from './FeaturedSpotlightCarousel';

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  featuredProduct?: Product;
  featuredProducts?: Product[];
  onSelectProduct: (product: Product) => void;
  hasDiscountOffers: boolean;
  publicOrigin?: string;
}

export function HeroSection({
  searchQuery,
  onSearchChange,
  featuredProduct,
  featuredProducts = [],
  onSelectProduct,
  hasDiscountOffers,
  publicOrigin,
}: HeroSectionProps) {
  const siteConfig = useSiteConfig();

  const getBannerStyle = (): React.CSSProperties => {
    if (siteConfig.heroBgType === 'image' && siteConfig.heroBgImage) {
      return {
        backgroundImage: `url(${siteConfig.heroBgImage})`,
        backgroundSize: siteConfig.heroBgFit || 'cover',
        backgroundPosition: siteConfig.heroBgPosition || 'center',
        backgroundRepeat: 'no-repeat',
      };
    }
    if (siteConfig.heroBgType === 'color') {
      return {
        backgroundColor: siteConfig.heroBgColor || '#0B2354',
      };
    }
    const c1 = siteConfig.heroBgColor || '#0B2354';
    const c2 = siteConfig.heroBgColor2 || '#0EA5E9';
    const dir = siteConfig.heroBgGradientDirection || 'to-bl';
    const directionMap: Record<string, string> = {
      'to-bl': 'to bottom left',
      'to-br': 'to bottom right',
      'to-tl': 'to top left',
      'to-tr': 'to top right',
      'to-r': 'to right',
      'to-l': 'to left',
      'to-t': 'to top',
      'to-b': 'to bottom',
    };
    const cssDir = directionMap[dir] || dir || 'to bottom left';
    if (c1.toLowerCase() === '#0b2354' && c2.toLowerCase() === '#0ea5e9' && (dir === 'to-bl' || !dir)) {
      return {
        backgroundImage: `linear-gradient(${cssDir}, #0B2354, #164BB0, #0EA5E9)`,
      };
    }
    return {
      backgroundImage: `linear-gradient(${cssDir}, ${c1}, ${c2})`,
    };
  };

  const scrollToProducts = () => {
    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToOffers = () => {
    document.getElementById('offers-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    scrollToProducts();
  };

  const showSpotlight = Boolean(
    siteConfig.showHeroSpotlight && (featuredProducts.length > 0 || featuredProduct)
  );

  return (
    <section id="top" className="relative overflow-hidden bg-white">
      {siteConfig.announcementText.trim() && (
        <div className="bg-[#0B2354] border-b border-white/15 px-4 py-2 text-center text-xs sm:text-sm font-bold text-[#E0F2FE]">
          <div className="mx-auto max-w-7xl truncate">{siteConfig.announcementText.trim()}</div>
        </div>
      )}

      {/* Main Welcome Banner */}
      <div className="relative overflow-hidden text-white" style={getBannerStyle()}>
        {/* Custom Overlay Layer */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundColor: siteConfig.heroOverlayColor || '#000000',
            opacity:
              typeof siteConfig.heroOverlayOpacity === 'number'
                ? siteConfig.heroOverlayOpacity
                : 0.2,
          }}
        />

        {/* Subtle Water-Inspired Geometric Contours (shown for gradient/color modes) */}
        {siteConfig.heroBgType !== 'image' && (
          <svg
            aria-hidden="true"
            viewBox="0 0 1440 560"
            fill="none"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full opacity-20 z-0"
          >
            <circle cx="180" cy="90" r="240" stroke="#BAE6FD" strokeWidth="1.5" />
            <circle cx="180" cy="90" r="340" stroke="#7DD3FC" strokeWidth="1" />
            <path
              d="M-100 430 C 320 310, 680 540, 1120 390 C 1300 330, 1420 380, 1540 350"
              stroke="#E0F2FE"
              strokeWidth="1.5"
            />
            <path
              d="M-100 490 C 360 370, 740 580, 1180 440 C 1340 390, 1440 420, 1540 400"
              stroke="#7DD3FC"
              strokeWidth="1.2"
            />
          </svg>
        )}

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            {/* Right Column (RTL): Official Identity, Headline, Search Bar, CTAs */}
            <div
              className={`${
                showSpotlight ? 'lg:col-span-7' : 'lg:col-span-9'
              } flex flex-col justify-center`}
            >
              <p className="text-xs sm:text-sm font-bold text-[#BAE6FD] tracking-wide mb-3">
                {siteConfig.storeName}
                {siteConfig.storeSubtitle ? (
                  <>
                    {' '}
                    | <bdi>{siteConfig.storeSubtitle}</bdi>
                  </>
                ) : null}
              </p>

              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold leading-[1.24] text-white mb-4 text-balance">
                <span className="sr-only">{siteConfig.storeName} | Elmahlawy Store — </span>
                {siteConfig.tagline}
              </h1>

              {siteConfig.heroDescription && (
                <p className="text-sm sm:text-base lg:text-lg text-[#E0F2FE] leading-relaxed max-w-2xl mb-6">
                  {siteConfig.heroDescription}
                </p>
              )}

              {/* Prominent Accessible Search Bar */}
              <form
                onSubmit={handleSearchSubmit}
                role="search"
                aria-label="البحث عن المنتجات"
                className="relative max-w-xl mb-6"
              >
                <label htmlFor="hero-product-search" className="sr-only">
                  ابحث عن منتج أو ماركة أو مواصفات
                </label>
                <div className="relative flex items-center rounded-2xl bg-white p-1.5 shadow-[0_12px_32px_rgba(8,26,51,0.22)]">
                  <Search
                    className="mr-3 ml-2 h-5 w-5 text-[#1D4ED8] shrink-0"
                    aria-hidden="true"
                  />
                  <input
                    id="hero-product-search"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="ابحث في المنتجات والأجهزة والموديلات المتاحة..."
                    className="w-full min-h-[42px] bg-transparent text-sm sm:text-base text-[#0B1F3A] placeholder:text-slate-400 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => onSearchChange('')}
                      aria-label="مسح البحث"
                      className="p-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="min-h-[42px] rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    بحث
                  </button>
                </div>
              </form>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={scrollToProducts}
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-white px-6 py-2.5 text-sm sm:text-base font-extrabold text-[#0F294A] shadow-sm hover:bg-[#F2FAFF] transition-transform duration-150 active:scale-[0.99] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <span>تصفح المنتجات</span>
                  <ArrowDownLeft className="h-4 w-4 text-[#1D4ED8]" aria-hidden="true" />
                </button>

                <a
                  href={siteConfig.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-white/14 hover:bg-white/22 border border-white/35 px-5 py-2.5 text-sm sm:text-base font-bold text-white transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>واتساب الأعمال</span>
                </a>

                {hasDiscountOffers && siteConfig.showOffersSection && (
                  <button
                    type="button"
                    onClick={scrollToOffers}
                    className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/18 border border-white/25 px-4 py-2.5 text-xs sm:text-sm font-bold text-[#E0F2FE] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <span>عروض وخصومات المتجر</span>
                  </button>
                )}
              </div>
            </div>

            {/* Left Column (RTL): Auto-Playing Featured Product Spotlight Pedestal */}
            {showSpotlight && (
              <div className="lg:col-span-5 flex items-center justify-center">
                <FeaturedSpotlightCarousel
                  featuredProducts={featuredProducts}
                  fallbackProduct={featuredProduct}
                  onSelectProduct={onSelectProduct}
                  publicOrigin={publicOrigin}
                  variant="desktop"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Soft Harmonious Value & Partnership Strip */}
      {siteConfig.showValueStrip && (
        <div className="bg-[#F2FAFF] dark:bg-[#081830] border-b border-[#D8EEFB] dark:border-[#163663]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 text-xs sm:text-sm text-[#0F294A] dark:text-[#E0F2FE]">
              <div className="flex items-center gap-3 py-1">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-[#0E264A] border border-[#CBE7FA] dark:border-[#1E3F73] text-[#1D4ED8] dark:text-[#38BDF8]">
                  <Layers className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-bold text-[#0B1F3A] dark:text-[#F0F9FF]">
                    أحدث المنتجات والموديلات
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    استعراض شامل للأجهزة المتاحة
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 py-1">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-[#0E264A] border border-[#CBE7FA] dark:border-[#1E3F73] text-[#0284C7] dark:text-[#38BDF8]">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-bold text-[#0B1F3A] dark:text-[#F0F9FF]">
                    صور ومواصفات واضحة
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    تعرف على الإمكانيات لاختيار الأنسب
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 py-1">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-[#0E264A] border border-[#CBE7FA] dark:border-[#1E3F73] text-[#1D4ED8] dark:text-[#38BDF8]">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-bold text-[#0B1F3A] dark:text-[#F0F9FF]">
                    تواصل عبر واتساب الأعمال
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    للاستفسار عن الأسعار والتوافر فورًا
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 py-1">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-[#0E264A] border border-[#CBE7FA] dark:border-[#1E3F73] text-[#0284C7] dark:text-[#38BDF8]">
                  <Cpu className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-bold text-[#0B1F3A] dark:text-[#F0F9FF]">
                    شريك النجاح <bdi>{siteConfig.partnerName}</bdi>
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    أنظمة ذكية وتركيبات ودعم فني
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

