import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Product } from '../types/store';
import { DEFAULT_SITE_CONFIG } from './siteConfig';
import {
  ALTERNATE_SITE_NAMES,
  DEFAULT_HOME_SEO_TITLE,
  OFFICIAL_SITE_NAME,
  OFFICIAL_SITE_ORIGIN,
  buildCrawlableNoscriptHtml,
  buildPageSeoMetadata,
  buildProductImageAlt,
  buildRobotsTxt,
  buildSitemapXml,
  buildStructuredDataGraph,
  decodeFirestoreRestFields,
  injectSeoIntoHtml,
  optimizeCloudinaryImageUrl,
  parseStoreSeoRoute,
} from './seo';

const ORIGIN = 'https://elmahlawy-store.example.com';

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'prod-hikvision-2mp',
    name: 'كاميرا مراقبة خارجية 2 ميجا ليلية',
    brand: 'Hikvision',
    category: 'كاميرات مراقبة',
    categoryId: 'cctv',
    price: 950,
    originalPrice: 1200,
    discountEnabled: true,
    discountType: 'fixed',
    discountValue: 250,
    discountEndDate: '2027-12-31',
    shortDescription: 'رؤية ليلية واضحة ومقاومة للعوامل الجوية IP67.',
    description: 'كاميرا مراقبة خارجية عالية الدقة مناسبة للمنازل والمحلات التجارية.',
    specs: ['الدقة: 1080p Full HD'],
    options: [],
    images: ['https://res.cloudinary.com/demo/image/upload/v1710000000/hikvision-cam.jpg'],
    inStock: true,
    isPublished: true,
    isFeatured: true,
    featuredOrder: 0,
    authorUid: 'admin-1',
    createdAt: '2026-03-10T10:00:00.000Z',
    updatedAt: '2026-03-15T12:00:00.000Z',
  },
  {
    id: 'prod-draft-hidden',
    name: 'منتج تجريبي مخفي',
    brand: '',
    category: 'سمارت هوم',
    categoryId: 'smart-home',
    price: 500,
    originalPrice: 500,
    discountEnabled: false,
    shortDescription: 'مسودة غير منشورة',
    description: 'لا يجب أن يظهر في خريطة الموقع',
    specs: [],
    options: [],
    images: [],
    inStock: false,
    isFeatured: false,
    isPublished: false,
    authorUid: 'admin-1',
    createdAt: '2026-03-11T10:00:00.000Z',
    updatedAt: '2026-03-11T10:00:00.000Z',
  },
];

test('Homepage SEO title, description, canonical, and OpenGraph match brand requirements', () => {
  const route = parseStoreSeoRoute('/');
  assert.equal(route.kind, 'home');

  const meta = buildPageSeoMetadata({
    origin: ORIGIN,
    route,
    siteConfig: DEFAULT_SITE_CONFIG,
    products: SAMPLE_PRODUCTS,
  });

  assert.equal(meta.title, 'المحلاوي ستور | Elmahlawy Store - تسوق منتجاتنا');
  assert.equal(meta.title, DEFAULT_HOME_SEO_TITLE);
  assert.ok(meta.description.includes('المحلاوي ستور'));
  assert.ok(meta.description.includes('Elmahlawy Store'));
  assert.equal(meta.canonicalUrl, `${ORIGIN}/`);
  assert.equal(meta.ogSiteName, OFFICIAL_SITE_NAME);
  assert.equal(meta.ogLocale, 'ar_EG');
  assert.equal(meta.ogImage, `${ORIGIN}/logo.png`);
  assert.equal(meta.httpStatus, 200);
  assert.ok(meta.robots.startsWith('index, follow'));
});

test('Per-page SEO metadata and canonical URLs work for About, Category, Product, Search, Developer, and 404', () => {
  // About Us (/about)
  const aboutMeta = buildPageSeoMetadata({
    origin: ORIGIN,
    route: parseStoreSeoRoute('/about'),
    siteConfig: DEFAULT_SITE_CONFIG,
  });
  assert.equal(aboutMeta.title, 'من نحن | المحلاوي ستور - Elmahlawy Store');
  assert.equal(aboutMeta.canonicalUrl, `${ORIGIN}/about`);
  assert.equal(aboutMeta.httpStatus, 200);

  // Category (/category/cctv)
  const categoryMeta = buildPageSeoMetadata({
    origin: ORIGIN,
    route: parseStoreSeoRoute('/category/cctv'),
    siteConfig: DEFAULT_SITE_CONFIG,
  });
  assert.equal(categoryMeta.title, 'قسم كاميرات المراقبة | المحلاوي ستور - Elmahlawy Store');
  assert.equal(categoryMeta.canonicalUrl, `${ORIGIN}/category/cctv`);
  assert.equal(categoryMeta.httpStatus, 200);

  // Product (/product/prod-hikvision-2mp) and legacy query (?product=prod-hikvision-2mp)
  const legacyProductRoute = parseStoreSeoRoute('/', '?product=prod-hikvision-2mp');
  assert.equal(legacyProductRoute.kind, 'product');
  const productMeta = buildPageSeoMetadata({
    origin: ORIGIN,
    route: legacyProductRoute,
    siteConfig: DEFAULT_SITE_CONFIG,
    products: SAMPLE_PRODUCTS,
  });
  assert.ok(productMeta.title.includes('كاميرا مراقبة خارجية 2 ميجا ليلية'));
  assert.ok(productMeta.title.includes('Hikvision'));
  assert.equal(productMeta.canonicalUrl, `${ORIGIN}/product/prod-hikvision-2mp`);
  assert.equal(productMeta.ogType, 'product');
  assert.equal(productMeta.productPriceAmount, '950');
  assert.equal(productMeta.productPriceCurrency, 'EGP');
  assert.equal(productMeta.productAvailability, 'in stock');
  assert.equal(
    productMeta.ogImage,
    'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v1710000000/hikvision-cam.jpg'
  );

  // Missing or unpublished product returns 404 + noindex, nofollow
  const hiddenProductMeta = buildPageSeoMetadata({
    origin: ORIGIN,
    route: parseStoreSeoRoute('/product/prod-draft-hidden'),
    products: SAMPLE_PRODUCTS,
    catalogLoaded: true,
  });
  assert.equal(hiddenProductMeta.httpStatus, 404);
  assert.equal(hiddenProductMeta.robots, 'noindex, nofollow');

  // Search query (/?q=...) is noindex, follow with canonical /
  const searchMeta = buildPageSeoMetadata({
    origin: ORIGIN,
    route: parseStoreSeoRoute('/', '?q=كاميرات'),
  });
  assert.equal(searchMeta.robots, 'noindex, follow');
  assert.equal(searchMeta.canonicalUrl, `${ORIGIN}/`);

  // Developer route is noindex, nofollow
  const devMeta = buildPageSeoMetadata({
    origin: ORIGIN,
    route: parseStoreSeoRoute('/developer'),
  });
  assert.equal(devMeta.robots, 'noindex, nofollow');

  // Unknown route returns 404 + noindex, nofollow
  const unknownMeta = buildPageSeoMetadata({
    origin: ORIGIN,
    route: parseStoreSeoRoute('/non-existent-page'),
  });
  assert.equal(unknownMeta.httpStatus, 404);
  assert.equal(unknownMeta.robots, 'noindex, nofollow');
});

test('Schema.org JSON-LD includes OnlineStore, WebSite SearchAction, and truthful Product Offer without fake ratings', () => {
  const graphDoc = buildStructuredDataGraph({
    origin: ORIGIN,
    route: parseStoreSeoRoute('/product/prod-hikvision-2mp'),
    siteConfig: DEFAULT_SITE_CONFIG,
    products: SAMPLE_PRODUCTS,
  });

  const graph = graphDoc['@graph'] as Array<Record<string, unknown>>;
  assert.ok(Array.isArray(graph));

  const storeNode = graph.find((node) => node['@type'] === 'OnlineStore');
  assert.ok(storeNode);
  assert.equal(storeNode.name, 'Elmahlawy Store');
  assert.deepEqual(storeNode.alternateName, [...ALTERNATE_SITE_NAMES]);
  assert.equal(storeNode.currenciesAccepted, 'EGP');
  assert.equal(storeNode.telephone, '+201210141187');
  assert.equal('aggregateRating' in storeNode, false);

  const websiteNode = graph.find((node) => node['@type'] === 'WebSite');
  assert.ok(websiteNode);
  const searchAction = websiteNode.potentialAction as Record<string, unknown>;
  assert.equal(searchAction['@type'], 'SearchAction');

  const productNode = graph.find((node) => node['@type'] === 'Product');
  assert.ok(productNode);
  assert.equal(productNode.sku, 'prod-hikvision-2mp');
  assert.equal('aggregateRating' in productNode, false);
  assert.equal('review' in productNode, false);

  const offer = productNode.offers as Record<string, unknown>;
  assert.equal(offer.priceCurrency, 'EGP');
  assert.equal(offer.price, '950');
  assert.equal(offer.availability, 'https://schema.org/InStock');
});

test('buildSitemapXml and buildRobotsTxt include only public indexable URLs', () => {
  const xml = buildSitemapXml(ORIGIN, DEFAULT_SITE_CONFIG.categories, SAMPLE_PRODUCTS);
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(xml.includes(`<loc>${ORIGIN}/</loc>`));
  assert.ok(xml.includes(`<loc>${ORIGIN}/about</loc>`));
  assert.ok(xml.includes(`<loc>${ORIGIN}/category/cctv</loc>`));
  assert.ok(xml.includes(`<loc>${ORIGIN}/product/prod-hikvision-2mp</loc>`));
  assert.ok(xml.includes('<lastmod>2026-03-15</lastmod>'));
  assert.equal(xml.includes('prod-draft-hidden'), false);
  assert.equal(xml.includes('/developer'), false);

  const robots = buildRobotsTxt(ORIGIN);
  assert.ok(robots.includes('Allow: /'));
  assert.ok(robots.includes('Disallow: /developer'));
  assert.ok(robots.includes(`Sitemap: ${ORIGIN}/sitemap.xml`));
});

test('injectSeoIntoHtml replaces head metadata cleanly without duplicate tags and supports Google verification', () => {
  const template = `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <title>Old Title</title>
    <meta name="description" content="Old desc" />
    <link rel="canonical" href="https://old.example.com/" />
    <meta property="og:title" content="Old OG" />
    <script id="seo-structured-data" type="application/ld+json">{}</script>
  </head>
  <body>
    <div id="root"></div>
    <noscript id="seo-crawlable-fallback">Old fallback</noscript>
  </body>
</html>`;

  const route = parseStoreSeoRoute('/');
  const meta = buildPageSeoMetadata({ origin: ORIGIN, route });
  const jsonLd = buildStructuredDataGraph({ origin: ORIGIN, route, products: SAMPLE_PRODUCTS });
  const noscript = buildCrawlableNoscriptHtml({
    origin: ORIGIN,
    route,
    products: SAMPLE_PRODUCTS,
  });

  const enriched = injectSeoIntoHtml(template, meta, jsonLd, noscript, 'gsc-verify-token-123');
  assert.equal((enriched.match(/<title>/g) || []).length, 1);
  assert.equal((enriched.match(/rel="canonical"/g) || []).length, 1);
  assert.equal((enriched.match(/google-site-verification/g) || []).length, 1);
  assert.ok(enriched.includes('<meta name="google-site-verification" content="gsc-verify-token-123" />'));
  assert.ok(enriched.includes('المحلاوي ستور | Elmahlawy Store - تسوق منتجاتنا'));
  assert.ok(enriched.includes(`${ORIGIN}/product/prod-hikvision-2mp`));

  const templateWithEmbeddedGsc = `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="google-site-verification" content="Q64R65UJ2_InKDzink7gozFlm1hRsgE5G5L-N2mVwcw" />
  </head>
  <body><div id="root"></div></body>
</html>`;
  const enrichedFromEmbedded = injectSeoIntoHtml(templateWithEmbeddedGsc, meta, jsonLd, noscript, '');
  assert.equal((enrichedFromEmbedded.match(/google-site-verification/g) || []).length, 1);
  assert.ok(
    enrichedFromEmbedded.includes(
      '<meta name="google-site-verification" content="Q64R65UJ2_InKDzink7gozFlm1hRsgE5G5L-N2mVwcw" />'
    )
  );
});

test('Cloudinary optimizer, product alt builder, and Firestore REST decoder work accurately', () => {
  assert.equal(
    optimizeCloudinaryImageUrl('https://res.cloudinary.com/abc/image/upload/v123/item.png'),
    'https://res.cloudinary.com/abc/image/upload/f_auto,q_auto/v123/item.png'
  );
  // Does not double-inject if transformations already exist
  assert.equal(
    optimizeCloudinaryImageUrl('https://res.cloudinary.com/abc/image/upload/f_auto,q_auto/v123/item.png'),
    'https://res.cloudinary.com/abc/image/upload/f_auto,q_auto/v123/item.png'
  );

  const alt = buildProductImageAlt(SAMPLE_PRODUCTS[0], 2);
  assert.ok(alt.includes('كاميرا مراقبة خارجية 2 ميجا ليلية'));
  assert.ok(alt.includes('Hikvision'));
  assert.ok(alt.includes('صورة 2'));
  assert.ok(alt.includes('المحلاوي ستور Elmahlawy Store'));

  const decoded = decodeFirestoreRestFields({
    name: { stringValue: 'رسيفر 4K' },
    price: { integerValue: '1550' },
    isPublished: { booleanValue: true },
    images: { arrayValue: { values: [{ stringValue: '/img1.jpg' }] } },
  });
  assert.deepEqual(decoded, {
    name: 'رسيفر 4K',
    price: 1550,
    isPublished: true,
    images: ['/img1.jpg'],
  });
});

test('Generated public/sitemap.xml, public/robots.txt, and vercel.json comply with Google & Vercel requirements', () => {
  assert.equal(OFFICIAL_SITE_ORIGIN, 'https://elmahlawy-store.vercel.app');

  const rootDir = process.cwd();
  const sitemapPath = path.join(rootDir, 'public', 'sitemap.xml');
  const robotsPath = path.join(rootDir, 'public', 'robots.txt');
  const vercelPath = path.join(rootDir, 'vercel.json');

  assert.equal(fs.existsSync(sitemapPath), true, 'public/sitemap.xml must exist');
  assert.equal(fs.existsSync(robotsPath), true, 'public/robots.txt must exist');
  assert.equal(fs.existsSync(vercelPath), true, 'vercel.json must exist');

  const sitemapXml = fs.readFileSync(sitemapPath, 'utf8');
  assert.equal(
    sitemapXml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'),
    true,
    'sitemap.xml must begin at byte 0 with valid XML declaration and sitemaps.org 0.9 namespace'
  );
  assert.equal(sitemapXml.trimEnd().endsWith('</urlset>'), true);

  const locs = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(locs.length >= 8, 'sitemap.xml must include homepage, about, and real store categories');
  assert.ok(locs.includes('https://elmahlawy-store.vercel.app/'));
  assert.ok(locs.includes('https://elmahlawy-store.vercel.app/about'));

  const uniqueLocs = new Set(locs);
  assert.equal(uniqueLocs.size, locs.length, 'sitemap.xml must contain no duplicate URLs');

  for (const loc of locs) {
    assert.equal(
      loc.startsWith('https://elmahlawy-store.vercel.app/'),
      true,
      `Every <loc> must use official domain, got: ${loc}`
    );
    assert.equal(loc.includes('/developer'), false, 'Admin/developer routes must never appear in sitemap');
    assert.equal(loc.includes('/admin'), false, 'Admin routes must never appear in sitemap');
  }

  for (const lastmodMatch of sitemapXml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)) {
    assert.match(lastmodMatch[1], /^\d{4}-\d{2}-\d{2}$/);
  }

  const robotsTxt = fs.readFileSync(robotsPath, 'utf8');
  assert.ok(robotsTxt.includes('User-agent: Googlebot'));
  assert.ok(robotsTxt.includes('Allow: /'));
  assert.ok(robotsTxt.includes('Disallow: /developer'));
  assert.ok(robotsTxt.includes('Sitemap: https://elmahlawy-store.vercel.app/sitemap.xml'));

  const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf8')) as {
    headers?: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
    rewrites?: Array<{ source: string; destination: string }>;
  };
  const sitemapHeaderRule = (vercelConfig.headers || []).find((h) => h.source === '/sitemap.xml');
  assert.ok(sitemapHeaderRule, 'vercel.json must configure headers for /sitemap.xml');
  assert.ok(
    sitemapHeaderRule.headers.some(
      (hdr) => hdr.key.toLowerCase() === 'content-type' && hdr.value.includes('application/xml')
    )
  );

  const rewriteSources = (vercelConfig.rewrites || []).map((r) => r.source);
  assert.equal(rewriteSources.includes('/sitemap.xml'), false);
  assert.equal(rewriteSources.includes('/robots.txt'), false);
  assert.equal(rewriteSources.includes('/(.*)'), false, 'Avoid catch-all rewrite that could mask XML/404s');
  assert.equal(rewriteSources.includes('/about'), true);
  assert.equal(rewriteSources.includes('/category/:id'), true);
  assert.equal(rewriteSources.includes('/product/:id'), true);
});
