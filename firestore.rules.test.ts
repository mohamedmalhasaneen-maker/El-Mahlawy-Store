import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_SITE_CONFIG, sanitizeSiteConfig } from './src/utils/siteConfig';

const rulesSource = fs.readFileSync(path.join(process.cwd(), 'firestore.rules'), 'utf8');
const blueprint = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'firebase-blueprint.json'), 'utf8')
);

interface AuthContext {
  uid: string;
  email: string;
  email_verified: boolean;
}

const REQUEST_TIME = '2026-10-28T10:00:00.000Z';
const AUTHORIZED_UID = 'eGi5P37ztLe5Nn77sEFvmFFcZWp1';

const REQUIRED_PRODUCT_KEYS = blueprint.entities.Product.required as string[];
const ALLOWED_PRODUCT_KEYS = Object.keys(blueprint.entities.Product.properties);
const REQUIRED_SITE_CONFIG_KEYS = blueprint.entities.SiteConfig.required as string[];
const ALLOWED_SITE_CONFIG_KEYS = Object.keys(blueprint.entities.SiteConfig.properties);

function isValidId(id: unknown, maxLen = 128): boolean {
  return (
    typeof id === 'string' &&
    id.length >= 1 &&
    id.length <= maxLen &&
    /^[a-zA-Z0-9_\-]+$/.test(id)
  );
}

function isAuthorizedDeveloper(auth: AuthContext | null): boolean {
  if (!auth) return false;
  if (auth.uid === AUTHORIZED_UID) return true;
  return Boolean(
    auth.email_verified === true &&
      (auth.email === 'abdulazizriadvip@gmail.com' ||
        auth.email === 'mohamed.m.alhasaneen@gmail.com')
  );
}

function isValidCategoryItemSimulator(item: unknown): boolean {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
  const rec = item as Record<string, unknown>;
  const keys = Object.keys(rec);
  if (keys.length !== 3 || !['id', 'name', 'order'].every((k) => keys.includes(k))) {
    return false;
  }
  if (!isValidId(rec.id, 60)) return false;
  if (typeof rec.name !== 'string' || rec.name.length < 2 || rec.name.length > 80) return false;
  if (typeof rec.order !== 'number' || !Number.isFinite(rec.order) || rec.order < 1 || rec.order > 100) {
    return false;
  }
  return true;
}

function isValidProductRuleSimulator(data: Record<string, unknown>): boolean {
  const keys = Object.keys(data);
  if (!REQUIRED_PRODUCT_KEYS.every((k) => keys.includes(k))) return false;
  if (!keys.every((k) => ALLOWED_PRODUCT_KEYS.includes(k))) return false;

  if (!isValidId(data.id)) return false;
  if (typeof data.name !== 'string' || data.name.length < 2 || data.name.length > 160) return false;
  if (typeof data.brand !== 'string' || data.brand.length > 80) return false;
  if (typeof data.category !== 'string' || data.category.length > 80) return false;
  if ('categoryId' in data && (typeof data.categoryId !== 'string' || data.categoryId.length > 60)) {
    return false;
  }
  if (typeof data.shortDescription !== 'string' || data.shortDescription.length > 300) return false;
  if (typeof data.description !== 'string' || data.description.length > 3000) return false;
  if (typeof data.price !== 'number' || data.price <= 0 || data.price > 1000000) return false;
  if (
    typeof data.originalPrice !== 'number' ||
    data.originalPrice < data.price ||
    data.originalPrice > 1000000
  ) {
    return false;
  }
  if (typeof data.discountEnabled !== 'boolean') return false;
  if (data.discountEnabled && !(data.originalPrice > data.price)) return false;

  if (
    'discountType' in data &&
    (typeof data.discountType !== 'string' ||
      data.discountType.length > 20 ||
      !['percentage', 'fixed'].includes(data.discountType))
  ) {
    return false;
  }
  if (
    'discountValue' in data &&
    (typeof data.discountValue !== 'number' ||
      data.discountValue < 0 ||
      data.discountValue > 1000000)
  ) {
    return false;
  }
  if (
    'discountStartDate' in data &&
    (typeof data.discountStartDate !== 'string' || data.discountStartDate.length > 32)
  ) {
    return false;
  }
  if (
    'discountEndDate' in data &&
    (typeof data.discountEndDate !== 'string' || data.discountEndDate.length > 32)
  ) {
    return false;
  }

  if (typeof data.inStock !== 'boolean') return false;
  if (typeof data.isFeatured !== 'boolean') return false;
  if (typeof data.isPublished !== 'boolean') return false;
  if (!Array.isArray(data.images) || data.images.length < 1 || data.images.length > 15) return false;
  if (
    typeof data.images[0] !== 'string' ||
    data.images[0].length < 1 ||
    data.images[0].length > 2000
  ) {
    return false;
  }
  if (!Array.isArray(data.specs) || data.specs.length > 15) return false;
  if (
    data.specs.length > 0 &&
    (typeof data.specs[0] !== 'string' || data.specs[0].length < 1 || data.specs[0].length > 200)
  ) {
    return false;
  }
  if (!Array.isArray(data.options) || data.options.length > 10) return false;
  if (
    data.options.length > 0 &&
    (typeof data.options[0] !== 'string' || data.options[0].length < 1 || data.options[0].length > 80)
  ) {
    return false;
  }
  if (!isValidId(data.authorUid)) return false;
  if (typeof data.createdAt !== 'string' || typeof data.updatedAt !== 'string') return false;

  return true;
}

function isValidSiteConfigRuleSimulator(data: Record<string, unknown>): boolean {
  const keys = Object.keys(data);
  if (!REQUIRED_SITE_CONFIG_KEYS.every((k) => keys.includes(k))) return false;
  if (!keys.every((k) => ALLOWED_SITE_CONFIG_KEYS.includes(k))) return false;
  if (!isValidId(data.id, 32)) return false;
  if (typeof data.storeName !== 'string' || data.storeName.length < 2 || data.storeName.length > 100) {
    return false;
  }
  if (typeof data.primaryPhone !== 'string' || data.primaryPhone.length < 7 || data.primaryPhone.length > 30) {
    return false;
  }
  if (typeof data.primaryWhatsApp !== 'string' || data.primaryWhatsApp.length < 7 || data.primaryWhatsApp.length > 25) {
    return false;
  }
  if ('aboutStoreIntro' in data && (typeof data.aboutStoreIntro !== 'string' || data.aboutStoreIntro.length > 5000)) {
    return false;
  }
  if ('aboutPartnerIntro' in data && (typeof data.aboutPartnerIntro !== 'string' || data.aboutPartnerIntro.length > 5000)) {
    return false;
  }
  if ('contactChannels' in data && (!Array.isArray(data.contactChannels) || data.contactChannels.length > 20)) {
    return false;
  }
  if ('socialLinks' in data && (!Array.isArray(data.socialLinks) || data.socialLinks.length > 15)) {
    return false;
  }
  if ('branches' in data && (!Array.isArray(data.branches) || data.branches.length > 10)) {
    return false;
  }
  if ('categories' in data) {
    if (!Array.isArray(data.categories) || data.categories.length < 1 || data.categories.length > 20) {
      return false;
    }
    if (!isValidCategoryItemSimulator(data.categories[0])) return false;
  }
  if (!isValidId(data.updatedBy)) return false;
  if (typeof data.updatedAt !== 'string') return false;
  return true;
}

function evaluateProductGet(
  productId: string,
  existing: Record<string, unknown>,
  auth: AuthContext | null
): 'ALLOWED' | 'PERMISSION_DENIED' {
  if (!isValidId(productId)) return 'PERMISSION_DENIED';
  if (existing.isPublished === true || isAuthorizedDeveloper(auth)) return 'ALLOWED';
  return 'PERMISSION_DENIED';
}

function evaluateAdminRoleCreate(): 'ALLOWED' | 'PERMISSION_DENIED' {
  return 'PERMISSION_DENIED';
}

function evaluateConnectionProbe(
  probeId: string,
  op: 'get' | 'list' | 'write'
): 'ALLOWED' | 'PERMISSION_DENIED' {
  if (
    op === 'get' &&
    isValidId(probeId) &&
    (probeId === 'connection' || probeId === 'rules_v3_ready')
  ) {
    return 'ALLOWED';
  }
  return 'PERMISSION_DENIED';
}

function evaluateProductCreate(
  productId: string,
  incoming: Record<string, unknown>,
  auth: AuthContext | null
): 'ALLOWED' | 'PERMISSION_DENIED' {
  if (!auth) return 'PERMISSION_DENIED';
  if (!isValidId(productId)) return 'PERMISSION_DENIED';
  if (!isValidProductRuleSimulator(incoming)) return 'PERMISSION_DENIED';
  if (incoming.id !== productId) return 'PERMISSION_DENIED';
  if (incoming.authorUid !== auth.uid) return 'PERMISSION_DENIED';
  if (incoming.createdAt !== REQUEST_TIME || incoming.updatedAt !== REQUEST_TIME) {
    return 'PERMISSION_DENIED';
  }
  if (!isAuthorizedDeveloper(auth)) return 'PERMISSION_DENIED';
  return 'ALLOWED';
}

function evaluateProductUpdate(
  productId: string,
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
  auth: AuthContext | null
): 'ALLOWED' | 'PERMISSION_DENIED' {
  if (!auth) return 'PERMISSION_DENIED';
  if (!isValidId(productId)) return 'PERMISSION_DENIED';
  if (!isValidProductRuleSimulator(incoming)) return 'PERMISSION_DENIED';
  if (incoming.id !== existing.id) return 'PERMISSION_DENIED';
  if (incoming.authorUid !== existing.authorUid) return 'PERMISSION_DENIED';
  if (incoming.createdAt !== existing.createdAt) return 'PERMISSION_DENIED';
  if (incoming.updatedAt !== REQUEST_TIME) return 'PERMISSION_DENIED';
  if (!isAuthorizedDeveloper(auth)) return 'PERMISSION_DENIED';
  return 'ALLOWED';
}

function evaluateSiteConfigWrite(
  configId: string,
  incoming: Record<string, unknown>,
  auth: AuthContext | null
): 'ALLOWED' | 'PERMISSION_DENIED' {
  if (!auth) return 'PERMISSION_DENIED';
  if (!isValidId(configId) || configId !== 'main') return 'PERMISSION_DENIED';
  if (!isValidSiteConfigRuleSimulator(incoming)) return 'PERMISSION_DENIED';
  if (incoming.id !== 'main') return 'PERMISSION_DENIED';
  if (incoming.updatedBy !== auth.uid) return 'PERMISSION_DENIED';
  if (incoming.updatedAt !== REQUEST_TIME) return 'PERMISSION_DENIED';
  if (!isAuthorizedDeveloper(auth)) return 'PERMISSION_DENIED';
  return 'ALLOWED';
}

function makeBaseValidPayload(authorUid = AUTHORIZED_UID): Record<string, unknown> {
  return {
    id: 'prod-101',
    name: 'سماعة بلوتوث برو',
    brand: '',
    category: 'قسم إكسسوارات الهاتف',
    categoryId: 'mobile-accessories',
    shortDescription: '',
    description: '',
    price: 2200,
    originalPrice: 2800,
    discountEnabled: true,
    discountType: 'percentage',
    discountValue: 21.43,
    discountStartDate: '2026-10-01',
    discountEndDate: '2026-12-31',
    inStock: true,
    isFeatured: true,
    isPublished: true,
    images: ['https://res.cloudinary.com/obvb7rtp/image/upload/v1/item.jpg'],
    specs: ['بلوتوث 5.3'],
    options: ['أزرق ملكي'],
    authorUid,
    createdAt: REQUEST_TIME,
    updatedAt: REQUEST_TIME,
  };
}

const authorizedDeveloperUidAuth: AuthContext = {
  uid: AUTHORIZED_UID,
  email: 'abdulazizriadvip@gmail.com',
  email_verified: false, // Exact developer UID succeeds even when email_verified is false
};

const verifiedBootstrappedOwner: AuthContext = {
  uid: 'owner-uid-1',
  email: 'mohamed.m.alhasaneen@gmail.com',
  email_verified: true,
};

test('firestore.rules structural guards match security_spec invariants and cover all blueprint paths', () => {
  assert.ok(rulesSource.includes("rules_version = '2';"));
  assert.ok(rulesSource.includes('allow read, write: if false;'));
  assert.ok(rulesSource.includes(`request.auth.uid == '${AUTHORIZED_UID}'`));
  assert.ok(rulesSource.includes("request.auth.token.email == 'abdulazizriadvip@gmail.com'"));
  assert.ok(rulesSource.includes('request.auth.token.email_verified == true'));
  assert.ok(rulesSource.includes('isValidSocialLinkItem'));
  assert.ok(rulesSource.includes('isValidCategoryItem'));
  assert.ok(rulesSource.includes('incoming().createdAt == request.time'));
  assert.ok(rulesSource.includes('incoming().updatedAt == request.time'));
  assert.ok(rulesSource.includes('affectedKeys().hasOnly'));
  assert.ok(rulesSource.includes('match /products/{productId}'));
  assert.ok(rulesSource.includes('match /siteConfig/{configId}'));
  assert.ok(rulesSource.includes('match /admins/{adminUid}'));
  assert.ok(rulesSource.includes('match /test/{probeId}'));
  assert.ok(rulesSource.includes('match /meta/{statId}'));
  assert.ok(rulesSource.includes('allow create: if false;'));
});

test('Authorized developer UID eGi5P37ztLe5Nn77sEFvmFFcZWp1 (with emailVerified: false) succeeds on siteConfig/main, categories ordering, and products', () => {
  assert.equal(
    evaluateProductCreate('prod-101', makeBaseValidPayload(AUTHORIZED_UID), authorizedDeveloperUidAuth),
    'ALLOWED'
  );

  const sanitized = {
    ...sanitizeSiteConfig(
      {
        ...DEFAULT_SITE_CONFIG,
        storeName: 'المحلاوي ستور',
        primaryPhone: '01210141187',
        aboutStoreIntro: 'نص تعريفي محدّث لصفحة من نحن الخاصة بالمحلاوي ستور.',
        categories: [
          { id: 'satellite', name: 'قسم الستلايت', order: 1 },
          { id: 'cctv', name: 'قسم كاميرات المراقبة', order: 2 },
          { id: 'smart-home', name: 'قسم السمارت هوم', order: 3 },
        ],
        socialLinks: [
          {
            id: 'sl-tiktok',
            platform: 'tiktok',
            label: 'تيك توك المحلاوي',
            owner: 'store',
            url: 'https://www.tiktok.com/@elmahlawystore',
          },
        ],
      },
      AUTHORIZED_UID
    ),
    updatedAt: REQUEST_TIME,
  } as unknown as Record<string, unknown>;

  // Targeted { merge: true } update payload (core required keys + only modified About Us fields)
  const targetedAboutUpdate: Record<string, unknown> = {
    id: 'main',
    storeName: 'المحلاوي ستور',
    primaryPhone: '01210141187',
    primaryWhatsApp: '201210141187',
    aboutHeroTitle: 'المحلاوي ستور × Infinity Corp — شرم الشيخ',
    aboutStoreIntro: 'فقرة تعريفية موسعة '.repeat(140), // ~2800 Arabic chars (well over legacy 1200 limit, within 5000 limit)
    aboutPartnerIntro: 'نبذة تفصيلية عن خدمات Infinity Corp '.repeat(80),
    updatedBy: AUTHORIZED_UID,
    updatedAt: REQUEST_TIME,
  };
  assert.equal(
    evaluateSiteConfigWrite('main', targetedAboutUpdate, authorizedDeveloperUidAuth),
    'ALLOWED'
  );

  assert.equal(evaluateSiteConfigWrite('main', sanitized, authorizedDeveloperUidAuth), 'ALLOWED');
  // Reject rogue document ID
  assert.equal(evaluateSiteConfigWrite('other', sanitized, authorizedDeveloperUidAuth), 'PERMISSION_DENIED');
  // Reject unauthenticated visitor write
  assert.equal(evaluateSiteConfigWrite('main', sanitized, null), 'PERMISSION_DENIED');
  // Reject non-developer authenticated write on siteConfig/main
  assert.equal(
    evaluateSiteConfigWrite('main', sanitized, {
      uid: 'random-user-uid',
      email: 'visitor@example.com',
      email_verified: true,
    }),
    'PERMISSION_DENIED'
  );

  // Connectivity & rules v3 probe check
  assert.equal(evaluateConnectionProbe('connection', 'get'), 'ALLOWED');
  assert.equal(evaluateConnectionProbe('rules_v3_ready', 'get'), 'ALLOWED');
  assert.equal(evaluateConnectionProbe('other', 'get'), 'PERMISSION_DENIED');
  assert.equal(evaluateConnectionProbe('connection', 'write'), 'PERMISSION_DENIED');
  assert.equal(evaluateConnectionProbe('connection', 'list'), 'PERMISSION_DENIED');
});

test('Unauthenticated and non-developer users are blocked from reading hidden admin products or creating admin accounts', () => {
  const hiddenDraft = { ...makeBaseValidPayload(), isPublished: false };
  const publishedItem = { ...makeBaseValidPayload(), isPublished: true };

  assert.equal(evaluateProductGet('prod-101', publishedItem, null), 'ALLOWED');
  assert.equal(evaluateProductGet('prod-101', hiddenDraft, null), 'PERMISSION_DENIED');
  assert.equal(
    evaluateProductGet('prod-101', hiddenDraft, {
      uid: 'u-2',
      email: 'stranger@gmail.com',
      email_verified: true,
    }),
    'PERMISSION_DENIED'
  );
  assert.equal(evaluateProductGet('prod-101', hiddenDraft, authorizedDeveloperUidAuth), 'ALLOWED');
  assert.equal(evaluateProductGet('prod-101', hiddenDraft, verifiedBootstrappedOwner), 'ALLOWED');
  assert.equal(evaluateAdminRoleCreate(), 'PERMISSION_DENIED');
});

test('Dirty Dozen adversarial payloads all return PERMISSION_DENIED', () => {
  // Baseline valid developer write succeeds
  assert.equal(
    evaluateProductCreate('prod-101', makeBaseValidPayload(AUTHORIZED_UID), authorizedDeveloperUidAuth),
    'ALLOWED'
  );

  // 1. Shadow Field Injection on Product
  assert.equal(
    evaluateProductCreate(
      'prod-101',
      { ...makeBaseValidPayload(AUTHORIZED_UID), isSuperFeatured: true },
      authorizedDeveloperUidAuth
    ),
    'PERMISSION_DENIED'
  );

  // 2. Email Spoofing (non-developer UID claiming unverified developer email abdulazizriadvip@gmail.com)
  assert.equal(
    evaluateProductCreate('prod-101', makeBaseValidPayload('spoof-uid-999'), {
      uid: 'spoof-uid-999',
      email: 'abdulazizriadvip@gmail.com',
      email_verified: false,
    }),
    'PERMISSION_DENIED'
  );

  // 3. Non-admin authenticated user write
  assert.equal(
    evaluateProductCreate('prod-101', makeBaseValidPayload('attacker-uid-1'), {
      uid: 'attacker-uid-1',
      email: 'attacker@example.com',
      email_verified: true,
    }),
    'PERMISSION_DENIED'
  );

  // 4. Identity Spoofing (authorUid mismatch)
  assert.equal(
    evaluateProductCreate(
      'prod-101',
      { ...makeBaseValidPayload(AUTHORIZED_UID), authorUid: 'other-user' },
      authorizedDeveloperUidAuth
    ),
    'PERMISSION_DENIED'
  );

  // 5. ID Poisoning (invalid characters in path ID)
  assert.equal(
    evaluateProductCreate(
      'bad$id with spaces!',
      { ...makeBaseValidPayload(AUTHORIZED_UID), id: 'bad$id with spaces!' },
      authorizedDeveloperUidAuth
    ),
    'PERMISSION_DENIED'
  );

  // 6. Discount Inversion Attack
  assert.equal(
    evaluateProductCreate(
      'prod-101',
      {
        ...makeBaseValidPayload(AUTHORIZED_UID),
        price: 3000,
        originalPrice: 2500,
        discountEnabled: true,
      },
      authorizedDeveloperUidAuth
    ),
    'PERMISSION_DENIED'
  );

  // 7. Zero/Negative Price Attack
  assert.equal(
    evaluateProductCreate(
      'prod-101',
      { ...makeBaseValidPayload(AUTHORIZED_UID), price: 0 },
      authorizedDeveloperUidAuth
    ),
    'PERMISSION_DENIED'
  );

  // 8. Denial-of-Wallet Unbounded Array (25 images > max 15)
  assert.equal(
    evaluateProductCreate(
      'prod-101',
      {
        ...makeBaseValidPayload(AUTHORIZED_UID),
        images: Array.from({ length: 25 }, (_, i) => `https://example.com/${i}.jpg`),
      },
      authorizedDeveloperUidAuth
    ),
    'PERMISSION_DENIED'
  );

  // 9. Value Poisoning on Update (wrong type for whitelisted field)
  const existing = makeBaseValidPayload(AUTHORIZED_UID);
  assert.equal(
    evaluateProductUpdate(
      'prod-101',
      existing,
      { ...existing, name: true },
      authorizedDeveloperUidAuth
    ),
    'PERMISSION_DENIED'
  );

  // 10. Immutable Field Tampering (changing authorUid on update)
  assert.equal(
    evaluateProductUpdate(
      'prod-101',
      existing,
      { ...existing, authorUid: 'hijacked-uid' },
      authorizedDeveloperUidAuth
    ),
    'PERMISSION_DENIED'
  );

  // 11. Client Timestamp Forgery
  assert.equal(
    evaluateProductUpdate(
      'prod-101',
      existing,
      { ...existing, updatedAt: '2099-01-01T00:00:00.000Z' },
      authorizedDeveloperUidAuth
    ),
    'PERMISSION_DENIED'
  );

  // 12. Shadow Field / Rogue Key on SiteConfig (e.g. storing password in public config)
  const badSiteConfig = {
    ...sanitizeSiteConfig(DEFAULT_SITE_CONFIG, AUTHORIZED_UID),
    updatedAt: REQUEST_TIME,
    adminPassword: 'leaked-password',
  } as unknown as Record<string, unknown>;
  assert.equal(
    evaluateSiteConfigWrite('main', badSiteConfig, authorizedDeveloperUidAuth),
    'PERMISSION_DENIED'
  );
});
