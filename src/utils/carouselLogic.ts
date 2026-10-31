import { Product } from '../types/store';
import { deduplicateProductsById } from './catalogLogic';

export const AUTO_PLAY_INTERVAL_MS = 4000;
export const POST_INTERACTION_RESUME_MS = 4200;
export const SLIDE_TRANSITION_MS = 560;
export const SWIPE_THRESHOLD_PX = 40;

export interface CarouselSlideEntry {
  key: string;
  product: Product;
  isClone: boolean;
  logicalIndex: number;
}

/**
 * Resolves the active spotlight list:
 * - If at least 1 featured product exists, returns deduplicated featured products in exact order.
 * - Otherwise falls back to the single newest product (if available).
 */
export function resolveSpotlightCarouselItems(
  featuredProducts: Product[],
  fallbackProduct?: Product
): { items: Product[]; isFeaturedMode: boolean; shouldAutoPlay: boolean } {
  const cleanFeatured = deduplicateProductsById(featuredProducts).filter(
    (p) => p.isPublished && p.isFeatured
  );
  if (cleanFeatured.length > 0) {
    return {
      items: cleanFeatured,
      isFeaturedMode: true,
      shouldAutoPlay: cleanFeatured.length > 1,
    };
  }
  if (fallbackProduct && fallbackProduct.isPublished) {
    return {
      items: [fallbackProduct],
      isFeaturedMode: false,
      shouldAutoPlay: false,
    };
  }
  return {
    items: [],
    isFeaturedMode: false,
    shouldAutoPlay: false,
  };
}

/**
 * Builds the horizontal track slides.
 * - For 0 or 1 item: returns without clones (static display).
 * - For N >= 2 items: prepends clone of last item (trackIndex 0) and appends clone of first item (trackIndex N + 1)
 *   so forward (N -> N + 1 -> 1) and backward (1 -> 0 -> N) transitions glide continuously in the same direction.
 */
export function buildCarouselTrackSlides(items: Product[]): CarouselSlideEntry[] {
  if (items.length === 0) return [];
  if (items.length === 1) {
    return [
      {
        key: `single-${items[0].id}`,
        product: items[0],
        isClone: false,
        logicalIndex: 0,
      },
    ];
  }

  const lastIdx = items.length - 1;
  const slides: CarouselSlideEntry[] = [
    {
      key: `clone-prev-${items[lastIdx].id}`,
      product: items[lastIdx],
      isClone: true,
      logicalIndex: lastIdx,
    },
    ...items.map((product, idx) => ({
      key: `slide-${idx}-${product.id}`,
      product,
      isClone: false,
      logicalIndex: idx,
    })),
    {
      key: `clone-next-${items[0].id}`,
      product: items[0],
      isClone: true,
      logicalIndex: 0,
    },
  ];

  return slides;
}

/**
 * Maps internal track index (0 .. N + 1 when N >= 2) to logical item index (0 .. N - 1).
 */
export function getLogicalCarouselIndex(trackIndex: number, itemCount: number): number {
  if (itemCount <= 1) return 0;
  if (trackIndex <= 0) return itemCount - 1;
  if (trackIndex >= itemCount + 1) return 0;
  return trackIndex - 1;
}

/**
 * Normalizes cloned boundary track indices back to their real counterparts after slide completion:
 * - trackIndex 0 (clone of last) -> itemCount
 * - trackIndex itemCount + 1 (clone of first) -> 1
 */
export function normalizeCloneTrackIndex(trackIndex: number, itemCount: number): number {
  if (itemCount <= 1) return 0;
  if (trackIndex <= 0) return itemCount;
  if (trackIndex >= itemCount + 1) return 1;
  return trackIndex;
}

/**
 * Resolves horizontal swipe delta in RTL layout:
 * - In a dir="rtl" flex track, slides flow right-to-left [CloneLast, Item0, Item1, ..., CloneFirst].
 * - Dragging finger to the RIGHT (deltaX > 0) pulls the NEXT item in from the left.
 * - Dragging finger to the LEFT (deltaX < 0) pulls the PREVIOUS item in from the right.
 */
export function resolveRtlSwipeDirection(
  deltaX: number,
  thresholdPx: number = SWIPE_THRESHOLD_PX
): 'next' | 'prev' | null {
  if (!Number.isFinite(deltaX)) return null;
  if (deltaX >= thresholdPx) return 'next';
  if (deltaX <= -thresholdPx) return 'prev';
  return null;
}

/**
 * Computes GPU-composited translate3d string for a dir="rtl" flex track where each slide is 100% width.
 */
export function computeRtlTrackTransform(
  trackIndex: number,
  itemCount: number,
  dragOffsetPx: number = 0
): string {
  if (itemCount <= 1) {
    return 'translate3d(0px, 0, 0)';
  }
  const clampedIndex = Math.max(0, Math.min(itemCount + 1, trackIndex));
  const cleanDrag = Number.isFinite(dragOffsetPx) ? Math.round(dragOffsetPx) : 0;
  if (cleanDrag === 0) {
    return `translate3d(${clampedIndex * 100}%, 0, 0)`;
  }
  return `translate3d(calc(${clampedIndex * 100}% + ${cleanDrag}px), 0, 0)`;
}
