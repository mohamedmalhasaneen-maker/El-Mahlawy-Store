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

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getExpectedAdminPassword(): string {
  const envPass = (process.env.ADMIN_PASSWORD || '').trim();
  return envPass || 'WQ(8)@opnKLOZ$80@Gh';
}

function isAuthorizedAdminRequest(req: Request): boolean {
  const headerPass = String(req.headers['x-admin-password'] || '').trim();
  return headerPass === getExpectedAdminPassword();
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

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    cb(null, `mahallawy-${uniqueSuffix}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max per image
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
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

  // Verify admin password (123456)
  app.post('/api/admin/verify', (req: Request, res: Response) => {
    const provided = String(req.body?.password || '').trim();
    if (provided === getExpectedAdminPassword()) {
      res.json({ ok: true });
      return;
    }
    res.status(401).json({ ok: false, error: 'كلمة المرور غير صحيحة.' });
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
