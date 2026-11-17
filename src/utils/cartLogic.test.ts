import test from 'node:test';
import assert from 'node:assert/strict';
import { Product } from '../types/store';
import {
  buildCartKey,
  buildCartWhatsAppOrderUrl,
  getCartTotals,
  normalizeCartItems,
  reconcileCartWithLiveProducts,
  removeCartItemByKey,
  setCartItemQuantity,
  upsertCartItem,
} from './cartLogic';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'cam-1',
    name: 'كاميرا مراقبة 5MP',
    brand: 'Hikvision',
    category: 'كاميرات المراقبة',
    categoryId: 'cameras',
    shortDescription: 'كاميرا عالية الدقة',
    description: 'تفاصيل الكاميرا',
    price: 1000,
    originalPrice: 1200,
    discountEnabled: true,
    discountType: 'fixed',
    discountValue: 200,
    discountStartDate: '',
    discountEndDate: '',
    inStock: true,
    isFeatured: false,
    featuredOrder: 0,
    isPublished: true,
    images: ['/uploads/cam1.png'],
    specs: ['5 ميجابكسل'],
    options: ['أبيض', 'أسود'],
    authorUid: 'admin',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

test('upsertCartItem increments quantity for same product and option without creating duplicate rows', () => {
  const p1 = makeProduct();

  const step1 = upsertCartItem([], p1, { selectedOption: 'أبيض', quantity: 1, now: 1000 });
  assert.equal(step1.nextItems.length, 1);
  assert.equal(step1.updatedItem.quantity, 1);
  assert.equal(step1.wasExisting, false);

  const step2 = upsertCartItem(step1.nextItems, p1, { selectedOption: 'أبيض', quantity: 2, now: 2000 });
  assert.equal(step2.nextItems.length, 1);
  assert.equal(step2.updatedItem.quantity, 3);
  assert.equal(step2.wasExisting, true);
});

test('upsertCartItem separates lines when selectedOption differs', () => {
  const p1 = makeProduct();
  const s1 = upsertCartItem([], p1, { selectedOption: 'أبيض', quantity: 1 });
  const s2 = upsertCartItem(s1.nextItems, p1, { selectedOption: 'أسود', quantity: 2 });

  assert.equal(s2.nextItems.length, 2);
  assert.equal(s2.nextItems[0].cartKey, buildCartKey('cam-1', 'أبيض'));
  assert.equal(s2.nextItems[1].cartKey, buildCartKey('cam-1', 'أسود'));
  assert.equal(s2.nextItems[0].quantity, 1);
  assert.equal(s2.nextItems[1].quantity, 2);
});

test('setCartItemQuantity and removeCartItemByKey update totals accurately', () => {
  const p1 = makeProduct({ price: 500, originalPrice: 500, discountEnabled: false });
  const p2 = makeProduct({
    id: 'cable-1',
    name: 'كابل شبكة 50 متر',
    price: 250,
    originalPrice: 300,
    discountEnabled: true,
    options: [],
  });

  let items = upsertCartItem([], p1, { quantity: 2 }).nextItems;
  items = upsertCartItem(items, p2, { quantity: 1 }).nextItems;

  let totals = getCartTotals(items);
  assert.equal(totals.totalQuantity, 3);
  assert.equal(totals.uniqueCount, 2);
  assert.equal(totals.totalPrice, 1250);
  assert.equal(totals.totalSavings, 50);

  items = setCartItemQuantity(items, buildCartKey('cam-1', 'أبيض'), 4);
  totals = getCartTotals(items);
  assert.equal(totals.totalQuantity, 5);
  assert.equal(totals.totalPrice, 2250);

  items = removeCartItemByKey(items, buildCartKey('cable-1', ''));
  totals = getCartTotals(items);
  assert.equal(totals.uniqueCount, 1);
  assert.equal(totals.totalPrice, 2000);
});

test('reconcileCartWithLiveProducts updates online prices without losing quantities or deleting offline items', () => {
  const cachedP1 = makeProduct({
    id: 'cam-1',
    price: 1000,
    originalPrice: 1200,
    updatedAt: '2026-01-01T00:00:00.000Z',
  });
  const cachedOfflineOnly = makeProduct({
    id: 'offline-item',
    name: 'منتج مضاف دون اتصال',
    price: 300,
    originalPrice: 300,
    discountEnabled: false,
    options: [],
  });

  let items = upsertCartItem([], cachedP1, { selectedOption: 'أبيض', quantity: 3 }).nextItems;
  items = upsertCartItem(items, cachedOfflineOnly, { quantity: 2 }).nextItems;

  const updatedLiveP1 = makeProduct({
    id: 'cam-1',
    price: 900,
    originalPrice: 1200,
    updatedAt: '2026-02-01T00:00:00.000Z',
  });

  const { nextItems, changed } = reconcileCartWithLiveProducts(items, [updatedLiveP1]);
  assert.equal(changed, true);
  assert.equal(nextItems.length, 2);
  assert.equal(nextItems[0].quantity, 3);
  assert.equal(nextItems[0].productSnapshot.price, 900);
  // Offline item preserved even if not in live array
  assert.equal(nextItems[1].productId, 'offline-item');
  assert.equal(nextItems[1].quantity, 2);
});

test('reconcileCartWithLiveProducts never overwrites a newer snapshot with an older one', () => {
  const newerSnap = makeProduct({
    id: 'cam-1',
    price: 850,
    updatedAt: '2026-03-01T00:00:00.000Z',
  });
  const olderLive = makeProduct({
    id: 'cam-1',
    price: 1000,
    updatedAt: '2026-01-01T00:00:00.000Z',
  });

  const items = upsertCartItem([], newerSnap, { quantity: 2 }).nextItems;
  const { nextItems, changed } = reconcileCartWithLiveProducts(items, [olderLive]);
  assert.equal(changed, false);
  assert.equal(nextItems[0].productSnapshot.price, 850);
});

test('normalizeCartItems deduplicates duplicate keys safely', () => {
  const p = makeProduct();
  const normalized = normalizeCartItems([
    {
      cartKey: 'cam-1::أبيض',
      productId: 'cam-1',
      selectedOption: 'أبيض',
      quantity: 2,
      productSnapshot: p,
      updatedAt: 1000,
    },
    {
      cartKey: 'cam-1::أبيض',
      productId: 'cam-1',
      selectedOption: ' أبيض ',
      quantity: 3,
      productSnapshot: p,
      updatedAt: 2000,
    },
  ]);

  assert.equal(normalized.length, 1);
  assert.equal(normalized[0].quantity, 5);
});

test('buildCartWhatsAppOrderUrl generates valid wa.me link with itemized total', () => {
  const p = makeProduct({ price: 750, originalPrice: 750, discountEnabled: false });
  const items = upsertCartItem([], p, { selectedOption: 'أسود', quantity: 2 }).nextItems;
  const url = buildCartWhatsAppOrderUrl({
    items,
    storeName: 'المحلاوي ستور',
    primaryWhatsApp: '201210141187',
  });

  assert.ok(url.startsWith('https://wa.me/201210141187?text='));
  const decoded = decodeURIComponent(url.split('?text=')[1]);
  assert.ok(decoded.includes('كاميرا مراقبة 5MP'));
  assert.ok(decoded.includes('أسود'));
  assert.ok(decoded.includes('1,500 ج.م'));
});
