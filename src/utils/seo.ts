import { Product, STORE_INFO } from '../types/store';
import {
  Category,
  PRODUCT_CATEGORIES,
  getCategoryIdByName,
  getCategoryName,
  getOrderedCategories,
} from '../constants/categories';
import {
  DEFAULT_SITE_CONFIG,
  OFFICIAL_STORE_LATITUDE,
  OFFICIAL_STORE_LONGITUDE,
  SiteConfig,
  isValidOptionalHttpUrl,
} from './siteConfig';
import { formatPriceEgp, getEffectiveProductPrice, isDiscountActive } from './catalogLogic';

export const OFFICIAL_SITE_ORIGIN = 'https://elmahlawy-store.vercel.app';
export const OFFICIAL_SITE_NAME = 'Elmahlawy Store';
export const ARABIC_SITE_NAME = 'المحلاوي ستور';

export const ALTERNATE_SITE_NAMES: readonly string[] = [
  'المحلاوي ستور',
  'El Mahlawy Store',
  'Elmahlawy',
  'المحلاوي',
  'Elmahlawy Store Egypt',
];

export const DEFAULT_HOME_SEO_TITLE = 'المحلاوي ستور | Elmahlawy Store - المتجر الرسمي';

export const DEFAULT_HOME_SEO_DESCRIPTION =
  'المحلاوي ستور (Elmahlawy Store) في مصر — تسوق كاميرات المراقبة، الستالايت والرسيفرات، أنظمة الصوتيات، السمارت هوم، والإنذار المبكر مع شحن لجميع المحافظات.';

const LEGACY_DEFAULT_TITLES = new Set([
  'المحلاوي ستور | El Mahlawy Store',
  'المحلاوي ستور',
  'El Mahlawy Store',
  'المحلاوي ستور | Elmahlawy Store - تسوق منتجاتنا',
]);

const LEGACY_DEFAULT_DESCRIPTIONS = new Set([
  'متجر المحلاوي ستور الإلكتروني لعرض المنتجات ومواصفاتها وأسعارها والطلب عبر WhatsApp.',
  'المحلاوي ستور - تسوق أحدث المنتجات والإلكترونيات وحلول الأنظمة الفنية بشرم الشيخ وجميع محافظات مصر.',
  'المحلاوي ستور - تسوق أحدث المنتجات والإلكترونيات وحلول الذكاء التكنولوجي بشرم الشيخ وجميع محافظات مصر.',
]);

export type SeoRouteInfo =
  | { kind: 'home'; canonicalPath: '/' }
  | { kind: 'about'; canonicalPath: '/about' }
  | { kind: 'developer'; canonicalPath: '/developer' }
  | { kind: 'category'; categoryId: string; canonicalPath: string }
  | { kind: 'product'; productId: string; canonicalPath: string }
  | { kind: 'search'; query: string; canonicalPath: '/' }
  | { kind: 'not_found'; rawPath: string; canonicalPath: '/' };

export interface PageSeoMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  robots: string;
  ogType: 'website' | 'product';
  ogSiteName: string;
  ogLocale: string;
  ogTitle: string;
  ogDescription: string;
  ogUrl: string;
  ogImage: string;
  ogImageAlt: string;
  twitterCard: 'summary_large_image';
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  productPriceAmount?: string;
  productPriceCurrency?: string;
  productAvailability?: 'in stock' | 'out of stock';
  httpStatus: 200 | 404;
}

export interface BuildSeoInput {
  origin: string;
  route: SeoRouteInfo;
  siteConfig?: SiteConfig;
  products?: Product[];
  activeProductOverride?: Product | null;
  catalogLoaded?: boolean;
}

export function cleanOriginUrl(origin?: string): string {
  const raw = (origin || '').trim().replace(/\/+$/, '');
  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }
  return '';
}

export function buildAbsoluteUrl(origin: string, pathOrUrl: string): string {
  const trimmed = (pathOrUrl || '').trim();
  if (!trimmed) return cleanOriginUrl(origin) || '/';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = cleanOriginUrl(origin);
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return base ? `${base}${cleanPath}` : cleanPath;
}

/**
 * Injects Cloudinary automatic format (WebP/AVIF) and perceptual quality compression (`f_auto,q_auto`)
 * when an uploaded Cloudinary image URL has no explicit transformations applied yet.
 */
export function optimizeCloudinaryImageUrl(rawUrl?: string): string {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return '';
  if (!/^https?:\/\/res\.cloudinary\.com\//i.test(trimmed)) {
    return trimmed;
  }

  return trimmed.replace(
    /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(?!f_auto|q_auto|[a-z]{1,3}_[a-z0-9]+)/i,
    '$1f_auto,q_auto/'
  );
}

export function buildProductImageAlt(
  product: Pick<Product, 'name' | 'brand' | 'category'>,
  imageNumber?: number
): string {
  const parts: string[] = [product.name.trim()];
  if (product.brand && product.brand.trim()) {
    parts.push(product.brand.trim());
  } else if (product.category && product.category.trim() && product.category.trim() !== 'عام') {
    parts.push(product.category.trim());
  }
  if (imageNumber && imageNumber > 1) {
    parts.push(`صورة ${imageNumber}`);
  }
  parts.push(`${ARABIC_SITE_NAME} ${OFFICIAL_SITE_NAME}`);
  return parts.filter(Boolean).join(' - ');
}

function safeDecodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment).trim();
  } catch {
    return segment.trim();
  }
}

export function parseStoreSeoRoute(
  pathname: string,
  search = '',
  hash = ''
): SeoRouteInfo {
  const cleanPathname = (pathname || '/').split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  const lowerPath = cleanPathname.toLowerCase();
  const cleanHash = (hash || '').trim().toLowerCase();
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);

  // 1. Developer / Admin route (always non-indexed)
  const viewParam = (params.get('view') || '').trim().toLowerCase();
  if (
    lowerPath === '/developer' ||
    lowerPath === '/developer-settings' ||
    lowerPath === '/admin' ||
    cleanHash === '#developer' ||
    cleanHash === '#developer-settings' ||
    cleanHash === '#admin' ||
    viewParam === 'developer'
  ) {
    return { kind: 'developer', canonicalPath: '/developer' };
  }

  // 2. About Us page (/about or #about or ?view=about)
  if (
    lowerPath === '/about' ||
    lowerPath === '/about-us' ||
    cleanHash === '#about' ||
    viewParam === 'about'
  ) {
    return { kind: 'about', canonicalPath: '/about' };
  }

  // 3. Clean Product route (/product/:id) or legacy query (?product=:id)
  const productPathMatch = cleanPathname.match(/^\/product\/([^/]+)$/i);
  if (productPathMatch) {
    const productId = safeDecodeSegment(productPathMatch[1]);
    if (productId) {
      return {
        kind: 'product',
        productId,
        canonicalPath: `/product/${encodeURIComponent(productId)}`,
      };
    }
  }

  const queryProductId = (params.get('product') || '').trim();
  if (cleanPathname === '/' && queryProductId) {
    return {
      kind: 'product',
      productId: queryProductId,
      canonicalPath: `/product/${encodeURIComponent(queryProductId)}`,
    };
  }

  // 4. Clean Category route (/category/:id) or query (?category=:id)
  const categoryPathMatch = cleanPathname.match(/^\/category\/([^/]+)$/i);
  if (categoryPathMatch) {
    const categoryId = safeDecodeSegment(categoryPathMatch[1]);
    if (categoryId && categoryId !== 'all' && categoryId !== 'featured') {
      return {
        kind: 'category',
        categoryId,
        canonicalPath: `/category/${encodeURIComponent(categoryId)}`,
      };
    }
    return { kind: 'home', canonicalPath: '/' };
  }

  const queryCategoryId = (params.get('category') || '').trim();
  if (
    cleanPathname === '/' &&
    queryCategoryId &&
    queryCategoryId !== 'all' &&
    queryCategoryId !== 'featured'
  ) {
    return {
      kind: 'category',
      categoryId: queryCategoryId,
      canonicalPath: `/category/${encodeURIComponent(queryCategoryId)}`,
    };
  }

  // 5. Internal Search query (/?q=...) for Schema.org SearchAction
  const searchQuery = (params.get('q') || params.get('search') || '').trim();
  if (cleanPathname === '/' && searchQuery) {
    return {
      kind: 'search',
      query: searchQuery,
      canonicalPath: '/',
    };
  }

  // 6. Homepage (/)
  if (cleanPathname === '/') {
    return { kind: 'home', canonicalPath: '/' };
  }

  // 7. Unknown path -> not_found so crawlers never index soft-404 URLs
  return {
    kind: 'not_found',
    rawPath: cleanPathname,
    canonicalPath: '/',
  };
}

function truncateCleanDescription(text: string, maxLength = 158): string {
  const normalized = (text || '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  const sliced = normalized.slice(0, maxLength - 1);
  const lastSpace = sliced.lastIndexOf(' ');
  return `${(lastSpace > 90 ? sliced.slice(0, lastSpace) : sliced).trim()}…`;
}

function resolveHomeSeoTitle(siteConfig: SiteConfig): string {
  const custom = (siteConfig.seoTitle || '').trim();
  if (!custom || LEGACY_DEFAULT_TITLES.has(custom)) {
    return DEFAULT_HOME_SEO_TITLE;
  }
  return custom;
}

function resolveHomeSeoDescription(siteConfig: SiteConfig): string {
  const custom = (siteConfig.seoDescription || '').trim();
  if (!custom || LEGACY_DEFAULT_DESCRIPTIONS.has(custom)) {
    return DEFAULT_HOME_SEO_DESCRIPTION;
  }
  return truncateCleanDescription(custom, 165);
}

function formatInternationalEgyptPhone(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '+201210141187';
  if (digits.startsWith('20') && digits.length >= 11) {
    return `+${digits}`;
  }
  if (digits.startsWith('01') && digits.length === 11) {
    return `+2${digits}`;
  }
  if (digits.startsWith('00')) {
    return `+${digits.slice(2)}`;
  }
  return `+${digits}`;
}

export function buildPageSeoMetadata({
  origin,
  route,
  siteConfig = DEFAULT_SITE_CONFIG,
  products = [],
  activeProductOverride = null,
  catalogLoaded = true,
}: BuildSeoInput): PageSeoMetadata {
  const orderedCategories = getOrderedCategories(siteConfig.categories);
  const logoUrl = buildAbsoluteUrl(origin, '/logo.png');
  const defaultImageAlt = `شعار ${ARABIC_SITE_NAME} | ${OFFICIAL_SITE_NAME}`;
  const indexRobots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

  // If an explicit product is open in modal/sheet on the client, treat metadata as that product page
  const effectiveProduct: Product | null =
    activeProductOverride ||
    (route.kind === 'product'
      ? products.find((p) => p.isPublished && p.id === route.productId) || null
      : null);

  if (effectiveProduct) {
    const unitPrice = getEffectiveProductPrice(effectiveProduct);
    const priceLabel = `${formatPriceEgp(unitPrice)} ج.م`;
    const brandSegment = effectiveProduct.brand?.trim() ? ` - ${effectiveProduct.brand.trim()}` : '';
    const title = `${effectiveProduct.name}${brandSegment} | ${ARABIC_SITE_NAME} - ${OFFICIAL_SITE_NAME}`;
    const rawSummary =
      effectiveProduct.shortDescription?.trim() ||
      effectiveProduct.description?.trim() ||
      effectiveProduct.category?.trim() ||
      'أجهزة ومنتجات أصلية';
    const description = truncateCleanDescription(
      `${effectiveProduct.name} بسعر ${priceLabel} لدى ${ARABIC_SITE_NAME} (${OFFICIAL_SITE_NAME}) — ${rawSummary}. متاح الشحن لجميع محافظات مصر.`,
      160
    );
    const canonicalUrl = buildAbsoluteUrl(
      origin,
      `/product/${encodeURIComponent(effectiveProduct.id)}`
    );
    const primaryImage = effectiveProduct.images[0]
      ? buildAbsoluteUrl(origin, optimizeCloudinaryImageUrl(effectiveProduct.images[0]))
      : logoUrl;
    const imageAlt = buildProductImageAlt(effectiveProduct);

    return {
      title,
      description,
      canonicalUrl,
      robots: indexRobots,
      ogType: 'product',
      ogSiteName: OFFICIAL_SITE_NAME,
      ogLocale: 'ar_EG',
      ogTitle: title,
      ogDescription: description,
      ogUrl: canonicalUrl,
      ogImage: primaryImage,
      ogImageAlt: imageAlt,
      twitterCard: 'summary_large_image',
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: primaryImage,
      productPriceAmount: String(unitPrice),
      productPriceCurrency: 'EGP',
      productAvailability: effectiveProduct.inStock ? 'in stock' : 'out of stock',
      httpStatus: 200,
    };
  }

  // Product URL requested, either still loading catalog or not found in loaded catalog
  if (route.kind === 'product') {
    const canonicalUrl = catalogLoaded
      ? buildAbsoluteUrl(origin, '/')
      : buildAbsoluteUrl(origin, route.canonicalPath);
    const title = catalogLoaded
      ? `المنتج غير متوفر | ${ARABIC_SITE_NAME} - ${OFFICIAL_SITE_NAME}`
      : resolveHomeSeoTitle(siteConfig);
    const description = resolveHomeSeoDescription(siteConfig);
    return {
      title,
      description,
      canonicalUrl,
      robots: catalogLoaded ? 'noindex, nofollow' : indexRobots,
      ogType: 'website',
      ogSiteName: OFFICIAL_SITE_NAME,
      ogLocale: 'ar_EG',
      ogTitle: title,
      ogDescription: description,
      ogUrl: canonicalUrl,
      ogImage: logoUrl,
      ogImageAlt: defaultImageAlt,
      twitterCard: 'summary_large_image',
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: logoUrl,
      httpStatus: catalogLoaded ? 404 : 200,
    };
  }

  if (route.kind === 'about') {
    const title = `من نحن | ${ARABIC_SITE_NAME} - ${OFFICIAL_SITE_NAME}`;
    const description = truncateCleanDescription(
      `تعرّف على ${ARABIC_SITE_NAME} (${OFFICIAL_SITE_NAME}) في شرم الشيخ ومصر وشريك النجاح ${siteConfig.partnerName} للأنظمة الأمنية والستالايت والسمارت هوم وخدمات ما بعد البيع.`,
      160
    );
    const canonicalUrl = buildAbsoluteUrl(origin, '/about');
    return {
      title,
      description,
      canonicalUrl,
      robots: indexRobots,
      ogType: 'website',
      ogSiteName: OFFICIAL_SITE_NAME,
      ogLocale: 'ar_EG',
      ogTitle: title,
      ogDescription: description,
      ogUrl: canonicalUrl,
      ogImage: logoUrl,
      ogImageAlt: defaultImageAlt,
      twitterCard: 'summary_large_image',
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: logoUrl,
      httpStatus: 200,
    };
  }

  if (route.kind === 'category') {
    const matchedId = getCategoryIdByName(route.categoryId, orderedCategories);
    if (!matchedId && catalogLoaded) {
      const fallbackCanonical = buildAbsoluteUrl(origin, '/');
      const title = resolveHomeSeoTitle(siteConfig);
      const description = resolveHomeSeoDescription(siteConfig);
      return {
        title,
        description,
        canonicalUrl: fallbackCanonical,
        robots: 'noindex, nofollow',
        ogType: 'website',
        ogSiteName: OFFICIAL_SITE_NAME,
        ogLocale: 'ar_EG',
        ogTitle: title,
        ogDescription: description,
        ogUrl: fallbackCanonical,
        ogImage: logoUrl,
        ogImageAlt: defaultImageAlt,
        twitterCard: 'summary_large_image',
        twitterTitle: title,
        twitterDescription: description,
        twitterImage: logoUrl,
        httpStatus: 404,
      };
    }

    const effectiveCatId = matchedId || route.categoryId;
    const categoryName = getCategoryName(effectiveCatId, orderedCategories);
    const title = `${categoryName} | ${ARABIC_SITE_NAME} - ${OFFICIAL_SITE_NAME}`;
    const description = truncateCleanDescription(
      `تسوق أحدث منتجات ${categoryName} من ${ARABIC_SITE_NAME} (${OFFICIAL_SITE_NAME}) بمواصفات واضحة وأسعار تنافسية وشحن لجميع محافظات مصر وتوصيل داخل شرم الشيخ.`,
      160
    );
    const canonicalUrl = buildAbsoluteUrl(
      origin,
      `/category/${encodeURIComponent(effectiveCatId)}`
    );

    return {
      title,
      description,
      canonicalUrl,
      robots: indexRobots,
      ogType: 'website',
      ogSiteName: OFFICIAL_SITE_NAME,
      ogLocale: 'ar_EG',
      ogTitle: title,
      ogDescription: description,
      ogUrl: canonicalUrl,
      ogImage: logoUrl,
      ogImageAlt: defaultImageAlt,
      twitterCard: 'summary_large_image',
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: logoUrl,
      httpStatus: 200,
    };
  }

  if (route.kind === 'developer') {
    const title = `إعدادات المطور | ${ARABIC_SITE_NAME}`;
    const description = resolveHomeSeoDescription(siteConfig);
    const canonicalUrl = buildAbsoluteUrl(origin, '/');
    return {
      title,
      description,
      canonicalUrl,
      robots: 'noindex, nofollow',
      ogType: 'website',
      ogSiteName: OFFICIAL_SITE_NAME,
      ogLocale: 'ar_EG',
      ogTitle: title,
      ogDescription: description,
      ogUrl: canonicalUrl,
      ogImage: logoUrl,
      ogImageAlt: defaultImageAlt,
      twitterCard: 'summary_large_image',
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: logoUrl,
      httpStatus: 200,
    };
  }

  if (route.kind === 'search') {
    const cleanQ = route.query.slice(0, 60);
    const title = `نتائج البحث عن «${cleanQ}» | ${ARABIC_SITE_NAME} - ${OFFICIAL_SITE_NAME}`;
    const description = resolveHomeSeoDescription(siteConfig);
    const canonicalUrl = buildAbsoluteUrl(origin, '/');
    return {
      title,
      description,
      canonicalUrl,
      robots: 'noindex, follow',
      ogType: 'website',
      ogSiteName: OFFICIAL_SITE_NAME,
      ogLocale: 'ar_EG',
      ogTitle: title,
      ogDescription: description,
      ogUrl: canonicalUrl,
      ogImage: logoUrl,
      ogImageAlt: defaultImageAlt,
      twitterCard: 'summary_large_image',
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: logoUrl,
      httpStatus: 200,
    };
  }

  if (route.kind === 'not_found') {
    const title = `الصفحة غير موجودة | ${ARABIC_SITE_NAME} - ${OFFICIAL_SITE_NAME}`;
    const description = resolveHomeSeoDescription(siteConfig);
    const canonicalUrl = buildAbsoluteUrl(origin, '/');
    return {
      title,
      description,
      canonicalUrl,
      robots: 'noindex, nofollow',
      ogType: 'website',
      ogSiteName: OFFICIAL_SITE_NAME,
      ogLocale: 'ar_EG',
      ogTitle: title,
      ogDescription: description,
      ogUrl: canonicalUrl,
      ogImage: logoUrl,
      ogImageAlt: defaultImageAlt,
      twitterCard: 'summary_large_image',
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: logoUrl,
      httpStatus: 404,
    };
  }

  // Homepage ('home')
  const title = resolveHomeSeoTitle(siteConfig);
  const description = resolveHomeSeoDescription(siteConfig);
  const canonicalUrl = buildAbsoluteUrl(origin, '/');

  return {
    title,
    description,
    canonicalUrl,
    robots: indexRobots,
    ogType: 'website',
    ogSiteName: OFFICIAL_SITE_NAME,
    ogLocale: 'ar_EG',
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonicalUrl,
    ogImage: logoUrl,
    ogImageAlt: defaultImageAlt,
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: logoUrl,
    httpStatus: 200,
  };
}

export function buildStructuredDataGraph({
  origin,
  route,
  siteConfig = DEFAULT_SITE_CONFIG,
  products = [],
  activeProductOverride = null,
}: BuildSeoInput): Record<string, unknown> {
  const homeUrl = buildAbsoluteUrl(origin, '/');
  const logoUrl = buildAbsoluteUrl(origin, '/logo.png');
  const orgId = `${homeUrl}#organization`;
  const websiteId = `${homeUrl}#website`;
  const orderedCategories = getOrderedCategories(siteConfig.categories);

  const sameAsSet = new Set<string>();
  const candidateSocialUrls = [
    siteConfig.facebookUrl,
    siteConfig.instagramUrl,
    ...(siteConfig.socialLinks || [])
      .filter((sl) => sl.owner === 'store')
      .map((sl) => sl.url),
  ];
  for (const rawUrl of candidateSocialUrls) {
    const trimmed = (rawUrl || '').trim();
    if (trimmed && isValidOptionalHttpUrl(trimmed)) {
      sameAsSet.add(trimmed);
    }
  }

  const storeEntity: Record<string, unknown> = {
    '@type': 'OnlineStore',
    '@id': orgId,
    name: OFFICIAL_SITE_NAME,
    alternateName: [...ALTERNATE_SITE_NAMES],
    url: homeUrl,
    logo: {
      '@type': 'ImageObject',
      url: logoUrl,
    },
    image: logoUrl,
    description: resolveHomeSeoDescription(siteConfig),
    telephone: formatInternationalEgyptPhone(siteConfig.primaryPhone || STORE_INFO.primaryPhone),
    currenciesAccepted: 'EGP',
    priceRange: 'EGP',
    areaServed: {
      '@type': 'Country',
      name: 'Egypt',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: siteConfig.address || STORE_INFO.address,
      addressLocality: 'شرم الشيخ',
      addressRegion: 'جنوب سيناء',
      addressCountry: 'EG',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: OFFICIAL_STORE_LATITUDE,
      longitude: OFFICIAL_STORE_LONGITUDE,
    },
  };

  if (siteConfig.googleMapsUrl && isValidOptionalHttpUrl(siteConfig.googleMapsUrl)) {
    storeEntity.hasMap = siteConfig.googleMapsUrl.trim();
  }
  if (sameAsSet.size > 0) {
    storeEntity.sameAs = Array.from(sameAsSet);
  }

  const websiteEntity: Record<string, unknown> = {
    '@type': 'WebSite',
    '@id': websiteId,
    name: OFFICIAL_SITE_NAME,
    alternateName: ['المحلاوي ستور', 'El Mahlawy Store', 'Elmahlawy'],
    url: homeUrl,
    inLanguage: 'ar-EG',
    publisher: { '@id': orgId },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${homeUrl}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const graph: Record<string, unknown>[] = [storeEntity, websiteEntity];

  const effectiveProduct: Product | null =
    activeProductOverride ||
    (route.kind === 'product'
      ? products.find((p) => p.isPublished && p.id === route.productId) || null
      : null);

  if (effectiveProduct) {
    const productUrl = buildAbsoluteUrl(
      origin,
      `/product/${encodeURIComponent(effectiveProduct.id)}`
    );
    const unitPrice = getEffectiveProductPrice(effectiveProduct);
    const productImages = (effectiveProduct.images || [])
      .map((img) => optimizeCloudinaryImageUrl(img))
      .filter(Boolean)
      .map((img) => buildAbsoluteUrl(origin, img));

    const breadcrumbItems: Record<string, unknown>[] = [
      {
        '@type': 'ListItem',
        position: 1,
        name: ARABIC_SITE_NAME,
        item: homeUrl,
      },
    ];

    const resolvedCatId = getCategoryIdByName(
      effectiveProduct.categoryId || effectiveProduct.category,
      orderedCategories
    );
    if (resolvedCatId) {
      breadcrumbItems.push({
        '@type': 'ListItem',
        position: 2,
        name: getCategoryName(resolvedCatId, orderedCategories),
        item: buildAbsoluteUrl(origin, `/category/${encodeURIComponent(resolvedCatId)}`),
      });
    }

    breadcrumbItems.push({
      '@type': 'ListItem',
      position: breadcrumbItems.length + 1,
      name: effectiveProduct.name,
      item: productUrl,
    });

    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems,
    });

    const offer: Record<string, unknown> = {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'EGP',
      price: String(unitPrice),
      availability: effectiveProduct.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': orgId },
    };

    if (
      isDiscountActive(effectiveProduct) &&
      effectiveProduct.discountEndDate &&
      /^\d{4}-\d{2}-\d{2}$/.test(effectiveProduct.discountEndDate.trim())
    ) {
      offer.priceValidUntil = effectiveProduct.discountEndDate.trim();
    }

    const productEntity: Record<string, unknown> = {
      '@type': 'Product',
      '@id': `${productUrl}#product`,
      sku: effectiveProduct.id,
      name: effectiveProduct.name,
      description:
        effectiveProduct.description?.trim() ||
        effectiveProduct.shortDescription?.trim() ||
        effectiveProduct.name,
      image: productImages.length > 0 ? productImages : [logoUrl],
      brand: {
        '@type': 'Brand',
        name: effectiveProduct.brand?.trim() || OFFICIAL_SITE_NAME,
      },
      offers: offer,
    };

    if (effectiveProduct.category && effectiveProduct.category.trim()) {
      productEntity.category = effectiveProduct.category.trim();
    }

    graph.push(productEntity);
  } else if (route.kind === 'about') {
    const aboutUrl = buildAbsoluteUrl(origin, '/about');
    graph.push({
      '@type': 'AboutPage',
      '@id': `${aboutUrl}#aboutpage`,
      url: aboutUrl,
      name: `من نحن | ${ARABIC_SITE_NAME} - ${OFFICIAL_SITE_NAME}`,
      isPartOf: { '@id': websiteId },
      about: { '@id': orgId },
      inLanguage: 'ar-EG',
    });
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: ARABIC_SITE_NAME,
          item: homeUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'من نحن | About Us',
          item: aboutUrl,
        },
      ],
    });
  } else if (route.kind === 'category') {
    const matchedId = getCategoryIdByName(route.categoryId, orderedCategories);
    if (matchedId) {
      const catName = getCategoryName(matchedId, orderedCategories);
      const catUrl = buildAbsoluteUrl(origin, `/category/${encodeURIComponent(matchedId)}`);
      graph.push({
        '@type': 'CollectionPage',
        '@id': `${catUrl}#collection`,
        url: catUrl,
        name: `${catName} | ${ARABIC_SITE_NAME} - ${OFFICIAL_SITE_NAME}`,
        isPartOf: { '@id': websiteId },
        inLanguage: 'ar-EG',
      });
      graph.push({
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: ARABIC_SITE_NAME,
            item: homeUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: catName,
            item: catUrl,
          },
        ],
      });
    }
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function extractValidIsoDate(raw?: string): string {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }
  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed) && parsed > 0) {
    return new Date(parsed).toISOString().slice(0, 10);
  }
  return '';
}

export function buildSitemapXml(
  origin: string,
  categories: ReadonlyArray<Category> = PRODUCT_CATEGORIES,
  products: ReadonlyArray<Product> = []
): string {
  const entries: Array<{
    loc: string;
    lastmod?: string;
    changefreq: 'daily' | 'weekly';
    priority: string;
  }> = [];
  const seenLocs = new Set<string>();

  const pushEntry = (
    loc: string,
    changefreq: 'daily' | 'weekly',
    priority: string,
    lastmod?: string
  ) => {
    if (!loc || seenLocs.has(loc)) return;
    seenLocs.add(loc);
    entries.push({ loc, lastmod: lastmod || undefined, changefreq, priority });
  };

  const publishedProducts = products.filter((p) => p.isPublished && p.id);
  let latestCatalogDate = '';
  for (const prod of publishedProducts) {
    const d = extractValidIsoDate(prod.updatedAt || prod.createdAt);
    if (d && d > latestCatalogDate) {
      latestCatalogDate = d;
    }
  }

  // 1. Homepage
  pushEntry(buildAbsoluteUrl(origin, '/'), 'daily', '1.0', latestCatalogDate);

  // 2. About Us Page
  pushEntry(buildAbsoluteUrl(origin, '/about'), 'weekly', '0.8', latestCatalogDate);

  // 3. Real Store Categories
  const orderedCats = getOrderedCategories(categories);
  for (const cat of orderedCats) {
    if (!cat.id || cat.id === 'all' || cat.id === 'featured') continue;
    pushEntry(
      buildAbsoluteUrl(origin, `/category/${encodeURIComponent(cat.id)}`),
      'daily',
      '0.8',
      latestCatalogDate
    );
  }

  // 4. Real Published Products
  for (const prod of publishedProducts) {
    const prodLastMod = extractValidIsoDate(prod.updatedAt || prod.createdAt);
    pushEntry(
      buildAbsoluteUrl(origin, `/product/${encodeURIComponent(prod.id)}`),
      'weekly',
      '0.9',
      prodLastMod
    );
  }

  const urlNodes = entries
    .map((entry) => {
      const lines = [
        '  <url>',
        `    <loc>${escapeXml(entry.loc)}</loc>`,
        entry.lastmod ? `    <lastmod>${escapeXml(entry.lastmod)}</lastmod>` : '',
        `    <changefreq>${entry.changefreq}</changefreq>`,
        `    <priority>${entry.priority}</priority>`,
        '  </url>',
      ].filter(Boolean);
      return lines.join('\n');
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlNodes}\n</urlset>\n`;
}

export function buildRobotsTxt(origin: string = OFFICIAL_SITE_ORIGIN): string {
  const sitemapUrl = buildAbsoluteUrl(origin || OFFICIAL_SITE_ORIGIN, '/sitemap.xml');
  return [
    'User-agent: Googlebot',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /developer',
    'Disallow: /developer-settings',
    'Disallow: /admin',
    '',
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /developer',
    'Disallow: /developer-settings',
    'Disallow: /admin',
    '',
    `Sitemap: ${sitemapUrl}`,
    '',
  ].join('\n');
}

export function buildCrawlableNoscriptHtml({
  origin,
  route,
  siteConfig = DEFAULT_SITE_CONFIG,
  products = [],
}: BuildSeoInput): string {
  const orderedCats = getOrderedCategories(siteConfig.categories);
  const published = products.filter((p) => p.isPublished);
  const homeUrl = buildAbsoluteUrl(origin, '/');
  const aboutUrl = buildAbsoluteUrl(origin, '/about');

  if (route.kind === 'product') {
    const prod = published.find((p) => p.id === route.productId);
    if (prod) {
      const price = formatPriceEgp(getEffectiveProductPrice(prod));
      return [
        `<section dir="rtl" lang="ar">`,
        `<h1>${escapeHtml(prod.name)} — ${escapeHtml(ARABIC_SITE_NAME)} | ${escapeHtml(OFFICIAL_SITE_NAME)}</h1>`,
        prod.brand ? `<p>الماركة: ${escapeHtml(prod.brand)}</p>` : '',
        prod.category ? `<p>القسم: ${escapeHtml(prod.category)}</p>` : '',
        `<p>السعر: ${escapeHtml(price)} جنيه مصري (${prod.inStock ? 'متوفر' : 'غير متوفر حاليًا'})</p>`,
        `<p>${escapeHtml(prod.description || prod.shortDescription || '')}</p>`,
        `<nav><a href="${escapeHtml(homeUrl)}">${escapeHtml(ARABIC_SITE_NAME)} (${escapeHtml(OFFICIAL_SITE_NAME)})</a> · <a href="${escapeHtml(aboutUrl)}">من نحن</a></nav>`,
        `</section>`,
      ]
        .filter(Boolean)
        .join('');
    }
  }

  if (route.kind === 'about') {
    return [
      `<section dir="rtl" lang="ar">`,
      `<h1>من نحن — ${escapeHtml(ARABIC_SITE_NAME)} | ${escapeHtml(OFFICIAL_SITE_NAME)}</h1>`,
      `<p>${escapeHtml(siteConfig.aboutStoreIntro || DEFAULT_HOME_SEO_DESCRIPTION)}</p>`,
      `<p>${escapeHtml(siteConfig.aboutPartnerIntro || '')}</p>`,
      `<p>العنوان: ${escapeHtml(siteConfig.address || STORE_INFO.address)}</p>`,
      `<nav><a href="${escapeHtml(homeUrl)}">العودة إلى ${escapeHtml(ARABIC_SITE_NAME)}</a></nav>`,
      `</section>`,
    ].join('');
  }

  const catLinks = orderedCats
    .map(
      (c) =>
        `<li><a href="${escapeHtml(buildAbsoluteUrl(origin, `/category/${encodeURIComponent(c.id)}`))}">${escapeHtml(c.name)}</a></li>`
    )
    .join('');

  const prodLinks = published
    .slice(0, 30)
    .map((p) => {
      const pUrl = buildAbsoluteUrl(origin, `/product/${encodeURIComponent(p.id)}`);
      const price = formatPriceEgp(getEffectiveProductPrice(p));
      return `<li><a href="${escapeHtml(pUrl)}">${escapeHtml(p.name)}</a> — ${escapeHtml(price)} ج.م</li>`;
    })
    .join('');

  return [
    `<section dir="rtl" lang="ar">`,
    `<h1>${escapeHtml(ARABIC_SITE_NAME)} | ${escapeHtml(OFFICIAL_SITE_NAME)}</h1>`,
    `<p>${escapeHtml(resolveHomeSeoDescription(siteConfig))}</p>`,
    `<p>العنوان: ${escapeHtml(siteConfig.address || STORE_INFO.address)} — هاتف: ${escapeHtml(siteConfig.primaryPhone || STORE_INFO.primaryPhone)}</p>`,
    `<nav><h2>أقسام المتجر</h2><ul>${catLinks}<li><a href="${escapeHtml(aboutUrl)}">من نحن | About Us</a></li></ul></nav>`,
    prodLinks ? `<section><h2>منتجات المحلاوي ستور</h2><ul>${prodLinks}</ul></section>` : '',
    `</section>`,
  ]
    .filter(Boolean)
    .join('');
}

export function serializeJsonLdSafely(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function injectSeoIntoHtml(
  rawHtml: string,
  meta: PageSeoMetadata,
  jsonLdGraph: Record<string, unknown>,
  noscriptContent: string,
  googleSiteVerification?: string
): string {
  let html = rawHtml;

  const existingVerificationMatch =
    rawHtml.match(
      /<meta\s+name=["']google-site-verification["']\s+content=["']([^"']+)["'][^>]*>/i
    ) ||
    rawHtml.match(
      /<meta\s+content=["']([^"']+)["']\s+name=["']google-site-verification["'][^>]*>/i
    );
  const existingHtmlVerification = existingVerificationMatch?.[1]?.trim() || '';

  // Strip existing managed tags in index.html so there are never duplicate meta/canonical/jsonld tags
  html = html.replace(/<title>[\s\S]*?<\/title>/i, '');
  html = html.replace(/<meta\s+name=["']description["'][^>]*>\s*/gi, '');
  html = html.replace(/<meta\s+name=["']robots["'][^>]*>\s*/gi, '');
  html = html.replace(/<meta\s+name=["']google-site-verification["'][^>]*>\s*/gi, '');
  html = html.replace(/<meta\s+property=["']og:[^"']+["'][^>]*>\s*/gi, '');
  html = html.replace(/<meta\s+property=["']product:[^"']+["'][^>]*>\s*/gi, '');
  html = html.replace(/<meta\s+name=["']twitter:[^"']+["'][^>]*>\s*/gi, '');
  html = html.replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, '');
  html = html.replace(
    /<script[^>]*id=["']seo-structured-data["'][^>]*>[\s\S]*?<\/script>\s*/gi,
    ''
  );
  html = html.replace(
    /<noscript[^>]*id=["']seo-crawlable-fallback["'][^>]*>[\s\S]*?<\/noscript>\s*/gi,
    ''
  );

  const explicitVerification = (googleSiteVerification || '').trim();
  const hasExplicitVerification =
    explicitVerification.length > 0 &&
    explicitVerification !== 'YOUR_GOOGLE_SITE_VERIFICATION_CODE';
  const cleanVerification = hasExplicitVerification
    ? explicitVerification
    : existingHtmlVerification.length > 0 &&
        existingHtmlVerification !== 'YOUR_GOOGLE_SITE_VERIFICATION_CODE'
      ? existingHtmlVerification
      : '';
  const hasRealVerification = cleanVerification.length > 0;

  const headTags: string[] = [
    `    <title>${escapeHtml(meta.title)}</title>`,
    `    <meta name="description" content="${escapeHtml(meta.description)}" />`,
    `    <meta name="robots" content="${escapeHtml(meta.robots)}" />`,
    `    <link rel="canonical" href="${escapeHtml(meta.canonicalUrl)}" />`,
    hasRealVerification
      ? `    <meta name="google-site-verification" content="${escapeHtml(cleanVerification)}" />`
      : '',
    `    <meta property="og:type" content="${escapeHtml(meta.ogType)}" />`,
    `    <meta property="og:site_name" content="${escapeHtml(meta.ogSiteName)}" />`,
    `    <meta property="og:locale" content="${escapeHtml(meta.ogLocale)}" />`,
    `    <meta property="og:title" content="${escapeHtml(meta.ogTitle)}" />`,
    `    <meta property="og:description" content="${escapeHtml(meta.ogDescription)}" />`,
    `    <meta property="og:url" content="${escapeHtml(meta.ogUrl)}" />`,
    `    <meta property="og:image" content="${escapeHtml(meta.ogImage)}" />`,
    `    <meta property="og:image:alt" content="${escapeHtml(meta.ogImageAlt)}" />`,
    meta.productPriceAmount
      ? `    <meta property="product:price:amount" content="${escapeHtml(meta.productPriceAmount)}" />`
      : '',
    meta.productPriceCurrency
      ? `    <meta property="product:price:currency" content="${escapeHtml(meta.productPriceCurrency)}" />`
      : '',
    meta.productAvailability
      ? `    <meta property="product:availability" content="${escapeHtml(meta.productAvailability)}" />`
      : '',
    `    <meta name="twitter:card" content="${escapeHtml(meta.twitterCard)}" />`,
    `    <meta name="twitter:title" content="${escapeHtml(meta.twitterTitle)}" />`,
    `    <meta name="twitter:description" content="${escapeHtml(meta.twitterDescription)}" />`,
    `    <meta name="twitter:image" content="${escapeHtml(meta.twitterImage)}" />`,
    `    <script id="seo-structured-data" type="application/ld+json">${serializeJsonLdSafely(jsonLdGraph)}</script>`,
  ].filter(Boolean);

  if (/<\/head>/i.test(html)) {
    html = html.replace(/<\/head>/i, `${headTags.join('\n')}\n  </head>`);
  }

  if (noscriptContent && /<div\s+id=["']root["']\s*><\/div>/i.test(html)) {
    html = html.replace(
      /<div\s+id=["']root["']\s*><\/div>/i,
      `<div id="root"></div>\n    <noscript id="seo-crawlable-fallback">${noscriptContent}</noscript>`
    );
  }

  return html;
}

function upsertHeadMeta(
  attrName: 'name' | 'property',
  attrValue: string,
  content: string | undefined
): void {
  if (typeof document === 'undefined') return;
  const selector = `meta[${attrName}="${attrValue}"]`;
  const existing = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!content) {
    if (existing) existing.remove();
    return;
  }
  if (existing) {
    existing.setAttribute('content', content);
    return;
  }
  const el = document.createElement('meta');
  el.setAttribute(attrName, attrValue);
  el.setAttribute('content', content);
  document.head.appendChild(el);
}

/**
 * Synchronizes browser `<head>` tags (`<title>`, `<meta>`, `<link rel="canonical">`, and JSON-LD)
 * on every SPA navigation or product view change.
 */
export function syncDocumentSeoHead(
  meta: PageSeoMetadata,
  jsonLdGraph: Record<string, unknown>
): void {
  if (typeof document === 'undefined') return;

  document.title = meta.title;

  upsertHeadMeta('name', 'description', meta.description);
  upsertHeadMeta('name', 'robots', meta.robots);

  upsertHeadMeta('property', 'og:type', meta.ogType);
  upsertHeadMeta('property', 'og:site_name', meta.ogSiteName);
  upsertHeadMeta('property', 'og:locale', meta.ogLocale);
  upsertHeadMeta('property', 'og:title', meta.ogTitle);
  upsertHeadMeta('property', 'og:description', meta.ogDescription);
  upsertHeadMeta('property', 'og:url', meta.ogUrl);
  upsertHeadMeta('property', 'og:image', meta.ogImage);
  upsertHeadMeta('property', 'og:image:alt', meta.ogImageAlt);

  upsertHeadMeta('property', 'product:price:amount', meta.productPriceAmount);
  upsertHeadMeta('property', 'product:price:currency', meta.productPriceCurrency);
  upsertHeadMeta('property', 'product:availability', meta.productAvailability);

  upsertHeadMeta('name', 'twitter:card', meta.twitterCard);
  upsertHeadMeta('name', 'twitter:title', meta.twitterTitle);
  upsertHeadMeta('name', 'twitter:description', meta.twitterDescription);
  upsertHeadMeta('name', 'twitter:image', meta.twitterImage);

  let canonicalLink = document.head.querySelector(
    'link[rel="canonical"]'
  ) as HTMLLinkElement | null;
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', meta.canonicalUrl);

  let jsonLdScript = document.getElementById(
    'seo-structured-data'
  ) as HTMLScriptElement | null;
  if (!jsonLdScript) {
    jsonLdScript = document.createElement('script');
    jsonLdScript.id = 'seo-structured-data';
    jsonLdScript.type = 'application/ld+json';
    document.head.appendChild(jsonLdScript);
  }
  jsonLdScript.textContent = JSON.stringify(jsonLdGraph);
}

/**
 * Decodes a Firestore REST API Value object (`stringValue`, `integerValue`, `doubleValue`,
 * `booleanValue`, `timestampValue`, `arrayValue`, `mapValue`) into a plain JS value.
 */
export function decodeFirestoreRestValue(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return undefined;
  const val = raw as Record<string, unknown>;
  if ('nullValue' in val) return null;
  if (typeof val.stringValue === 'string') return val.stringValue;
  if (typeof val.booleanValue === 'boolean') return val.booleanValue;
  if (typeof val.integerValue === 'string' || typeof val.integerValue === 'number') {
    return Number(val.integerValue);
  }
  if (typeof val.doubleValue === 'number' || typeof val.doubleValue === 'string') {
    return Number(val.doubleValue);
  }
  if (typeof val.timestampValue === 'string') return val.timestampValue;
  if (val.arrayValue && typeof val.arrayValue === 'object') {
    const arrObj = val.arrayValue as { values?: unknown[] };
    return Array.isArray(arrObj.values)
      ? arrObj.values.map((item) => decodeFirestoreRestValue(item))
      : [];
  }
  if (val.mapValue && typeof val.mapValue === 'object') {
    const mapObj = val.mapValue as { fields?: Record<string, unknown> };
    return decodeFirestoreRestFields(mapObj.fields);
  }
  return undefined;
}

export function decodeFirestoreRestFields(
  fields?: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!fields || typeof fields !== 'object') return out;
  for (const [key, rawVal] of Object.entries(fields)) {
    out[key] = decodeFirestoreRestValue(rawVal);
  }
  return out;
}
