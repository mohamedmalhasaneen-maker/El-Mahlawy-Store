export const AUTHORIZED_DEVELOPER_UID = 'eGi5P37ztLe5Nn77sEFvmFFcZWp1';
export const AUTHORIZED_DEVELOPER_EMAIL = 'abdulazizriadvip@gmail.com';
export const BOOTSTRAPPED_OWNER_EMAIL = 'mohamed.m.alhasaneen@gmail.com';

export const ALLOWED_DEVELOPER_EMAILS: readonly string[] = [
  AUTHORIZED_DEVELOPER_EMAIL,
  BOOTSTRAPPED_OWNER_EMAIL,
];

const SIMPLE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ALLOWED_FIREBASE_AUTH_UPSTREAM_ORIGINS = new Set([
  'https://identitytoolkit.googleapis.com',
  'https://securetoken.googleapis.com',
]);

export type DeveloperAccessState =
  | 'checking'
  | 'unauthenticated'
  | 'unauthorized_account'
  | 'unverified_email'
  | 'authorized';

export interface DeveloperAuthUserSnapshot {
  uid: string;
  email?: string | null;
  emailVerified?: boolean;
}

export interface DeveloperLoginValidationResult {
  valid: boolean;
  normalizedEmail: string;
  error?: string;
}

export interface FirebaseWebAppConfigShape {
  projectId?: string;
  appId?: string;
  apiKey?: string;
  authDomain?: string;
  firestoreDatabaseId?: string;
}

export interface FirebaseConfigValidationResult {
  valid: boolean;
  errors: string[];
}

export interface SafeFirebaseAuthDiagnostic {
  operation: string;
  code: string;
  message: string;
  projectId: string;
  authDomain: string;
  currentOrigin: string;
  currentHostname: string;
  isEmbeddedIframe: boolean;
  browserOnline: boolean;
}

export function validateFirebaseWebAppConfig(
  config: FirebaseWebAppConfigShape | null | undefined
): FirebaseConfigValidationResult {
  const errors: string[] = [];
  if (!config || typeof config !== 'object') {
    return { valid: false, errors: ['ملف إعدادات Firebase غير موجود أو غير صالح.'] };
  }

  const projectId = (config.projectId ?? '').trim();
  const apiKey = (config.apiKey ?? '').trim();
  const authDomain = (config.authDomain ?? '').trim();
  const appId = (config.appId ?? '').trim();

  if (
    !projectId ||
    /^(demo|test|placeholder|your[-_])/i.test(projectId)
  ) {
    errors.push('معرّف مشروع Firebase (projectId) مفقود أو يحتوي على قيمة تجريبية.');
  }

  if (
    !apiKey ||
    !apiKey.startsWith('AIza') ||
    apiKey.length < 30 ||
    /placeholder|your[-_]/i.test(apiKey)
  ) {
    errors.push('مفتاح Firebase Web API (apiKey) غير صالح أو مفقود.');
  }

  if (
    !authDomain ||
    !authDomain.includes('.') ||
    /^(demo|placeholder|your[-_])/i.test(authDomain)
  ) {
    errors.push('نطاق المصادقة (authDomain) غير صالح أو مفقود.');
  }

  if (!appId || !/^\d+:\d+:web:[a-zA-Z0-9]+$/.test(appId)) {
    errors.push('معرّف تطبيق الويب (appId) غير صالح أو مفقود.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function sanitizeDiagnosticText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/key=AIza[0-9A-Za-z\-_]+/g, 'key=[REDACTED]')
    .replace(/AIza[0-9A-Za-z\-_]{20,}/g, '[REDACTED_API_KEY]')
    .replace(/"password"\s*:\s*"[^"]*"/gi, '"password":"[REDACTED]"')
    .replace(/"idToken"\s*:\s*"[^"]*"/gi, '"idToken":"[REDACTED]"')
    .replace(/"refreshToken"\s*:\s*"[^"]*"/gi, '"refreshToken":"[REDACTED]"')
    .replace(/oobCode=[^&\s]+/gi, 'oobCode=[REDACTED]')
    .slice(0, 500);
}

export function extractFirebaseAuthErrorDetails(error: unknown): {
  code: string;
  sanitizedMessage: string;
} {
  const errObj = error as {
    code?: unknown;
    message?: unknown;
    customData?: { message?: unknown; _tokenResponse?: { error?: { message?: unknown } } };
  } | null;

  const code = typeof errObj?.code === 'string' ? errObj.code.trim() : '';
  const baseMessage =
    error instanceof Error
      ? error.message
      : typeof errObj?.message === 'string'
        ? errObj.message
        : String(error ?? '');
  const nestedMessage =
    typeof errObj?.customData?.message === 'string'
      ? errObj.customData.message
      : typeof errObj?.customData?._tokenResponse?.error?.message === 'string'
        ? errObj.customData._tokenResponse.error.message
        : '';

  const combined = nestedMessage ? `${baseMessage} | ${nestedMessage}` : baseMessage;
  return {
    code: sanitizeDiagnosticText(code || 'unknown'),
    sanitizedMessage: sanitizeDiagnosticText(combined),
  };
}

export function buildSafeDeveloperAuthDiagnostic(
  operation: string,
  error: unknown,
  config: { projectId: string; authDomain: string },
  envOverride?: {
    origin?: string;
    hostname?: string;
    isEmbeddedIframe?: boolean;
    browserOnline?: boolean;
  }
): SafeFirebaseAuthDiagnostic {
  const { code, sanitizedMessage } = extractFirebaseAuthErrorDetails(error);

  const hasWindow = typeof window !== 'undefined';
  const currentOrigin =
    envOverride?.origin ?? (hasWindow ? window.location.origin : 'server');
  const currentHostname =
    envOverride?.hostname ?? (hasWindow ? window.location.hostname : 'localhost');

  let isEmbeddedIframe = false;
  if (typeof envOverride?.isEmbeddedIframe === 'boolean') {
    isEmbeddedIframe = envOverride.isEmbeddedIframe;
  } else if (hasWindow) {
    try {
      isEmbeddedIframe = window.self !== window.top;
    } catch {
      isEmbeddedIframe = true;
    }
  }

  const browserOnline =
    typeof envOverride?.browserOnline === 'boolean'
      ? envOverride.browserOnline
      : typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
        ? navigator.onLine
        : true;

  return {
    operation,
    code,
    message: sanitizedMessage,
    projectId: config.projectId,
    authDomain: config.authDomain,
    currentOrigin,
    currentHostname,
    isEmbeddedIframe,
    browserOnline,
  };
}

export function logSafeDeveloperAuthDiagnostic(
  operation: string,
  error: unknown,
  config: { projectId: string; authDomain: string }
): SafeFirebaseAuthDiagnostic {
  const diagnostic = buildSafeDeveloperAuthDiagnostic(operation, error, config);
  console.error('[DeveloperAuth]', diagnostic);
  return diagnostic;
}

export function isFirebaseAuthUpstreamUrl(targetUrl: string): boolean {
  try {
    const parsed = new URL(targetUrl);
    return ALLOWED_FIREBASE_AUTH_UPSTREAM_ORIGINS.has(parsed.origin);
  } catch {
    return false;
  }
}

export function createFirebaseAuthResilientFetch(
  nativeFetch: typeof fetch,
  options?: {
    relayEndpoint?: string;
    directTimeoutMs?: number;
    onRelayFallback?: (info: { endpointPath: string; reason: string }) => void;
  }
): typeof fetch {
  const relayEndpoint = options?.relayEndpoint ?? '/api/firebase-auth-relay';
  const directTimeoutMs = options?.directTimeoutMs ?? 8000;

  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const targetUrl =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    if (!isFirebaseAuthUpstreamUrl(targetUrl)) {
      return nativeFetch(input, init);
    }

    try {
      if (!init?.signal && typeof AbortController !== 'undefined') {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), directTimeoutMs);
        try {
          return await nativeFetch(input, { ...init, signal: controller.signal });
        } finally {
          clearTimeout(timer);
        }
      }
      return await nativeFetch(input, init);
    } catch (directErr) {
      // Only fall back to same-origin relay when running in browser and not aborted by caller
      if (init?.signal?.aborted) {
        throw directErr;
      }

      let parsedUrl: URL;
      try {
        parsedUrl = new URL(targetUrl);
      } catch {
        throw directErr;
      }

      options?.onRelayFallback?.({
        endpointPath: parsedUrl.pathname,
        reason: sanitizeDiagnosticText(
          directErr instanceof Error ? directErr.message : String(directErr)
        ),
      });

      const forwardedHeaders: Record<string, string> = {};
      if (init?.headers) {
        if (init.headers instanceof Headers) {
          init.headers.forEach((val, key) => {
            forwardedHeaders[key] = val;
          });
        } else if (Array.isArray(init.headers)) {
          for (const [key, val] of init.headers) {
            forwardedHeaders[key] = val;
          }
        } else {
          for (const [key, val] of Object.entries(init.headers)) {
            if (typeof val === 'string') {
              forwardedHeaders[key] = val;
            }
          }
        }
      }

      const bodyString =
        typeof init?.body === 'string'
          ? init.body
          : init?.body instanceof URLSearchParams
            ? init.body.toString()
            : undefined;

      try {
        const relayResponse = await nativeFetch(relayEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            targetUrl,
            method: init?.method || 'POST',
            headers: forwardedHeaders,
            body: bodyString,
          }),
        });

        // If relay endpoint itself is missing (404) or gateway-unavailable (502/504), surface original error
        if (relayResponse.status === 404 || relayResponse.status === 502 || relayResponse.status === 504) {
          throw directErr;
        }

        return relayResponse;
      } catch {
        throw directErr;
      }
    }
  };
}

const WRAPPED_RESILIENT_FETCHES = new WeakSet<object>();

export interface GlobalFetchInstallResult {
  installedOnGlobal: boolean;
  resilientFetch: typeof fetch | null;
}

/**
 * Safely installs a fetch wrapper onto a global object (such as `window`) without using
 * direct `=` assignment when `fetch` is defined as a getter-only accessor property
 * (which otherwise throws `TypeError: Cannot set property fetch of #<Window> which has only a getter`
 * in strict ES modules, e.g. inside instrumented preview iframes).
 */
export function safelyInstallGlobalFetchWrapper(
  targetGlobal: Record<string, unknown> | null | undefined,
  wrapFetch: (boundNativeFetch: typeof fetch) => typeof fetch
): GlobalFetchInstallResult {
  if (
    !targetGlobal ||
    (typeof targetGlobal !== 'object' && typeof targetGlobal !== 'function')
  ) {
    return { installedOnGlobal: false, resilientFetch: null };
  }

  let rawFetch: unknown;
  try {
    rawFetch = targetGlobal.fetch;
  } catch {
    return { installedOnGlobal: false, resilientFetch: null };
  }

  if (typeof rawFetch !== 'function') {
    return { installedOnGlobal: false, resilientFetch: null };
  }

  if (WRAPPED_RESILIENT_FETCHES.has(rawFetch)) {
    return {
      installedOnGlobal: true,
      resilientFetch: rawFetch as typeof fetch,
    };
  }

  const rawFn = rawFetch as typeof fetch;
  const boundNativeFetch: typeof fetch =
    typeof rawFn.bind === 'function'
      ? (rawFn.bind(targetGlobal) as typeof fetch)
      : ((input: RequestInfo | URL, init?: RequestInit) => rawFn(input, init));

  const resilientFetch = wrapFetch(boundNativeFetch);
  WRAPPED_RESILIENT_FETCHES.add(resilientFetch);

  try {
    const ownDescriptor = Object.getOwnPropertyDescriptor(targetGlobal, 'fetch');

    if (!ownDescriptor || ownDescriptor.configurable) {
      if (!ownDescriptor && !Object.isExtensible(targetGlobal)) {
        return { installedOnGlobal: false, resilientFetch };
      }

      let activeFetch: typeof fetch = resilientFetch;
      Object.defineProperty(targetGlobal, 'fetch', {
        configurable: true,
        enumerable: ownDescriptor?.enumerable ?? true,
        get: () => activeFetch,
        set: (nextFetch: unknown) => {
          if (typeof nextFetch === 'function') {
            activeFetch = nextFetch as typeof fetch;
          }
        },
      });
      return { installedOnGlobal: true, resilientFetch };
    }

    if ('writable' in ownDescriptor && ownDescriptor.writable) {
      Object.defineProperty(targetGlobal, 'fetch', {
        value: resilientFetch,
      });
      return { installedOnGlobal: true, resilientFetch };
    }

    if (typeof ownDescriptor.set === 'function') {
      ownDescriptor.set.call(targetGlobal, resilientFetch);
      return { installedOnGlobal: true, resilientFetch };
    }

    return { installedOnGlobal: false, resilientFetch };
  } catch {
    return { installedOnGlobal: false, resilientFetch };
  }
}

export function normalizeDeveloperEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase();
}

export function isAuthorizedDeveloperEmail(email: string | null | undefined): boolean {
  const normalized = normalizeDeveloperEmail(email);
  if (!normalized) return false;
  return ALLOWED_DEVELOPER_EMAILS.some(
    (allowed) => allowed.toLowerCase() === normalized
  );
}

export function isAuthorizedDeveloperUid(uid: string | null | undefined): boolean {
  return typeof uid === 'string' && uid.trim() === AUTHORIZED_DEVELOPER_UID;
}

export function isAuthorizedDeveloperUser(
  user: DeveloperAuthUserSnapshot | null | undefined
): boolean {
  if (!user || !user.uid) return false;
  if (isAuthorizedDeveloperUid(user.uid)) {
    return true;
  }
  return Boolean(user.emailVerified) && isAuthorizedDeveloperEmail(user.email);
}

export function validateDeveloperLoginInput(
  email: string,
  password: string
): DeveloperLoginValidationResult {
  const trimmedRawEmail = (email ?? '').trim();
  const normalizedEmail = normalizeDeveloperEmail(email);
  const trimmedPassword = (password ?? '').trim();

  if (!normalizedEmail && !password) {
    return {
      valid: false,
      normalizedEmail,
      error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.',
    };
  }

  if (
    trimmedRawEmail === AUTHORIZED_DEVELOPER_UID ||
    trimmedPassword === AUTHORIZED_DEVELOPER_UID
  ) {
    return {
      valid: false,
      normalizedEmail,
      error:
        'لا يمكن استخدام معرّف الحساب (UID) ككلمة مرور أو كبديل لتسجيل الدخول. يرجى إدخال البريد الإلكتروني وكلمة المرور الخاصة بالحساب.',
    };
  }

  if (!normalizedEmail) {
    return {
      valid: false,
      normalizedEmail,
      error: 'يرجى إدخال البريد الإلكتروني لحساب المطور.',
    };
  }

  if (!SIMPLE_EMAIL_REGEX.test(normalizedEmail)) {
    return {
      valid: false,
      normalizedEmail,
      error: 'صيغة البريد الإلكتروني غير صحيحة. يرجى كتابة بريد إلكتروني سليم.',
    };
  }

  if (!password) {
    return {
      valid: false,
      normalizedEmail,
      error: 'يرجى إدخال كلمة المرور.',
    };
  }

  return {
    valid: true,
    normalizedEmail,
  };
}

export function resolveDeveloperAccessState(
  user: DeveloperAuthUserSnapshot | null,
  isAuthReady: boolean
): DeveloperAccessState {
  if (!isAuthReady) return 'checking';
  if (!user) return 'unauthenticated';
  if (isAuthorizedDeveloperUser(user)) return 'authorized';
  if (isAuthorizedDeveloperEmail(user.email) && !user.emailVerified) {
    return 'unverified_email';
  }
  return 'unauthorized_account';
}

export function isPermanentAuthSessionInvalidError(error: unknown): boolean {
  const { code, sanitizedMessage } = extractFirebaseAuthErrorDetails(error);
  const combined = `${code} ${sanitizedMessage}`.toLowerCase();
  return (
    combined.includes('auth/user-disabled') ||
    combined.includes('auth/user-not-found') ||
    combined.includes('auth/user-token-expired') ||
    combined.includes('auth/invalid-user-token') ||
    combined.includes('user_disabled') ||
    combined.includes('user_not_found') ||
    combined.includes('token_expired')
  );
}

export function translateDeveloperAuthError(
  error: unknown,
  options?: { browserOnline?: boolean }
): string {
  const { code, sanitizedMessage } = extractFirebaseAuthErrorDetails(error);
  const lowerCode = code.toLowerCase();
  const lowerMsg = sanitizedMessage.toLowerCase();

  if (
    lowerCode === 'auth/unauthorized-developer-account' ||
    lowerCode === 'auth/unauthorized-developer-email' ||
    lowerMsg.includes('unauthorized-developer-account') ||
    lowerMsg.includes('unauthorized-developer-email')
  ) {
    return 'هذا الحساب غير مصرح له بالدخول إلى إعدادات المطور (لا يطابق معرّف حساب المطور المعتمد).';
  }

  if (
    lowerCode === 'auth/uid-used-as-password' ||
    lowerMsg.includes('uid-used-as-password')
  ) {
    return 'لا يمكن استخدام معرّف الحساب (UID) ككلمة مرور.';
  }

  if (
    lowerCode === 'auth/invalid-credential' ||
    lowerCode === 'auth/wrong-password' ||
    lowerCode === 'auth/user-not-found' ||
    lowerCode === 'auth/invalid-login-credentials' ||
    lowerMsg.includes('auth/invalid-credential') ||
    lowerMsg.includes('auth/wrong-password') ||
    lowerMsg.includes('auth/user-not-found') ||
    lowerMsg.includes('invalid_login_credentials')
  ) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التأكد من البيانات والمحاولة مرة أخرى.';
  }

  if (
    lowerCode.includes('requests-from-referer') ||
    lowerMsg.includes('requests-from-referer') ||
    lowerMsg.includes('api_key_http_referrer_blocked') ||
    lowerCode === 'auth/app-not-authorized' ||
    lowerMsg.includes('auth/app-not-authorized')
  ) {
    return 'تم حظر طلب المصادقة بسبب قيود النطاق (HTTP Referrer) على مفتاح API في Google Cloud Console. يرجى السماح بنطاق الموقع الحالي في إعدادات مفتاح API.';
  }

  if (
    lowerCode === 'auth/invalid-api-key' ||
    lowerCode.includes('api-key-not-valid') ||
    lowerMsg.includes('auth/invalid-api-key') ||
    lowerMsg.includes('api-key-not-valid') ||
    lowerMsg.includes('api_key_invalid')
  ) {
    return 'مفتاح الربط مع Firebase (apiKey) غير صالح أو لا يطابق إعدادات تطبيق الويب في Firebase Console.';
  }

  if (
    lowerCode === 'auth/unauthorized-domain' ||
    lowerMsg.includes('auth/unauthorized-domain') ||
    lowerMsg.includes('unauthorized_domain')
  ) {
    return 'نطاق الموقع الحالي غير مضاف ضمن النطاقات المصرح بها (Authorized domains) في إعدادات Firebase Authentication.';
  }

  if (
    lowerCode === 'auth/operation-not-allowed' ||
    lowerMsg.includes('auth/operation-not-allowed') ||
    lowerMsg.includes('operation_not_allowed')
  ) {
    return 'تسجيل الدخول بالبريد الإلكتروني وكلمة المرور (Email/Password) غير مفعّل بعد في Firebase Console. يرجى تفعيله من قسم Authentication > Sign-in method.';
  }

  if (
    lowerCode === 'auth/user-disabled' ||
    lowerMsg.includes('auth/user-disabled') ||
    lowerMsg.includes('user_disabled')
  ) {
    return 'تم إيقاف هذا الحساب من إعدادات Firebase Authentication.';
  }

  if (
    lowerCode === 'auth/too-many-requests' ||
    lowerMsg.includes('auth/too-many-requests') ||
    lowerMsg.includes('too_many_attempts_try_later')
  ) {
    return 'تم حظر المحاولات مؤقتًا بسبب تكرار إدخال بيانات غير صحيحة. يرجى الانتظار قليلًا ثم المحاولة مرة أخرى.';
  }

  if (
    lowerCode === 'auth/invalid-email' ||
    lowerMsg.includes('auth/invalid-email') ||
    lowerMsg.includes('invalid_email')
  ) {
    return 'صيغة البريد الإلكتروني غير صحيحة.';
  }

  if (
    lowerCode === 'auth/missing-password' ||
    lowerMsg.includes('auth/missing-password')
  ) {
    return 'يرجى إدخال كلمة المرور.';
  }

  if (
    lowerCode === 'auth/network-request-failed' ||
    lowerMsg.includes('auth/network-request-failed')
  ) {
    const isOnline =
      typeof options?.browserOnline === 'boolean'
        ? options.browserOnline
        : typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
          ? navigator.onLine
          : true;

    if (!isOnline) {
      return 'لا يوجد اتصال بالإنترنت على جهازك حاليًا. يرجى التحقق من اتصال الشبكة والمحاولة مرة أخرى.';
    }

    return 'تعذر الوصول إلى خادم مصادقة Firebase (auth/network-request-failed) رغم وجود اتصال بالإنترنت. قد يكون الاتصال بنطاقات مصادقة Google محجوبًا بواسطة مانع إعلانات أو إعدادات الحماية من التتبع في المتصفح أو قيود الشبكة. يرجى تعطيل حظر التتبع لهذا الموقع أو تجربة متصفح آخر.';
  }

  return 'تعذر إتمام تسجيل الدخول. يرجى التحقق من بيانات حساب المطور وإعدادات Firebase والمحاولة مرة أخرى.';
}
