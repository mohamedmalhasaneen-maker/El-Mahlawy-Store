import { useEffect, useId, useRef, useState } from 'react';

interface ValuesAndPrinciplesSectionProps {
  id?: string;
  variant?: 'storefront' | 'about';
}

function CornerOrnament({ position }: { position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' }) {
  const positionClasses = {
    'top-right': 'top-3 right-3',
    'top-left': 'top-3 left-3 -scale-x-100',
    'bottom-right': 'bottom-3 right-3 -scale-y-100',
    'bottom-left': 'bottom-3 left-3 -scale-x-100 -scale-y-100',
  }[position];

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 28 28"
      fill="none"
      className={`pointer-events-none absolute h-5 w-5 sm:h-6 sm:w-6 text-[#B8860B]/45 dark:text-[#D4AF37]/45 ${positionClasses}`}
    >
      <path
        d="M27 1H9C4.58172 1 1 4.58172 1 9V27"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M21 5H10C7.23858 5 5 7.23858 5 10V21"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        strokeOpacity="0.65"
      />
      <circle cx="9" cy="9" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function ValuesAndPrinciplesSection({
  id = 'values-and-principles',
  variant = 'storefront',
}: ValuesAndPrinciplesSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const rawPatternId = useId();
  const patternId = `islamic-khatam-${rawPatternId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const headingId = `${id}-heading`;

  const [isVisible, setIsVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    if (typeof window.IntersectionObserver === 'undefined') return true;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return true;
    }
    return false;
  });

  useEffect(() => {
    if (isVisible) return;
    const node = sectionRef.current;
    if (!node || typeof window === 'undefined' || typeof window.IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -24px 0px',
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isVisible]);

  const sectionBgClass =
    variant === 'about'
      ? 'bg-gradient-to-b from-[#FCFBF7] via-[#F8F3E6] to-[#F3ECD9] dark:from-[#0B0B0B] dark:via-[#08242D] dark:to-[#0B0B0B] border-y border-[#D4AF37]/45 dark:border-[#D4AF37]/40'
      : 'bg-gradient-to-b from-[#FCFBF7] via-[#F8F4E8] to-[#F3EFE2] dark:from-[#071529] dark:via-[#0A1E3A] dark:to-[#061224] border-t border-[#D4AF37]/40 dark:border-[#D4AF37]/30';

  const cardSurfaceClass =
    variant === 'about'
      ? 'bg-white/95 dark:bg-[#12191E]/95 border-[#D4AF37]/50 dark:border-[#D4AF37]/40 hover:border-[#9A7209] dark:hover:border-[#D4AF37]/85 shadow-[0_14px_38px_-14px_rgba(11,31,58,0.10)] dark:shadow-[0_18px_42px_-16px_rgba(0,0,0,0.65)]'
      : 'bg-white/95 dark:bg-[#0D2240]/92 border-[#D4AF37]/45 dark:border-[#D4AF37]/38 hover:border-[#9A7209] dark:hover:border-[#D4AF37]/80 shadow-[0_14px_38px_-14px_rgba(11,31,58,0.09)] dark:shadow-[0_18px_42px_-16px_rgba(2,8,20,0.6)]';

  return (
    <section
      id={id}
      ref={sectionRef}
      aria-labelledby={headingId}
      className={`relative overflow-hidden py-12 sm:py-16 lg:py-20 transition-colors ${sectionBgClass}`}
    >
      {/* Subtle Islamic 8-Pointed Star (Rub el Hizb) Geometric Pattern */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full text-[#9A7209] dark:text-[#D4AF37] opacity-[0.055] dark:opacity-[0.065]"
      >
        <defs>
          <pattern
            id={patternId}
            width="72"
            height="72"
            patternUnits="userSpaceOnUse"
          >
            <g fill="none" stroke="currentColor" strokeWidth="0.9">
              <rect x="20" y="20" width="32" height="32" />
              <rect x="20" y="20" width="32" height="32" transform="rotate(45 36 36)" />
              <circle cx="36" cy="36" r="5" />
              <path d="M36 0V13.4M36 58.6V72M0 36H13.4M58.6 36H72" />
              <path d="M0 0L16 16M72 0L56 16M0 72L16 56M72 72L56 56" strokeOpacity="0.55" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>

      {/* Soft Radial Golden Ambient Highlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-64 w-[38rem] max-w-full rounded-full bg-[#D4AF37]/10 dark:bg-[#D4AF37]/8 blur-3xl"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div
          className={`text-center max-w-2xl mx-auto mb-8 sm:mb-11 transition-all duration-700 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div aria-hidden="true" className="inline-flex items-center justify-center gap-3 mb-3">
            <span className="h-px w-10 sm:w-14 bg-gradient-to-l from-[#B8860B] dark:from-[#D4AF37] to-transparent" />
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5 text-[#9A7209] dark:text-[#D4AF37]"
            >
              <rect x="5" y="5" width="14" height="14" stroke="currentColor" strokeWidth="1.5" />
              <rect
                x="5"
                y="5"
                width="14"
                height="14"
                transform="rotate(45 12 12)"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
            </svg>
            <span className="h-px w-10 sm:w-14 bg-gradient-to-r from-[#B8860B] dark:from-[#D4AF37] to-transparent" />
          </div>

          <h2
            id={headingId}
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B1F3A] dark:text-[#FAF6EC] tracking-tight text-balance"
          >
            قيمنا ومبادئنا
          </h2>
        </div>

        {/* Two Cards: Side-by-Side on Desktop (Quranic Verse on Right in RTL), Stacked on Mobile (Quranic Verse on Top) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 lg:gap-8 items-stretch">
          {/* Card 1: الآية القرآنية (Verbatim) - Appears on Right in Desktop RTL & Top in Mobile */}
          <article
            className={`relative rounded-3xl border p-6 sm:p-8 lg:p-10 flex flex-col justify-center transition-all duration-700 delay-100 ease-out hover:-translate-y-0.5 ${cardSurfaceClass} ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
            }`}
          >
            <CornerOrnament position="top-right" />
            <CornerOrnament position="top-left" />
            <CornerOrnament position="bottom-right" />
            <CornerOrnament position="bottom-left" />

            <blockquote className="relative z-10 m-0">
              <p className="m-0 flex flex-col items-center text-center gap-4 sm:gap-5">
                <span className="text-sm sm:text-base font-extrabold text-[#8A6508] dark:text-[#E5C158]">
                  🤲 قال الله تعالى
                </span>{' '}
                <span className="font-sacred block text-2xl sm:text-[1.8rem] lg:text-[2.05rem] font-bold leading-[1.95] text-[#0B1F3A] dark:text-[#FAF6EC] text-balance px-2">
                  ﴿وَلَا تَبْخَسُوا النَّاسَ أَشْيَاءَهُمْ﴾
                </span>{' '}
                <span className="inline-flex items-center gap-3 text-xs sm:text-sm font-bold text-[#6E5108] dark:text-[#D4AF37] pt-1">
                  <span aria-hidden="true" className="h-px w-6 sm:w-8 bg-[#B8860B]/45 dark:bg-[#D4AF37]/50" />
                  <span>سورة الأعراف – الآية 85</span>
                  <span aria-hidden="true" className="h-px w-6 sm:w-8 bg-[#B8860B]/45 dark:bg-[#D4AF37]/50" />
                </span>
              </p>
            </blockquote>
          </article>

          {/* Card 2: الحديث الشريف (Verbatim) - Appears on Left in Desktop RTL & Bottom in Mobile */}
          <article
            className={`relative rounded-3xl border p-6 sm:p-8 lg:p-10 flex flex-col justify-center transition-all duration-700 delay-200 ease-out hover:-translate-y-0.5 ${cardSurfaceClass} ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
            }`}
          >
            <CornerOrnament position="top-right" />
            <CornerOrnament position="top-left" />
            <CornerOrnament position="bottom-right" />
            <CornerOrnament position="bottom-left" />

            <blockquote className="relative z-10 m-0">
              <p className="m-0 flex flex-col items-center text-center gap-4 sm:gap-5">
                <span className="text-sm sm:text-base font-extrabold text-[#8A6508] dark:text-[#E5C158]">
                  📖 قال رسول الله ﷺ
                </span>{' '}
                <span className="font-sacred block text-2xl sm:text-[1.8rem] lg:text-[2.05rem] font-bold leading-[1.95] text-[#0B1F3A] dark:text-[#FAF6EC] text-balance px-2">
                  «لَا يَبِعْ بَعْضُكُمْ عَلَى بَيْعِ بَعْضٍ»
                </span>{' '}
                <span className="inline-flex items-center gap-3 text-xs sm:text-sm font-bold text-[#6E5108] dark:text-[#D4AF37] pt-1">
                  <span aria-hidden="true" className="h-px w-6 sm:w-8 bg-[#B8860B]/45 dark:bg-[#D4AF37]/50" />
                  <span>رواه مسلم</span>
                  <span aria-hidden="true" className="h-px w-6 sm:w-8 bg-[#B8860B]/45 dark:bg-[#D4AF37]/50" />
                </span>
              </p>
            </blockquote>
          </article>
        </div>

        {/* Closing Principle Phrase Below Both Cards */}
        <div
          className={`mt-7 sm:mt-9 text-center transition-all duration-700 delay-300 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <p className="inline-flex items-center justify-center gap-3 text-sm sm:text-base font-extrabold text-[#0B1F3A]/90 dark:text-[#E5C158]">
            <span aria-hidden="true" className="h-1.5 w-1.5 rotate-45 bg-[#B8860B] dark:bg-[#D4AF37]" />
            <span>الأمانة والصدق أساس تعاملاتنا</span>
            <span aria-hidden="true" className="h-1.5 w-1.5 rotate-45 bg-[#B8860B] dark:bg-[#D4AF37]" />
          </p>
        </div>
      </div>
    </section>
  );
}
