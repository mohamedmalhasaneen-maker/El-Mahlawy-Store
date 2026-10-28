import {
  DiscountType,
  Product,
  ProductFormInput,
  SortOption,
  STORE_INFO,
  ValidationResult,
} from '../types/store';

// Verbatim constants synced with firebase-blueprint.json & firestore.rules
export const ID_PATTERN = /^[a-zA-Z0-9_\-]+$/;
export const MAX_ID_LENGTH = 128;
export const MIN_NAME_LENGTH = 2;
export const MAX_NAME_LENGTH = 160;
export const MIN_BRAND_LENGTH = 0;
export const MAX_BRAND_LENGTH = 80;
export const MIN_CATEGORY_LENGTH = 0;
export const MAX_CATEGORY_LENGTH = 60;
export const MIN_SHORT_DESC_LENGTH = 0;
export const MAX_SHORT_DESC_LENGTH = 300;
export const MIN_DESC_LENGTH = 0;
export const MAX_DESC_LENGTH = 3000;
export const MAX_PRICE = 1000000;
export const MAX_IMAGES = 15;
export const MAX_IMAGE_URL_LENGTH = 2000;
export const MAX_SPECS = 15;
export const MAX_SPEC_LENGTH = 200;
export const MAX_OPTIONS = 10;
export const MAX_OPTION_LENGTH = 80;
export const MAX_DATE_STRING_LENGTH = 32;

export function roundCurrency(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatLocalIsoDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface DiscountComputationInput {
  basePrice: number;
  discountEnabled: boolean;
  discountType: DiscountType;
  discountValue: number;
  discountStartDate?: string;
  discountEndDate?: string;
}

export interface DiscountComputationResult {
  valid: boolean;
  errors: string[];
  originalPrice: number;
  price: number;
  discountPercent: number;
  savings: number;
}

export function computeDiscountPricing(
  input: DiscountComputationInput
): DiscountComputationResult {
  const errors: string[] = [];
  const cleanBase = roundCurrency(Number(input.basePrice));

  if (!Number.isFinite(cleanBase) || cleanBase <= 0 || cleanBase > MAX_PRICE) {
    return {
      valid: false,
      errors: ['يرجى إدخال سعر أساسي صحيح أكبر من صفر.'],
      originalPrice: 0,
      price: 0,
      discountPercent: 0,
      savings: 0,
    };
  }

  if (!input.discountEnabled) {
    return {
      valid: true,
      errors: [],
      originalPrice: cleanBase,
      price: cleanBase,
      discountPercent: 0,
      savings: 0,
    };
  }

  const rawVal = Number(input.discountValue);
  if (!Number.isFinite(rawVal)) {
    errors.push('يرجى إدخال قيمة خصم رقمية صحيحة.');
  } else if (rawVal < 0) {
    errors.push('لا يُسمح بإدخال قيم خصم سالبة.');
  } else if (rawVal === 0) {
    errors.push('يرجى إدخال قيمة خصم أكبر من صفر أو إيقاف تفعيل الخصم.');
  }

  let finalPrice = cleanBase;
  let savings = 0;

  if (errors.length === 0) {
    if (input.discountType === 'percentage') {
      if (rawVal > 100) {
        errors.push('نسبة الخصم لا يمكن أن تتجاوز 100%.');
      } else {
        savings = roundCurrency(cleanBase * (rawVal / 100));
        finalPrice = roundCurrency(cleanBase - savings);
        if (finalPrice <= 0) {
          errors.push(
            'نسبة الخصم 100% تجعل السعر النهائي صفرًا؛ يرجى إدخال نسبة أقل من 100% ليبقى السعر النهائي أكبر من صفر.'
          );
        }
      }
    } else {
      if (rawVal > cleanBase) {
        errors.push('قيمة الخصم الثابت لا يمكن أن تتجاوز السعر الأساسي للمنتج.');
      } else {
        savings = roundCurrency(rawVal);
        finalPrice = roundCurrency(cleanBase - savings);
        if (finalPrice <= 0) {
          errors.push(
            'قيمة الخصم الثابت يجب أن تكون أقل من السعر الأساسي ليبقى السعر النهائي أكبر من صفر.'
          );
        }
      }
    }
  }

  const startStr = (input.discountStartDate || '').trim();
  const endStr = (input.discountEndDate || '').trim();
  if (startStr && !/^\d{4}-\d{2}-\d{2}$/.test(startStr)) {
    errors.push('صيغة تاريخ بداية الخصم غير صالحة.');
  }
  if (endStr && !/^\d{4}-\d{2}-\d{2}$/.test(endStr)) {
    errors.push('صيغة تاريخ نهاية الخصم غير صالحة.');
  }
  if (
    startStr &&
    endStr &&
    /^\d{4}-\d{2}-\d{2}$/.test(startStr) &&
    /^\d{4}-\d{2}-\d{2}$/.test(endStr) &&
    endStr < startStr
  ) {
    errors.push('تاريخ نهاية الخصم يجب أن يكون بعد أو مساويًا لتاريخ بداية الخصم.');
  }

  const discountPercent =
    errors.length === 0 && finalPrice < cleanBase
      ? calculateDiscountPercent(cleanBase, finalPrice)
      : 0;

  return {
    valid: errors.length === 0,
    errors,
    originalPrice: cleanBase,
    price: errors.length === 0 ? finalPrice : cleanBase,
    discountPercent,
    savings: errors.length === 0 ? savings : 0,
  };
}

export interface ProductDiscountDraft {
  basePriceDraft: string;
  discountEnabled: boolean;
  discountType: DiscountType;
  discountValueDraft: string;
  finalPriceDraft: string;
  discountStartDate: string;
  discountEndDate: string;
}

export function deriveInitialDiscountDraft(
  product?: Product,
  options?: { enableDiscount?: boolean }
): ProductDiscountDraft {
  if (!product) {
    const enabled = Boolean(options?.enableDiscount);
    return {
      basePriceDraft: '',
      discountEnabled: enabled,
      discountType: 'percentage',
      discountValueDraft: enabled ? '10' : '',
      finalPriceDraft: '',
      discountStartDate: '',
      discountEndDate: '',
    };
  }

  const base = roundCurrency(
    product.originalPrice && product.originalPrice > 0 ? product.originalPrice : product.price
  );
  const currentPrice = roundCurrency(product.price);
  const storedType: DiscountType = product.discountType === 'fixed' ? 'fixed' : 'percentage';

  if (!product.discountEnabled || !(base > currentPrice) || !(currentPrice > 0)) {
    return {
      basePriceDraft: base > 0 ? String(base) : '',
      discountEnabled: false,
      discountType: storedType,
      discountValueDraft:
        product.discountValue && product.discountValue > 0
          ? String(roundCurrency(product.discountValue))
          : '',
      finalPriceDraft: base > 0 ? String(base) : '',
      discountStartDate: product.discountStartDate || '',
      discountEndDate: product.discountEndDate || '',
    };
  }

  let resolvedType: DiscountType = storedType;
  let resolvedValue: number;

  if (product.discountValue && product.discountValue > 0) {
    resolvedValue = roundCurrency(product.discountValue);
  } else {
    const exactPct = roundCurrency(((base - currentPrice) / base) * 100);
    const pctPrice = roundCurrency(base - roundCurrency(base * (exactPct / 100)));
    if (storedType !== 'fixed' && exactPct > 0 && exactPct < 100 && pctPrice === currentPrice) {
      resolvedType = 'percentage';
      resolvedValue = exactPct;
    } else {
      resolvedType = 'fixed';
      resolvedValue = roundCurrency(base - currentPrice);
    }
  }

  return {
    basePriceDraft: String(base),
    discountEnabled: true,
    discountType: resolvedType,
    discountValueDraft: String(resolvedValue),
    finalPriceDraft: String(currentPrice),
    discountStartDate: product.discountStartDate || '',
    discountEndDate: product.discountEndDate || '',
  };
}

export interface PreparedProductSubmission {
  valid: boolean;
  errors: string[];
  candidate: ProductFormInput;
}

export function prepareProductFormSubmission(
  form: ProductFormInput,
  draft: ProductDiscountDraft
): PreparedProductSubmission {
  const parsedBase = roundCurrency(Number(draft.basePriceDraft));
  const normalizedCategory = (form.category || '').trim() || 'عام';

  if (!draft.discountEnabled) {
    const candidate: ProductFormInput = {
      ...form,
      category: normalizedCategory,
      originalPrice: parsedBase,
      price: parsedBase,
      discountEnabled: false,
      discountType: 'percentage',
      discountValue: 0,
      discountStartDate: '',
      discountEndDate: '',
    };
    const validation = validateProductInput(candidate);
    return {
      valid: validation.valid,
      errors: validation.errors,
      candidate,
    };
  }

  const extraErrors: string[] = [];
  const trimmedFinal = draft.finalPriceDraft.trim();
  if (trimmedFinal !== '' && Number.isFinite(parsedBase) && parsedBase > 0) {
    const parsedFinal = roundCurrency(Number(trimmedFinal));
    if (!Number.isFinite(parsedFinal) || parsedFinal <= 0) {
      extraErrors.push('يرجى إدخال سعر نهائي بعد الخصم أكبر من صفر.');
    } else if (parsedFinal >= parsedBase) {
      extraErrors.push('السعر النهائي بعد الخصم يجب أن يكون أقل من السعر الأساسي للمنتج.');
    }
  }

  const trimmedDiscountVal = draft.discountValueDraft.trim();
  const numericDiscountVal =
    trimmedDiscountVal === '' ? 0 : roundCurrency(Number(trimmedDiscountVal));

  const discountCalc = computeDiscountPricing({
    basePrice: parsedBase,
    discountEnabled: true,
    discountType: draft.discountType,
    discountValue: numericDiscountVal,
    discountStartDate: draft.discountStartDate,
    discountEndDate: draft.discountEndDate,
  });

  const candidate: ProductFormInput = {
    ...form,
    category: normalizedCategory,
    originalPrice: discountCalc.originalPrice,
    price: discountCalc.valid ? discountCalc.price : parsedBase,
    discountEnabled: true,
    discountType: draft.discountType,
    discountValue: Number.isFinite(numericDiscountVal) ? Math.max(0, numericDiscountVal) : 0,
    discountStartDate: draft.discountStartDate.trim(),
    discountEndDate: draft.discountEndDate.trim(),
  };

  const productValidation = validateProductInput(candidate);
  const mergedErrors: string[] = [];
  for (const err of [...extraErrors, ...discountCalc.errors, ...productValidation.errors]) {
    if (!mergedErrors.includes(err)) {
      mergedErrors.push(err);
    }
  }

  return {
    valid: extraErrors.length === 0 && discountCalc.valid && productValidation.valid,
    errors: mergedErrors,
    candidate,
  };
}

export type DiscountSelectableProduct = Pick<
  Product,
  'discountEnabled' | 'originalPrice' | 'price' | 'discountStartDate' | 'discountEndDate'
>;

export function getDiscountScheduleStatus(
  product: DiscountSelectableProduct,
  referenceDate: Date = new Date()
): 'disabled' | 'scheduled' | 'active' | 'expired' {
  if (
    !product.discountEnabled ||
    !Number.isFinite(product.originalPrice) ||
    !Number.isFinite(product.price) ||
    !(product.originalPrice > product.price) ||
    !(product.price > 0)
  ) {
    return 'disabled';
  }

  const today = formatLocalIsoDate(referenceDate);
  const start = (product.discountStartDate || '').trim().slice(0, 10);
  const end = (product.discountEndDate || '').trim().slice(0, 10);

  if (start && /^\d{4}-\d{2}-\d{2}$/.test(start) && today < start) {
    return 'scheduled';
  }
  if (end && /^\d{4}-\d{2}-\d{2}$/.test(end) && today > end) {
    return 'expired';
  }
  return 'active';
}

export function isDiscountActive(
  product: DiscountSelectableProduct,
  referenceDate: Date = new Date()
): boolean {
  return getDiscountScheduleStatus(product, referenceDate) === 'active';
}

export function getEffectiveProductPrice(
  product: Pick<
    Product,
    'discountEnabled' | 'originalPrice' | 'price' | 'discountStartDate' | 'discountEndDate'
  >,
  referenceDate: Date = new Date()
): number {
  if (isDiscountActive(product, referenceDate)) {
    return roundCurrency(product.price);
  }
  const base =
    Number.isFinite(product.originalPrice) && product.originalPrice > 0
      ? product.originalPrice
      : product.price;
  return roundCurrency(base);
}

export function calculateDiscountPercent(originalPrice: number, currentPrice: number): number {
  if (
    !Number.isFinite(originalPrice) ||
    !Number.isFinite(currentPrice) ||
    originalPrice <= 0 ||
    currentPrice <= 0
  ) {
    return 0;
  }
  if (currentPrice >= originalPrice) {
    return 0;
  }
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

export function calculateSavingsAmount(originalPrice: number, currentPrice: number): number {
  if (
    !Number.isFinite(originalPrice) ||
    !Number.isFinite(currentPrice) ||
    currentPrice >= originalPrice
  ) {
    return 0;
  }
  return roundCurrency(originalPrice - currentPrice);
}

export function formatPriceEgp(amount: number): string {
  if (!Number.isFinite(amount)) return '0';
  const rounded = roundCurrency(amount);
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rounded);
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
    | 'name'
    | 'brand'
    | 'price'
    | 'originalPrice'
    | 'discountEnabled'
    | 'discountStartDate'
    | 'discountEndDate'
    | 'images'
  >;
  selectedOption?: string;
  quantity?: number;
  notes?: string;
  baseOrigin?: string;
  whatsappNumber?: string;
  storeName?: string;
  storeSubtitle?: string;
}

export function buildWhatsAppOrderMessage({
  product,
  selectedOption,
  quantity = 1,
  notes,
  baseOrigin,
  storeName = STORE_INFO.storeName,
  storeSubtitle = STORE_INFO.storeSubtitle,
}: WhatsAppOrderParams): string {
  const safeQty = Math.max(1, Math.floor(quantity));
  const unitPrice = getEffectiveProductPrice(product);
  const total = roundCurrency(unitPrice * safeQty);
  const hasDiscount = isDiscountActive(product);
  const discountPct = hasDiscount
    ? calculateDiscountPercent(product.originalPrice, unitPrice)
    : 0;
  const primaryImage = product.images[0]
    ? resolvePublicImageUrl(product.images[0], baseOrigin)
    : '';

  const lines: string[] = [
    `مرحبًا ${storeName}${storeSubtitle ? ` | ${storeSubtitle}` : ''} 👋`,
    'أرغب في طلب المنتج التالي:',
    `• المنتج: ${product.name}`,
  ];

  if (product.brand && product.brand.trim()) {
    lines.push(`• الماركة: ${product.brand.trim()}`);
  }

  if (selectedOption && selectedOption.trim()) {
    lines.push(`• الخيار المحدد: ${selectedOption.trim()}`);
  }

  lines.push(`• الكمية: ${safeQty}`);
  lines.push(`• سعر القطعة: ${formatPriceEgp(unitPrice)} ج.م`);

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
  const rawPhone = (params.whatsappNumber || STORE_INFO.primaryWhatsApp).replace(/\D/g, '');
  const phone = rawPhone || STORE_INFO.primaryWhatsApp;
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
    | 'id'
    | 'name'
    | 'brand'
    | 'price'
    | 'originalPrice'
    | 'discountEnabled'
    | 'discountStartDate'
    | 'discountEndDate'
  >,
  baseOrigin?: string,
  storeName: string = STORE_INFO.storeName,
  storeSubtitle: string = STORE_INFO.storeSubtitle
): ProductShareLinks {
  const productUrl = buildProductShareUrl(product.id, baseOrigin);
  const unitPrice = getEffectiveProductPrice(product);
  const hasDiscount = isDiscountActive(product);
  const discountPct = hasDiscount
    ? calculateDiscountPercent(product.originalPrice, unitPrice)
    : 0;

  const shareTitle = `${product.name} | ${storeName}`;
  const priceSummary = hasDiscount
    ? `${formatPriceEgp(unitPrice)} ج.م بدلًا من ${formatPriceEgp(product.originalPrice)} ج.م (خصم ${discountPct}%)`
    : `${formatPriceEgp(unitPrice)} ج.م`;

  const brandLabel = product.brand?.trim() ? ` (${product.brand.trim()})` : '';
  const shareText = `${product.name}${brandLabel} — السعر: ${priceSummary} لدى ${storeName}${storeSubtitle ? ` | ${storeSubtitle}` : ''}`;
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
    if (!input.id || input.id.length > MAX_ID_LENGTH || !ID_PATTERN.test(input.id)) {
      errors.push('معرّف المنتج غير صالح.');
    }
  }

  if (name.length < MIN_NAME_LENGTH || name.length > MAX_NAME_LENGTH) {
    errors.push(`اسم المنتج مطلوب ويجب أن يكون بين ${MIN_NAME_LENGTH} و ${MAX_NAME_LENGTH} حرفًا.`);
  }

  if (brand.length > MAX_BRAND_LENGTH) {
    errors.push(`اسم الماركة/المصنع يجب ألا يتجاوز ${MAX_BRAND_LENGTH} حرفًا.`);
  }

  if (category.length > MAX_CATEGORY_LENGTH) {
    errors.push(`التصنيف يجب ألا يتجاوز ${MAX_CATEGORY_LENGTH} حرفًا.`);
  }

  if (shortDesc.length > MAX_SHORT_DESC_LENGTH) {
    errors.push(`الوصف المختصر يجب ألا يتجاوز ${MAX_SHORT_DESC_LENGTH} حرفًا.`);
  }

  if (desc.length > MAX_DESC_LENGTH) {
    errors.push(`تفاصيل المنتج ووصفه يجب ألا تتجاوز ${MAX_DESC_LENGTH} حرفًا.`);
  }

  if (!Number.isFinite(input.price) || input.price <= 0 || input.price > MAX_PRICE) {
    errors.push('يرجى إدخال سعر صحيح أكبر من صفر.');
  }

  const effectiveOriginalPrice = input.discountEnabled ? input.originalPrice : input.price;
  if (
    !Number.isFinite(effectiveOriginalPrice) ||
    effectiveOriginalPrice <= 0 ||
    effectiveOriginalPrice > MAX_PRICE
  ) {
    errors.push('يرجى إدخال السعر الأساسي بشكل صحيح.');
  }

  if (input.discountEnabled && input.originalPrice <= input.price) {
    errors.push('عند تفعيل الخصم يجب أن يكون السعر الأساسي أعلى من السعر بعد الخصم.');
  }

  if (input.discountType !== undefined && !['percentage', 'fixed'].includes(input.discountType)) {
    errors.push('نوع الخصم غير صالح.');
  }

  if (
    input.discountValue !== undefined &&
    (!Number.isFinite(input.discountValue) || input.discountValue < 0 || input.discountValue > MAX_PRICE)
  ) {
    errors.push('قيمة الخصم غير صالحة.');
  }

  const startDate = (input.discountStartDate || '').trim();
  const endDate = (input.discountEndDate || '').trim();
  if (startDate.length > MAX_DATE_STRING_LENGTH || endDate.length > MAX_DATE_STRING_LENGTH) {
    errors.push('تاريخ الخصم يتجاوز الطول المسموح.');
  }
  if (startDate && endDate && endDate < startDate) {
    errors.push('تاريخ نهاية الخصم يجب أن يكون بعد أو مساويًا لتاريخ البداية.');
  }

  const cleanImages = (input.images || []).map((img) => img.trim()).filter(Boolean);
  if (cleanImages.length < 1) {
    errors.push('يرجى رفع أو إضافة صورة واحدة على الأقل للمنتج.');
  } else if (cleanImages.length > MAX_IMAGES) {
    errors.push(`الحد الأقصى لعدد صور المنتج هو ${MAX_IMAGES} صورة.`);
  } else if (cleanImages.some((img) => img.length > MAX_IMAGE_URL_LENGTH)) {
    errors.push('أحد روابط الصور يتجاوز الطول المسموح به.');
  } else if (cleanImages.some((img) => /^(blob:|data:)/i.test(img))) {
    errors.push('لا يُسمح بحفظ صور محلية مؤقتة (blob/base64)؛ يجب رفع الصور سحابيًا أولًا.');
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

export function sanitizeProductPayload(
  input: ProductFormInput,
  existingId?: string,
  authorUid = 'admin-local'
): Product {
  const now = new Date().toISOString();
  const safeId =
    existingId && ID_PATTERN.test(existingId)
      ? existingId
      : `prod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const discountEnabled = Boolean(input.discountEnabled);
  const rawPrice = roundCurrency(Number(input.price));
  const rawOriginal = roundCurrency(Number(input.originalPrice));

  const price = rawPrice > 0 ? rawPrice : 1;
  const originalPrice = discountEnabled
    ? Math.max(roundCurrency(price + 0.01), rawOriginal)
    : rawOriginal > 0
      ? rawOriginal
      : price;

  // When discount is disabled, price equals originalPrice so base price is preserved
  const normalizedSellingPrice = discountEnabled ? price : originalPrice;

  const discountType: DiscountType =
    input.discountType === 'fixed' ? 'fixed' : 'percentage';
  const discountValue =
    input.discountValue !== undefined && Number.isFinite(Number(input.discountValue))
      ? Math.max(0, roundCurrency(Number(input.discountValue)))
      : discountEnabled
        ? calculateDiscountPercent(originalPrice, normalizedSellingPrice)
        : 0;

  const discountStartDate = (input.discountStartDate || '').trim().slice(0, MAX_DATE_STRING_LENGTH);
  const discountEndDate = (input.discountEndDate || '').trim().slice(0, MAX_DATE_STRING_LENGTH);

  return {
    id: safeId.slice(0, MAX_ID_LENGTH),
    name: (input.name || '').trim().slice(0, MAX_NAME_LENGTH),
    brand: (input.brand || '').trim().slice(0, MAX_BRAND_LENGTH),
    category: ((input.category || '').trim() || 'عام').slice(0, MAX_CATEGORY_LENGTH),
    shortDescription: (input.shortDescription || '').trim().slice(0, MAX_SHORT_DESC_LENGTH),
    description: (input.description || '').trim().slice(0, MAX_DESC_LENGTH),
    price: normalizedSellingPrice,
    originalPrice,
    discountEnabled,
    discountType,
    discountValue,
    discountStartDate,
    discountEndDate,
    inStock: Boolean(input.inStock),
    isFeatured: Boolean(input.isFeatured),
    isPublished: input.isPublished !== false,
    images: (input.images || [])
      .map((u) => u.trim())
      .filter((u) => Boolean(u) && !/^(blob:|data:)/i.test(u))
      .slice(0, MAX_IMAGES)
      .map((u) => u.slice(0, MAX_IMAGE_URL_LENGTH)),
    specs: (input.specs || [])
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, MAX_SPECS)
      .map((s) => s.slice(0, MAX_SPEC_LENGTH)),
    options: (input.options || [])
      .map((o) => o.trim())
      .filter(Boolean)
      .slice(0, MAX_OPTIONS)
      .map((o) => o.slice(0, MAX_OPTION_LENGTH)),
    authorUid: authorUid.slice(0, MAX_ID_LENGTH),
    createdAt: now,
    updatedAt: now,
  };
}

export function getDiscountedProducts(
  products: Product[],
  referenceDate: Date = new Date()
): Product[] {
  return products.filter((p) => p.isPublished && isDiscountActive(p, referenceDate));
}

export function filterAndSortProducts(
  products: Product[],
  searchQuery: string,
  selectedCategory: string,
  sortBy: SortOption,
  referenceDate: Date = new Date()
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
      sorted.sort(
        (a, b) =>
          getEffectiveProductPrice(a, referenceDate) - getEffectiveProductPrice(b, referenceDate)
      );
      break;
    case SortOption.PRICE_DESC:
      sorted.sort(
        (a, b) =>
          getEffectiveProductPrice(b, referenceDate) - getEffectiveProductPrice(a, referenceDate)
      );
      break;
    case SortOption.DISCOUNT_DESC:
      sorted.sort((a, b) => {
        const discA = isDiscountActive(a, referenceDate)
          ? calculateDiscountPercent(a.originalPrice, getEffectiveProductPrice(a, referenceDate))
          : 0;
        const discB = isDiscountActive(b, referenceDate)
          ? calculateDiscountPercent(b.originalPrice, getEffectiveProductPrice(b, referenceDate))
          : 0;
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
