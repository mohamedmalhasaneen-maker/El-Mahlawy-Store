import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';

const PORT = 3000;
const ROOT_DIR = process.cwd();
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ASSETS_IMAGES_DIR = path.join(ROOT_DIR, 'src', 'assets', 'images');
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

function loadConfiguredFirebaseApiKey(): string {
  try {
    if (!fs.existsSync(FIREBASE_CONFIG_FILE)) return '';
    const parsed = JSON.parse(fs.readFileSync(FIREBASE_CONFIG_FILE, 'utf8')) as {
      apiKey?: unknown;
    };
    return typeof parsed.apiKey === 'string' ? parsed.apiKey.trim() : '';
  } catch {
    return '';
  }
}

const CONFIGURED_FIREBASE_API_KEY = loadConfiguredFirebaseApiKey();

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
  storeEnglishName: 'El Mahlawy Store',
  tagline: 'منتجات متنوعة وحلول ذكية لحياة أسهل',
  address: 'جنوب سيناء – شرم الشيخ – الرويسات – مدخل 1 – شارع دستي، بجوار قسم الشرطة، الشارع الجانبي لمول الشيخ عيد، محل المحلاوي ستور.',
  googleMapsUrl: 'https://maps.google.com/?q=27.9158,34.3300',
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
  htmlTitle: 'المحلاوي ستور | El Mahlawy Store',
  seoDescription: 'المحلاوي ستور - تسوق أحدث المنتجات والإلكترونيات وحلول الذكاء التكنولوجي بشرم الشيخ وجميع محافظات مصر.',
  seoKeywords: 'المحلاوي ستور, شرم الشيخ, تسوق, إلكترونيات, الرويسات, Infinity Corp',
  ogImageUrl: '',
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
    return typeof parsed === 'object' && parsed !== null ? { ...DEFAULT_SETTINGS, ...parsed } : DEFAULT_SETTINGS;
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

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(ROOT_DIR, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`El-Mahallawy Store server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
