import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rulesSource = fs.readFileSync(path.join(process.cwd(), 'firestore.rules'), 'utf8');
const blueprint = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'firebase-blueprint.json'), 'utf8')
);

interface AuthContext {
  uid: string;
  email: string;
  email_verified: boolean;
}

const REQUEST_TIME = '2026-10-27T10:00:00.000Z';

const REQUIRED_PRODUCT_KEYS = blueprint.entities.Product.required as string[];

function isValidId(id: unknown): boolean {
  return typeof id === 'string' && id.length >= 1 && id.length <= 128 && /^[a-zA-Z0-9_\-]+$/.test(id);
}

function isBootstrappedAdmin(auth: AuthContext | null): boolean {
  return Boolean(
    auth &&
      auth.email === 'mohamed.m.alhasaneen@gmail.com' &&
      auth.email_verified === true
  );
}

function isValidProductRuleSimulator(data: Record<string, unknown>): boolean {
  const keys = Object.keys(data);
  if (!REQUIRED_PRODUCT_KEYS.every((k) => keys.includes(k))) return false;
  if (!keys.every((k) => REQUIRED_PRODUCT_KEYS.includes(k))) return false;

  if (!isValidId(data.id)) return false;
  if (typeof data.name !== 'string' || data.name.length < 2 || data.name.length > 160) return false;
  if (typeof data.brand !== 'string' || data.brand.length < 1 || data.brand.length > 80) return false;
  if (typeof data.category !== 'string' || data.category.length < 2 || data.category.length > 60) return false;
  if (
    typeof data.shortDescription !== 'string' ||
    data.shortDescription.length < 4 ||
    data.shortDescription.length > 300
  )
    return false;
  if (typeof data.description !== 'string' || data.description.length < 4 || data.description.length > 3000)
    return false;
  if (typeof data.price !== 'number' || data.price <= 0 || data.price > 1000000) return false;
  if (
    typeof data.originalPrice !== 'number' ||
    data.originalPrice < data.price ||
    data.originalPrice > 1000000
  )
    return false;
  if (typeof data.discountEnabled !== 'boolean') return false;
  if (data.discountEnabled && !(data.originalPrice > data.price)) return false;
  if (typeof data.inStock !== 'boolean') return false;
  if (typeof data.isFeatured !== 'boolean') return false;
  if (typeof data.isPublished !== 'boolean') return false;
  if (!Array.isArray(data.images) || data.images.length < 1 || data.images.length > 8) return false;
  if (
    typeof data.images[0] !== 'string' ||
    data.images[0].length < 1 ||
    data.images[0].length > 500
  )
    return false;
  if (!Array.isArray(data.specs) || data.specs.length > 15) return false;
  if (
    data.specs.length > 0 &&
    (typeof data.specs[0] !== 'string' || data.specs[0].length < 1 || data.specs[0].length > 200)
  )
    return false;
  if (!Array.isArray(data.options) || data.options.length > 10) return false;
  if (
    data.options.length > 0 &&
    (typeof data.options[0] !== 'string' || data.options[0].length < 1 || data.options[0].length > 80)
  )
    return false;
  if (!isValidId(data.authorUid)) return false;
  if (typeof data.createdAt !== 'string' || typeof data.updatedAt !== 'string') return false;

  return true;
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
  if (!isBootstrappedAdmin(auth)) return 'PERMISSION_DENIED';
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
  if (!isBootstrappedAdmin(auth)) return 'PERMISSION_DENIED';
  return 'ALLOWED';
}

function makeBaseValidPayload(): Record<string, unknown> {
  return {
    id: 'prod-101',
    name: 'سماعة بلوتوث برو',
    brand: 'سوني',
    category: 'سماعات وصوتيات',
    shortDescription: 'سماعة رأس لاسلكية بعزل ضوضاء احترافي',
    description: 'سماعة رأس لاسلكية بعزل ضوضاء احترافي وبطارية 40 ساعة.',
    price: 2200,
    originalPrice: 2800,
    discountEnabled: true,
    inStock: true,
    isFeatured: true,
    isPublished: true,
    images: ['https://example.com/uploads/item.jpg'],
    specs: ['بلوتوث 5.3'],
    options: ['أزرق ملكي'],
    authorUid: 'admin-uid-1',
    createdAt: REQUEST_TIME,
    updatedAt: REQUEST_TIME,
  };
}

const verifiedAdmin: AuthContext = {
  uid: 'admin-uid-1',
  email: 'mohamed.m.alhasaneen@gmail.com',
  email_verified: true,
};

test('firestore.rules structural guards match security_spec invariants', () => {
  assert.ok(rulesSource.includes("rules_version = '2';"));
  assert.ok(rulesSource.includes('allow read, write: if false;'));
  assert.ok(rulesSource.includes('request.auth.token.email_verified == true'));
  assert.ok(rulesSource.includes('incoming().createdAt == request.time'));
  assert.ok(rulesSource.includes('incoming().updatedAt == request.time'));
  assert.ok(rulesSource.includes('affectedKeys().hasOnly'));
});

test('Dirty Dozen adversarial payloads all return PERMISSION_DENIED', () => {
  // Baseline valid admin write succeeds
  assert.equal(evaluateProductCreate('prod-101', makeBaseValidPayload(), verifiedAdmin), 'ALLOWED');

  // 1. Shadow Field Injection
  assert.equal(
    evaluateProductCreate(
      'prod-101',
      { ...makeBaseValidPayload(), isSuperFeatured: true },
      verifiedAdmin
    ),
    'PERMISSION_DENIED'
  );

  // 2. Email Spoofing (unverified admin email)
  assert.equal(
    evaluateProductCreate('prod-101', makeBaseValidPayload(), {
      uid: 'admin-uid-1',
      email: 'mohamed.m.alhasaneen@gmail.com',
      email_verified: false,
    }),
    'PERMISSION_DENIED'
  );

  // 3. Non-admin authenticated user write
  assert.equal(
    evaluateProductCreate('prod-101', makeBaseValidPayload(), {
      uid: 'admin-uid-1',
      email: 'attacker@example.com',
      email_verified: true,
    }),
    'PERMISSION_DENIED'
  );

  // 4. Identity Spoofing (authorUid mismatch)
  assert.equal(
    evaluateProductCreate(
      'prod-101',
      { ...makeBaseValidPayload(), authorUid: 'other-user' },
      verifiedAdmin
    ),
    'PERMISSION_DENIED'
  );

  // 5. ID Poisoning (invalid characters in path ID)
  assert.equal(
    evaluateProductCreate(
      'bad$id with spaces!',
      { ...makeBaseValidPayload(), id: 'bad$id with spaces!' },
      verifiedAdmin
    ),
    'PERMISSION_DENIED'
  );

  // 6. Discount Inversion Attack
  assert.equal(
    evaluateProductCreate(
      'prod-101',
      { ...makeBaseValidPayload(), price: 3000, originalPrice: 2500, discountEnabled: true },
      verifiedAdmin
    ),
    'PERMISSION_DENIED'
  );

  // 7. Zero/Negative Price Attack
  assert.equal(
    evaluateProductCreate(
      'prod-101',
      { ...makeBaseValidPayload(), price: 0 },
      verifiedAdmin
    ),
    'PERMISSION_DENIED'
  );

  // 8. Denial-of-Wallet Unbounded Array (25 images)
  assert.equal(
    evaluateProductCreate(
      'prod-101',
      {
        ...makeBaseValidPayload(),
        images: Array.from({ length: 25 }, (_, i) => `https://example.com/${i}.jpg`),
      },
      verifiedAdmin
    ),
    'PERMISSION_DENIED'
  );

  // 9. Value Poisoning on Update (wrong type for whitelisted field)
  const existing = makeBaseValidPayload();
  assert.equal(
    evaluateProductUpdate(
      'prod-101',
      existing,
      { ...existing, name: true },
      verifiedAdmin
    ),
    'PERMISSION_DENIED'
  );

  // 10. Immutable Field Tampering (changing authorUid on update)
  assert.equal(
    evaluateProductUpdate(
      'prod-101',
      existing,
      { ...existing, authorUid: 'hijacked-uid' },
      verifiedAdmin
    ),
    'PERMISSION_DENIED'
  );

  // 11. Client Timestamp Forgery
  assert.equal(
    evaluateProductUpdate(
      'prod-101',
      existing,
      { ...existing, updatedAt: '2099-01-01T00:00:00.000Z' },
      verifiedAdmin
    ),
    'PERMISSION_DENIED'
  );

  // 12. Unauthenticated write attempt
  assert.equal(
    evaluateProductCreate('prod-101', makeBaseValidPayload(), null),
    'PERMISSION_DENIED'
  );
});
