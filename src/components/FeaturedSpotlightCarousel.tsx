import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageCircle,
  ShoppingBag,
  Star,
} from 'lucide-react';
import { useSiteConfig } from '../contexts/SiteConfigContext';
import { Product } from '../types/store';
import {
  buildWhatsAppOrderUrl,
  calculateDiscountPercent,
  formatPriceEgp,
  getEffectiveProductPrice,
  isDiscountActive,
} from '../utils/catalogLogic';
import {
  AUTO_PLAY_INTERVAL_MS,
  POST_INTERACTION_RESUME_MS,
  SLIDE_TRANSITION_MS,
  SWIPE_THRESHOLD_PX,
  buildCarouselTrackSlides,
  computeRtlTrackTransform,
  getLogicalCarouselIndex,
  normalizeCloneTrackIndex,
  resolveRtlSwipeDirection,
  resolveSpotlightCarouselItems,
} from '../utils/carouselLogic';
import { ProductImage } from './ProductImage';

interface FeaturedSpotlightCarouselProps {
  featuredProducts?: Product[];
  fallbackProduct?: Product;
  onSelectProduct: (product: Product) => void;
  onOrderProduct?: (product: Product) => void;
  publicOrigin?: string;
  variant?: 'desktop' | 'mobile';
}

export function FeaturedSpotlightCarousel({
  featuredProducts = [],
  fallbackProduct,
  onSelectProduct,
  onOrderProduct,
  publicOrigin,
  variant = 'desktop',
}: FeaturedSpotlightCarouselProps) {
  const siteConfig = useSiteConfig();

  const { items, isFeaturedMode, shouldAutoPlay } = useMemo(
    () => resolveSpotlightCarouselItems(featuredProducts, fallbackProduct),
    [featuredProducts, fallbackProduct]
  );

  const slides = useMemo(() => buildCarouselTrackSlides(items), [items]);
  const itemCount = items.length;
  const itemsSignature = useMemo(() => items.map((p) => p.id).join('|'), [items]);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const [trackIndex, setTrackIndex] = useState<number>(() => (itemCount > 1 ? 1 : 0));
  const [enableTransition, setEnableTransition] = useState<boolean>(false);
  const [dragOffsetPx, setDragOffsetPx] = useState<number>(0);
  const [isMouseHovering, setIsMouseHovering] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isPageHidden, setIsPageHidden] = useState<boolean>(false);
  const [manualCooldownNonce, setManualCooldownNonce] = useState<number>(0);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackIndexRef = useRef<number>(trackIndex);
  trackIndexRef.current = trackIndex;

  const didSwipeRef = useRef<boolean>(false);
  const touchStateRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    lastX: number;
    axis: 'x' | 'y' | null;
    pointerId: number | null;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    axis: null,
    pointerId: null,
  });

  // Listen to device Reduced Motion preference changes
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    setPrefersReducedMotion(mql.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  // Pause background timers when browser tab is hidden and resume immediately when visible
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleVisibility = () => {
      setIsPageHidden(document.visibilityState === 'hidden');
    };
    handleVisibility();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Reconcile slider position automatically whenever Firestore featured products or order changes
  useEffect(() => {
    setEnableTransition(false);
    setDragOffsetPx(0);
    setTrackIndex(itemCount > 1 ? 1 : 0);
  }, [itemsSignature, itemCount]);

  // Normalize clone boundary indices seamlessly after horizontal slide finishes
  useEffect(() => {
    if (itemCount <= 1) return;
    if (trackIndex !== 0 && trackIndex !== itemCount + 1) return;

    const delay = prefersReducedMotion ? 0 : SLIDE_TRANSITION_MS + 30;
    const timer = window.setTimeout(() => {
      setEnableTransition(false);
      setTrackIndex((current) => normalizeCloneTrackIndex(current, itemCount));
    }, delay);

    return () => window.clearTimeout(timer);
  }, [trackIndex, itemCount, prefersReducedMotion]);

  const stepSlide = useCallback(
    (direction: 'next' | 'prev', isManual = false) => {
      if (itemCount <= 1) return;

      if (isManual) {
        setManualCooldownNonce((n) => n + 1);
      }

      const current = trackIndexRef.current;

      // Reduced motion: switch directly to normalized target without sliding animation
      if (prefersReducedMotion) {
        setEnableTransition(false);
        const normalizedCurrent = normalizeCloneTrackIndex(current, itemCount);
        const nextRaw = direction === 'next' ? normalizedCurrent + 1 : normalizedCurrent - 1;
        setTrackIndex(normalizeCloneTrackIndex(nextRaw, itemCount));
        return;
      }

      // If rapid interaction catches track while resting on a clone boundary, snap first then glide
      if (current <= 0 || current >= itemCount + 1) {
        const snapped = normalizeCloneTrackIndex(current, itemCount);
        setEnableTransition(false);
        setTrackIndex(snapped);

        window.requestAnimationFrame(() => {
          viewportRef.current?.getBoundingClientRect();
          window.requestAnimationFrame(() => {
            setEnableTransition(true);
            setTrackIndex(direction === 'next' ? snapped + 1 : snapped - 1);
          });
        });
        return;
      }

      setEnableTransition(true);
      setTrackIndex(direction === 'next' ? current + 1 : current - 1);
    },
    [itemCount, prefersReducedMotion]
  );

  const jumpToLogicalSlide = useCallback(
    (targetLogicalIdx: number) => {
      if (itemCount <= 1) return;
      const clampedLogical = Math.max(0, Math.min(itemCount - 1, targetLogicalIdx));
      setManualCooldownNonce((n) => n + 1);

      const current = trackIndexRef.current;
      if (current <= 0 || current >= itemCount + 1) {
        const snapped = normalizeCloneTrackIndex(current, itemCount);
        setEnableTransition(false);
        setTrackIndex(snapped);
        window.requestAnimationFrame(() => {
          viewportRef.current?.getBoundingClientRect();
          window.requestAnimationFrame(() => {
            setEnableTransition(!prefersReducedMotion);
            setTrackIndex(clampedLogical + 1);
          });
        });
        return;
      }

      setEnableTransition(!prefersReducedMotion);
      setTrackIndex(clampedLogical + 1);
    },
    [itemCount, prefersReducedMotion]
  );

  const handleTrackTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (itemCount <= 1) return;
    if (trackIndex === 0 || trackIndex === itemCount + 1) {
      setEnableTransition(false);
      setTrackIndex(normalizeCloneTrackIndex(trackIndex, itemCount));
    }
  };

  // Automatic circular playback every ~4s (pauses during active hover/drag or when Reduced Motion is set)
  const isPausedByUser = isMouseHovering || isDragging || isPageHidden;

  useEffect(() => {
    if (!shouldAutoPlay || prefersReducedMotion || isPausedByUser) return;

    const delayMs =
      manualCooldownNonce > 0 ? POST_INTERACTION_RESUME_MS : AUTO_PLAY_INTERVAL_MS;

    const timer = window.setTimeout(() => {
      stepSlide('next', false);
      if (manualCooldownNonce > 0) {
        setManualCooldownNonce(0);
      }
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [
    shouldAutoPlay,
    prefersReducedMotion,
    isPausedByUser,
    trackIndex,
    manualCooldownNonce,
    stepSlide,
  ]);

  // Touch & Drag handlers for smooth horizontal swiping on mobile & touch screens
  const beginSwipe = (clientX: number, clientY: number, pointerId: number | null = null) => {
    if (itemCount <= 1) return;
    const current = trackIndexRef.current;
    if (current <= 0 || current >= itemCount + 1) {
      setEnableTransition(false);
      setTrackIndex(normalizeCloneTrackIndex(current, itemCount));
    }
    touchStateRef.current = {
      active: true,
      startX: clientX,
      startY: clientY,
      lastX: clientX,
      axis: null,
      pointerId,
    };
    didSwipeRef.current = false;
    setIsDragging(true);
  };

  const moveSwipe = (clientX: number, clientY: number) => {
    const state = touchStateRef.current;
    if (!state.active || itemCount <= 1) return;

    const dx = clientX - state.startX;
    const dy = clientY - state.startY;
    state.lastX = clientX;

    if (state.axis === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      state.axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
    }

    if (state.axis === 'x') {
      didSwipeRef.current = true;
      setEnableTransition(false);
      const maxDrag = (viewportRef.current?.clientWidth || 340) * 0.82;
      const clampedDx = Math.max(-maxDrag, Math.min(maxDrag, dx));
      setDragOffsetPx(clampedDx);
    }
  };

  const endSwipe = () => {
    const state = touchStateRef.current;
    if (!state.active) return;

    const dx = state.lastX - state.startX;
    const wasHorizontal = state.axis === 'x';

    touchStateRef.current.active = false;
    touchStateRef.current.axis = null;
    touchStateRef.current.pointerId = null;

    setDragOffsetPx(0);
    setIsDragging(false);

    if (wasHorizontal && itemCount > 1) {
      const swipeDir = resolveRtlSwipeDirection(dx, SWIPE_THRESHOLD_PX);
      if (swipeDir) {
        stepSlide(swipeDir, true);
      } else {
        setEnableTransition(!prefersReducedMotion);
        setManualCooldownNonce((n) => n + 1);
      }
      window.setTimeout(() => {
        didSwipeRef.current = false;
      }, 80);
    } else {
      didSwipeRef.current = false;
    }
  };

  if (itemCount === 0) return null;

  const activeLogicalIndex = getLogicalCarouselIndex(trackIndex, itemCount);
  const activeHeaderProduct = items[activeLogicalIndex] || items[0];
  const activeHeaderEffectivePrice = getEffectiveProductPrice(activeHeaderProduct);
  const activeHeaderDiscounted = isDiscountActive(activeHeaderProduct);
  const trackTransform = computeRtlTrackTransform(trackIndex, itemCount, dragOffsetPx);
  const isCompactMobile = variant === 'mobile';

  return (
    <div
      role={itemCount > 1 ? 'region' : undefined}
      aria-roledescription={itemCount > 1 ? 'carousel' : undefined}
      aria-label={
        isFeaturedMode
          ? `منتجاتنا المفضّلة في ${siteConfig.storeName}`
          : `أحدث منتجات ${siteConfig.storeName}`
      }
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') {
          setIsMouseHovering(true);
        }
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === 'mouse') {
          setIsMouseHovering(false);
          if (touchStateRef.current.active) {
            endSwipe();
          }
        }
      }}
      onKeyDown={(e) => {
        if (itemCount <= 1) return;
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          stepSlide('next', true);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          stepSlide('prev', true);
        } else if (e.key === 'Tab') {
          setManualCooldownNonce((n) => n + 1);
        }
      }}
      className={`w-full ${
        isCompactMobile
          ? 'rounded-2xl p-3.5 sm:p-4'
          : 'max-w-md rounded-3xl p-5 sm:p-6'
      } bg-white/96 dark:bg-[#0B1F3A]/96 text-[#0B1F3A] dark:text-[#F0F9FF] shadow-[0_20px_50px_rgba(7,22,48,0.28)] border border-white/60 dark:border-[#1E3F73]`}
    >
      {/* Card Header: Title + Discount + Optional Manual Arrows */}
      <div className="flex items-center justify-between gap-2 mb-3 text-xs font-semibold text-[#0284C7] dark:text-[#38BDF8]">
        <span className="inline-flex items-center gap-1.5 font-extrabold text-[#0B2354] dark:text-[#F0F9FF] min-w-0">
          {isFeaturedMode && (
            <Star
              className="h-4 w-4 text-[#F59E0B] fill-[#F59E0B] shrink-0"
              aria-hidden="true"
            />
          )}
          <span className="truncate">
            {isFeaturedMode
              ? itemCount > 1
                ? `منتجاتنا المفضّلة · ${siteConfig.storeName}`
                : `المنتج المفضّل · ${siteConfig.storeName}`
              : `أحدث منتجات ${siteConfig.storeName}`}
          </span>
        </span>

        <div className="flex items-center gap-2 shrink-0">
          {activeHeaderDiscounted && (
            <span className="font-bold text-[#1D4ED8] dark:text-[#38BDF8] whitespace-nowrap">
              خصم{' '}
              <bdi className="font-num">
                {calculateDiscountPercent(
                  activeHeaderProduct.originalPrice,
                  activeHeaderEffectivePrice
                )}
                %
              </bdi>
            </span>
          )}

          {itemCount > 1 && (
            <div
              className="inline-flex items-center gap-0.5 rounded-xl bg-[#F2FAFF] dark:bg-[#0E264A] border border-[#CBE7FA] dark:border-[#1E3F73] px-1 py-0.5 text-[11px] font-extrabold text-[#0F294A] dark:text-[#E0F2FE]"
              aria-label="التنقل اليدوي بين المنتجات المفضّلة"
            >
              <button
                type="button"
                onClick={() => stepSlide('prev', true)}
                aria-label="المنتج المفضّل السابق"
                className="inline-flex h-6 w-6 items-center justify-center rounded-lg hover:bg-[#E0F2FE] dark:hover:bg-[#163663] text-[#1D4ED8] dark:text-[#38BDF8] transition-colors cursor-pointer"
              >
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <span className="font-num px-1 select-none">
                {activeLogicalIndex + 1} / {itemCount}
              </span>
              <button
                type="button"
                onClick={() => stepSlide('next', true)}
                aria-label="المنتج المفضّل التالي"
                className="inline-flex h-6 w-6 items-center justify-center rounded-lg hover:bg-[#E0F2FE] dark:hover:bg-[#163663] text-[#1D4ED8] dark:text-[#38BDF8] transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Horizontal Sliding Viewport (RTL-aware, touch-swipeable, zero-reload) */}
      <div
        ref={viewportRef}
        dir="rtl"
        onTouchStart={(e) => {
          if (e.touches.length !== 1) return;
          beginSwipe(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchMove={(e) => {
          if (e.touches.length !== 1) return;
          moveSwipe(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchEnd={endSwipe}
        onTouchCancel={endSwipe}
        onPointerDown={(e) => {
          if (e.pointerType !== 'mouse' || e.button !== 0 || itemCount <= 1) return;
          const targetEl = e.target as HTMLElement | null;
          if (targetEl?.closest('a, button')) return;
          beginSwipe(e.clientX, e.clientY, e.pointerId);
        }}
        onPointerMove={(e) => {
          if (e.pointerType !== 'mouse' || !touchStateRef.current.active) return;
          moveSwipe(e.clientX, e.clientY);
        }}
        onPointerUp={(e) => {
          if (e.pointerType !== 'mouse' || !touchStateRef.current.active) return;
          endSwipe();
        }}
        onPointerCancel={(e) => {
          if (e.pointerType !== 'mouse' || !touchStateRef.current.active) return;
          endSwipe();
        }}
        onClickCapture={(e) => {
          if (didSwipeRef.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        className={`overflow-hidden rounded-2xl touch-pan-y select-none ${
          itemCount > 1 ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
      >
        <div
          onTransitionEnd={handleTrackTransitionEnd}
          style={{
            transform: trackTransform,
            transition:
              enableTransition && !prefersReducedMotion
                ? `transform ${SLIDE_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
                : 'none',
          }}
          className="flex items-stretch will-change-transform"
        >
          {slides.map((slide) => {
            const product = slide.product;
            const effectivePrice = getEffectiveProductPrice(product);
            const discountActive = isDiscountActive(product);
            const showCategory =
              Boolean(product.category) && product.category.trim() !== 'عام';
            const whatsappUrl = buildWhatsAppOrderUrl({
              product,
              selectedOption: product.options[0],
              quantity: 1,
              baseOrigin: publicOrigin,
              whatsappNumber: siteConfig.primaryWhatsApp,
              storeName: siteConfig.storeName,
              storeSubtitle: siteConfig.storeSubtitle,
            });
            const isCurrentLogical = slide.logicalIndex === activeLogicalIndex && !slide.isClone;

            return (
              <article
                key={slide.key}
                dir="rtl"
                aria-hidden={itemCount > 1 && !isCurrentLogical ? true : undefined}
                className="w-full shrink-0 flex flex-col justify-between px-0.5"
              >
                <div>
                  <button
                    type="button"
                    tabIndex={itemCount > 1 && !isCurrentLogical ? -1 : 0}
                    onClick={() => onSelectProduct(product)}
                    aria-label={`استعراض ${product.name}`}
                    className="group relative block w-full text-right cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1D4ED8] rounded-2xl"
                  >
                    {!product.inStock && (
                      <span className="absolute top-2.5 left-2.5 z-20 rounded-lg bg-slate-800/90 px-2 py-0.5 text-[11px] font-semibold text-white">
                        غير متوفر حاليًا
                      </span>
                    )}

                    <ProductImage
                      src={product.images[0]}
                      alt={product.name}
                      loading="eager"
                      showPedestalHalo={true}
                      containerClassName={`${
                        isCompactMobile ? 'h-48 min-[400px]:h-52' : 'h-60 sm:h-64'
                      } w-full rounded-2xl p-2`}
                      className="group-hover:scale-[1.02]"
                    />

                    <div className="mt-3.5 flex items-end justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {(product.brand || showCategory) && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 truncate">
                            {product.brand}
                            {product.brand && showCategory ? ' · ' : ''}
                            {showCategory ? product.category : ''}
                          </p>
                        )}
                        <h2
                          className={`${
                            isCompactMobile ? 'text-sm min-[390px]:text-base' : 'text-base sm:text-lg'
                          } font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF] leading-snug line-clamp-2 min-h-[2.5rem]`}
                        >
                          {product.name}
                        </h2>
                      </div>

                      <div className="text-left shrink-0">
                        {discountActive && (
                          <p className="text-xs text-slate-400 line-through">
                            <bdi className="font-num">
                              {formatPriceEgp(product.originalPrice)}
                            </bdi>{' '}
                            ج.م
                          </p>
                        )}
                        <p
                          className={`${
                            isCompactMobile ? 'text-base min-[390px]:text-lg' : 'text-lg sm:text-xl'
                          } font-extrabold text-[#1D4ED8] dark:text-[#38BDF8] whitespace-nowrap`}
                        >
                          <bdi className="font-num">{formatPriceEgp(effectivePrice)}</bdi>{' '}
                          <span className="text-xs font-bold text-[#0F294A] dark:text-[#E0F2FE]">
                            ج.م
                          </span>
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Action Buttons: Purchase / Order + View Details */}
                <div className="mt-3.5 grid grid-cols-2 gap-2">
                  {onOrderProduct ? (
                    <button
                      type="button"
                      tabIndex={itemCount > 1 && !isCurrentLogical ? -1 : 0}
                      onClick={() => onOrderProduct(product)}
                      aria-label={`طلب المنتج: ${product.name}`}
                      className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] active:scale-[0.98] px-3 py-2 text-xs font-extrabold text-white transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
                    >
                      <ShoppingBag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>طلب المنتج</span>
                    </button>
                  ) : (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      tabIndex={itemCount > 1 && !isCurrentLogical ? -1 : 0}
                      aria-label={`طلب المنتج عبر واتساب: ${product.name}`}
                      className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] active:scale-[0.98] px-3 py-2 text-xs font-extrabold text-white transition-all whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
                    >
                      <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>اطلب عبر واتساب</span>
                    </a>
                  )}

                  <button
                    type="button"
                    tabIndex={itemCount > 1 && !isCurrentLogical ? -1 : 0}
                    onClick={() => onSelectProduct(product)}
                    aria-label={`عرض التفاصيل: ${product.name}`}
                    className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-[#F2FAFF] dark:bg-[#081830] hover:bg-[#E0F2FE] dark:hover:bg-[#153460] active:scale-[0.98] border border-[#CBE7FA] dark:border-[#1E3F73] px-3 py-2 text-xs font-extrabold text-[#0F294A] dark:text-[#E0F2FE] transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
                  >
                    <Eye
                      className="h-3.5 w-3.5 text-[#0284C7] dark:text-[#38BDF8] shrink-0"
                      aria-hidden="true"
                    />
                    <span>التفاصيل</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Pagination Dots (only when multiple featured products exist) */}
      {itemCount > 1 && (
        <div className="mt-3 pt-2.5 border-t border-[#E8F4FD] dark:border-[#1E3F73] flex items-center justify-center gap-1.5">
          {items.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => jumpToLogicalSlide(idx)}
              aria-label={`الانتقال إلى ${item.name}`}
              aria-current={idx === activeLogicalIndex ? 'true' : undefined}
              className={`h-2 rounded-full transition-all duration-200 cursor-pointer ${
                idx === activeLogicalIndex
                  ? 'w-6 bg-[#1D4ED8] dark:bg-[#38BDF8]'
                  : 'w-2 bg-[#BFDBFE] dark:bg-[#1E3F73] hover:bg-[#60A5FA]'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
