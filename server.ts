import 'dotenv/config';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import type { Product } from './src/types/store';
import { getOrderedCategories } from './src/constants/categories';
import { DEFAULT_SITE_CONFIG, SiteConfig, sanitizeSiteConfig } from './src/utils/siteConfig';
import {
  buildCrawlableNoscriptHtml,
  buildPageSeoMetadata,
  buildRobotsTxt,
  buildSitemapXml,
  buildStructuredDataGraph,
  decodeFirestoreRestFields,
  injectSeoIntoHtml,
  parseStoreSeoRoute,
} from './src/utils/seo';

const PORT = 3000;
const ROOT_DIR = process.cwd();
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ASSETS_IMAGES_DIR = path.join(ROOT_DIR, 'src', 'assets', 'images');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const FIREBASE_CONFIG_FILE = path.join(ROOT_DIR, 'firebase-applet-config.json');

const ALLOWED_FIREBASE_AUTH_HOSTS = new Set([
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
]);

const ALLOWED_FIREBASE_AUTH_PATH_PREFIXES = [
  '/v1/accounts:',
  '/v1/projects',
  '/v1/token',
  '/v2/accounts:',
  '/v2/passwordPolicy',
  '/v2/recaptchaConfig',
];

interface LoadedFirebaseClientConfig {
  apiKey: string;
  projectId: string;
  firestoreDatabaseId: string;
}

function loadConfiguredFirebaseConfig(): LoadedFirebaseClientConfig {
  try {
    if (!fs.existsSync(FIREBASE_CONFIG_FILE)) {
      return { apiKey: '', projectId: '', firestoreDatabaseId: '(default)' };
    }
    const parsed = JSON.parse(fs.readFileSync(FIREBASE_CONFIG_FILE, 'utf8')) as {
      apiKey?: unknown;
      projectId?: unknown;
      firestoreDatabaseId?: unknown;
    };
    return {
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey.trim() : '',
      projectId: typeof parsed.projectId === 'string' ? parsed.projectId.trim() : '',
      firestoreDatabaseId:
        typeof parsed.firestoreDatabaseId === 'string' && parsed.firestoreDatabaseId.trim()
          ? parsed.firestoreDatabaseId.trim()
          : '(default)',
    };
  } catch {
    return { apiKey: '', projectId: '', firestoreDatabaseId: '(default)' };
  }
}

const CONFIGURED_FIREBASE = loadConfiguredFirebaseConfig();
const CONFIGURED_FIREBASE_API_KEY = CONFIGURED_FIREBASE.apiKey;

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getExpectedAdminPassword(): string {
  return (process.env.ADMIN_PASSWORD || '').trim();
}

function isAuthorizedAdminRequest(req: Request): boolean {
  const expected = getExpectedAdminPassword();
  if (!expected) return false;
  const headerPass = String(req.headers['x-admin-password'] || '').trim();
  return headerPass.length > 0 && headerPass === expected;
}

function readStoredProducts(): Record<string, unknown>[] | null {
  try {
    if (!fs.existsSync(PRODUCTS_FILE)) return null;
    const raw = fs.readFileSync(PRODUCTS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeStoredProducts(products: Record<string, unknown>[]): void {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
}

const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

const DEFAULT_SETTINGS = {
  storeName: 'المحلاوي ستور',
  storeEnglishName: 'Elmahlawy Store',
  tagline: 'منتجات متنوعة وحلول ذكية لحياة أسهل',
  address: 'جنوب سيناء – شرم الشيخ – الرويسات – مدخل 1 – شارع دستي، بجوار قسم الشرطة، الشارع الجانبي لمول الشيخ عيد، محل المحلاوي ستور.',
  googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=27.9074681,34.2805336',
  workingHours: 'يومياً من 10 صباحاً حتى 11 مساؤًا',
  deliverySummary: 'شحن متاح لجميع محافظات مصر. وتوصيل داخل شرم الشيخ من خلال خدمة الدليفري.',
  deliveryCost: 'يُحدد حسب المنطقة (خدمة الدليفري متاحة بشرم الشيخ)',
  warrantyPolicy: 'ضمان معتمد ودعم فني طوال فترة الضمان',
  afterSalesPolicy: 'نضمن لك الدعم والمساعدة خلال فترة الضمان. معاينة المنتج عن بُعد وتوجيه الدعم الفني.',
  primaryPhone: '01210141187',
  secondaryPhone: '01000000000',
  primaryWhatsApp: '201210141187',
  afterSalesWhatsApp: '201210141187',
  infinityCorpPhone: '01000000000',
  infinityCorpWhatsApp: '201000000000',
  facebookUrl: 'https://facebook.com/elmahlawystore',
  instagramUrl: 'https://instagram.com/elmahlawystore',
  whatsappOrderTemplate: 'السلام عليكم، أرغب في طلب المنتج التالي:\n- المنتج: {productName}\n- السعر: {price} جنيه\n- الرابط: {productUrl}\n\nملاحظات العميل: {notes}',
  orderConfirmationMessage: 'تم استلام طلبك بنجاح! سيتم التواصل معك قريباً لتأكيد التوصيل.',
  htmlTitle: 'المحلاوي ستور | Elmahlawy Store - تسوق منتجاتنا',
  seoDescription: 'المحلاوي ستور (Elmahlawy Store) في مصر — تسوق كاميرات المراقبة، الستالايت والرسيفرات، أنظمة الصوتيات، السمارت هوم، والإنذار المبكر مع شحن لجميع المحافظات.',
  seoKeywords: 'المحلاوي ستور, المحلاوي, Elmahlawy Store, El Mahlawy Store, Elmahlawy, Elmahlawy Store Egypt, شرم الشيخ',
  ogImageUrl: '/logo.png',
  primaryColor: '#0284c7',
  secondaryColor: '#0ea5e9',
  bannerImageUrl: '',
  announcementText: 'عروض خاصة لفترة محدودة على جميع المنتجات - شحن لجميع محافظات مصر!',
  announcementEnabled: true,
  maintenanceMode: false,
  maintenanceMessage: 'الموقع تحت الصيانة الدورية وسيعود قريباً.',
  activityLog: [],
};

function readStoredSettings(): Record<string, unknown> {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) return DEFAULT_SETTINGS;
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_SETTINGS;
    const merged: Record<string, unknown> = { ...DEFAULT_SETTINGS, ...parsed };
    const storedMapUrl = typeof merged.googleMapsUrl === 'string' ? merged.googleMapsUrl.trim() : '';
    if (
      !storedMapUrl ||
      /^https?:\/\/(?:maps\.app\.goo\.gl|goo\.gl\/maps)\b/i.test(storedMapUrl) ||
      storedMapUrl.includes('27.9158')
    ) {
      merged.googleMapsUrl = DEFAULT_SETTINGS.googleMapsUrl;
    }
    return merged;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function writeStoredSettings(settings: Record<string, unknown>): void {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const normalizedExt = ['.heic', '.heif', '.avif'].includes(ext) ? '.jpg' : ext;
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'].includes(normalizedExt) ? normalizedExt : '.jpg';
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    cb(null, `mahallawy-${uniqueSuffix}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max per image
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const isImageExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif', '.avif', '.bmp'].includes(ext);
    if ((file.mimetype && file.mimetype.startsWith('image/')) || isImageExt) {
      cb(null, true);
    } else {
      cb(new Error('يُسمح برفع ملفات الصور فقط (JPG, PNG, WEBP).'));
    }
  },
});

function resolveRequestOrigin(req: Request): string {
  const sharedAppUrl = (process.env.SHARED_APP_URL || '').trim();
  if (sharedAppUrl && /^https?:\/\//i.test(sharedAppUrl)) {
    return sharedAppUrl.replace(/\/+$/, '');
  }
  const configuredAppUrl = (process.env.APP_URL || '').trim();
  if (configuredAppUrl && configuredAppUrl !== 'MY_APP_URL' && /^https?:\/\//i.test(configuredAppUrl)) {
    return configuredAppUrl.replace(/\/+$/, '');
  }
  const protoHeader = req.headers['x-forwarded-proto'];
  const proto = Array.isArray(protoHeader)
    ? protoHeader[0]
    : protoHeader
      ? protoHeader.split(',')[0].trim()
      : req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

interface SeoStoreSnapshot {
  siteConfig: SiteConfig;
  products: Product[];
  catalogLoaded: boolean;
  fetchedAt: number;
}

const SEO_CACHE_TTL_MS = 60_000;
let cachedSeoSnapshot: SeoStoreSnapshot | null = null;
let inflightSeoFetch: Promise<SeoStoreSnapshot> | null = null;

function mapRawRecordToProduct(raw: Record<string, unknown>, fallbackId = ''): Product | null {
  const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : fallbackId;
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  const price = Number(raw.price);
  if (!id || !name || !Number.isFinite(price) || price <= 0) return null;

  const originalPrice = Number.isFinite(Number(raw.originalPrice)) && Number(raw.originalPrice) > 0
    ? Number(raw.originalPrice)
    : price;

  return {
    id,
    name,
    brand: typeof raw.brand === 'string' ? raw.brand : '',
    category: typeof raw.category === 'string' ? raw.category : '',
    categoryId: typeof raw.categoryId === 'string' ? raw.categoryId : '',
    shortDescription: typeof raw.shortDescription === 'string' ? raw.shortDescription : '',
    description: typeof raw.description === 'string' ? raw.description : '',
    price,
    originalPrice,
    discountEnabled: Boolean(raw.discountEnabled),
    discountType: raw.discountType === 'fixed' ? 'fixed' : 'percentage',
    discountValue: Number.isFinite(Number(raw.discountValue)) ? Number(raw.discountValue) : 0,
    discountStartDate: typeof raw.discountStartDate === 'string' ? raw.discountStartDate : '',
    discountEndDate: typeof raw.discountEndDate === 'string' ? raw.discountEndDate : '',
    inStock: raw.inStock !== false,
    isFeatured: Boolean(raw.isFeatured),
    featuredOrder: Number.isFinite(Number(raw.featuredOrder)) ? Number(raw.featuredOrder) : 0,
    isPublished: raw.isPublished !== false,
    images: Array.isArray(raw.images)
      ? raw.images.filter((img): img is string => typeof img === 'string' && img.trim().length > 0)
      : [],
    specs: Array.isArray(raw.specs)
      ? raw.specs.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      : [],
    options: Array.isArray(raw.options)
      ? raw.options.filter((o): o is string => typeof o === 'string' && o.trim().length > 0)
      : [],
    authorUid: typeof raw.authorUid === 'string' ? raw.authorUid : 'admin',
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : '',
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : '',
  };
}

async function fetchLiveSeoSnapshot(): Promise<SeoStoreSnapshot> {
  const { projectId, firestoreDatabaseId, apiKey } = CONFIGURED_FIREBASE;
  if (!projectId || !apiKey) {
    const localStored = (readStoredProducts() || [])
      .map((item) => mapRawRecordToProduct(item))
      .filter((p): p is Product => Boolean(p && p.isPublished));
    return {
      siteConfig: DEFAULT_SITE_CONFIG,
      products: localStored,
      catalogLoaded: localStored.length > 0,
      fetchedAt: Date.now(),
    };
  }

  const baseDocsUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    projectId
  )}/databases/${encodeURIComponent(firestoreDatabaseId)}/documents`;

  let siteConfig: SiteConfig = cachedSeoSnapshot?.siteConfig || DEFAULT_SITE_CONFIG;
  let products: Product[] = cachedSeoSnapshot?.products || [];
  let catalogLoaded = Boolean(cachedSeoSnapshot?.catalogLoaded);

  const [configResult, productsResult] = await Promise.allSettled([
    fetch(`${baseDocsUrl}/siteConfig/main?key=${encodeURIComponent(apiKey)}`, {
      signal: AbortSignal.timeout(3500),
    }),
    fetch(`${baseDocsUrl}:runQuery?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'products' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'isPublished' },
              op: 'EQUAL',
              value: { booleanValue: true },
            },
          },
          limit: 300,
        },
      }),
      signal: AbortSignal.timeout(3500),
    }),
  ]);

  if (configResult.status === 'fulfilled' && configResult.value.ok) {
    try {
      const json = (await configResult.value.json()) as {
        fields?: Record<string, unknown>;
      };
      if (json.fields) {
        const decoded = decodeFirestoreRestFields(json.fields);
        siteConfig = sanitizeSiteConfig(
          decoded as Partial<SiteConfig>,
          typeof decoded.updatedBy === 'string' ? decoded.updatedBy : 'system'
        );
      }
    } catch {
      // Keep fallback siteConfig
    }
  }

  if (productsResult.status === 'fulfilled' && productsResult.value.ok) {
    try {
      const rows = (await productsResult.value.json()) as Array<{
        document?: {
          name?: string;
          fields?: Record<string, unknown>;
        };
      }>;
      if (Array.isArray(rows)) {
        const parsedProducts: Product[] = [];
        for (const row of rows) {
          if (!row?.document?.fields) continue;
          const docPath = row.document.name || '';
          const fallbackDocId = docPath.split('/').pop() || '';
          const decoded = decodeFirestoreRestFields(row.document.fields);
          const mapped = mapRawRecordToProduct(decoded, fallbackDocId);
          if (mapped && mapped.isPublished) {
            parsedProducts.push(mapped);
          }
        }
        parsedProducts.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        products = parsedProducts;
        catalogLoaded = true;
      }
    } catch {
      // Keep fallback products
    }
  }

  const snapshot: SeoStoreSnapshot = {
    siteConfig,
    products,
    catalogLoaded,
    fetchedAt: Date.now(),
  };
  cachedSeoSnapshot = snapshot;
  return snapshot;
}

async function getSeoStoreSnapshot(): Promise<SeoStoreSnapshot> {
  const now = Date.now();
  if (cachedSeoSnapshot && now - cachedSeoSnapshot.fetchedAt < SEO_CACHE_TTL_MS) {
    return cachedSeoSnapshot;
  }
  if (!inflightSeoFetch) {
    inflightSeoFetch = fetchLiveSeoSnapshot().finally(() => {
      inflightSeoFetch = null;
    });
  }
  return inflightSeoFetch;
}

const STATIC_ASSET_EXT_REGEX =
  /\.(?:js|mjs|cjs|ts|tsx|jsx|css|png|jpg|jpeg|webp|gif|svg|ico|bmp|avif|json|xml|txt|woff|woff2|ttf|otf|eot|map|webmanifest)$/i;

function shouldServeEnrichedHtml(req: Request): boolean {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;
  const p = req.path || '/';
  if (
    p.startsWith('/api/') ||
    p === '/api' ||
    p.startsWith('/uploads/') ||
    p.startsWith('/src/') ||
    p.startsWith('/@') ||
    p.startsWith('/node_modules/') ||
    p.startsWith('/assets/') ||
    p.startsWith('/__vite')
  ) {
    return false;
  }
  if (/^\/google[a-z0-9_-]+\.html$/i.test(p)) {
    return false;
  }
  if (STATIC_ASSET_EXT_REGEX.test(p)) {
    return false;
  }
  return true;
}

function getGoogleSiteVerificationToken(): string {
  return (
    process.env.GOOGLE_SITE_VERIFICATION ||
    process.env.VITE_GOOGLE_SITE_VERIFICATION ||
    ''
  ).trim();
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '2mb' }));

  // Serve uploaded product images publicly so WhatsApp links resolve anywhere
  app.use(
    '/uploads',
    express.static(UPLOADS_DIR, {
      maxAge: '7d',
      fallthrough: true,
    })
  );

  // Serve generated studio catalog images publicly in both dev and production
  if (fs.existsSync(ASSETS_IMAGES_DIR)) {
    app.use(
      '/src/assets/images',
      express.static(ASSETS_IMAGES_DIR, {
        maxAge: '7d',
        fallthrough: true,
      })
    );
  }

  // Health & config info route
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      publicOrigin: resolveRequestOrigin(req),
    });
  });

  // Resolve Google Maps short links (maps.app.goo.gl / goo.gl/maps) into direct Maps URLs
  app.post('/api/resolve-map-url', async (req: Request, res: Response) => {
    const rawUrl = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
    if (!rawUrl || rawUrl.length > 600) {
      res.status(400).json({ error: 'رابط غير صالح.' });
      return;
    }

    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      res.status(400).json({ error: 'صيغة الرابط غير صالحة.' });
      return;
    }

    const allowedShortHosts = new Set(['maps.app.goo.gl', 'goo.gl']);
    if (parsed.protocol !== 'https:' || !allowedShortHosts.has(parsed.hostname.toLowerCase())) {
      res.status(400).json({ error: 'يدعم المحوّل روابط Google Maps المختصرة فقط.' });
      return;
    }

    try {
      const upstream = await fetch(parsed.toString(), {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(8000),
      });
      const locationHeader = upstream.headers.get('location') || '';
      if (!locationHeader) {
        res.status(422).json({ error: 'تعذر استخراج الإحداثيات من الرابط المختصر.' });
        return;
      }

      const bangMatch = locationHeader.match(/!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/);
      if (bangMatch) {
        res.json({
          directUrl: `https://www.google.com/maps/search/?api=1&query=${bangMatch[1]},${bangMatch[2]}`,
          coordinates: `${bangMatch[1]},${bangMatch[2]}`,
        });
        return;
      }

      const placeOrQueryMatch = locationHeader.match(
        /(?:\/maps\/place\/|[?&](?:q|query)=)(-?\d{1,2}\.\d+)\s*(?:,|%2C)\s*(-?\d{1,3}\.\d+)/i
      );
      if (placeOrQueryMatch) {
        res.json({
          directUrl: `https://www.google.com/maps/search/?api=1&query=${placeOrQueryMatch[1]},${placeOrQueryMatch[2]}`,
          coordinates: `${placeOrQueryMatch[1]},${placeOrQueryMatch[2]}`,
        });
        return;
      }

      const atCoordMatch = locationHeader.match(/\/@(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
      if (atCoordMatch) {
        res.json({
          directUrl: `https://www.google.com/maps/search/?api=1&query=${atCoordMatch[1]},${atCoordMatch[2]}`,
          coordinates: `${atCoordMatch[1]},${atCoordMatch[2]}`,
        });
        return;
      }

      const qParam = (() => {
        try {
          const locUrl = new URL(locationHeader);
          return locUrl.searchParams.get('q') || locUrl.searchParams.get('query') || '';
        } catch {
          return '';
        }
      })();

      if (qParam) {
        res.json({
          directUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(qParam)}`,
        });
        return;
      }

      res.status(422).json({ error: 'لم يتم العثور على إحداثيات صالحة داخل الرابط المختصر.' });
    } catch {
      res.status(502).json({ error: 'تعذر الاتصال لفتح الرابط المختصر.' });
    }
  });

  // Same-origin Firebase Authentication HTTPS relay (fallback when client browser/ISP blocks identitytoolkit/securetoken)
  app.post('/api/firebase-auth-relay', async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

    if (!CONFIGURED_FIREBASE_API_KEY) {
      res.status(503).json({ error: { code: 503, message: 'FIREBASE_CONFIG_UNAVAILABLE' } });
      return;
    }

    const rawTargetUrl = typeof req.body?.targetUrl === 'string' ? req.body.targetUrl.trim() : '';
    const rawMethod =
      typeof req.body?.method === 'string' ? req.body.method.trim().toUpperCase() : 'POST';
    const rawHeaders =
      req.body?.headers && typeof req.body.headers === 'object' && !Array.isArray(req.body.headers)
        ? (req.body.headers as Record<string, unknown>)
        : {};
    const rawBody = typeof req.body?.body === 'string' ? req.body.body : undefined;

    if (!rawTargetUrl || !['GET', 'POST'].includes(rawMethod)) {
      res.status(400).json({ error: { code: 400, message: 'INVALID_AUTH_RELAY_REQUEST' } });
      return;
    }

    let parsedTarget: URL;
    try {
      parsedTarget = new URL(rawTargetUrl);
    } catch {
      res.status(400).json({ error: { code: 400, message: 'INVALID_AUTH_RELAY_URL' } });
      return;
    }

    const hasAllowedPath = ALLOWED_FIREBASE_AUTH_PATH_PREFIXES.some((prefix) =>
      parsedTarget.pathname.startsWith(prefix)
    );

    if (
      parsedTarget.protocol !== 'https:' ||
      !ALLOWED_FIREBASE_AUTH_HOSTS.has(parsedTarget.hostname) ||
      !hasAllowedPath ||
      parsedTarget.searchParams.get('key') !== CONFIGURED_FIREBASE_API_KEY
    ) {
      res.status(403).json({ error: { code: 403, message: 'FORBIDDEN_AUTH_RELAY_TARGET' } });
      return;
    }

    const upstreamHeaders: Record<string, string> = {};
    const safeHeaderMap: Record<string, string> = {
      'content-type': 'Content-Type',
      'x-client-version': 'X-Client-Version',
      'x-firebase-gmpid': 'X-Firebase-gmpid',
      'x-firebase-locale': 'X-Firebase-Locale',
      'x-firebase-client': 'X-Firebase-Client',
      'x-firebase-appcheck': 'X-Firebase-AppCheck',
    };

    for (const [incomingKey, incomingVal] of Object.entries(rawHeaders)) {
      const canonical = safeHeaderMap[incomingKey.toLowerCase()];
      if (canonical && typeof incomingVal === 'string' && incomingVal.length <= 2048) {
        upstreamHeaders[canonical] = incomingVal;
      }
    }

    const clientOrigin =
      typeof req.headers.origin === 'string' && req.headers.origin.startsWith('http')
        ? req.headers.origin
        : resolveRequestOrigin(req);
    const clientReferer =
      typeof req.headers.referer === 'string' && req.headers.referer.startsWith('http')
        ? req.headers.referer
        : `${clientOrigin}/`;

    upstreamHeaders['Origin'] = clientOrigin;
    upstreamHeaders['Referer'] = clientReferer;

    try {
      const upstreamRes = await fetch(parsedTarget.toString(), {
        method: rawMethod,
        headers: upstreamHeaders,
        body: rawMethod === 'GET' ? undefined : rawBody,
        signal: AbortSignal.timeout(15000),
      });

      const responseBody = await upstreamRes.text();
      const contentType =
        upstreamRes.headers.get('content-type') || 'application/json; charset=UTF-8';
      res.status(upstreamRes.status).setHeader('Content-Type', contentType).send(responseBody);
    } catch {
      res.status(502).json({ error: { code: 502, message: 'UPSTREAM_AUTH_UNREACHABLE' } });
    }
  });

  // Verify admin password (123456)
  app.post('/api/admin/verify', (req: Request, res: Response) => {
    const provided = String(req.body?.password || '').trim();
    if (provided === getExpectedAdminPassword()) {
      res.json({ ok: true });
      return;
    }
    res.status(401).json({ ok: false, error: 'كلمة المرور غير صحيحة.' });
  });

  // Site Settings Endpoints
  app.get('/api/settings', (_req: Request, res: Response) => {
    const settings = readStoredSettings();
    res.json(settings);
  });

  app.post('/api/settings', (req: Request, res: Response) => {
    if (!isAuthorizedAdminRequest(req)) {
      res.status(401).json({ error: 'غير مصرح بتنفيذ هذا الإجراء.' });
      return;
    }
    const newSettings = req.body?.settings as Record<string, unknown> | undefined;
    if (!newSettings || typeof newSettings !== 'object') {
      res.status(400).json({ error: 'بيانات الإعدادات غير صالحة.' });
      return;
    }
    const current = readStoredSettings();
    const merged = { ...current, ...newSettings };
    writeStoredSettings(merged);
    res.json({ ok: true, settings: merged });
  });

  // Persistent Catalog Endpoints
  app.get('/api/products', (_req: Request, res: Response) => {
    const stored = readStoredProducts();
    if (!stored) {
      res.json({ initialized: false, products: [] });
      return;
    }
    res.json({ initialized: true, products: stored });
  });

  app.post('/api/products/seed', (req: Request, res: Response) => {
    const existing = readStoredProducts();
    if (existing && existing.length > 0) {
      res.json({ initialized: true, products: existing });
      return;
    }
    const seedItems = Array.isArray(req.body?.products) ? req.body.products : [];
    if (seedItems.length > 0) {
      writeStoredProducts(seedItems);
    }
    res.json({ initialized: true, products: seedItems });
  });

  app.post('/api/products', (req: Request, res: Response) => {
    if (!isAuthorizedAdminRequest(req)) {
      res.status(401).json({ error: 'غير مصرح بتنفيذ هذا الإجراء.' });
      return;
    }
    const product = req.body?.product as Record<string, unknown> | undefined;
    if (!product || typeof product.id !== 'string') {
      res.status(400).json({ error: 'بيانات المنتج غير مكتملة.' });
      return;
    }
    const current = readStoredProducts() || [];
    const next = [product, ...current.filter((p) => p.id !== product.id)];
    writeStoredProducts(next);
    res.json({ product, products: next });
  });

  app.put('/api/products/:id', (req: Request, res: Response) => {
    if (!isAuthorizedAdminRequest(req)) {
      res.status(401).json({ error: 'غير مصرح بتنفيذ هذا الإجراء.' });
      return;
    }
    const targetId = req.params.id;
    const updatedProduct = req.body?.product as Record<string, unknown> | undefined;
    if (!updatedProduct) {
      res.status(400).json({ error: 'بيانات التعديل غير مكتملة.' });
      return;
    }
    const current = readStoredProducts() || [];
    const exists = current.some((p) => p.id === targetId);
    const next = exists
      ? current.map((p) => (p.id === targetId ? { ...p, ...updatedProduct, id: targetId } : p))
      : [{ ...updatedProduct, id: targetId }, ...current];
    writeStoredProducts(next);
    res.json({ product: updatedProduct, products: next });
  });

  app.delete('/api/products/:id', (req: Request, res: Response) => {
    if (!isAuthorizedAdminRequest(req)) {
      res.status(401).json({ error: 'غير مصرح بتنفيذ هذا الإجراء.' });
      return;
    }
    const targetId = req.params.id;
    const current = readStoredProducts() || [];
    const next = current.filter((p) => p.id !== targetId);
    writeStoredProducts(next);
    res.json({ ok: true, products: next });
  });

  // Image upload endpoint returning full public URL for storefront & WhatsApp order messages
  app.post('/api/upload', (req: Request, res: Response) => {
    upload.array('images', 8)(req, res, (err: unknown) => {
      if (err) {
        const message = err instanceof Error ? err.message : 'تعذر رفع الصورة، يرجى المحاولة مجددًا.';
        res.status(400).json({ error: message });
        return;
      }

      const files = (req.files as Express.Multer.File[] | undefined) || [];
      if (files.length === 0) {
        res.status(400).json({ error: 'لم يتم اختيار أي صورة للرفع.' });
        return;
      }

      const urls = files.map((file) => `/uploads/${file.filename}`);
      res.json({ urls });
    });
  });

  // Google Search Console HTML file verification support (via env or /public/google*.html)
  app.get(/^\/(google[a-z0-9_-]+\.html)$/i, (req: Request, res: Response, next: NextFunction) => {
    const fileName = req.params[0];
    const configuredFile = (process.env.GOOGLE_SITE_VERIFICATION_FILE || '').trim();
    if (configuredFile && configuredFile === fileName) {
      res
        .status(200)
        .setHeader('Content-Type', 'text/html; charset=utf-8')
        .send(`google-site-verification: ${configuredFile}`);
      return;
    }
    const publicVerificationPath = path.join(PUBLIC_DIR, fileName);
    if (fs.existsSync(publicVerificationPath)) {
      res.sendFile(publicVerificationPath);
      return;
    }
    next();
  });

  // Dynamic robots.txt for search engine crawlers
  app.get('/robots.txt', (req: Request, res: Response) => {
    const origin = resolveRequestOrigin(req);
    res
      .status(200)
      .setHeader('Content-Type', 'text/plain; charset=utf-8')
      .setHeader('Cache-Control', 'public, max-age=3600')
      .send(buildRobotsTxt(origin));
  });

  // Dynamic XML Sitemap synced with live Firestore categories & published products
  app.get('/sitemap.xml', async (req: Request, res: Response) => {
    const origin = resolveRequestOrigin(req);
    const snapshot = await getSeoStoreSnapshot();
    const categories = getOrderedCategories(snapshot.siteConfig.categories);
    const xml = buildSitemapXml(origin, categories, snapshot.products);
    res
      .status(200)
      .setHeader('Content-Type', 'application/xml; charset=utf-8')
      .setHeader('Cache-Control', 'public, max-age=900')
      .send(xml);
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });

    // Serve /public static assets with clean caching before HTML route enrichment
    if (fs.existsSync(PUBLIC_DIR)) {
      app.use(
        express.static(PUBLIC_DIR, {
          index: false,
          maxAge: '1h',
          fallthrough: true,
        })
      );
    }

    app.use(async (req: Request, res: Response, next: NextFunction) => {
      if (!shouldServeEnrichedHtml(req)) {
        next();
        return;
      }

      try {
        const origin = resolveRequestOrigin(req);
        const queryIdx = req.originalUrl.indexOf('?');
        const search = queryIdx >= 0 ? req.originalUrl.slice(queryIdx) : '';
        const route = parseStoreSeoRoute(req.path, search, '');
        const snapshot = await getSeoStoreSnapshot();

        const meta = buildPageSeoMetadata({
          origin,
          route,
          siteConfig: snapshot.siteConfig,
          products: snapshot.products,
          catalogLoaded: snapshot.catalogLoaded,
        });
        const jsonLd = buildStructuredDataGraph({
          origin,
          route,
          siteConfig: snapshot.siteConfig,
          products: snapshot.products,
        });
        const noscriptHtml = buildCrawlableNoscriptHtml({
          origin,
          route,
          siteConfig: snapshot.siteConfig,
          products: snapshot.products,
        });

        const rawTemplate = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
        const viteTransformed = await vite.transformIndexHtml(req.originalUrl, rawTemplate);
        const enrichedHtml = injectSeoIntoHtml(
          viteTransformed,
          meta,
          jsonLd,
          noscriptHtml,
          getGoogleSiteVerificationToken()
        );

        res
          .status(meta.httpStatus)
          .setHeader('Content-Type', 'text/html; charset=utf-8')
          .setHeader('Cache-Control', 'no-cache')
          .send(enrichedHtml);
      } catch (err) {
        next(err);
      }
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(ROOT_DIR, 'dist');
    const distAssetsPath = path.join(distPath, 'assets');

    if (fs.existsSync(distAssetsPath)) {
      app.use(
        '/assets',
        express.static(distAssetsPath, {
          maxAge: '365d',
          immutable: true,
          fallthrough: true,
        })
      );
    }

    app.use(
      express.static(distPath, {
        index: false,
        maxAge: '7d',
        fallthrough: true,
      })
    );

    const distIndexFile = path.join(distPath, 'index.html');
    const cachedDistTemplate = fs.existsSync(distIndexFile)
      ? fs.readFileSync(distIndexFile, 'utf8')
      : '';

    app.get('*', async (req: Request, res: Response) => {
      try {
        const rawTemplate = cachedDistTemplate || fs.readFileSync(distIndexFile, 'utf8');
        const origin = resolveRequestOrigin(req);
        const queryIdx = req.originalUrl.indexOf('?');
        const search = queryIdx >= 0 ? req.originalUrl.slice(queryIdx) : '';
        const route = parseStoreSeoRoute(req.path, search, '');
        const snapshot = await getSeoStoreSnapshot();

        const meta = buildPageSeoMetadata({
          origin,
          route,
          siteConfig: snapshot.siteConfig,
          products: snapshot.products,
          catalogLoaded: snapshot.catalogLoaded,
        });
        const jsonLd = buildStructuredDataGraph({
          origin,
          route,
          siteConfig: snapshot.siteConfig,
          products: snapshot.products,
        });
        const noscriptHtml = buildCrawlableNoscriptHtml({
          origin,
          route,
          siteConfig: snapshot.siteConfig,
          products: snapshot.products,
        });

        const enrichedHtml = injectSeoIntoHtml(
          rawTemplate,
          meta,
          jsonLd,
          noscriptHtml,
          getGoogleSiteVerificationToken()
        );

        res
          .status(meta.httpStatus)
          .setHeader('Content-Type', 'text/html; charset=utf-8')
          .setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=600')
          .send(enrichedHtml);
      } catch {
        res.sendFile(distIndexFile);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`El-Mahallawy Store server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
