import { LayoutDashboard } from 'lucide-react';
import { STORE_INFO } from '../types/store';

interface NavbarProps {
  activeView: 'store' | 'admin';
  onSwitchView: (view: 'store' | 'admin') => void;
  onAdminButtonClick: () => void;
  hasDiscountOffers: boolean;
}

export function Navbar({
  activeView,
  onSwitchView,
  onAdminButtonClick,
  hasDiscountOffers,
}: NavbarProps) {
  const handleNavClick = (sectionId: string) => {
    if (activeView !== 'store') {
      onSwitchView('store');
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    }
  };

  return (
    <header className="sticky top-0 z-40 h-14 md:h-16 bg-white/95 backdrop-blur-md border-b border-[#D8EEFB]">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 md:gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <a
          href="#top"
          onClick={() => {
            if (activeView !== 'store') onSwitchView('store');
          }}
          className="inline-flex items-center gap-2.5 text-[13px] sm:text-lg font-extrabold tracking-tight text-[#0B1F3A] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] rounded-md"
        >
          <img
            src="/logo.png"
            alt={STORE_INFO.storeName}
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl object-contain shadow-xs shrink-0 bg-white"
          />
          <span>
            {STORE_INFO.storeName} <span className="text-[#0284C7] font-bold">|</span>{' '}
            <bdi className="font-bold text-[#1E3A8A]">{STORE_INFO.storeSubtitle}</bdi>
          </span>
        </a>

        {/* Zone 2: Clean single-line navigation links */}
        <nav
          aria-label="التنقل الرئيسي"
          className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600"
        >
          <a
            href="#top"
            onClick={() => handleNavClick('top')}
            className="hover:text-[#1D4ED8] transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:border-[#38BDF8]"
          >
            الرئيسية
          </a>
          {hasDiscountOffers && (
            <a
              href="#offers-section"
              onClick={() => handleNavClick('offers-section')}
              className="hover:text-[#1D4ED8] transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:border-[#38BDF8]"
            >
              العروض والخصومات
            </a>
          )}
          <a
            href="#products-section"
            onClick={() => handleNavClick('products-section')}
            className="hover:text-[#1D4ED8] transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:border-[#38BDF8]"
          >
            المنتجات
          </a>
          <a
            href="#about-store"
            onClick={() => handleNavClick('about-store')}
            className="hover:text-[#1D4ED8] transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:border-[#38BDF8]"
          >
            عن المتجر
          </a>
          <a
            href="#infinity-corp"
            onClick={() => handleNavClick('infinity-corp')}
            className="hover:text-[#1D4ED8] transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:border-[#38BDF8]"
          >
            <bdi>Infinity Corp</bdi>
          </a>
          <a
            href="#footer-contact"
            onClick={() => handleNavClick('footer-contact')}
            className="hover:text-[#1D4ED8] transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:border-[#38BDF8]"
          >
            تواصل معنا
          </a>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center shrink-0">
          {activeView === 'store' && (
            <button
              type="button"
              onClick={onAdminButtonClick}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-[#F2FAFF] px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold text-[#0F294A] border border-[#CBE7FA] hover:bg-[#E2F3FE] hover:border-[#7DD3FC] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
            >
              <LayoutDashboard className="h-4 w-4 text-[#1D4ED8]" aria-hidden="true" />
              <span>لوحة الإدارة</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
