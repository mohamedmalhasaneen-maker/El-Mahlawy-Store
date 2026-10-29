import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildProductShareLinks,
  buildProductShareUrl,
  buildWhatsAppOrderMessage,
  buildWhatsAppOrderUrl,
  calculateDiscountPercent,
  calculateSavingsAmount,
  computeDiscountPricing,
  deriveInitialDiscountDraft,
  filterAndSortProducts,
  findProductByShareParam,
  formatPriceEgp,
  getDiscountedProducts,
  getDiscountScheduleStatus,
  getEffectiveProductPrice,
  isDiscountActive,
  prepareProductFormSubmission,
  resolvePublicImageUrl,
  sanitizeProductPayload,
  validateProductInput,
} from './catalogLogic';
import {
  DEFAULT_SITE_CONFIG,
  MAX_FIRESTORE_DOC_SAFE_BYTES,
  buildTargetedSiteConfigUpdateFields,
  estimateJsonUtf8Bytes,
  isValidOptionalHttpUrl,
  isValidPhoneNumber,
  mergeSafeSiteConfigForSave,
  sanitizeSiteConfig,
  validateSiteConfigInput,
} from './siteConfig';
import { Product, SortOption } from '../types/store';

const TEST_PRODUCTS: Product[] = [
  {
    id: 'prod-test-1',
    name: 'سماعة رأس لاسلكية برو',
    brand: 'سوني',
    categoryId: 'accessories',
    category: 'قسم إكسسوارات الهاتف',
    shortDescription: 'صوت نقي وعزل ضوضاء احترافي',
    description: 'سماعة لاسلكية حديثة ببطارية تدوم طويلًا.',
    price: 2450,
    originalPrice: 3150,
    discountEnabled: true,
    inStock: true,
    isFeatured: true,
    isPublished: true,
    images: ['/uploads/headphones.jpg'],
    specs: ['بلوتوث 5.3'],
    options: ['أزرق ملكي × فضي'],
    authorUid: 'admin',
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
  },
  {
    id: 'prod-titanium-smartwatch-ultra',
    name: 'ساعة ذكية تيتانيوم ألترا',
    brand: 'أوشن تيك',
    categoryId: 'smart_home',
    category: 'قسم السمارت هوم',
    shortDescription: 'شاشة AMOLED عالية السطوع',
    description: 'ساعة ذكية مقاومة للماء مع متابعة شاملة.',
    price: 1890,
    originalPrice: 2400,
    discountEnabled: true,
    inStock: true,
    isFeatured: true,
    isPublished: true,
    images: ['/uploads/watch.jpg'],
    specs: ['مقاومة للماء'],
    options: [],
    authorUid: 'admin',
    createdAt: '2026-07-02T10:00:00.000Z',
    updatedAt: '2026-07-02T10:00:00.000Z',
  },
  {
    id: 'prod-charger-1',
    name: 'باور بانك 20000 مللي أمبير',
    brand: 'بيسوس',
    categoryId: 'electrical',
    category: 'قسم الأدوات الكهربائية',
    shortDescription: 'شحن سريع رقمي PD',
    description: 'بطارية محمولة بسعة كبيرة وشاشة رقمية.',
    price: 1250,
    originalPrice: 1250,
    discountEnabled: false,
    inStock: true,
    isFeatured: false,
    isPublished: true,
    images: ['/uploads/powerbank.jpg'],
    specs: [],
    options: [],
    authorUid: 'admin',
    createdAt: '2026-07-03T10:00:00.000Z',
    updatedAt: '2026-07-03T10:00:00.000Z',
  },
  {
    id: 'prod-charger-2',
    name: 'المشترك الكوري الذكي',
    brand: 'LG',
    categoryId: 'electrical',
    category: 'قسم الأدوات الكهربائية',
    shortDescription: 'مشترك كهرباء ذكي مع حماية ومنافذ USB',
    description: '4 مخارج كهرباء مع منفذي شحن USB وحماية فصل تلقائي.',
    price: 800,
    originalPrice: 1000,
    discountEnabled: true,
    inStock: true,
    isFeatured: false,
    isPublished: true,
    images: ['/uploads/lg-strip.jpg'],
    specs: [],
    options: [],
    authorUid: 'admin',
    createdAt: '2026-07-04T10:00:00.000Z',
    updatedAt: '2026-07-04T10:00:00.000Z',
  },
];

test('no plaintext admin password remains in frontend catalogLogic bundle', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'src/utils/catalogLogic.ts'), 'utf8');
  const legacyLeakedSecret = String.fromCharCode(
    87, 81, 40, 56, 41, 64, 111, 112, 110, 75, 76, 79, 90, 36, 56, 48, 64, 71, 104
  );
  assert.equal(source.includes('ADMIN_ACCESS_PASSWORD'), false);
  assert.equal(source.includes(legacyLeakedSecret), false);
});

test('computeDiscountPricing calculates percentage & fixed discounts, rounds to 2 decimals, and blocks invalid values', () => {
  // 15% off 1000 = 850
  const pct = computeDiscountPricing({
    basePrice: 1000,
    discountEnabled: true,
    discountType: 'percentage',
    discountValue: 15,
  });
  assert.equal(pct.valid, true);
  assert.equal(pct.originalPrice, 1000);
  assert.equal(pct.price, 850);
  assert.equal(pct.savings, 150);
  assert.equal(pct.discountPercent, 15);

  // 2-decimal rounding: 33.33% off 199.99 -> savings = 66.66, final = 133.33
  const decimalPct = computeDiscountPricing({
    basePrice: 199.99,
    discountEnabled: true,
    discountType: 'percentage',
    discountValue: 33.33,
  });
  assert.equal(decimalPct.valid, true);
  assert.equal(decimalPct.price, 133.33);
  assert.equal(decimalPct.savings, 66.66);

  // Fixed amount: 250 EGP off 1200 = 950 EGP
  const fixed = computeDiscountPricing({
    basePrice: 1200,
    discountEnabled: true,
    discountType: 'fixed',
    discountValue: 250,
  });
  assert.equal(fixed.valid, true);
  assert.equal(fixed.originalPrice, 1200);
  assert.equal(fixed.price, 950);
  assert.equal(fixed.savings, 250);

  // Disabling discount reverts cleanly to basePrice
  const disabled = computeDiscountPricing({
    basePrice: 1200,
    discountEnabled: false,
    discountType: 'percentage',
    discountValue: 50,
  });
  assert.equal(disabled.valid, true);
  assert.equal(disabled.price, 1200);
  assert.equal(disabled.originalPrice, 1200);
  assert.equal(disabled.savings, 0);

  // Negative value rejected
  const neg = computeDiscountPricing({
    basePrice: 1000,
    discountEnabled: true,
    discountType: 'percentage',
    discountValue: -10,
  });
  assert.equal(neg.valid, false);

  // Percentage > 100% rejected
  const over100 = computeDiscountPricing({
    basePrice: 1000,
    discountEnabled: true,
    discountType: 'percentage',
    discountValue: 110,
  });
  assert.equal(over100.valid, false);

  // Fixed > basePrice rejected
  const fixedOverBase = computeDiscountPricing({
    basePrice: 500,
    discountEnabled: true,
    discountType: 'fixed',
    discountValue: 650,
  });
  assert.equal(fixedOverBase.valid, false);

  // End date before start date rejected
  const invertedDates = computeDiscountPricing({
    basePrice: 1000,
    discountEnabled: true,
    discountType: 'percentage',
    discountValue: 10,
    discountStartDate: '2026-11-10',
    discountEndDate: '2026-11-01',
  });
  assert.equal(invertedDates.valid, false);
});

test('date-bounded discounts activate only within window and revert to base price when expired', () => {
  const scheduledProduct: Product = {
    ...TEST_PRODUCTS[0],
    price: 2000,
    originalPrice: 2500,
    discountEnabled: true,
    discountStartDate: '2026-10-10',
    discountEndDate: '2026-10-20',
  };

  // Before start date -> scheduled, effective price is base originalPrice (2500)
  const beforeDate = new Date(2026, 9, 5, 12, 0, 0); // Oct 5, 2026
  assert.equal(getDiscountScheduleStatus(scheduledProduct, beforeDate), 'scheduled');
  assert.equal(isDiscountActive(scheduledProduct, beforeDate), false);
  assert.equal(getEffectiveProductPrice(scheduledProduct, beforeDate), 2500);

  // Inside window -> active, effective price is discounted price (2000)
  const duringDate = new Date(2026, 9, 15, 12, 0, 0); // Oct 15, 2026
  assert.equal(getDiscountScheduleStatus(scheduledProduct, duringDate), 'active');
  assert.equal(isDiscountActive(scheduledProduct, duringDate), true);
  assert.equal(getEffectiveProductPrice(scheduledProduct, duringDate), 2000);

  // After end date -> expired, automatically reverts to base originalPrice (2500)
  const afterDate = new Date(2026, 9, 25, 12, 0, 0); // Oct 25, 2026
  assert.equal(getDiscountScheduleStatus(scheduledProduct, afterDate), 'expired');
  assert.equal(isDiscountActive(scheduledProduct, afterDate), false);
  assert.equal(getEffectiveProductPrice(scheduledProduct, afterDate), 2500);
});

test('calculateDiscountPercent, calculateSavingsAmount, and formatPriceEgp support decimals cleanly', () => {
  assert.equal(calculateDiscountPercent(3150, 2450), 22);
  assert.equal(calculateDiscountPercent(2000, 1500), 25);
  assert.equal(calculateDiscountPercent(1000, 1000), 0);
  assert.equal(calculateSavingsAmount(3150, 2450), 700);
  assert.equal(formatPriceEgp(2450), '2,450');
  assert.equal(formatPriceEgp(133.334), '133.33');
});

test('validateProductInput allows optional description/category/brand while rejecting missing name, images, or blob URLs', () => {
  const minimalValid = validateProductInput({
    name: 'كاميرا مراقبة خارجية',
    brand: '',
    categoryId: 'cctv',
    category: '',
    shortDescription: '',
    description: '',
    price: 1150,
    originalPrice: 1150,
    discountEnabled: false,
    inStock: true,
    isFeatured: false,
    isPublished: false,
    images: ['https://res.cloudinary.com/obvb7rtp/image/upload/v1/cam.jpg'],
    specs: [],
    options: [],
  });
  assert.equal(minimalValid.valid, true);

  const sanitized = sanitizeProductPayload({
    name: 'كاميرا مراقبة خارجية',
    brand: '',
    categoryId: 'cctv',
    category: '',
    shortDescription: '',
    description: '',
    price: 900,
    originalPrice: 1200,
    discountEnabled: false, // Disabled discount should restore selling price to originalPrice (1200)!
    inStock: true,
    isFeatured: false,
    isPublished: false,
    images: ['https://res.cloudinary.com/obvb7rtp/image/upload/v1/cam.jpg'],
    specs: [],
    options: [],
  });
  assert.equal(sanitized.price, 1200);
  assert.equal(sanitized.originalPrice, 1200);
  assert.equal(sanitized.categoryId, 'cctv');
  assert.equal(sanitized.category, 'قسم كاميرات المراقبة');
  assert.equal(sanitized.isPublished, false);

  const blobRejected = validateProductInput({
    name: 'منتج بصورة مؤقتة',
    brand: '',
    categoryId: 'cctv',
    category: '',
    shortDescription: '',
    description: '',
    price: 500,
    originalPrice: 500,
    discountEnabled: false,
    inStock: true,
    isFeatured: false,
    isPublished: true,
    images: ['blob:http://localhost:3000/12345'],
    specs: [],
    options: [],
  });
  assert.equal(blobRejected.valid, false);
});

test('siteConfig validation validates phones, URLs, and contact channels cleanly', () => {
  assert.equal(isValidPhoneNumber('01210141187'), true);
  assert.equal(isValidPhoneNumber('+20 121 014 1187'), true);
  assert.equal(isValidPhoneNumber('123'), false);
  assert.equal(isValidOptionalHttpUrl('https://wa.me/201210141187'), true);
  assert.equal(isValidOptionalHttpUrl(''), true);
  assert.equal(isValidOptionalHttpUrl('javascript:alert(1)'), false);

  const defaultValidation = validateSiteConfigInput(DEFAULT_SITE_CONFIG);
  assert.equal(defaultValidation.valid, true);

  const sanitized = sanitizeSiteConfig({
    ...DEFAULT_SITE_CONFIG,
    storeName: 'المحلاوي ستور المحدّث',
    showOffersSection: false,
    socialLinks: Array.from({ length: 20 }, (_, i) => ({
      id: `sl-${i}`,
      platform: 'tiktok' as const,
      label: `حساب ${i + 1}`,
      owner: i % 2 === 0 ? ('store' as const) : ('partner' as const),
      url: `https://www.tiktok.com/@account${i}`,
    })),
  });
  assert.equal(sanitized.storeName, 'المحلاوي ستور المحدّث');
  assert.equal(sanitized.showOffersSection, false);
  assert.equal(sanitized.socialLinks.length, 15);

  const badSocialValidation = validateSiteConfigInput({
    ...DEFAULT_SITE_CONFIG,
    socialLinks: [
      {
        id: 'sl-bad',
        platform: 'facebook',
        label: 'رابط غير آمن',
        owner: 'store',
        url: 'javascript:alert(1)',
      },
    ],
  });
  assert.equal(badSocialValidation.valid, false);
});

test('resolvePublicImageUrl, WhatsApp order builder, share links, and catalog filters work end-to-end', () => {
  assert.equal(
    resolvePublicImageUrl('/uploads/item.jpg', 'https://mahallawy.example.com/'),
    'https://mahallawy.example.com/uploads/item.jpg'
  );

  const sample = TEST_PRODUCTS[0];
  const msg = buildWhatsAppOrderMessage({
    product: sample,
    selectedOption: 'أزرق ملكي × فضي',
    quantity: 2,
    notes: 'التوصيل مساءً إلى شرم الشيخ - الرويسات',
    baseOrigin: 'https://mahallawy.example.com',
  });
  assert.ok(msg.includes('2,450 ج.م'));
  assert.ok(msg.includes('4,900 ج.م'));

  const url = buildWhatsAppOrderUrl({
    product: sample,
    quantity: 1,
    whatsappNumber: '201507558522',
  });
  assert.ok(url.startsWith('https://wa.me/201507558522?text='));

  const discounted = getDiscountedProducts(TEST_PRODUCTS);
  assert.equal(discounted.length, 3);

  const chargers = filterAndSortProducts(TEST_PRODUCTS, '', 'electrical', SortOption.PRICE_ASC);
  assert.equal(chargers.length, 2);
  assert.ok(chargers[0].price <= chargers[1].price);

  const directUrl = buildProductShareUrl('prod-charger-2', 'https://mahallawy.example.com/');
  assert.equal(directUrl, 'https://mahallawy.example.com/?product=prod-charger-2');
  const links = buildProductShareLinks(TEST_PRODUCTS[3], 'https://mahallawy.example.com');
  assert.ok(links.shareText.includes('800 ج.م'));
  assert.ok(findProductByShareParam(TEST_PRODUCTS, 'prod-charger-2'));
});

test('deriveInitialDiscountDraft initializes add-product and edit-product discount drafts without price drift', () => {
  const freshDefault = deriveInitialDiscountDraft();
  assert.equal(freshDefault.discountEnabled, false);
  assert.equal(freshDefault.discountType, 'percentage');
  assert.equal(freshDefault.basePriceDraft, '');

  const freshWithDiscount = deriveInitialDiscountDraft(undefined, { enableDiscount: true });
  assert.equal(freshWithDiscount.discountEnabled, true);
  assert.equal(freshWithDiscount.discountType, 'percentage');
  assert.equal(freshWithDiscount.discountValueDraft, '10');

  // Legacy product with price 2450 & originalPrice 3150 (exact pct 22.22% would yield 2450.07, so fixed 700 preserves 2450)
  const legacyDraft = deriveInitialDiscountDraft(TEST_PRODUCTS[0]);
  assert.equal(legacyDraft.discountEnabled, true);
  assert.equal(legacyDraft.basePriceDraft, '3150');
  assert.equal(legacyDraft.finalPriceDraft, '2450');
  assert.equal(legacyDraft.discountType, 'fixed');
  assert.equal(legacyDraft.discountValueDraft, '700');

  // Product with exact clean percentage (800 from 1000 = 20%)
  const cleanPctDraft = deriveInitialDiscountDraft(TEST_PRODUCTS[3]);
  assert.equal(cleanPctDraft.discountEnabled, true);
  assert.equal(cleanPctDraft.discountType, 'percentage');
  assert.equal(cleanPctDraft.discountValueDraft, '20');
  assert.equal(cleanPctDraft.finalPriceDraft, '800');
});

test('prepareProductFormSubmission persists discount settings from Upload & Add New Product form and blocks invalid discounts', () => {
  const baseForm = {
    name: 'جهاز تسجيل هيك فيجن 8 قنوات',
    brand: 'Hikvision',
    categoryId: 'cctv',
    category: 'قسم كاميرات المراقبة',
    shortDescription: 'دقة عالية مع دعم الموبايل',
    description: 'يدعم 8 كاميرات بدقة 5 ميجابكسل.',
    price: 0,
    originalPrice: 0,
    discountEnabled: true,
    discountType: 'percentage' as const,
    discountValue: 15,
    discountStartDate: '2026-10-01',
    discountEndDate: '2026-12-31',
    inStock: true,
    isFeatured: true,
    isPublished: true,
    images: ['https://res.cloudinary.com/obvb7rtp/image/upload/v1/dvr.jpg'],
    specs: ['8 قنوات'],
    options: [],
  };

  // 15% percentage discount on new product upload
  const pctSubmission = prepareProductFormSubmission(baseForm, {
    basePriceDraft: '2000',
    discountEnabled: true,
    discountType: 'percentage',
    discountValueDraft: '15',
    finalPriceDraft: '1700',
    discountStartDate: '2026-10-01',
    discountEndDate: '2026-12-31',
  });
  assert.equal(pctSubmission.valid, true);
  assert.equal(pctSubmission.candidate.originalPrice, 2000);
  assert.equal(pctSubmission.candidate.price, 1700);
  assert.equal(pctSubmission.candidate.discountEnabled, true);
  assert.equal(pctSubmission.candidate.discountType, 'percentage');
  assert.equal(pctSubmission.candidate.discountValue, 15);
  assert.equal(pctSubmission.candidate.discountStartDate, '2026-10-01');
  assert.equal(pctSubmission.candidate.discountEndDate, '2026-12-31');

  // Fixed amount discount on new product upload
  const fixedSubmission = prepareProductFormSubmission(baseForm, {
    basePriceDraft: '2000',
    discountEnabled: true,
    discountType: 'fixed',
    discountValueDraft: '350',
    finalPriceDraft: '1650',
    discountStartDate: '',
    discountEndDate: '',
  });
  assert.equal(fixedSubmission.valid, true);
  assert.equal(fixedSubmission.candidate.originalPrice, 2000);
  assert.equal(fixedSubmission.candidate.price, 1650);
  assert.equal(fixedSubmission.candidate.discountType, 'fixed');
  assert.equal(fixedSubmission.candidate.discountValue, 350);

  // Disabled discount resets selling price cleanly to base price
  const noDiscountSubmission = prepareProductFormSubmission(baseForm, {
    basePriceDraft: '1500',
    discountEnabled: false,
    discountType: 'percentage',
    discountValueDraft: '25',
    finalPriceDraft: '1500',
    discountStartDate: '2026-10-01',
    discountEndDate: '2026-12-31',
  });
  assert.equal(noDiscountSubmission.valid, true);
  assert.equal(noDiscountSubmission.candidate.discountEnabled, false);
  assert.equal(noDiscountSubmission.candidate.price, 1500);
  assert.equal(noDiscountSubmission.candidate.originalPrice, 1500);
  assert.equal(noDiscountSubmission.candidate.discountValue, 0);
  assert.equal(noDiscountSubmission.candidate.discountStartDate, '');
  assert.equal(noDiscountSubmission.candidate.discountEndDate, '');

  // Invalid discount value (empty/zero while discountEnabled = true) must fail explicitly, never silently drop discount
  const missingDiscountVal = prepareProductFormSubmission(baseForm, {
    basePriceDraft: '2000',
    discountEnabled: true,
    discountType: 'percentage',
    discountValueDraft: '',
    finalPriceDraft: '',
    discountStartDate: '',
    discountEndDate: '',
  });
  assert.equal(missingDiscountVal.valid, false);
  assert.ok(missingDiscountVal.errors.length > 0);

  // Final price >= base price while discountEnabled = true must fail explicitly
  const badFinalPrice = prepareProductFormSubmission(baseForm, {
    basePriceDraft: '2000',
    discountEnabled: true,
    discountType: 'fixed',
    discountValueDraft: '0',
    finalPriceDraft: '2100',
    discountStartDate: '',
    discountEndDate: '',
  });
  assert.equal(badFinalPrice.valid, false);
  assert.ok(badFinalPrice.errors.some((e) => e.includes('أقل من السعر الأساسي')));
});

test('sanitizeSiteConfig enforces Firestore minLength boundaries and preserves custom ordered categories', () => {
  const sanitized = sanitizeSiteConfig(
    {
      ...DEFAULT_SITE_CONFIG,
      storeName: ' ',
      primaryPhone: '12',
      primaryWhatsApp: '',
      categories: [
        { id: 'smart_home', name: 'قسم السمارت هوم الذكي', order: 1 },
        { id: 'cctv', name: 'قسم كاميرات المراقبة', order: 2 },
        { id: 'cat-networking', name: 'قسم الشبكات والراوتر', order: 3 },
      ],
    },
    'eGi5P37ztLe5Nn77sEFvmFFcZWp1'
  );

  assert.equal(sanitized.storeName, DEFAULT_SITE_CONFIG.storeName);
  assert.equal(sanitized.primaryPhone, DEFAULT_SITE_CONFIG.primaryPhone);
  assert.equal(sanitized.primaryWhatsApp, DEFAULT_SITE_CONFIG.primaryWhatsApp);
  assert.equal(sanitized.updatedBy, 'eGi5P37ztLe5Nn77sEFvmFFcZWp1');
  assert.equal(sanitized.categories.length, 3);
  assert.equal(sanitized.categories[0].id, 'smart_home');
  assert.equal(sanitized.categories[0].order, 1);
  assert.equal(sanitized.categories[2].id, 'cat-networking');
  assert.equal(sanitized.categories[2].name, 'قسم الشبكات والراوتر');
});

test('mergeSafeSiteConfigForSave prevents accidental blanking, preserves server fields, builds minimal targeted updates, and checks Firestore byte limits', () => {
  const existingServerDoc: Record<string, unknown> = {
    ...DEFAULT_SITE_CONFIG,
    storeName: 'المحلاوي ستور الأصلي',
    aboutHeroTitle: 'عنوان من نحن الحالي على الخادم',
    aboutStoreIntro: 'نبذة المحلاوي ستور المحفوظة مسبقًا على الخادم.',
    announcementText: 'إعلان قديم قابل للمسح',
    instagramUrl: 'https://instagram.com/elmahlawystore',
  };

  // Accidental blanking of protected fields (empty storeName / empty aboutHeroTitle) preserves server values,
  // while intentional update of aboutStoreIntro and intentional clearing of optional announcementText succeed!
  const merged = mergeSafeSiteConfigForSave(
    existingServerDoc,
    {
      storeName: '   ',
      aboutHeroTitle: '',
      aboutStoreIntro: 'نبذة جديدة موسعة ومحدّثة للمحلاوي ستور في شرم الشيخ.',
      announcementText: '',
      instagramUrl: '',
    },
    'eGi5P37ztLe5Nn77sEFvmFFcZWp1'
  );

  assert.equal(merged.storeName, 'المحلاوي ستور الأصلي');
  assert.equal(merged.aboutHeroTitle, 'عنوان من نحن الحالي على الخادم');
  assert.equal(merged.aboutStoreIntro, 'نبذة جديدة موسعة ومحدّثة للمحلاوي ستور في شرم الشيخ.');
  assert.equal(merged.announcementText, '');
  assert.equal(merged.instagramUrl, '');
  assert.ok(estimateJsonUtf8Bytes(merged) < MAX_FIRESTORE_DOC_SAFE_BYTES);

  // Targeted update fields include core required keys + ONLY the fields that actually changed
  const targeted = buildTargetedSiteConfigUpdateFields(
    existingServerDoc,
    merged,
    'eGi5P37ztLe5Nn77sEFvmFFcZWp1'
  );
  assert.equal(targeted.id, 'main');
  assert.equal(targeted.storeName, 'المحلاوي ستور الأصلي');
  assert.equal(targeted.updatedBy, 'eGi5P37ztLe5Nn77sEFvmFFcZWp1');
  assert.equal(targeted.aboutStoreIntro, 'نبذة جديدة موسعة ومحدّثة للمحلاوي ستور في شرم الشيخ.');
  assert.equal(targeted.announcementText, '');
  assert.equal(targeted.instagramUrl, '');
  // Unchanged field (e.g. visionDescription) is NOT redundantly resent in targeted update
  assert.equal('visionDescription' in targeted, false);

  // Initial creation (existingServerRaw === null) includes full SiteConfig fields
  const initialCreateFields = buildTargetedSiteConfigUpdateFields(
    null,
    merged,
    'eGi5P37ztLe5Nn77sEFvmFFcZWp1'
  );
  assert.equal(initialCreateFields.visionDescription, merged.visionDescription);
});



