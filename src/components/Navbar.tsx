import { LayoutDashboard } from 'lucide-react';
import { useSiteConfig } from '../contexts/SiteConfigContext';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  activeView: 'store' | 'about' | 'developer';
  onSwitchView: (view: 'store' | 'about' | 'developer') => void;
  onAdminButtonClick: () => void;
  hasDiscountOffers: boolean;
  isDark?: boolean;
  onToggleTheme?: () => void;
  onOpenRatingModal?: () => void;
}

export function Navbar({
  activeView,
  onSwitchView,
  onAdminButtonClick,
  hasDiscountOffers,
  isDark = false,
  onToggleTheme,
  onOpenRatingModal,
}: NavbarProps) {
  const siteConfig = useSiteConfig();

  const handleNavClick = (sectionId: string) => {
    if (activeView !== 'store') {
      onSwitchView('store');
      setTimeout(() => {
        const target = document.getElementById(sectionId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 80);
    } else {
      const target = document.getElementById(sectionId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 h-14 md:h-16 bg-white/95 dark:bg-[#081A33]/95 backdrop-blur-md border-b border-[#D8EEFB] dark:border-[#163663] transition-colors">
      <style>{`
        div#root:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > header:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) {
          display: none !important;
        }
      `}</style>
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-3 md:gap-6 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onSwitchView('store');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-2.5 text-[13px] sm:text-lg font-extrabold tracking-tight text-[#0B1F3A] dark:text-[#F0F9FF] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] rounded-md"
        >
          <img
            src="/logo.png"
            alt={siteConfig.storeName}
            referrerPolicy="no-referrer"
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl object-contain shadow-xs shrink-0 bg-white p-0.5"
          />
          <span>
            {siteConfig.storeName}
            {siteConfig.storeSubtitle ? (
              <>
                {' '}
                <span className="text-[#0284C7] font-bold">|</span>{' '}
                <bdi className="font-bold text-[#1E3A8A] dark:text-[#7DD3FC]">
                  {siteConfig.storeSubtitle}
                </bdi>
              </>
            ) : null}
          </span>
        </a>

        {/* Zone 2: Clean single-line navigation links */}
        <nav
          aria-label="التنقل الرئيسي"
          className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600 dark:text-slate-200"
        >
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              onSwitchView('store');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hover:text-[#1D4ED8] dark:hover:text-[#38BDF8] transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:border-[#38BDF8]"
          >
            الرئيسية
          </a>
          {hasDiscountOffers && siteConfig.showOffersSection && (
            <a
              href="#offers-section"
              onClick={() => handleNavClick('offers-section')}
              className="hover:text-[#1D4ED8] dark:hover:text-[#38BDF8] transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:border-[#38BDF8]"
            >
              العروض والخصومات
            </a>
          )}
          <a
            href="#products-section"
            onClick={() => handleNavClick('products-section')}
            className="hover:text-[#1D4ED8] dark:hover:text-[#38BDF8] transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:border-[#38BDF8]"
          >
            المنتجات
          </a>
          <button
            type="button"
            onClick={() => onSwitchView('about')}
            className="hover:text-[#1D4ED8] dark:hover:text-[#38BDF8] transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:border-[#38BDF8] cursor-pointer"
          >
            من نحن | About Us
          </button>
          <a
            href="#footer-contact"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('footer-contact');
            }}
            className="hover:text-[#1D4ED8] dark:hover:text-[#38BDF8] transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:border-[#38BDF8]"
          >
            تواصل معنا
          </a>
          {onOpenRatingModal && siteConfig.showRatingsSection !== false && (
            <button
              type="button"
              onClick={onOpenRatingModal}
              className="hover:text-[#1D4ED8] dark:hover:text-[#38BDF8] transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:border-[#38BDF8] cursor-pointer"
            >
              تقييم المتجر
            </button>
          )}
          {onToggleTheme && (
            <div className="ms-1 ps-3 border-r border-slate-200 dark:border-slate-700 flex items-center shrink-0">
              <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
            </div>
          )}
        </nav>

        {/* Zone 3: Actions (Theme Toggle & Developer Settings) */}
        <div className="flex items-center gap-2 shrink-0">
          {onToggleTheme && <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />}

          {activeView === 'store' && (
            <button
              type="button"
              onClick={onAdminButtonClick}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-[#F2FAFF] dark:bg-[#0E264A] px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold text-[#0F294A] dark:text-[#E0F2FE] border border-[#CBE7FA] dark:border-[#1E3F73] hover:bg-[#E2F3FE] dark:hover:bg-[#163868] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
            >
              <LayoutDashboard
                className="h-4 w-4 text-[#1D4ED8] dark:text-[#38BDF8]"
                aria-hidden="true"
              />
              <span>إعدادات المطور</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

