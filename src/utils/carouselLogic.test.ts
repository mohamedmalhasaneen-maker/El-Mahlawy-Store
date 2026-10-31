import assert from 'node:assert/strict';
import test from 'node:test';
import { getFeaturedProducts, sanitizeProductPayload } from './catalogLogic';
import {
  AUTO_PLAY_INTERVAL_MS,
  SWIPE_THRESHOLD_PX,
  buildCarouselTrackSlides,
  computeRtlTrackTransform,
  getLogicalCarouselIndex,
  normalizeCloneTrackIndex,
  resolveRtlSwipeDirection,
  resolveSpotlightCarouselItems,
} from './carouselLogic';

function makeProduct(
  id: string,
  name: string,
  opts: { isFeatured?: boolean; featuredOrder?: number; isPublished?: boolean; createdAt?: string }
) {
  const p = sanitizeProductPayload(
    {
      name,
      brand: 'El Mahlawy',
      category: 'قسم كاميرات المراقبة',
      categoryId: 'cctv',
      shortDescription: 'وصف مختصر',
      description: 'وصف تفصيلي',
      price: 1850,
      originalPrice: 2200,
      discountEnabled: true,
      discountType: 'percentage',
      discountValue: 15.91,
      inStock: true,
      isFeatured: Boolean(opts.isFeatured),
      featuredOrder: opts.featuredOrder ?? 0,
      isPublished: opts.isPublished !== false,
      images: [`https://res.cloudinary.com/obvb7rtp/image/upload/v1/${id}.jpg`],
      specs: ['دقة 4K'],
      options: ['أبيض'],
    },
    id,
    'eGi5P37ztLe5Nn77sEFvmFFcZWp1'
  );
  if (opts.createdAt) {
    p.createdAt = opts.createdAt;
  }
  return p;
}

test('Auto-play interval is ~4 seconds (4000ms) and activates only when 2+ featured products exist', () => {
  assert.equal(AUTO_PLAY_INTERVAL_MS, 4000);

  const p1 = makeProduct('p1', 'كاميرا 1', { isFeatured: true, featuredOrder: 1 });
  const p2 = makeProduct('p2', 'كاميرا 2', { isFeatured: true, featuredOrder: 2 });
  const newestNonFeatured = makeProduct('p-latest', 'أحدث منتج', {
    isFeatured: false,
    createdAt: '2026-10-31T12:00:00.000Z',
  });

  // Case 1: Zero featured products -> falls back to newest product statically (no auto-play)
  const zeroFeatured = resolveSpotlightCarouselItems([], newestNonFeatured);
  assert.equal(zeroFeatured.isFeaturedMode, false);
  assert.equal(zeroFeatured.shouldAutoPlay, false);
  assert.deepEqual(zeroFeatured.items.map((p) => p.id), ['p-latest']);
  assert.equal(buildCarouselTrackSlides(zeroFeatured.items).length, 1);

  // Case 2: Single featured product -> displayed statically without motion or clones
  const singleFeatured = resolveSpotlightCarouselItems([p1], newestNonFeatured);
  assert.equal(singleFeatured.isFeaturedMode, true);
  assert.equal(singleFeatured.shouldAutoPlay, false);
  assert.deepEqual(singleFeatured.items.map((p) => p.id), ['p1']);
  assert.equal(buildCarouselTrackSlides(singleFeatured.items).length, 1);
  assert.equal(computeRtlTrackTransform(0, 1, 0), 'translate3d(0px, 0, 0)');

  // Case 3: Multiple featured products -> auto-plays and builds circular clone track
  const multiFeatured = resolveSpotlightCarouselItems([p1, p2], newestNonFeatured);
  assert.equal(multiFeatured.isFeaturedMode, true);
  assert.equal(multiFeatured.shouldAutoPlay, true);
  assert.deepEqual(multiFeatured.items.map((p) => p.id), ['p1', 'p2']);
});

test('Circular RTL horizontal track loops infinitely from last slide to first slide without rewind', () => {
  const f1 = makeProduct('f1', 'المنتج الأول', { isFeatured: true, featuredOrder: 1 });
  const f2 = makeProduct('f2', 'المنتج الثاني', { isFeatured: true, featuredOrder: 2 });
  const f3 = makeProduct('f3', 'المنتج الثالث', { isFeatured: true, featuredOrder: 3 });

  const items = getFeaturedProducts([f3, f1, f2, f1]); // Deduplicated & ordered: f1, f2, f3
  assert.deepEqual(items.map((p) => p.id), ['f1', 'f2', 'f3']);

  const slides = buildCarouselTrackSlides(items);
  assert.equal(slides.length, 5); // [clone(f3), f1, f2, f3, clone(f1)]
  assert.equal(slides[0].product.id, 'f3');
  assert.equal(slides[0].isClone, true);
  assert.equal(slides[1].product.id, 'f1');
  assert.equal(slides[2].product.id, 'f2');
  assert.equal(slides[3].product.id, 'f3');
  assert.equal(slides[4].product.id, 'f1');
  assert.equal(slides[4].isClone, true);

  // Forward loop progression: trackIndex 1 (f1) -> 2 (f2) -> 3 (f3) -> 4 (clone of f1) -> snap 1 (f1)
  assert.equal(getLogicalCarouselIndex(1, 3), 0);
  assert.equal(getLogicalCarouselIndex(2, 3), 1);
  assert.equal(getLogicalCarouselIndex(3, 3), 2);
  assert.equal(getLogicalCarouselIndex(4, 3), 0); // Clone of f1 already maps to logical index 0!
  assert.equal(normalizeCloneTrackIndex(4, 3), 1); // Snaps seamlessly to real f1 at trackIndex 1

  // Backward loop progression: trackIndex 1 (f1) -> 0 (clone of f3) -> snap 3 (f3)
  assert.equal(getLogicalCarouselIndex(0, 3), 2);
  assert.equal(normalizeCloneTrackIndex(0, 3), 3);

  // Transform moves smoothly in the same positive RTL direction across the wrap boundary
  assert.equal(computeRtlTrackTransform(1, 3, 0), 'translate3d(100%, 0, 0)');
  assert.equal(computeRtlTrackTransform(2, 3, 0), 'translate3d(200%, 0, 0)');
  assert.equal(computeRtlTrackTransform(3, 3, 0), 'translate3d(300%, 0, 0)');
  assert.equal(computeRtlTrackTransform(4, 3, 0), 'translate3d(400%, 0, 0)');
});

test('RTL touch swipe resolves natural right/left drag gestures and tracks finger offset', () => {
  // Dragging finger right (+dx >= threshold) pulls next item from left in RTL
  assert.equal(resolveRtlSwipeDirection(SWIPE_THRESHOLD_PX + 15), 'next');
  // Dragging finger left (-dx <= -threshold) pulls previous item from right in RTL
  assert.equal(resolveRtlSwipeDirection(-(SWIPE_THRESHOLD_PX + 15)), 'prev');
  // Small taps/micro-movements do not trigger slide change
  assert.equal(resolveRtlSwipeDirection(12), null);
  assert.equal(resolveRtlSwipeDirection(-12), null);

  assert.equal(computeRtlTrackTransform(1, 3, 64), 'translate3d(calc(100% + 64px), 0, 0)');
  assert.equal(computeRtlTrackTransform(2, 3, -48), 'translate3d(calc(200% + -48px), 0, 0)');
});
