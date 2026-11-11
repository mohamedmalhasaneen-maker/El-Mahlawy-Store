import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const FIREBASE_CONFIG_PATH = path.join(ROOT_DIR, 'firebase-applet-config.json');
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');
const ROBOTS_PATH = path.join(PUBLIC_DIR, 'robots.txt');

const OFFICIAL_SITE_ORIGIN = (
  process.env.CANONICAL_SITE_URL || 'https://elmahlawy-store.vercel.app'
)
  .trim()
  .replace(/\/+$/, '');

const DEFAULT_CATEGORIES = [
  { id: 'cctv', order: 1 },
  { id: 'satellite', order: 2 },
  { id: 'mobile-accessories', order: 3 },
  { id: 'electrical-tools', order: 4 },
  { id: 'early-warning', order: 5 },
  { id: 'smart-home', order: 6 },
  { id: 'computer-accessories', order: 7 },
  { id: 'internet', order: 8 },
  { id: 'memory-cards-flash', order: 9 },
];

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function extractValidIsoDate(raw) {
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

function decodeFirestoreValue(raw) {
  if (!raw || typeof raw !== 'object') return undefined;
  if ('nullValue' in raw) return null;
  if (typeof raw.stringValue === 'string') return raw.stringValue;
  if (typeof raw.booleanValue === 'boolean') return raw.booleanValue;
  if (typeof raw.integerValue === 'string' || typeof raw.integerValue === 'number') {
    return Number(raw.integerValue);
  }
  if (typeof raw.doubleValue === 'number' || typeof raw.doubleValue === 'string') {
    return Number(raw.doubleValue);
  }
  if (typeof raw.timestampValue === 'string') return raw.timestampValue;
  if (raw.arrayValue && typeof raw.arrayValue === 'object') {
    return Array.isArray(raw.arrayValue.values)
      ? raw.arrayValue.values.map((v) => decodeFirestoreValue(v))
      : [];
  }
  if (raw.mapValue && typeof raw.mapValue === 'object') {
    return decodeFirestoreFields(raw.mapValue.fields);
  }
  return undefined;
}

function decodeFirestoreFields(fields) {
  const out = {};
  if (!fields || typeof fields !== 'object') return out;
  for (const [k, v] of Object.entries(fields)) {
    out[k] = decodeFirestoreValue(v);
  }
  return out;
}

function buildRobotsTxtContent(origin) {
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
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n');
}

function buildSitemapXmlContent(origin, categories, publishedProducts) {
  const entries = [];
  const seen = new Set();

  const pushEntry = (loc, changefreq, priority, lastmod) => {
    if (!loc || seen.has(loc)) return;
    seen.add(loc);
    entries.push({ loc, changefreq, priority, lastmod: lastmod || '' });
  };

  let latestDate = '';
  for (const prod of publishedProducts) {
    const d = extractValidIsoDate(prod.updatedAt || prod.createdAt);
    if (d && d > latestDate) {
      latestDate = d;
    }
  }

  // 1. Official Homepage (with trailing slash matching canonical https://elmahlawy-store.vercel.app/)
  pushEntry(`${origin}/`, 'daily', '1.0', latestDate);

  // 2. Public About Us Page
  pushEntry(`${origin}/about`, 'weekly', '0.8', latestDate);

  // 3. Real Public Store Categories
  const sortedCategories = [...categories].sort(
    (a, b) => (Number(a.order) || 0) - (Number(b.order) || 0)
  );
  for (const cat of sortedCategories) {
    const catId = typeof cat.id === 'string' ? cat.id.trim() : '';
    if (!catId || catId === 'all' || catId === 'featured') continue;
    pushEntry(
      `${origin}/category/${encodeURIComponent(catId)}`,
      'daily',
      '0.8',
      latestDate
    );
  }

  // 4. Real Published Products Only (isPublished === true)
  for (const prod of publishedProducts) {
    const prodId = typeof prod.id === 'string' ? prod.id.trim() : '';
    if (!prodId) continue;
    const prodLastMod = extractValidIsoDate(prod.updatedAt || prod.createdAt);
    pushEntry(
      `${origin}/product/${encodeURIComponent(prodId)}`,
      'weekly',
      '0.9',
      prodLastMod
    );
  }

  const urlBlocks = entries
    .map((entry) =>
      [
        '  <url>',
        `    <loc>${escapeXml(entry.loc)}</loc>`,
        entry.lastmod ? `    <lastmod>${escapeXml(entry.lastmod)}</lastmod>` : '',
        `    <changefreq>${entry.changefreq}</changefreq>`,
        `    <priority>${entry.priority}</priority>`,
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n')
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlBlocks}\n</urlset>\n`;
}

async function fetchLiveCatalogFromFirestore() {
  if (!fs.existsSync(FIREBASE_CONFIG_PATH)) {
    return null;
  }
  const cfg = JSON.parse(fs.readFileSync(FIREBASE_CONFIG_PATH, 'utf8'));
  const projectId = typeof cfg.projectId === 'string' ? cfg.projectId.trim() : '';
  const apiKey = typeof cfg.apiKey === 'string' ? cfg.apiKey.trim() : '';
  const databaseId =
    typeof cfg.firestoreDatabaseId === 'string' && cfg.firestoreDatabaseId.trim()
      ? cfg.firestoreDatabaseId.trim()
      : '(default)';

  if (!projectId || !apiKey || projectId === 'remixed-project-id') {
    return null;
  }

  const baseDocsUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    projectId
  )}/databases/${encodeURIComponent(databaseId)}/documents`;

  const [siteRes, prodRes] = await Promise.all([
    fetch(`${baseDocsUrl}/siteConfig/main?key=${encodeURIComponent(apiKey)}`, {
      signal: AbortSignal.timeout(8000),
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
          limit: 500,
        },
      }),
      signal: AbortSignal.timeout(8000),
    }),
  ]);

  let categories = DEFAULT_CATEGORIES;
  if (siteRes.ok) {
    const siteJson = await siteRes.json();
    if (siteJson?.fields) {
      const decodedSite = decodeFirestoreFields(siteJson.fields);
      if (Array.isArray(decodedSite.categories) && decodedSite.categories.length > 0) {
        const fetched = decodedSite.categories
          .filter((c) => c && typeof c.id === 'string' && c.id.trim().length > 0)
          .map((c, idx) => ({
            id: c.id.trim(),
            order: Number.isFinite(Number(c.order)) ? Number(c.order) : idx + 1,
          }));
        const seenIds = new Set(fetched.map((c) => c.id));
        for (const def of DEFAULT_CATEGORIES) {
          if (!seenIds.has(def.id)) {
            fetched.push(def);
            seenIds.add(def.id);
          }
        }
        categories = fetched;
      }
    }
  }

  if (!prodRes.ok) {
    throw new Error(`Firestore products query returned HTTP ${prodRes.status}`);
  }

  const rows = await prodRes.json();
  const products = [];
  if (Array.isArray(rows)) {
    for (const row of rows) {
      if (!row?.document?.fields) continue;
      const fallbackId = String(row.document.name || '').split('/').pop() || '';
      const decoded = decodeFirestoreFields(row.document.fields);
      const id = typeof decoded.id === 'string' && decoded.id.trim() ? decoded.id.trim() : fallbackId;
      const name = typeof decoded.name === 'string' ? decoded.name.trim() : '';
      const price = Number(decoded.price);
      if (!id || !name || !Number.isFinite(price) || price <= 0) continue;
      if (decoded.isPublished === false) continue;
      products.push({
        id,
        createdAt: typeof decoded.createdAt === 'string' ? decoded.createdAt : '',
        updatedAt: typeof decoded.updatedAt === 'string' ? decoded.updatedAt : '',
      });
    }
  }

  products.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  return { categories, products };
}

async function main() {
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  // Always write fresh robots.txt referencing https://elmahlawy-store.vercel.app/sitemap.xml
  const robotsTxt = buildRobotsTxtContent(OFFICIAL_SITE_ORIGIN);
  fs.writeFileSync(ROBOTS_PATH, robotsTxt, 'utf8');

  try {
    const liveData = await fetchLiveCatalogFromFirestore();
    if (liveData) {
      const xml = buildSitemapXmlContent(
        OFFICIAL_SITE_ORIGIN,
        liveData.categories,
        liveData.products
      );
      fs.writeFileSync(SITEMAP_PATH, xml, 'utf8');
      console.log(
        `[SEO] Generated public/sitemap.xml (${2 + liveData.categories.length + liveData.products.length} URLs) & public/robots.txt for ${OFFICIAL_SITE_ORIGIN}`
      );
      return;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[SEO] Live Firestore sync warning (${message}); preserving static fallback.`);
  }

  // Fallback only if sitemap.xml does not exist yet
  if (!fs.existsSync(SITEMAP_PATH)) {
    const fallbackXml = buildSitemapXmlContent(OFFICIAL_SITE_ORIGIN, DEFAULT_CATEGORIES, []);
    fs.writeFileSync(SITEMAP_PATH, fallbackXml, 'utf8');
    console.log(`[SEO] Generated fallback public/sitemap.xml for ${OFFICIAL_SITE_ORIGIN}`);
  }
}

await main();
