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
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { DiscountType, OperationType, Product, ProductFormInput } from '../types/store';
import { sanitizeProductPayload } from '../utils/catalogLogic';
import { getCategoryIdByName, getCategoryName } from '../constants/categories';
import {
  AUTHORIZED_DEVELOPER_EMAIL,
  AUTHORIZED_DEVELOPER_UID,
  AUTHORIZED_DEVELOPER_UIDS,
  INFINITY_CORP_DEVELOPER_EMAIL,
  INFINITY_CORP_DEVELOPER_UID,
  isAuthorizedDeveloperEmail,
  isAuthorizedDeveloperUid,
  isAuthorizedDeveloperUser,
  logSafeDeveloperAuthDiagnostic,
  sanitizeDiagnosticText,
  translateDeveloperAuthError,
  validateFirebaseWebAppConfig,
} from '../utils/developerAuth';
import {
  DEFAULT_SITE_CONFIG,
  MAX_FIRESTORE_DOC_SAFE_BYTES,
  SiteConfig,
  buildTargetedSiteConfigUpdateFields,
  estimateJsonUtf8Bytes,
  mergeSafeSiteConfigForSave,
  sanitizeSiteConfig,
  validateSiteConfigInput,
} from '../utils/siteConfig';

const EXPECTED_FIREBASE_PROJECT_ID = 'emergent-transmitter-sv8b6';

const configCheck = validateFirebaseWebAppConfig(firebaseConfig);
if (!configCheck.valid) {
  console.error('[DeveloperAuth] Invalid Firebase Web App configuration:', configCheck.errors);
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

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

// Initialize Auth BEFORE Firestore so Firestore's CredentialsProvider binds immediately to our iframe-safe Auth instance
export const auth = createIframeSafeAuth();
export const db = createResilientFirestore();
export { doc, runTransaction };

export {
  AUTHORIZED_DEVELOPER_EMAIL,
  AUTHORIZED_DEVELOPER_UID,
  AUTHORIZED_DEVELOPER_UIDS,
  INFINITY_CORP_DEVELOPER_EMAIL,
  INFINITY_CORP_DEVELOPER_UID,
  isAuthorizedDeveloperEmail,
  isAuthorizedDeveloperUid,
  isAuthorizedDeveloperUser,
};
export const BOOTSTRAPPED_ADMIN_EMAIL = AUTHORIZED_DEVELOPER_EMAIL;
export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
export const FIREBASE_AUTH_DOMAIN = firebaseConfig.authDomain;
export const FIREBASE_DATABASE_ID = firebaseConfig.firestoreDatabaseId;

const SAFE_ID_REGEX = /^[a-zA-Z0-9_\-]{1,128}$/;

export type CloudWriteStage =
  | 'config_validation'
  | 'auth_session'
  | 'token_verification'
  | 'pre_write_server_merge'
  | 'payload_validation'
  | 'firestore_write'
  | 'server_readback_confirm';

const STAGE_ARABIC_LABELS: Record<CloudWriteStage, string> = {
  config_validation: 'التحقق من إعدادات مشروع Firebase',
  auth_session: 'التحقق من جلسة حساب المطور',
  token_verification: 'تحديث وتوثيق رمز الجلسة (ID Token)',
  pre_write_server_merge: 'قراءة ودمج البيانات الحالية من الخادم',
  payload_validation: 'فحص صحة وحجم البيانات قبل الإرسال',
  firestore_write: 'الكتابة في قاعدة بيانات Cloud Firestore',
  server_readback_confirm: 'تأكيد الحفظ الفعلي من الخادم',
};

export interface SafeCloudWriteDiagnostic {
  operationName: string;
  operationType: OperationType;
  targetPath: string;
  failedStage: CloudWriteStage;
  errorCode: string;
  originalErrorMessage: string;
  projectId: string;
  databaseId: string;
  authState: {
    isSignedIn: boolean;
    uid: string | null;
    emailVerified: boolean | null;
    isAuthorizedDeveloper: boolean;
  };
  payloadMeta?: {
    estimatedBytes?: number;
    fieldCount?: number;
    existedOnServerBeforeWrite?: boolean;
  };
  timestamp: string;
}

export function extractFirestoreErrorCode(error: unknown): string {
  const errObj = error as { code?: unknown; message?: unknown } | null;
  if (typeof errObj?.code === 'string' && errObj.code.trim()) {
    return sanitizeDiagnosticText(errObj.code.trim());
  }
  const msg = error instanceof Error ? error.message : String(error ?? '');
  if (/missing or insufficient permissions|permission-denied/i.test(msg)) {
    return 'permission-denied';
  }
  if (/client is offline|unavailable/i.test(msg)) {
    return 'unavailable';
  }
  if (/quota/i.test(msg)) {
    return 'resource-exhausted';
  }
  return 'unknown';
}

export function isPermissionDeniedError(error: unknown): boolean {
  const code = extractFirestoreErrorCode(error).toLowerCase();
  const msg = (error instanceof Error ? error.message : String(error ?? '')).toLowerCase();
  return (
    code.includes('permission-denied') ||
    msg.includes('missing or insufficient permissions') ||
    msg.includes('permission-denied')
  );
}

export function logSafeCloudWriteDiagnostic(params: {
  operationName: string;
  operationType: OperationType;
  targetPath: string;
  failedStage: CloudWriteStage;
  error: unknown;
  payloadMeta?: SafeCloudWriteDiagnostic['payloadMeta'];
}): SafeCloudWriteDiagnostic {
  const currentUser = auth.currentUser;
  const rawMessage =
    params.error instanceof Error ? params.error.message : String(params.error ?? '');
  const diagnostic: SafeCloudWriteDiagnostic = {
    operationName: params.operationName,
    operationType: params.operationType,
    targetPath: params.targetPath,
    failedStage: params.failedStage,
    errorCode: extractFirestoreErrorCode(params.error),
    originalErrorMessage: sanitizeDiagnosticText(rawMessage),
    projectId: FIREBASE_PROJECT_ID,
    databaseId: FIREBASE_DATABASE_ID,
    authState: {
      isSignedIn: Boolean(currentUser),
      uid: currentUser?.uid ?? null,
      emailVerified: currentUser?.emailVerified ?? null,
      isAuthorizedDeveloper: isAuthorizedDeveloperUser(currentUser),
    },
    ...(params.payloadMeta ? { payloadMeta: params.payloadMeta } : {}),
    timestamp: new Date().toISOString(),
  };
  console.error('[CloudWriteDiagnostic]', diagnostic);
  return diagnostic;
}

function assertFirebaseProjectConnectionReady(): void {
  const validation = validateFirebaseWebAppConfig(firebaseConfig);
  if (!validation.valid) {
    throw new Error(
      `إعدادات الربط مع مشروع Firebase غير مكتملة: ${validation.errors.join(' — ')}`
    );
  }
  if (firebaseConfig.projectId !== EXPECTED_FIREBASE_PROJECT_ID) {
    throw new Error(
      `عدم تطابق معرّف مشروع Firebase (${firebaseConfig.projectId} بدلًا من ${EXPECTED_FIREBASE_PROJECT_ID}).`
    );
  }
  if (!firebaseConfig.firestoreDatabaseId || !firebaseConfig.firestoreDatabaseId.trim()) {
    throw new Error('معرّف قاعدة بيانات Cloud Firestore المخصصة غير محدد في إعدادات المشروع.');
  }
}

function assertVerifiedDeveloperSession(): User {
  assertFirebaseProjectConnectionReady();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('لا توجد جلسة تسجيل دخول نشطة حاليًا. يرجى تسجيل الدخول بحساب المطور أولًا.');
  }
  if (!isAuthorizedDeveloperUser(user)) {
    if (isAuthorizedDeveloperEmail(user.email) && !user.emailVerified) {
      throw new Error(
        `الحساب (${user.email}) غير مطابق لمعرّفات المطورين المعتمدة وبريده الإلكتروني غير موثّق بعد (emailVerified: false). يرجى توثيق البريد أولًا أو الدخول بحساب مطور معتمد.`
      );
    }
    throw new Error(
      `غير مصرح بالحفظ السحابي لهذا الحساب (UID: ${user.uid}). الصلاحية مقتصرة على حسابات المطورين المعتمدة فقط.`
    );
  }
  return user;
}

async function prepareVerifiedDeveloperCloudWrite(
  onStage?: (stage: CloudWriteStage) => void
): Promise<User> {
  onStage?.('config_validation');
  assertFirebaseProjectConnectionReady();

  onStage?.('auth_session');
  if (typeof auth.authStateReady === 'function') {
    await auth.authStateReady();
  }
  const user = assertVerifiedDeveloperSession();

  onStage?.('token_verification');
  const tokenResult = await user.getIdTokenResult(false);
  const expirationMs = tokenResult?.expirationTime
    ? Date.parse(tokenResult.expirationTime)
    : Number.NaN;
  if (Number.isFinite(expirationMs) && expirationMs - Date.now() < 5 * 60 * 1000) {
    await user.getIdToken(true);
  }
  return user;
}

async function executeWriteWithAuthRebindRetry<T>(
  user: User,
  writeOperation: () => Promise<T>
): Promise<T> {
  try {
    return await writeOperation();
  } catch (firstErr) {
    if (isPermissionDeniedError(firstErr)) {
      // Force-refresh the ID token once so active long-polling Firestore channels rebind the authenticated UID
      await user.getIdToken(true);
      return await writeOperation();
    }
    throw firstErr;
  }
}

export interface FirestoreErrorInfo {
  error: string;
  errorCode?: string;
  operationName?: string;
  failedStage?: CloudWriteStage;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: boolean | string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  meta?: {
    operationName?: string;
    failedStage?: CloudWriteStage;
  }
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    errorCode: extractFirestoreErrorCode(error),
    ...(meta?.operationName ? { operationName: meta.operationName } : {}),
    ...(meta?.failedStage ? { failedStage: meta.failedStage } : {}),
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

const OPERATION_ARABIC_LABELS: Record<OperationType, string> = {
  [OperationType.CREATE]: 'إضافة مستند جديد',
  [OperationType.UPDATE]: 'تحديث مستند',
  [OperationType.DELETE]: 'حذف مستند',
  [OperationType.LIST]: 'قراءة قائمة مستندات',
  [OperationType.GET]: 'قراءة مستند',
  [OperationType.WRITE]: 'كتابة وحفظ مستند',
};

export function formatCloudErrorForDeveloper(
  error: unknown,
  contextLabel = 'حفظ التعديلات سحابيًا'
): string {
  const rawMessage = error instanceof Error ? error.message : String(error ?? '');
  if (!rawMessage) {
    return `تعذر ${contextLabel} في قاعدة البيانات السحابية.`;
  }

  try {
    const parsed = JSON.parse(rawMessage) as Partial<FirestoreErrorInfo>;
    if (parsed && typeof parsed === 'object' && typeof parsed.error === 'string') {
      const originalError = parsed.error;
      const errorCode = parsed.errorCode || 'unknown';
      const opLabel = parsed.operationType
        ? OPERATION_ARABIC_LABELS[parsed.operationType] || parsed.operationType
        : 'عملية سحابية';
      const stageLabel = parsed.failedStage
        ? STAGE_ARABIC_LABELS[parsed.failedStage] || parsed.failedStage
        : null;
      const targetPath = parsed.path || 'غير محدد';
      const uid = parsed.authInfo?.userId || 'غير مسجل الدخول';
      const emailVerified = parsed.authInfo?.emailVerified;
      const lowerErr = originalError.toLowerCase();
      const stageDetail = stageLabel ? ` في مرحلة (${stageLabel})` : '';

      if (
        lowerErr.includes('missing or insufficient permissions') ||
        lowerErr.includes('permission-denied')
      ) {
        return `تعذر ${contextLabel}: رفضت قواعد أمان Cloud Firestore عملية (${opLabel})${stageDetail} على المسار (${targetPath}) بكود (${errorCode}). جلسة المصادقة الحالية (UID: ${uid}، توثيق البريد: ${String(emailVerified)}). السبب الأصلي: ${originalError}`;
      }

      if (lowerErr.includes('offline') || lowerErr.includes('unavailable')) {
        return `تعذر ${contextLabel}: تعذر الوصول الفعلي إلى خادم Cloud Firestore${stageDetail} على المسار (${targetPath}) بكود (${errorCode}). يرجى التحقق من اتصال الإنترنت ثم المحاولة مجددًا. السبب الأصلي: ${originalError}`;
      }

      if (lowerErr.includes('quota')) {
        return `تعذر ${contextLabel}: تم تجاوز الحصة اليومية المجانية لقاعدة بيانات Firestore مؤقتًا (${errorCode}). السبب الأصلي: ${originalError}`;
      }

      return `تعذر ${contextLabel} أثناء (${opLabel})${stageDetail} على المسار (${targetPath}) بكود (${errorCode}). السبب الأصلي: ${originalError}`;
    }
  } catch {
    // Plain non-JSON error message (e.g., pre-write validation or session guard)
  }

  return rawMessage;
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

export function mapDocToProduct(
  id: string,
  data: Record<string, unknown>,
  customCategories?: ReadonlyArray<{ id: string; name: string; order?: number }>
): Product {
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

  const rawCategoryId = typeof data.categoryId === 'string' ? data.categoryId.trim() : '';
  const rawCategory = typeof data.category === 'string' ? data.category.trim() : '';
  const knownCategoryId = getCategoryIdByName(rawCategoryId || rawCategory, customCategories);
  const resolvedCategoryId = knownCategoryId || rawCategoryId;
  const resolvedCategoryName = knownCategoryId
    ? getCategoryName(knownCategoryId, customCategories)
    : rawCategory || resolvedCategoryId || 'بدون قسم';

  return {
    id: typeof data.id === 'string' && data.id.trim() ? data.id : id,
    name: String(data.name ?? ''),
    brand: String(data.brand ?? ''),
    categoryId: resolvedCategoryId,
    category: resolvedCategoryName,
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

function mapSnapshotToSiteConfig(raw: Record<string, unknown>): SiteConfig {
  return sanitizeSiteConfig(
    {
      ...(raw as Partial<SiteConfig>),
      updatedAt: timestampToIso(raw.updatedAt),
    },
    typeof raw.updatedBy === 'string' ? raw.updatedBy : 'admin'
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
      onConfig(mapSnapshotToSiteConfig(raw));
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
  const path = 'siteConfig/main';
  let currentStage: CloudWriteStage = 'config_validation';
  let estimatedBytes: number | undefined;
  let fieldCount: number | undefined;
  let existedOnServerBeforeWrite: boolean | undefined;

  try {
    const verifiedUser = await prepareVerifiedDeveloperCloudWrite((stage) => {
      currentStage = stage;
    });
    const effectiveUid = verifiedUser.uid || authorUid;
    const configRef = doc(db, 'siteConfig', 'main');

    currentStage = 'pre_write_server_merge';
    let existingServerRaw: Record<string, unknown> | null = null;
    try {
      const priorSnap = await getDocFromServer(configRef);
      existedOnServerBeforeWrite = priorSnap.exists();
      if (priorSnap.exists()) {
        existingServerRaw = priorSnap.data() as Record<string, unknown>;
      }
    } catch {
      const fallbackSnap = await getDoc(configRef);
      existedOnServerBeforeWrite = fallbackSnap.exists();
      if (fallbackSnap.exists()) {
        existingServerRaw = fallbackSnap.data() as Record<string, unknown>;
      }
    }

    const mergedConfig = mergeSafeSiteConfigForSave(existingServerRaw, config, effectiveUid);

    currentStage = 'payload_validation';
    const validation = validateSiteConfigInput(mergedConfig);
    if (!validation.valid) {
      throw new Error(validation.errors[0] || 'بيانات إعدادات الموقع غير صالحة للحفظ السحابي.');
    }

    estimatedBytes = estimateJsonUtf8Bytes(mergedConfig);
    if (estimatedBytes > MAX_FIRESTORE_DOC_SAFE_BYTES) {
      throw new Error(
        `حجم مستند إعدادات الموقع (${estimatedBytes} بايت) يتجاوز الحد الآمن المسموح به في Firestore.`
      );
    }

    const targetedFields = buildTargetedSiteConfigUpdateFields(
      existingServerRaw,
      mergedConfig,
      effectiveUid
    );
    const firestorePayload: Record<string, unknown> = {
      ...targetedFields,
      id: 'main',
      updatedBy: effectiveUid,
      updatedAt: serverTimestamp(),
    };
    fieldCount = Object.keys(firestorePayload).length;

    currentStage = 'firestore_write';
    await executeWriteWithAuthRebindRetry(verifiedUser, () =>
      setDoc(configRef, firestorePayload, { merge: true })
    );

    currentStage = 'server_readback_confirm';
    const serverSnap = await getDocFromServer(configRef);
    if (!serverSnap.exists()) {
      throw new Error('لم يتم العثور على المستند siteConfig/main على الخادم بعد عملية الحفظ.');
    }
    return mapSnapshotToSiteConfig(serverSnap.data() as Record<string, unknown>);
  } catch (error) {
    logSafeCloudWriteDiagnostic({
      operationName: 'saveCloudSiteConfig',
      operationType: OperationType.WRITE,
      targetPath: path,
      failedStage: currentStage,
      error,
      payloadMeta: {
        estimatedBytes,
        fieldCount,
        existedOnServerBeforeWrite,
      },
    });
    handleFirestoreError(error, OperationType.WRITE, path, {
      operationName: 'saveCloudSiteConfig',
      failedStage: currentStage,
    });
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
  assertFirebaseProjectConnectionReady();
  const normalizedEmail = email.trim().toLowerCase();
  if (
    isAuthorizedDeveloperUid(email) ||
    isAuthorizedDeveloperUid(password)
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

    await result.user.getIdToken(true);
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
    categoryId: sanitized.categoryId,
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
  const productRef = doc(db, 'products', productId);
  let snap;
  try {
    snap = await getDocFromServer(productRef);
  } catch {
    snap = await getDoc(productRef);
  }
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
  let currentStage: CloudWriteStage = 'config_validation';
  let path = customId ? `products/${customId}` : 'products/pending';

  try {
    const verifiedUser = await prepareVerifiedDeveloperCloudWrite((stage) => {
      currentStage = stage;
    });
    currentStage = 'payload_validation';
    const sanitized = sanitizeProductPayload(input, customId, verifiedUser.uid || authorUid);
    path = `products/${sanitized.id}`;
    const productRef = doc(db, 'products', sanitized.id);
    const record = buildFirestoreProductRecord(sanitized, serverTimestamp());

    currentStage = 'firestore_write';
    await executeWriteWithAuthRebindRetry(verifiedUser, () => setDoc(productRef, record));

    currentStage = 'server_readback_confirm';
    const serverSnap = await getDocFromServer(productRef);
    if (!serverSnap.exists()) {
      throw new Error(`لم يتم العثور على المنتج (${sanitized.id}) على الخادم بعد الحفظ.`);
    }
    return mapDocToProduct(serverSnap.id, serverSnap.data() as Record<string, unknown>);
  } catch (error) {
    logSafeCloudWriteDiagnostic({
      operationName: 'createCloudProduct',
      operationType: OperationType.CREATE,
      targetPath: path,
      failedStage: currentStage,
      error,
    });
    handleFirestoreError(error, OperationType.CREATE, path, {
      operationName: 'createCloudProduct',
      failedStage: currentStage,
    });
  }
}

export async function updateCloudProduct(
  productId: string,
  input: ProductFormInput,
  existingAuthorUid: string
): Promise<Product> {
  const path = `products/${productId}`;
  let currentStage: CloudWriteStage = 'config_validation';

  try {
    const verifiedUser = await prepareVerifiedDeveloperCloudWrite((stage) => {
      currentStage = stage;
    });
    const productRef = doc(db, 'products', productId);

    currentStage = 'pre_write_server_merge';
    const { preservedAuthorUid, preservedCreatedAt } =
      await resolveExistingProductImmutableMeta(
        productId,
        SAFE_ID_REGEX.test(existingAuthorUid) ? existingAuthorUid : verifiedUser.uid
      );

    currentStage = 'payload_validation';
    const sanitized = sanitizeProductPayload(input, productId, preservedAuthorUid);
    const record = buildFirestoreProductRecord(sanitized, preservedCreatedAt);

    currentStage = 'firestore_write';
    await executeWriteWithAuthRebindRetry(verifiedUser, () => setDoc(productRef, record));

    currentStage = 'server_readback_confirm';
    const serverSnap = await getDocFromServer(productRef);
    if (!serverSnap.exists()) {
      throw new Error(`لم يتم تأكيد تحديث المنتج (${productId}) على الخادم.`);
    }
    return mapDocToProduct(serverSnap.id, serverSnap.data() as Record<string, unknown>);
  } catch (error) {
    logSafeCloudWriteDiagnostic({
      operationName: 'updateCloudProduct',
      operationType: OperationType.UPDATE,
      targetPath: path,
      failedStage: currentStage,
      error,
    });
    handleFirestoreError(error, OperationType.UPDATE, path, {
      operationName: 'updateCloudProduct',
      failedStage: currentStage,
    });
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
): Promise<Product> {
  const path = `products/${productId}`;
  let currentStage: CloudWriteStage = 'config_validation';

  try {
    const verifiedUser = await prepareVerifiedDeveloperCloudWrite((stage) => {
      currentStage = stage;
    });
    const productRef = doc(db, 'products', productId);

    currentStage = 'pre_write_server_merge';
    const { existingProduct, preservedAuthorUid, preservedCreatedAt } =
      await resolveExistingProductImmutableMeta(productId, verifiedUser.uid);
    if (!existingProduct) {
      throw new Error('المنتج المطلوب تحديث خصمه غير موجود في قاعدة البيانات.');
    }

    currentStage = 'payload_validation';
    const mergedInput: ProductFormInput = {
      id: productId,
      name: existingProduct.name,
      brand: existingProduct.brand,
      category: existingProduct.category,
      categoryId: existingProduct.categoryId,
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
    const record = buildFirestoreProductRecord(sanitized, preservedCreatedAt);

    currentStage = 'firestore_write';
    await executeWriteWithAuthRebindRetry(verifiedUser, () => setDoc(productRef, record));

    currentStage = 'server_readback_confirm';
    const serverSnap = await getDocFromServer(productRef);
    if (!serverSnap.exists()) {
      throw new Error(`لم يتم تأكيد حفظ خصم المنتج (${productId}) على الخادم.`);
    }
    return mapDocToProduct(serverSnap.id, serverSnap.data() as Record<string, unknown>);
  } catch (error) {
    logSafeCloudWriteDiagnostic({
      operationName: 'updateCloudProductDiscount',
      operationType: OperationType.UPDATE,
      targetPath: path,
      failedStage: currentStage,
      error,
    });
    handleFirestoreError(error, OperationType.UPDATE, path, {
      operationName: 'updateCloudProductDiscount',
      failedStage: currentStage,
    });
  }
}

export async function updateCloudProductFlags(
  productId: string,
  updates: Partial<Pick<Product, 'isPublished' | 'inStock' | 'isFeatured'>>
): Promise<Product> {
  const path = `products/${productId}`;
  let currentStage: CloudWriteStage = 'config_validation';

  try {
    const verifiedUser = await prepareVerifiedDeveloperCloudWrite((stage) => {
      currentStage = stage;
    });
    const productRef = doc(db, 'products', productId);

    currentStage = 'pre_write_server_merge';
    const { existingProduct, preservedAuthorUid, preservedCreatedAt } =
      await resolveExistingProductImmutableMeta(productId, verifiedUser.uid);
    if (!existingProduct) {
      throw new Error('المنتج المطلوب تحديث حالته غير موجود في قاعدة البيانات.');
    }

    currentStage = 'payload_validation';
    const mergedInput: ProductFormInput = {
      id: productId,
      name: existingProduct.name,
      brand: existingProduct.brand,
      category: existingProduct.category,
      categoryId: existingProduct.categoryId,
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
    const record = buildFirestoreProductRecord(sanitized, preservedCreatedAt);

    currentStage = 'firestore_write';
    await executeWriteWithAuthRebindRetry(verifiedUser, () => setDoc(productRef, record));

    currentStage = 'server_readback_confirm';
    const serverSnap = await getDocFromServer(productRef);
    if (!serverSnap.exists()) {
      throw new Error(`لم يتم تأكيد تحديث حالة المنتج (${productId}) على الخادم.`);
    }
    return mapDocToProduct(serverSnap.id, serverSnap.data() as Record<string, unknown>);
  } catch (error) {
    logSafeCloudWriteDiagnostic({
      operationName: 'updateCloudProductFlags',
      operationType: OperationType.UPDATE,
      targetPath: path,
      failedStage: currentStage,
      error,
    });
    handleFirestoreError(error, OperationType.UPDATE, path, {
      operationName: 'updateCloudProductFlags',
      failedStage: currentStage,
    });
  }
}

export async function deleteCloudProduct(productId: string): Promise<void> {
  const path = `products/${productId}`;
  let currentStage: CloudWriteStage = 'config_validation';

  try {
    const verifiedUser = await prepareVerifiedDeveloperCloudWrite((stage) => {
      currentStage = stage;
    });
    const productRef = doc(db, 'products', productId);

    currentStage = 'firestore_write';
    await executeWriteWithAuthRebindRetry(verifiedUser, () => deleteDoc(productRef));

    currentStage = 'server_readback_confirm';
    const serverSnap = await getDocFromServer(productRef);
    if (serverSnap.exists()) {
      throw new Error(`لم يكتمل حذف المنتج (${productId}) من الخادم السحابي.`);
    }
  } catch (error) {
    logSafeCloudWriteDiagnostic({
      operationName: 'deleteCloudProduct',
      operationType: OperationType.DELETE,
      targetPath: path,
      failedStage: currentStage,
      error,
    });
    handleFirestoreError(error, OperationType.DELETE, path, {
      operationName: 'deleteCloudProduct',
      failedStage: currentStage,
    });
  }
}
