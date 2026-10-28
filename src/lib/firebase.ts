import './authFetchBootstrap';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  User,
  browserLocalPersistence,
  browserSessionPersistence,
  getAuth,
  inMemoryPersistence,
  initializeAuth,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  Firestore,
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  initializeFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { DiscountType, OperationType, Product, ProductFormInput } from '../types/store';
import { sanitizeProductPayload } from '../utils/catalogLogic';
import {
  AUTHORIZED_DEVELOPER_EMAIL,
  AUTHORIZED_DEVELOPER_UID,
  isAuthorizedDeveloperEmail,
  isAuthorizedDeveloperUid,
  isAuthorizedDeveloperUser,
  logSafeDeveloperAuthDiagnostic,
  translateDeveloperAuthError,
  validateFirebaseWebAppConfig,
} from '../utils/developerAuth';
import { DEFAULT_SITE_CONFIG, SiteConfig, sanitizeSiteConfig } from '../utils/siteConfig';

const configCheck = validateFirebaseWebAppConfig(firebaseConfig);
if (!configCheck.valid) {
  console.error('[DeveloperAuth] Invalid Firebase Web App configuration:', configCheck.errors);
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

function createResilientFirestore(): Firestore {
  try {
    return initializeFirestore(
      app,
      { experimentalAutoDetectLongPolling: true },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

function createIframeSafeAuth(): Auth {
  try {
    // Avoid getAuth(app) defaults (browserPopupRedirectResolver + indexedDBLocalPersistence first),
    // which inject cross-origin gapi/__/auth/iframe on mobile/Safari and can stall on IndexedDB in sandboxed iframes.
    return initializeAuth(app, {
      persistence: [
        browserLocalPersistence,
        browserSessionPersistence,
        inMemoryPersistence,
      ],
    });
  } catch {
    return getAuth(app);
  }
}

export const db = createResilientFirestore();
export const auth = createIframeSafeAuth();

export {
  AUTHORIZED_DEVELOPER_EMAIL,
  AUTHORIZED_DEVELOPER_UID,
  isAuthorizedDeveloperEmail,
  isAuthorizedDeveloperUid,
  isAuthorizedDeveloperUser,
};
export const BOOTSTRAPPED_ADMIN_EMAIL = AUTHORIZED_DEVELOPER_EMAIL;
export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
export const FIREBASE_AUTH_DOMAIN = firebaseConfig.authDomain;

const SAFE_ID_REGEX = /^[a-zA-Z0-9_\-]{1,128}$/;

function assertVerifiedDeveloperSession(): User {
  const user = auth.currentUser;
  if (!user || !isAuthorizedDeveloperUser(user)) {
    throw new Error('غير مصرح بهذه العملية. يرجى تسجيل الدخول بحساب المطور المعتمد أولًا.');
  }
  return user;
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function translateFirebaseAuthError(error: unknown): string {
  return translateDeveloperAuthError(error);
}

export async function testFirestoreConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

// Run mandatory boot validation check
void testFirestoreConnection();

function timestampToIso(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }
  return new Date().toISOString();
}

export function mapDocToProduct(id: string, data: Record<string, unknown>): Product {
  const discountType: DiscountType =
    data.discountType === 'fixed' ? 'fixed' : 'percentage';
  const discountValue =
    typeof data.discountValue === 'number' && Number.isFinite(data.discountValue)
      ? data.discountValue
      : undefined;

  const images =
    Array.isArray(data.images) && data.images.length > 0
      ? data.images.map(String).filter(Boolean)
      : typeof data.imageUrl === 'string' && data.imageUrl.trim()
        ? [data.imageUrl.trim()]
        : typeof data.image === 'string' && data.image.trim()
          ? [data.image.trim()]
          : [];

  return {
    id: typeof data.id === 'string' && data.id.trim() ? data.id : id,
    name: String(data.name ?? ''),
    brand: String(data.brand ?? ''),
    category: String(data.category ?? 'عام'),
    shortDescription: String(data.shortDescription ?? ''),
    description: String(data.description ?? ''),
    price: Number(data.price ?? 0),
    originalPrice: Number(data.originalPrice ?? data.price ?? 0),
    discountEnabled: Boolean(data.discountEnabled),
    discountType,
    discountValue,
    discountStartDate: typeof data.discountStartDate === 'string' ? data.discountStartDate : '',
    discountEndDate: typeof data.discountEndDate === 'string' ? data.discountEndDate : '',
    inStock: data.inStock !== false,
    isFeatured: Boolean(data.isFeatured),
    isPublished: data.isPublished !== false,
    images,
    specs: Array.isArray(data.specs) ? data.specs.map(String) : [],
    options: Array.isArray(data.options) ? data.options.map(String) : [],
    authorUid:
      typeof data.authorUid === 'string' && SAFE_ID_REGEX.test(data.authorUid)
        ? data.authorUid
        : 'admin',
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

export function subscribeToPublishedProducts(
  onProducts: (products: Product[]) => void,
  onErrorCallback?: (err: Error) => void
): () => void {
  const path = 'products';
  const q = query(collection(db, path), where('isPublished', '==', true));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) =>
        mapDocToProduct(d.id, d.data() as Record<string, unknown>)
      );
      onProducts(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (formattedErr) {
        if (onErrorCallback && formattedErr instanceof Error) {
          onErrorCallback(formattedErr);
        }
      }
    }
  );
}

export function subscribeToAllProductsForAdmin(
  onProducts: (products: Product[]) => void,
  onErrorCallback?: (err: Error) => void
): () => void {
  try {
    assertVerifiedDeveloperSession();
  } catch (err) {
    if (onErrorCallback && err instanceof Error) {
      onErrorCallback(err);
    }
    return () => {};
  }
  const path = 'products';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items = snapshot.docs.map((d) =>
        mapDocToProduct(d.id, d.data() as Record<string, unknown>)
      );
      onProducts(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (formattedErr) {
        if (onErrorCallback && formattedErr instanceof Error) {
          onErrorCallback(formattedErr);
        }
      }
    }
  );
}

export function subscribeToSiteConfig(
  onConfig: (config: SiteConfig) => void,
  onErrorCallback?: (err: Error) => void
): () => void {
  const path = 'siteConfig/main';
  return onSnapshot(
    doc(db, 'siteConfig', 'main'),
    (snapshot) => {
      if (!snapshot.exists()) {
        onConfig(DEFAULT_SITE_CONFIG);
        return;
      }
      const raw = snapshot.data() as Record<string, unknown>;
      const sanitized = sanitizeSiteConfig(
        {
          ...(raw as Partial<SiteConfig>),
          updatedAt: timestampToIso(raw.updatedAt),
        },
        typeof raw.updatedBy === 'string' ? raw.updatedBy : 'admin'
      );
      onConfig(sanitized);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (formattedErr) {
        if (onErrorCallback && formattedErr instanceof Error) {
          onErrorCallback(formattedErr);
        }
      }
    }
  );
}

export async function saveCloudSiteConfig(
  config: SiteConfig,
  authorUid: string
): Promise<SiteConfig> {
  const verifiedUser = assertVerifiedDeveloperSession();
  const effectiveUid = verifiedUser.uid || authorUid;
  const sanitized = sanitizeSiteConfig(config, effectiveUid);
  const path = 'siteConfig/main';
  try {
    const payload = {
      ...sanitized,
      id: 'main',
      updatedBy: effectiveUid,
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'siteConfig', 'main'), payload);
    return sanitized;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function checkUserIsCloudAdmin(user: User | null): Promise<boolean> {
  if (!user) return false;
  if (isAuthorizedDeveloperUser(user)) {
    return true;
  }
  if (!user.emailVerified) return false;
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function signInDeveloperWithEmail(email: string, password: string): Promise<User> {
  const normalizedEmail = email.trim().toLowerCase();
  if (
    email.trim() === AUTHORIZED_DEVELOPER_UID ||
    password.trim() === AUTHORIZED_DEVELOPER_UID
  ) {
    const uidErr = new Error('auth/uid-used-as-password') as Error & { code: string };
    uidErr.code = 'auth/uid-used-as-password';
    throw uidErr;
  }

  try {
    const result = await signInWithEmailAndPassword(auth, normalizedEmail, password);
    const matchesAuthorizedUidOrEmail =
      isAuthorizedDeveloperUser(result.user) || isAuthorizedDeveloperEmail(result.user.email);

    if (!matchesAuthorizedUidOrEmail) {
      await signOut(auth);
      const unauthorizedErr = new Error('auth/unauthorized-developer-account') as Error & {
        code: string;
      };
      unauthorizedErr.code = 'auth/unauthorized-developer-account';
      throw unauthorizedErr;
    }

    // signInWithEmailAndPassword already returns a freshly minted ID token; avoid redundant network round-trip
    await result.user.getIdToken(false);
    return result.user;
  } catch (error) {
    logSafeDeveloperAuthDiagnostic('signInWithEmailAndPassword', error, {
      projectId: FIREBASE_PROJECT_ID,
      authDomain: FIREBASE_AUTH_DOMAIN,
    });
    throw error;
  }
}

export async function sendDeveloperPasswordReset(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    const invalidErr = new Error('auth/invalid-email') as Error & { code: string };
    invalidErr.code = 'auth/invalid-email';
    throw invalidErr;
  }
  try {
    await sendPasswordResetEmail(auth, normalizedEmail);
  } catch (error) {
    logSafeDeveloperAuthDiagnostic('sendPasswordResetEmail', error, {
      projectId: FIREBASE_PROJECT_ID,
      authDomain: FIREBASE_AUTH_DOMAIN,
    });
    throw error;
  }
}

export async function sendDeveloperVerificationEmail(user: User): Promise<void> {
  try {
    await sendEmailVerification(user);
  } catch (error) {
    logSafeDeveloperAuthDiagnostic('sendEmailVerification', error, {
      projectId: FIREBASE_PROJECT_ID,
      authDomain: FIREBASE_AUTH_DOMAIN,
    });
    throw error;
  }
}

export async function signOutAdmin(): Promise<void> {
  await signOut(auth);
}

export { onAuthStateChanged };
export type { User };

function buildFirestoreProductRecord(
  sanitized: Product,
  createdAtValue: unknown
): Record<string, unknown> {
  return {
    id: sanitized.id,
    name: sanitized.name,
    brand: sanitized.brand,
    category: sanitized.category,
    shortDescription: sanitized.shortDescription,
    description: sanitized.description,
    price: sanitized.price,
    originalPrice: sanitized.originalPrice,
    discountEnabled: sanitized.discountEnabled,
    discountType: sanitized.discountType ?? 'percentage',
    discountValue: sanitized.discountValue ?? 0,
    discountStartDate: sanitized.discountStartDate ?? '',
    discountEndDate: sanitized.discountEndDate ?? '',
    inStock: sanitized.inStock,
    isFeatured: sanitized.isFeatured,
    isPublished: sanitized.isPublished,
    images: sanitized.images,
    specs: sanitized.specs,
    options: sanitized.options,
    authorUid: sanitized.authorUid,
    createdAt: createdAtValue,
    updatedAt: serverTimestamp(),
  };
}

async function resolveExistingProductImmutableMeta(
  productId: string,
  fallbackUid: string
): Promise<{
  existingProduct: Product | null;
  preservedAuthorUid: string;
  preservedCreatedAt: unknown;
}> {
  const snap = await getDoc(doc(db, 'products', productId));
  if (!snap.exists()) {
    return {
      existingProduct: null,
      preservedAuthorUid: fallbackUid,
      preservedCreatedAt: serverTimestamp(),
    };
  }
  const raw = snap.data() as Record<string, unknown>;
  const existingProduct = mapDocToProduct(productId, raw);
  const preservedAuthorUid =
    typeof raw.authorUid === 'string' && SAFE_ID_REGEX.test(raw.authorUid)
      ? raw.authorUid
      : fallbackUid;
  const preservedCreatedAt =
    raw.createdAt instanceof Timestamp ? raw.createdAt : serverTimestamp();
  return {
    existingProduct,
    preservedAuthorUid,
    preservedCreatedAt,
  };
}

export async function createCloudProduct(
  input: ProductFormInput,
  authorUid: string,
  customId?: string
): Promise<Product> {
  const verifiedUser = assertVerifiedDeveloperSession();
  const sanitized = sanitizeProductPayload(input, customId, verifiedUser.uid || authorUid);
  const path = `products/${sanitized.id}`;
  try {
    await setDoc(
      doc(db, 'products', sanitized.id),
      buildFirestoreProductRecord(sanitized, serverTimestamp())
    );
    return sanitized;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCloudProduct(
  productId: string,
  input: ProductFormInput,
  existingAuthorUid: string
): Promise<Product> {
  const verifiedUser = assertVerifiedDeveloperSession();
  const path = `products/${productId}`;
  try {
    const { preservedAuthorUid, preservedCreatedAt } =
      await resolveExistingProductImmutableMeta(
        productId,
        SAFE_ID_REGEX.test(existingAuthorUid) ? existingAuthorUid : verifiedUser.uid
      );
    const sanitized = sanitizeProductPayload(input, productId, preservedAuthorUid);
    await setDoc(
      doc(db, 'products', productId),
      buildFirestoreProductRecord(sanitized, preservedCreatedAt)
    );
    return sanitized;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export interface DiscountQuickUpdatePayload {
  price: number;
  originalPrice: number;
  discountEnabled: boolean;
  discountType: DiscountType;
  discountValue: number;
  discountStartDate: string;
  discountEndDate: string;
}

export async function updateCloudProductDiscount(
  productId: string,
  discount: DiscountQuickUpdatePayload
): Promise<void> {
  const verifiedUser = assertVerifiedDeveloperSession();
  const path = `products/${productId}`;
  try {
    const { existingProduct, preservedAuthorUid, preservedCreatedAt } =
      await resolveExistingProductImmutableMeta(productId, verifiedUser.uid);
    if (!existingProduct) {
      throw new Error('المنتج المطلوب تحديث خصمه غير موجود في قاعدة البيانات.');
    }
    const mergedInput: ProductFormInput = {
      id: productId,
      name: existingProduct.name,
      brand: existingProduct.brand,
      category: existingProduct.category,
      shortDescription: existingProduct.shortDescription,
      description: existingProduct.description,
      price: discount.price,
      originalPrice: discount.originalPrice,
      discountEnabled: discount.discountEnabled,
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      discountStartDate: discount.discountStartDate,
      discountEndDate: discount.discountEndDate,
      inStock: existingProduct.inStock,
      isFeatured: existingProduct.isFeatured,
      isPublished: existingProduct.isPublished,
      images:
        existingProduct.images.length > 0 ? existingProduct.images : ['/logo.png'],
      specs: existingProduct.specs,
      options: existingProduct.options,
    };
    const sanitized = sanitizeProductPayload(mergedInput, productId, preservedAuthorUid);
    await setDoc(
      doc(db, 'products', productId),
      buildFirestoreProductRecord(sanitized, preservedCreatedAt)
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateCloudProductFlags(
  productId: string,
  updates: Partial<Pick<Product, 'isPublished' | 'inStock' | 'isFeatured'>>
): Promise<void> {
  const verifiedUser = assertVerifiedDeveloperSession();
  const path = `products/${productId}`;
  try {
    const { existingProduct, preservedAuthorUid, preservedCreatedAt } =
      await resolveExistingProductImmutableMeta(productId, verifiedUser.uid);
    if (!existingProduct) {
      throw new Error('المنتج المطلوب تحديث حالته غير موجود في قاعدة البيانات.');
    }
    const mergedInput: ProductFormInput = {
      id: productId,
      name: existingProduct.name,
      brand: existingProduct.brand,
      category: existingProduct.category,
      shortDescription: existingProduct.shortDescription,
      description: existingProduct.description,
      price: existingProduct.price,
      originalPrice: existingProduct.originalPrice,
      discountEnabled: existingProduct.discountEnabled,
      discountType: existingProduct.discountType,
      discountValue: existingProduct.discountValue,
      discountStartDate: existingProduct.discountStartDate,
      discountEndDate: existingProduct.discountEndDate,
      inStock: updates.inStock ?? existingProduct.inStock,
      isFeatured: updates.isFeatured ?? existingProduct.isFeatured,
      isPublished: updates.isPublished ?? existingProduct.isPublished,
      images:
        existingProduct.images.length > 0 ? existingProduct.images : ['/logo.png'],
      specs: existingProduct.specs,
      options: existingProduct.options,
    };
    const sanitized = sanitizeProductPayload(mergedInput, productId, preservedAuthorUid);
    await setDoc(
      doc(db, 'products', productId),
      buildFirestoreProductRecord(sanitized, preservedCreatedAt)
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCloudProduct(productId: string): Promise<void> {
  assertVerifiedDeveloperSession();
  const path = `products/${productId}`;
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

