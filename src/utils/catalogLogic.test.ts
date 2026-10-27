import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildProductShareLinks,
  buildProductShareUrl,
  buildWhatsAppOrderMessage,
  buildWhatsAppOrderUrl,
  calculateDiscountPercent,
  calculateSavingsAmount,
  filterAndSortProducts,
  findProductByShareParam,
  formatPriceEgp,
  getDiscountedProducts,
  isDiscountActive,
  resolvePublicImageUrl,
  validateProductInput,
  verifyAdminPassword,
} from './catalogLogic';
import { Product, SortOption } from '../types/store';

const TEST_PRODUCTS: Product[] = [
  {
    id: 'prod-test-1',
    name: 'سماعة رأس لاسلكية برو',
    brand: 'سوني',
    category: 'سماعات وصوتيات',
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
    category: 'ساعات ذكية',
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
    category: 'شواحن وطاقة',
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
    category: 'شواحن وطاقة',
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

test('verifyAdminPassword accepts only 123456 and rejects other inputs', () => {
  assert.equal(verifyAdminPassword('123456'), true);
  assert.equal(verifyAdminPassword(' 123456 '), true);
  assert.equal(verifyAdminPassword('12345'), false);
  assert.equal(verifyAdminPassword('000000'), false);
  assert.equal(verifyAdminPassword(''), false);
});

test('calculateDiscountPercent computes accurate percentage and guards invalid cases', () => {
  assert.equal(calculateDiscountPercent(3150, 2450), 22);
  assert.equal(calculateDiscountPercent(2000, 1500), 25);
  assert.equal(calculateDiscountPercent(1000, 1000), 0);
  assert.equal(calculateDiscountPercent(800, 1200), 0);
  assert.equal(calculateDiscountPercent(0, 500), 0);
});

test('calculateSavingsAmount and formatPriceEgp format Egyptian Pound values cleanly', () => {
  assert.equal(calculateSavingsAmount(3150, 2450), 700);
  assert.equal(calculateSavingsAmount(1000, 1200), 0);
  assert.equal(formatPriceEgp(2450), '2,450');
});

test('resolvePublicImageUrl preserves external URLs and resolves relative asset paths', () => {
  assert.equal(
    resolvePublicImageUrl('/uploads/item.jpg', 'https://mahallawy.example.com/'),
    'https://mahallawy.example.com/uploads/item.jpg'
  );
  assert.equal(
    resolvePublicImageUrl('https://cdn.example.com/pic.png', 'https://mahallawy.example.com'),
    'https://cdn.example.com/pic.png'
  );
  assert.equal(
    resolvePublicImageUrl(
      'https://ais-dev-old-host.run.app/uploads/mahallawy-item.jpg',
      'https://mahallawy.example.com'
    ),
    'https://mahallawy.example.com/uploads/mahallawy-item.jpg'
  );
});

test('buildWhatsAppOrderMessage and buildWhatsAppOrderUrl route to El Mahlawy Store WhatsApp 201210141187 and include customer notes', () => {
  const sample = TEST_PRODUCTS[0];
  const msg = buildWhatsAppOrderMessage({
    product: sample,
    selectedOption: 'أزرق ملكي × فضي',
    quantity: 2,
    notes: 'التوصيل مساءً إلى شرم الشيخ - الرويسات',
    baseOrigin: 'https://mahallawy.example.com',
  });

  assert.ok(msg.includes('المحلاوي ستور'));
  assert.ok(msg.includes(sample.name));
  assert.ok(msg.includes('أزرق ملكي × فضي'));
  assert.ok(msg.includes('2,450 ج.م'));
  assert.ok(msg.includes('4,900 ج.م'));
  assert.ok(msg.includes('• ملاحظات العميل: التوصيل مساءً إلى شرم الشيخ - الرويسات'));
  assert.ok(msg.includes('https://mahallawy.example.com/uploads/headphones.jpg'));

  const url = buildWhatsAppOrderUrl({
    product: sample,
    quantity: 3,
    notes: 'تغليف هدية',
    baseOrigin: 'https://mahallawy.example.com',
  });
  assert.ok(url.startsWith('https://wa.me/201210141187?text='));
  assert.ok(decodeURIComponent(url).includes('تغليف هدية'));
});

test('validateProductInput enforces required fields and rejects inverted discounts', () => {
  const validResult = validateProductInput({
    name: 'سماعة بلوتوث احترافية',
    brand: 'أنكر',
    category: 'عام',
    shortDescription: 'صوت نقي وعزل ممتاز للمكالمات',
    description: 'تفاصيل كاملة حول السماعة اللاسلكية وجودة التصنيع والبطارية.',
    price: 950,
    originalPrice: 1200,
    discountEnabled: true,
    inStock: true,
    isFeatured: false,
    isPublished: true,
    images: ['/uploads/test.jpg'],
    specs: ['بلوتوث 5.3'],
    options: ['أزرق'],
  });
  assert.equal(validResult.valid, true);
  assert.equal(validResult.errors.length, 0);

  const invertedDiscount = validateProductInput({
    name: 'سماعة بلوتوث احترافية',
    brand: 'أنكر',
    category: 'عام',
    shortDescription: 'صوت نقي وعزل ممتاز للمكالمات',
    description: 'تفاصيل كاملة حول السماعة اللاسلكية وجودة التصنيع والبطارية.',
    price: 1400,
    originalPrice: 1200,
    discountEnabled: true,
    inStock: true,
    isFeatured: false,
    isPublished: true,
    images: ['/uploads/test.jpg'],
    specs: [],
    options: [],
  });
  assert.equal(invertedDiscount.valid, false);
  assert.ok(invertedDiscount.errors.some((e) => e.includes('السعر الأصلي')));
});

test('getDiscountedProducts and filterAndSortProducts return accurate subsets', () => {
  const discounted = getDiscountedProducts(TEST_PRODUCTS);
  assert.equal(discounted.length, 3);
  assert.ok(discounted.every((p) => isDiscountActive(p)));

  const chargers = filterAndSortProducts(
    TEST_PRODUCTS,
    '',
    'شواحن وطاقة',
    SortOption.PRICE_ASC
  );
  assert.equal(chargers.length, 2);
  assert.ok(chargers[0].price <= chargers[1].price);

  const searched = filterAndSortProducts(
    TEST_PRODUCTS,
    'تيتانيوم',
    'الكل',
    SortOption.NEWEST
  );
  assert.equal(searched.length, 1);
  assert.equal(searched[0].id, 'prod-titanium-smartwatch-ultra');
});

test('buildProductShareLinks and findProductByShareParam generate social share URLs and resolve deep links', () => {
  const sample = TEST_PRODUCTS[3]; // المشترك الكوري الذكي
  const directUrl = buildProductShareUrl(sample.id, 'https://mahallawy.example.com/');
  assert.equal(directUrl, 'https://mahallawy.example.com/?product=prod-charger-2');

  const links = buildProductShareLinks(sample, 'https://mahallawy.example.com');
  assert.equal(links.productUrl, 'https://mahallawy.example.com/?product=prod-charger-2');
  assert.ok(links.shareTitle.includes(sample.name));
  assert.ok(links.shareText.includes('800 ج.م'));
  assert.ok(links.whatsappShareUrl.startsWith('https://wa.me/?text='));
  assert.ok(decodeURIComponent(links.whatsappShareUrl).includes(links.productUrl));
  assert.ok(links.facebookShareUrl.startsWith('https://www.facebook.com/sharer/sharer.php?u='));
  assert.ok(links.telegramShareUrl.startsWith('https://t.me/share/url?url='));
  assert.ok(links.xShareUrl.startsWith('https://x.com/intent/tweet?url='));

  const resolved = findProductByShareParam(TEST_PRODUCTS, 'prod-charger-2');
  assert.ok(resolved);
  assert.equal(resolved.name, 'المشترك الكوري الذكي');
  assert.equal(findProductByShareParam(TEST_PRODUCTS, 'missing-id'), null);
  assert.equal(findProductByShareParam(TEST_PRODUCTS, null), null);
});

