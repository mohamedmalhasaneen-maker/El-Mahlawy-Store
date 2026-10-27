import { Product, ProductFormInput, SortOption, STORE_INFO, ValidationResult } from '../types/store';

// Verbatim constants synced with firebase-blueprint.json & firestore.rules
export const ID_PATTERN = /^[a-zA-Z0-9_\-]+$/;
export const MAX_ID_LENGTH = 128;
export const MIN_NAME_LENGTH = 2;
export const MAX_NAME_LENGTH = 160;
export const MIN_BRAND_LENGTH = 1;
export const MAX_BRAND_LENGTH = 80;
export const MIN_CATEGORY_LENGTH = 2;
export const MAX_CATEGORY_LENGTH = 60;
export const MIN_SHORT_DESC_LENGTH = 4;
export const MAX_SHORT_DESC_LENGTH = 300;
export const MIN_DESC_LENGTH = 4;
export const MAX_DESC_LENGTH = 3000;
export const MAX_PRICE = 1000000;
export const MAX_IMAGES = 8;
export const MAX_IMAGE_URL_LENGTH = 500;
export const MAX_SPECS = 15;
export const MAX_SPEC_LENGTH = 200;
export const MAX_OPTIONS = 10;
export const MAX_OPTION_LENGTH = 80;
export const ADMIN_ACCESS_PASSWORD = 'WQ(8)@opnKLOZ$80@Gh';

export function verifyAdminPassword(input: string): boolean {
  return (input || '').trim() === ADMIN_ACCESS_PASSWORD;
}

export function isDiscountActive(product: Pick<Product, 'discountEnabled' | 'originalPrice' | 'price'>): boolean {
  return Boolean(
    product.discountEnabled &&
      Number.isFinite(product.originalPrice) &&
      Number.isFinite(product.price) &&
      product.originalPrice > product.price &&
      product.price > 0
  );
}

export function calculateDiscountPercent(originalPrice: number, currentPrice: number): number {
  if (!Number.isFinite(originalPrice) || !Number.isFinite(currentPrice) || originalPrice <= 0 || currentPrice <= 0) {
    return 0;
  }
  if (currentPrice >= originalPrice) {
    return 0;
  }
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

export function calculateSavingsAmount(originalPrice: number, currentPrice: number): number {
  if (!Number.isFinite(originalPrice) || !Number.isFinite(currentPrice) || currentPrice >= originalPrice) {
    return 0;
  }
  return Math.round((originalPrice - currentPrice) * 100) / 100;
}

export function formatPriceEgp(amount: number): string {
  if (!Number.isFinite(amount)) return '0';
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function normalizeImageSrc(imagePath?: string): string {
  const trimmed = (imagePath || '').trim();
  if (!trimmed) return '';
  const localUploadMatch = trimmed.match(/^https?:\/\/[^/]+(\/uploads\/[^?#]+)$/i);
  if (localUploadMatch) {
    return localUploadMatch[1];
  }
  return trimmed;
}

export function resolvePublicImageUrl(imagePath: string, baseOrigin?: string): string {
  const normalized = normalizeImageSrc(imagePath);
  if (!normalized) return '';
  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }
  const origin =
    baseOrigin ||
    (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '');
  if (!origin) return normalized;
  const cleanOrigin = origin.replace(/\/+$/, '');
  const cleanPath = normalized.startsWith('/') ? normalized : `/${normalized}`;
  return `${cleanOrigin}${cleanPath}`;
}

export interface WhatsAppOrderParams {
  product: Pick<
    Product,
    'name' | 'brand' | 'price' | 'originalPrice' | 'discountEnabled' | 'images'
  >;
  selectedOption?: string;
  quantity?: number;
  notes?: string;
  baseOrigin?: string;
  whatsappNumber?: string;
}

export function buildWhatsAppOrderMessage({
  product,
  selectedOption,
  quantity = 1,
  notes,
  baseOrigin,
}: WhatsAppOrderParams): string {
  const safeQty = Math.max(1, Math.floor(quantity));
  const total = product.price * safeQty;
  const hasDiscount = isDiscountActive(product);
  const discountPct = hasDiscount
    ? calculateDiscountPercent(product.originalPrice, product.price)
    : 0;
  const primaryImage = product.images[0]
    ? resolvePublicImageUrl(product.images[0], baseOrigin)
    : '';

  const lines: string[] = [
    `مرحبًا ${STORE_INFO.storeName} | ${STORE_INFO.storeSubtitle} 👋`,
    'أرغب في طلب المنتج التالي:',
    `• المنتج: ${product.name}`,
    `• الماركة: ${product.brand}`,
  ];

  if (selectedOption && selectedOption.trim()) {
    lines.push(`• الخيار المحدد: ${selectedOption.trim()}`);
  }

  lines.push(`• الكمية: ${safeQty}`);
  lines.push(`• سعر القطعة: ${formatPriceEgp(product.price)} ج.م`);

  if (hasDiscount) {
    lines.push(
      `• العرض المفعّل: خصم ${discountPct}% (بدلًا من ${formatPriceEgp(product.originalPrice)} ج.م)`
    );
  }

  if (safeQty > 1) {
    lines.push(`• الإجمالي: ${formatPriceEgp(total)} ج.م`);
  }

  if (notes && notes.trim()) {
    lines.push(`• ملاحظات العميل: ${notes.trim()}`);
  }

  if (primaryImage) {
    lines.push(`• صورة المنتج: ${primaryImage}`);
  }

  lines.push('يرجى تأكيد التوفر وتفاصيل الشحن أو التوصيل.');
  return lines.join('\n');
}

export function buildWhatsAppOrderUrl(params: WhatsAppOrderParams): string {
  const phone = params.whatsappNumber || STORE_INFO.primaryWhatsApp;
  const message = buildWhatsAppOrderMessage(params);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export interface ProductShareLinks {
  productUrl: string;
  shareTitle: string;
  shareText: string;
  whatsappShareUrl: string;
  facebookShareUrl: string;
  telegramShareUrl: string;
  xShareUrl: string;
}

export function buildProductShareUrl(productId: string, baseOrigin?: string): string {
  const origin =
    (baseOrigin || '').trim() ||
    (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '');
  const cleanId = encodeURIComponent((productId || '').trim());
  if (!origin) {
    return `/?product=${cleanId}`;
  }
  const cleanOrigin = origin.replace(/\/+$/, '');
  return `${cleanOrigin}/?product=${cleanId}`;
}

export function buildProductShareLinks(
  product: Pick<
    Product,
    'id' | 'name' | 'brand' | 'price' | 'originalPrice' | 'discountEnabled'
  >,
  baseOrigin?: string
): ProductShareLinks {
  const productUrl = buildProductShareUrl(product.id, baseOrigin);
  const hasDiscount = isDiscountActive(product);
  const discountPct = hasDiscount
    ? calculateDiscountPercent(product.originalPrice, product.price)
    : 0;

  const shareTitle = `${product.name} | ${STORE_INFO.storeName}`;
  const priceSummary = hasDiscount
    ? `${formatPriceEgp(product.price)} ج.م بدلًا من ${formatPriceEgp(product.originalPrice)} ج.م (خصم ${discountPct}%)`
    : `${formatPriceEgp(product.price)} ج.م`;

  const shareText = `${product.name} (${product.brand}) — السعر: ${priceSummary} لدى ${STORE_INFO.storeName} | ${STORE_INFO.storeSubtitle}`;
  const combinedWhatsAppText = `${shareText}\n${productUrl}`;

  return {
    productUrl,
    shareTitle,
    shareText,
    whatsappShareUrl: `https://wa.me/?text=${encodeURIComponent(combinedWhatsAppText)}`,
    facebookShareUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}&quote=${encodeURIComponent(shareText)}`,
    telegramShareUrl: `https://t.me/share/url?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(shareText)}`,
    xShareUrl: `https://x.com/intent/tweet?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(shareText)}`,
  };
}

export function findProductByShareParam(
  products: Product[],
  productParam: string | null | undefined
): Product | null {
  const cleanId = (productParam || '').trim();
  if (!cleanId) return null;
  return products.find((p) => p.isPublished && p.id === cleanId) || null;
}

export function validateProductInput(input: ProductFormInput): ValidationResult {
  const errors: string[] = [];

  const name = (input.name || '').trim();
  const brand = (input.brand || '').trim();
  const category = (input.category || '').trim();
  const shortDesc = (input.shortDescription || '').trim();
  const desc = (input.description || '').trim();

  if (input.id !== undefined) {
    if (
      !input.id ||
      input.id.length > MAX_ID_LENGTH ||
      !ID_PATTERN.test(input.id)
    ) {
      errors.push('معرّف المنتج غير صالح.');
    }
  }

  if (name.length < MIN_NAME_LENGTH || name.length > MAX_NAME_LENGTH) {
    errors.push(`اسم المنتج يجب أن يكون بين ${MIN_NAME_LENGTH} و ${MAX_NAME_LENGTH} حرفًا.`);
  }

  if (brand.length < MIN_BRAND_LENGTH || brand.length > MAX_BRAND_LENGTH) {
    errors.push(`اسم الماركة/المصنع مطلوب وبحد أقصى ${MAX_BRAND_LENGTH} حرفًا.`);
  }

  if (category.length < MIN_CATEGORY_LENGTH || category.length > MAX_CATEGORY_LENGTH) {
    errors.push('يرجى تحديد قسم صالح للمنتج.');
  }

  if (shortDesc.length < MIN_SHORT_DESC_LENGTH || shortDesc.length > MAX_SHORT_DESC_LENGTH) {
    errors.push(`الوصف المختصر يجب أن يكون بين ${MIN_SHORT_DESC_LENGTH} و ${MAX_SHORT_DESC_LENGTH} حرفًا.`);
  }

  if (desc.length < MIN_DESC_LENGTH || desc.length > MAX_DESC_LENGTH) {
    errors.push(`الوصف التفصيلي يجب أن يكون بين ${MIN_DESC_LENGTH} و ${MAX_DESC_LENGTH} حرفًا.`);
  }

  if (!Number.isFinite(input.price) || input.price <= 0 || input.price > MAX_PRICE) {
    errors.push('يرجى إدخال سعر بيع صحيح أكبر من صفر.');
  }

  const effectiveOriginalPrice = input.discountEnabled ? input.originalPrice : input.price;
  if (
    !Number.isFinite(effectiveOriginalPrice) ||
    effectiveOriginalPrice <= 0 ||
    effectiveOriginalPrice > MAX_PRICE
  ) {
    errors.push('يرجى إدخال السعر الأصلي بشكل صحيح.');
  }

  if (input.discountEnabled && input.originalPrice <= input.price) {
    errors.push('عند تفعيل الخصم يجب أن يكون السعر الأصلي أعلى من السعر بعد الخصم.');
  }

  const cleanImages = (input.images || []).map((img) => img.trim()).filter(Boolean);
  if (cleanImages.length < 1) {
    errors.push('يرجى إضافة صورة واحدة على الأقل للمنتج.');
  } else if (cleanImages.length > MAX_IMAGES) {
    errors.push(`الحد الأقصى لعدد صور المنتج هو ${MAX_IMAGES} صور.`);
  } else if (cleanImages.some((img) => img.length > MAX_IMAGE_URL_LENGTH)) {
    errors.push('أحد روابط الصور يتجاوز الطول المسموح به.');
  }

  const cleanSpecs = (input.specs || []).map((s) => s.trim()).filter(Boolean);
  if (cleanSpecs.length > MAX_SPECS) {
    errors.push(`الحد الأقصى للمواصفات هو ${MAX_SPECS} عنصرًا.`);
  } else if (cleanSpecs.some((s) => s.length > MAX_SPEC_LENGTH)) {
    errors.push(`كل سطر مواصفات يجب ألا يتجاوز ${MAX_SPEC_LENGTH} حرفًا.`);
  }

  const cleanOptions = (input.options || []).map((o) => o.trim()).filter(Boolean);
  if (cleanOptions.length > MAX_OPTIONS) {
    errors.push(`الحد الأقصى للخيارات هو ${MAX_OPTIONS} خيارات.`);
  } else if (cleanOptions.some((o) => o.length > MAX_OPTION_LENGTH)) {
    errors.push(`كل خيار يجب ألا يتجاوز ${MAX_OPTION_LENGTH} حرفًا.`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function sanitizeProductPayload(input: ProductFormInput, existingId?: string, authorUid = 'admin-local'): Product {
  const now = new Date().toISOString();
  const safeId =
    existingId && ID_PATTERN.test(existingId)
      ? existingId
      : `prod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const price = Math.round(Number(input.price) * 100) / 100;
  const discountEnabled = Boolean(input.discountEnabled);
  const originalPrice = discountEnabled
    ? Math.max(price + 1, Math.round(Number(input.originalPrice) * 100) / 100)
    : price;

  return {
    id: safeId.slice(0, MAX_ID_LENGTH),
    name: input.name.trim().slice(0, MAX_NAME_LENGTH),
    brand: input.brand.trim().slice(0, MAX_BRAND_LENGTH),
    category: input.category.trim().slice(0, MAX_CATEGORY_LENGTH),
    shortDescription: input.shortDescription.trim().slice(0, MAX_SHORT_DESC_LENGTH),
    description: input.description.trim().slice(0, MAX_DESC_LENGTH),
    price,
    originalPrice,
    discountEnabled,
    inStock: Boolean(input.inStock),
    isFeatured: Boolean(input.isFeatured),
    isPublished: input.isPublished !== false,
    images: input.images
      .map((u) => u.trim())
      .filter(Boolean)
      .slice(0, MAX_IMAGES)
      .map((u) => u.slice(0, MAX_IMAGE_URL_LENGTH)),
    specs: input.specs
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, MAX_SPECS)
      .map((s) => s.slice(0, MAX_SPEC_LENGTH)),
    options: input.options
      .map((o) => o.trim())
      .filter(Boolean)
      .slice(0, MAX_OPTIONS)
      .map((o) => o.slice(0, MAX_OPTION_LENGTH)),
    authorUid: authorUid.slice(0, MAX_ID_LENGTH),
    createdAt: now,
    updatedAt: now,
  };
}

export function getDiscountedProducts(products: Product[]): Product[] {
  return products.filter((p) => p.isPublished && isDiscountActive(p));
}

export function filterAndSortProducts(
  products: Product[],
  searchQuery: string,
  selectedCategory: string,
  sortBy: SortOption
): Product[] {
  const q = searchQuery.trim().toLowerCase();

  const filtered = products.filter((p) => {
    if (!p.isPublished) return false;
    if (selectedCategory && selectedCategory !== 'الكل' && p.category !== selectedCategory) {
      return false;
    }
    if (!q) return true;
    const haystack = [
      p.name,
      p.brand,
      p.category,
      p.shortDescription,
      p.description,
      ...p.specs,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });

  const sorted = [...filtered];
  switch (sortBy) {
    case SortOption.PRICE_ASC:
      sorted.sort((a, b) => a.price - b.price);
      break;
    case SortOption.PRICE_DESC:
      sorted.sort((a, b) => b.price - a.price);
      break;
    case SortOption.DISCOUNT_DESC:
      sorted.sort((a, b) => {
        const discA = isDiscountActive(a) ? calculateDiscountPercent(a.originalPrice, a.price) : 0;
        const discB = isDiscountActive(b) ? calculateDiscountPercent(b.originalPrice, b.price) : 0;
        return discB - discA;
      });
      break;
    case SortOption.NEWEST:
    default:
      sorted.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      break;
  }

  return sorted;
}
