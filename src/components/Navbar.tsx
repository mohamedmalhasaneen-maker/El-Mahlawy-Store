import { useEffect, useRef, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useSiteConfig } from '../contexts/SiteConfigContext';
import { useCart } from '../contexts/CartContext';
import { ThemeToggle } from './ThemeToggle';
import { PWAInstallButton } from './PWAInstallButton';
import {
  findVisibleElementById,
  smoothScrollToElement,
  smoothScrollToTop,
} from '../utils/smoothScroll';

interface NavbarProps {
  activeView: 'store' | 'about' | 'developer';
  onSwitchView: (view: 'store' | 'about' | 'developer') => void;
  onAdminButtonClick: () => void;
  hasDiscountOffers: boolean;
  isDark?: boolean;
  onToggleTheme?: () => void;
  onOpenRatingModal?: () => void;
  onOpenCart?: () => void;
}

type NavSectionKey = 'home' | 'offers' | 'products' | 'about' | 'contact' | 'ratings';

export function Navbar({
  activeView,
  onSwitchView,
  onAdminButtonClick,
  hasDiscountOffers,
  isDark = false,
  onToggleTheme,
  onOpenRatingModal,
  onOpenCart,
}: NavbarProps) {
  const siteConfig = useSiteConfig();
  const { totals } = useCart();
  const [activeSection, setActiveSection] = useState<NavSectionKey>(() =>
    activeView === 'about' ? 'about' : 'home'
  );
  const manualLockUntilRef = useRef<number>(0);

  useEffect(() => {
    if (activeView === 'about') {
      setActiveSection('about');
      return;
    }

    const trackedSections: { key: NavSectionKey; id: string }[] = [
      { key: 'ratings', id: 'footer-ratings' },
      { key: 'about', id: 'footer-about' },
      { key: 'contact', id: 'footer-contact' },
      { key: 'products', id: 'products-section' },
      { key: 'offers', id: 'offers-section' },
    ];

    const handleScrollSpy = () => {
      if (Date.now() < manualLockUntilRef.current) return;
      if (window.scrollY < 120) {
        setActiveSection('home');
        return;
      }

      const nearBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 40;
      if (nearBottom) {
        for (const item of trackedSections) {
          if (findVisibleElementById(item.id)) {
            setActiveSection(item.key);
            return;
          }
        }
      }

      for (const item of trackedSections) {
        const el = findVisibleElementById(item.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= 180) {
          setActiveSection(item.key);
          return;
        }
      }

      setActiveSection('home');
    };

    window.addEventListener('scroll', handleScrollSpy, { passive: true });
    return () => window.removeEventListener('scroll', handleScrollSpy);
  }, [activeView]);

  const handleHomeClick = () => {
    manualLockUntilRef.current = Date.now() + 900;
    setActiveSection('home');
    onSwitchView('store');
    smoothScrollToTop();
  };

  const handleNavClick = (sectionKey: NavSectionKey, sectionId: string, fallback?: () => void) => {
    manualLockUntilRef.current = Date.now() + 900;
    setActiveSection(sectionKey);

    const scrollToTarget = () => {
      const scrolled = smoothScrollToElement(sectionId, { highlight: true });
      if (!scrolled) {
        if (fallback) {
          fallback();
        } else {
          smoothScrollToTop();
        }
      }
    };

    if (activeView !== 'store') {
      onSwitchView('store');
      setTimeout(scrollToTarget, 80);
    } else {
      scrollToTarget();
    }
  };

  const getNavLinkClass = (sectionKey: NavSectionKey) =>
    activeSection === sectionKey
      ? 'inline-flex h-10 items-center px-2.5 sm:px-3 rounded-xl text-xs xl:text-sm font-extrabold bg-gradient-to-r from-[#1D4ED8] to-[#0284C7] text-white shadow-sm transition-all whitespace-nowrap shrink-0 cursor-pointer'
      : 'inline-flex h-10 items-center px-2.5 sm:px-3 rounded-xl text-xs xl:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-[#153666] hover:text-[#1D4ED8] dark:hover:text-[#38BDF8] hover:shadow-xs transition-all whitespace-nowrap shrink-0 cursor-pointer';

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#081A33]/95 backdrop-blur-md border-b border-[#D8EEFB] dark:border-[#163663] transition-colors">
      <div className="mx-auto flex max-w-7xl flex-wrap xl:flex-nowrap items-center justify-between gap-2.5 xl:gap-4 px-4 sm:px-6 lg:px-8 py-2 xl:py-0 xl:h-16">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="/"
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
            e.preventDefault();
            handleHomeClick();
          }}
          className="order-1 inline-flex items-center gap-2 sm:gap-2.5 text-[13px] sm:text-base xl:text-lg font-extrabold tracking-tight text-[#0B1F3A] dark:text-[#F0F9FF] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] rounded-md"
        >
          <img
            src="/logo.png"
            alt={`شعار ${siteConfig.storeName} | Elmahlawy Store`}
            width={36}
            height={36}
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

        {/* Zone 2: Independent Navigation Bar */}
        <nav
          aria-label="التنقل الرئيسي"
          className="order-3 xl:order-2 w-full xl:w-auto flex items-center justify-between sm:justify-center gap-1 sm:gap-1.5 xl:gap-2 rounded-2xl bg-[#F2FAFF]/90 dark:bg-[#0E264A]/85 border border-[#D8EEFB] dark:border-[#1E3F73] p-1 overflow-x-auto scrollbar-hide"
        >
          <a
            href="/"
            aria-current={activeSection === 'home' ? 'location' : undefined}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
              e.preventDefault();
              handleHomeClick();
            }}
            className={getNavLinkClass('home')}
          >
            الرئيسية
          </a>
          {hasDiscountOffers && siteConfig.showOffersSection && (
            <a
              href="#offers-section"
              aria-current={activeSection === 'offers' ? 'location' : undefined}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('offers', 'offers-section');
              }}
              className={getNavLinkClass('offers')}
            >
              العروض والخصومات
            </a>
          )}
          <a
            href="#products-section"
            aria-current={activeSection === 'products' ? 'location' : undefined}
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('products', 'products-section');
            }}
            className={getNavLinkClass('products')}
          >
            المنتجات
          </a>
          <a
            href="#footer-about"
            aria-current={activeSection === 'about' ? 'location' : undefined}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
              e.preventDefault();
              handleNavClick('about', 'footer-about', () => onSwitchView('about'));
            }}
            className={getNavLinkClass('about')}
          >
            من نحن | About Us
          </a>
          <a
            href="#footer-contact"
            aria-current={activeSection === 'contact' ? 'location' : undefined}
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('contact', 'footer-contact');
            }}
            className={getNavLinkClass('contact')}
          >
            تواصل معنا
          </a>
          {siteConfig.showRatingsSection !== false && (
            <a
              href="#footer-ratings"
              aria-current={activeSection === 'ratings' ? 'location' : undefined}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('ratings', 'footer-ratings', onOpenRatingModal);
              }}
              className={getNavLinkClass('ratings')}
            >
              تقييم المتجر
            </a>
          )}
        </nav>

        {/* Zone 3: Unified Compact Icon Action Group */}
        <div
          role="group"
          aria-label="أدوات المتجر السريعة"
          className="order-2 xl:order-3 inline-flex items-center gap-1.5 rounded-2xl bg-[#F2FAFF]/90 dark:bg-[#0E264A]/85 border border-[#D8EEFB] dark:border-[#1E3F73] p-1 shrink-0"
        >
          {onOpenCart && (
            <button
              type="button"
              onClick={onOpenCart}
              aria-label={`سلة المشتريات والمفضلة (${totals.totalQuantity} منتج)`}
              title="سلة المشتريات والمفضلة"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-[#081A33] text-[#0F294A] dark:text-[#E0F2FE] border border-[#CBE7FA] dark:border-[#1E3F73] hover:bg-[#E2F3FE] dark:hover:bg-[#163868] active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <ShoppingCart className="h-4 w-4 text-[#1D4ED8] dark:text-[#38BDF8]" aria-hidden="true" />
              {totals.totalQuantity > 0 && (
                <span className="font-num absolute -top-1.5 -left-1.5 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-[#1D4ED8] px-1 text-[10px] font-extrabold text-white shadow-xs ring-2 ring-white dark:ring-[#081A33]">
                  {totals.totalQuantity > 99 ? '+99' : totals.totalQuantity}
                </span>
              )}
            </button>
          )}

          {onToggleTheme && (
            <ThemeToggle
              isDark={isDark}
              onToggle={onToggleTheme}
              iconOnly
              className="h-10 w-10 min-h-0 min-w-0 !bg-white dark:!bg-[#081A33]"
            />
          )}

          <PWAInstallButton
            variant="navbar"
            iconOnly
            className="h-10 w-10 min-h-0 min-w-0"
          />
        </div>
      </div>
    </header>
  );
}

