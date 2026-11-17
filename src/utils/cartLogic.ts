import { Product, STORE_INFO } from '../types/store';
import {
  calculateSavingsAmount,
  formatPriceEgp,
  getEffectiveProductPrice,
  isDiscountActive,
  roundCurrency,
} from './catalogLogic';

export const MAX_CART_ITEM_QUANTITY = 99;

export interface CartItem {
  cartKey: string; // `${productId}::${selectedOption}`
  productId: string;
  selectedOption: string;
  quantity: number;
  productSnapshot: Product;
  updatedAt: number;
}

export function normalizeCartOption(option?: string | null): string {
  return typeof option === 'string' ? option.trim() : '';
}

export function buildCartKey(productId: string, selectedOption?: string | null): string {
  return `${productId}::${normalizeCartOption(selectedOption)}`;
}

export function clampCartQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.max(1, Math.min(MAX_CART_ITEM_QUANTITY, Math.floor(quantity)));
}

export function normalizeCartItems(items: unknown): CartItem[] {
  if (!Array.isArray(items)) return [];

  const dedupedMap = new Map<string, CartItem>();

  for (const raw of items) {
    if (!raw || typeof raw !== 'object') continue;
    const candidate = raw as Partial<CartItem>;
    if (!candidate.productId || typeof candidate.productId !== 'string') continue;
    if (!candidate.productSnapshot || typeof candidate.productSnapshot !== 'object') continue;

    const selectedOption = normalizeCartOption(candidate.selectedOption);
    const cartKey = buildCartKey(candidate.productId, selectedOption);
    const qty = clampCartQuantity(Number(candidate.quantity ?? 1));
    const updatedAt =
      typeof candidate.updatedAt === 'number' && Number.isFinite(candidate.updatedAt)
        ? candidate.updatedAt
        : Date.now();

    const existing = dedupedMap.get(cartKey);
    if (existing) {
      const useIncomingSnapshot = updatedAt >= existing.updatedAt;
      dedupedMap.set(cartKey, {
        cartKey,
        productId: candidate.productId,
        selectedOption,
        quantity: clampCartQuantity(existing.quantity + qty),
        productSnapshot: useIncomingSnapshot
          ? (candidate.productSnapshot as Product)
          : existing.productSnapshot,
        updatedAt: Math.max(existing.updatedAt, updatedAt),
      });
    } else {
      dedupedMap.set(cartKey, {
        cartKey,
        productId: candidate.productId,
        selectedOption,
        quantity: qty,
        productSnapshot: candidate.productSnapshot as Product,
        updatedAt,
      });
    }
  }

  return Array.from(dedupedMap.values());
}

export function upsertCartItem(
  items: CartItem[],
  product: Product,
  options?: {
    selectedOption?: string;
    quantity?: number;
    now?: number;
  }
): { nextItems: CartItem[]; updatedItem: CartItem; wasExisting: boolean } {
  const hasExplicitOption = options?.selectedOption !== undefined;
  const resolvedOption = normalizeCartOption(
    hasExplicitOption ? options?.selectedOption : product.options?.[0] || ''
  );
  const addQty = clampCartQuantity(options?.quantity ?? 1);
  const now = options?.now ?? Date.now();
  const cartKey = buildCartKey(product.id, resolvedOption);

  const existingIndex = items.findIndex((item) => item.cartKey === cartKey);
  if (existingIndex >= 0) {
    const existing = items[existingIndex];
    const updatedItem: CartItem = {
      ...existing,
      quantity: clampCartQuantity(existing.quantity + addQty),
      productSnapshot: product,
      updatedAt: now,
    };
    const nextItems = [...items];
    nextItems[existingIndex] = updatedItem;
    return { nextItems, updatedItem, wasExisting: true };
  }

  const newItem: CartItem = {
    cartKey,
    productId: product.id,
    selectedOption: resolvedOption,
    quantity: addQty,
    productSnapshot: product,
    updatedAt: now,
  };

  return {
    nextItems: [...items, newItem],
    updatedItem: newItem,
    wasExisting: false,
  };
}

export function setCartItemQuantity(
  items: CartItem[],
  cartKey: string,
  nextQuantity: number,
  now: number = Date.now()
): CartItem[] {
  if (!Number.isFinite(nextQuantity) || Math.floor(nextQuantity) <= 0) {
    return items.filter((item) => item.cartKey !== cartKey);
  }
  const clamped = clampCartQuantity(nextQuantity);
  return items.map((item) =>
    item.cartKey === cartKey
      ? { ...item, quantity: clamped, updatedAt: now }
      : item
  );
}

export function removeCartItemByKey(items: CartItem[], cartKey: string): CartItem[] {
  return items.filter((item) => item.cartKey !== cartKey);
}

function areProductSnapshotsEquivalent(a: Product, b: Product): boolean {
  return (
    a.name === b.name &&
    a.price === b.price &&
    a.originalPrice === b.originalPrice &&
    a.discountEnabled === b.discountEnabled &&
    a.discountType === b.discountType &&
    a.discountValue === b.discountValue &&
    a.discountStartDate === b.discountStartDate &&
    a.discountEndDate === b.discountEndDate &&
    a.inStock === b.inStock &&
    a.updatedAt === b.updatedAt &&
    (a.images[0] || '') === (b.images[0] || '') &&
    a.images.length === b.images.length
  );
}

export function reconcileCartWithLiveProducts(
  items: CartItem[],
  liveProducts: Product[]
): { nextItems: CartItem[]; changed: boolean } {
  if (items.length === 0 || liveProducts.length === 0) {
    return { nextItems: items, changed: false };
  }

  const productMap = new Map<string, Product>();
  for (const p of liveProducts) {
    if (p && p.id) {
      productMap.set(p.id, p);
    }
  }

  let changed = false;
  const nextItems = items.map((item) => {
    const live = productMap.get(item.productId);
    // Keep offline/cached item intact if not found in current liveProducts list
    if (!live) return item;

    // Never overwrite a newer product snapshot with an older one
    const liveUpdated = live.updatedAt || '';
    const snapUpdated = item.productSnapshot.updatedAt || '';
    if (liveUpdated && snapUpdated && liveUpdated < snapUpdated) {
      return item;
    }

    if (areProductSnapshotsEquivalent(item.productSnapshot, live)) {
      return item;
    }

    changed = true;
    return {
      ...item,
      productSnapshot: live,
    };
  });

  return { nextItems, changed };
}

export interface CartTotals {
  totalQuantity: number;
  uniqueCount: number;
  totalPrice: number;
  totalSavings: number;
}

export function getCartTotals(
  items: CartItem[],
  referenceDate: Date = new Date()
): CartTotals {
  let totalQuantity = 0;
  let totalPrice = 0;
  let totalSavings = 0;

  for (const item of items) {
    const qty = clampCartQuantity(item.quantity);
    const unitPrice = getEffectiveProductPrice(item.productSnapshot, referenceDate);
    const unitSavings = isDiscountActive(item.productSnapshot, referenceDate)
      ? calculateSavingsAmount(item.productSnapshot.originalPrice, unitPrice)
      : 0;

    totalQuantity += qty;
    totalPrice += unitPrice * qty;
    totalSavings += unitSavings * qty;
  }

  return {
    totalQuantity,
    uniqueCount: items.length,
    totalPrice: roundCurrency(totalPrice),
    totalSavings: roundCurrency(totalSavings),
  };
}

export function buildCartWhatsAppOrderUrl(params: {
  items: CartItem[];
  storeName?: string;
  primaryWhatsApp?: string;
  referenceDate?: Date;
}): string {
  const rawPhone = (params.primaryWhatsApp || STORE_INFO.primaryWhatsApp).replace(/\D/g, '');
  const phone = rawPhone || STORE_INFO.primaryWhatsApp;
  const storeName = params.storeName || STORE_INFO.storeName;
  const refDate = params.referenceDate ?? new Date();
  const { totalPrice, totalQuantity, totalSavings } = getCartTotals(params.items, refDate);

  const lines: string[] = [
    `مرحبًا ${storeName} 👋`,
    `أرغب في طلب المنتجات التالية من السلة (${totalQuantity} قطعة):`,
    '',
  ];

  params.items.forEach((item, idx) => {
    const p = item.productSnapshot;
    const unit = getEffectiveProductPrice(p, refDate);
    const subtotal = roundCurrency(unit * item.quantity);
    lines.push(`${idx + 1}. ${p.name}`);
    if (p.brand) lines.push(`   - الماركة: ${p.brand}`);
    if (item.selectedOption) lines.push(`   - الخيار: ${item.selectedOption}`);
    lines.push(
      `   - الكمية: ${item.quantity} × ${formatPriceEgp(unit)} ج.م = ${formatPriceEgp(subtotal)} ج.م`
    );
  });

  lines.push('');
  if (totalSavings > 0) {
    lines.push(`إجمالي التوفير: ${formatPriceEgp(totalSavings)} ج.م`);
  }
  lines.push(`الإجمالي الكلي: ${formatPriceEgp(totalPrice)} ج.م`);
  lines.push('يرجى تأكيد التوفر وتفاصيل التوصيل.');

  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`;
}
