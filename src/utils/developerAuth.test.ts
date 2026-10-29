import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import firebaseAppletConfig from '../../firebase-applet-config.json';
import {
  AUTHORIZED_DEVELOPER_EMAIL,
  AUTHORIZED_DEVELOPER_UID,
  AUTHORIZED_DEVELOPER_UIDS,
  INFINITY_CORP_DEVELOPER_EMAIL,
  INFINITY_CORP_DEVELOPER_UID,
  buildSafeDeveloperAuthDiagnostic,
  createFirebaseAuthResilientFetch,
  isAuthorizedDeveloperEmail,
  isAuthorizedDeveloperUid,
  isAuthorizedDeveloperUser,
  isPermanentAuthSessionInvalidError,
  resolveDeveloperAccessState,
  safelyInstallGlobalFetchWrapper,
  sanitizeDiagnosticText,
  translateDeveloperAuthError,
  validateDeveloperLoginInput,
  validateFirebaseWebAppConfig,
} from './developerAuth';

function collectTypeScriptFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectTypeScriptFiles(full));
    } else if (
      (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
      !entry.name.endsWith('.test.ts')
    ) {
      results.push(full);
    }
  }
  return results;
}

test('firebase-applet-config.json passes Web App validation and targets emergent-transmitter-sv8b6', () => {
  const result = validateFirebaseWebAppConfig(firebaseAppletConfig);
  assert.equal(result.valid, true, `Unexpected config errors: ${result.errors.join(', ')}`);
  assert.equal(firebaseAppletConfig.projectId, 'emergent-transmitter-sv8b6');
  assert.equal(firebaseAppletConfig.authDomain, 'emergent-transmitter-sv8b6.firebaseapp.com');

  const demoResult = validateFirebaseWebAppConfig({
    projectId: 'demo-project',
    apiKey: 'placeholder-key',
    authDomain: 'demo',
    appId: 'invalid',
  });
  assert.equal(demoResult.valid, false);
  assert.equal(demoResult.errors.length, 4);
});

test('Primary and Infinity Corp developer UIDs and emails match configured developer identities', () => {
  assert.equal(AUTHORIZED_DEVELOPER_UID, 'eGi5P37ztLe5Nn77sEFvmFFcZWp1');
  assert.equal(INFINITY_CORP_DEVELOPER_UID, 'ILSbnyLsRWXvV9n2viqoMgFyDpr2');
  assert.deepEqual(AUTHORIZED_DEVELOPER_UIDS, [
    'eGi5P37ztLe5Nn77sEFvmFFcZWp1',
    'ILSbnyLsRWXvV9n2viqoMgFyDpr2',
  ]);

  assert.equal(isAuthorizedDeveloperUid('eGi5P37ztLe5Nn77sEFvmFFcZWp1'), true);
  assert.equal(isAuthorizedDeveloperUid('  eGi5P37ztLe5Nn77sEFvmFFcZWp1  '), true);
  assert.equal(isAuthorizedDeveloperUid('ILSbnyLsRWXvV9n2viqoMgFyDpr2'), true);
  assert.equal(isAuthorizedDeveloperUid('  ILSbnyLsRWXvV9n2viqoMgFyDpr2  '), true);
  assert.equal(isAuthorizedDeveloperUid('some-other-uid-999'), false);
  assert.equal(isAuthorizedDeveloperUid(''), false);
  assert.equal(isAuthorizedDeveloperUid(null), false);

  assert.equal(AUTHORIZED_DEVELOPER_EMAIL, 'abdulazizriadvip@gmail.com');
  assert.equal(INFINITY_CORP_DEVELOPER_EMAIL, 'companycamerasinfinitycorp@gmail.com');
  assert.equal(isAuthorizedDeveloperEmail('abdulazizriadvip@gmail.com'), true);
  assert.equal(isAuthorizedDeveloperEmail('  AbdulazizRiadVIP@Gmail.com '), true);
  assert.equal(isAuthorizedDeveloperEmail('companycamerasinfinitycorp@gmail.com'), true);
  assert.equal(isAuthorizedDeveloperEmail('  CompanyCamerasInfinityCorp@Gmail.com '), true);
  assert.equal(isAuthorizedDeveloperEmail('intruder@gmail.com'), false);
  assert.equal(isAuthorizedDeveloperEmail(''), false);
  assert.equal(isAuthorizedDeveloperEmail(null), false);
});

test('isAuthorizedDeveloperUser authorizes both primary and Infinity Corp UIDs and never relies on email alone without verification', () => {
  // Primary developer UID authorized even if emailVerified is false
  assert.equal(
    isAuthorizedDeveloperUser({
      uid: 'eGi5P37ztLe5Nn77sEFvmFFcZWp1',
      email: 'abdulazizriadvip@gmail.com',
      emailVerified: false,
    }),
    true
  );

  // Infinity Corp developer UID authorized with emailVerified false or true
  assert.equal(
    isAuthorizedDeveloperUser({
      uid: 'ILSbnyLsRWXvV9n2viqoMgFyDpr2',
      email: 'companycamerasinfinitycorp@gmail.com',
      emailVerified: false,
    }),
    true
  );
  assert.equal(
    isAuthorizedDeveloperUser({
      uid: 'ILSbnyLsRWXvV9n2viqoMgFyDpr2',
      email: 'companycamerasinfinitycorp@gmail.com',
      emailVerified: true,
    }),
    true
  );

  // Email alone with mismatched UID and emailVerified: false MUST be rejected
  assert.equal(
    isAuthorizedDeveloperUser({
      uid: 'spoof-uid-123',
      email: 'abdulazizriadvip@gmail.com',
      emailVerified: false,
    }),
    false
  );
  assert.equal(
    isAuthorizedDeveloperUser({
      uid: 'spoof-uid-888',
      email: 'companycamerasinfinitycorp@gmail.com',
      emailVerified: false,
    }),
    false
  );

  assert.equal(
    isAuthorizedDeveloperUser({
      uid: 'owner-uid-456',
      email: 'mohamed.m.alhasaneen@gmail.com',
      emailVerified: true,
    }),
    true
  );

  assert.equal(
    isAuthorizedDeveloperUser({
      uid: 'visitor-uid-789',
      email: 'visitor@gmail.com',
      emailVerified: true,
    }),
    false
  );
});

test('validateDeveloperLoginInput enforces email format, non-empty password, and blocks any developer UID used as password or login substitute', () => {
  const emptyBoth = validateDeveloperLoginInput('', '');
  assert.equal(emptyBoth.valid, false);
  assert.ok(emptyBoth.error?.includes('البريد الإلكتروني'));

  const uidAsPassword = validateDeveloperLoginInput(
    'abdulazizriadvip@gmail.com',
    AUTHORIZED_DEVELOPER_UID
  );
  assert.equal(uidAsPassword.valid, false);
  assert.ok(uidAsPassword.error?.includes('UID'));

  const infinityUidAsPassword = validateDeveloperLoginInput(
    'companycamerasinfinitycorp@gmail.com',
    INFINITY_CORP_DEVELOPER_UID
  );
  assert.equal(infinityUidAsPassword.valid, false);
  assert.ok(infinityUidAsPassword.error?.includes('UID'));

  const uidAsEmail = validateDeveloperLoginInput(AUTHORIZED_DEVELOPER_UID, 'AnySecretPass!');
  assert.equal(uidAsEmail.valid, false);
  assert.ok(uidAsEmail.error?.includes('UID'));

  const infinityUidAsEmail = validateDeveloperLoginInput(
    INFINITY_CORP_DEVELOPER_UID,
    'AnySecretPass!'
  );
  assert.equal(infinityUidAsEmail.valid, false);
  assert.ok(infinityUidAsEmail.error?.includes('UID'));

  const badEmail = validateDeveloperLoginInput('not-an-email', 'secret');
  assert.equal(badEmail.valid, false);
  assert.ok(badEmail.error?.includes('صيغة البريد'));

  const missingPassword = validateDeveloperLoginInput('abdulazizriadvip@gmail.com', '');
  assert.equal(missingPassword.valid, false);
  assert.ok(missingPassword.error?.includes('كلمة المرور'));

  const valid = validateDeveloperLoginInput('  AbdulazizRiadVIP@gmail.com  ', 'OwnerChosenPass!');
  assert.equal(valid.valid, true);
  assert.equal(valid.normalizedEmail, 'abdulazizriadvip@gmail.com');
  assert.equal(valid.error, undefined);

  const validInfinity = validateDeveloperLoginInput(
    '  CompanyCamerasInfinityCorp@gmail.com  ',
    'PartnerChosenPass!'
  );
  assert.equal(validInfinity.valid, true);
  assert.equal(validInfinity.normalizedEmail, 'companycamerasinfinitycorp@gmail.com');
  assert.equal(validInfinity.error, undefined);
});

test('resolveDeveloperAccessState strictly blocks unauthenticated, unauthorized, and unverified non-UID sessions while authorizing both developer UIDs', () => {
  assert.equal(resolveDeveloperAccessState(null, false), 'checking');
  assert.equal(resolveDeveloperAccessState(null, true), 'unauthenticated');

  assert.equal(
    resolveDeveloperAccessState(
      { uid: 'u1', email: 'other@gmail.com', emailVerified: true },
      true
    ),
    'unauthorized_account'
  );

  assert.equal(
    resolveDeveloperAccessState(
      { uid: 'eGi5P37ztLe5Nn77sEFvmFFcZWp1', email: 'any@gmail.com', emailVerified: false },
      true
    ),
    'authorized'
  );

  assert.equal(
    resolveDeveloperAccessState(
      {
        uid: 'ILSbnyLsRWXvV9n2viqoMgFyDpr2',
        email: 'companycamerasinfinitycorp@gmail.com',
        emailVerified: false,
      },
      true
    ),
    'authorized'
  );

  assert.equal(
    resolveDeveloperAccessState(
      { uid: 'u2', email: 'abdulazizriadvip@gmail.com', emailVerified: false },
      true
    ),
    'unverified_email'
  );

  assert.equal(
    resolveDeveloperAccessState(
      { uid: 'u3', email: 'companycamerasinfinitycorp@gmail.com', emailVerified: false },
      true
    ),
    'unverified_email'
  );

  assert.equal(
    resolveDeveloperAccessState(
      { uid: 'u2', email: 'abdulazizriadvip@gmail.com', emailVerified: true },
      true
    ),
    'authorized'
  );

  assert.equal(
    resolveDeveloperAccessState(
      { uid: 'u3', email: 'companycamerasinfinitycorp@gmail.com', emailVerified: true },
      true
    ),
    'authorized'
  );
});

test('translateDeveloperAuthError classifies all Firebase Auth errors accurately and distinguishes online vs offline network failures', () => {
  assert.ok(
    translateDeveloperAuthError({ code: 'auth/invalid-credential' }).includes(
      'البريد الإلكتروني أو كلمة المرور غير صحيحة'
    )
  );
  assert.ok(
    translateDeveloperAuthError({ code: 'auth/invalid-api-key' }).includes('apiKey')
  );
  assert.ok(
    translateDeveloperAuthError({
      code: 'auth/requests-from-referer-https://example.com-are-blocked.',
    }).includes('HTTP Referrer')
  );
  assert.ok(
    translateDeveloperAuthError({ code: 'auth/unauthorized-domain' }).includes(
      'Authorized domains'
    )
  );
  assert.ok(
    translateDeveloperAuthError({ code: 'auth/operation-not-allowed' }).includes(
      'Email/Password'
    )
  );
  assert.ok(
    translateDeveloperAuthError({ code: 'auth/too-many-requests' }).includes(
      'تم حظر المحاولات مؤقتًا'
    )
  );
  assert.ok(
    translateDeveloperAuthError({ code: 'auth/user-disabled' }).includes('تم إيقاف هذا الحساب')
  );
  assert.ok(
    translateDeveloperAuthError({ code: 'auth/unauthorized-developer-account' }).includes(
      'غير مصرح'
    )
  );
  assert.ok(
    translateDeveloperAuthError({ code: 'auth/uid-used-as-password' }).includes('UID')
  );

  // Online browser with blocked Firebase Auth endpoint must NOT falsely claim device has no internet
  const onlineNetworkMsg = translateDeveloperAuthError(
    { code: 'auth/network-request-failed' },
    { browserOnline: true }
  );
  assert.ok(onlineNetworkMsg.includes('رغم وجود اتصال بالإنترنت'));
  assert.equal(onlineNetworkMsg.includes('لا يوجد اتصال بالإنترنت على جهازك'), false);

  // Genuinely offline browser reports offline device state
  const offlineNetworkMsg = translateDeveloperAuthError(
    { code: 'auth/network-request-failed' },
    { browserOnline: false }
  );
  assert.ok(offlineNetworkMsg.includes('لا يوجد اتصال بالإنترنت على جهازك'));
});

test('diagnostic logging redacts API keys, passwords, and tokens while preserving error codes', () => {
  const rawLeak =
    'Request to https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyBnzOEbkxGfezgiVW6iP-mA9hCblajdJfQ failed with {"password":"MySuperSecretPassword!","idToken":"eyJhbGciOi...","refreshToken":"AMf-vBx..."}';
  const cleaned = sanitizeDiagnosticText(rawLeak);
  assert.equal(cleaned.includes('MySuperSecretPassword!'), false);
  assert.equal(cleaned.includes('AIzaSyBnzOEbkxGfezgiVW6iP'), false);
  assert.equal(cleaned.includes('eyJhbGciOi'), false);
  assert.equal(cleaned.includes('AMf-vBx'), false);
  assert.ok(cleaned.includes('[REDACTED]'));

  const diag = buildSafeDeveloperAuthDiagnostic(
    'signInWithEmailAndPassword',
    { code: 'auth/network-request-failed', message: rawLeak },
    {
      projectId: 'emergent-transmitter-sv8b6',
      authDomain: 'emergent-transmitter-sv8b6.firebaseapp.com',
    },
    {
      origin: 'https://ais-dev-example.run.app',
      hostname: 'ais-dev-example.run.app',
      isEmbeddedIframe: true,
      browserOnline: true,
    }
  );
  assert.equal(diag.code, 'auth/network-request-failed');
  assert.equal(diag.projectId, 'emergent-transmitter-sv8b6');
  assert.equal(diag.isEmbeddedIframe, true);
  assert.equal(diag.message.includes('MySuperSecretPassword!'), false);
});

test('isPermanentAuthSessionInvalidError only flags revoked/disabled accounts, not transient network blips', () => {
  assert.equal(isPermanentAuthSessionInvalidError({ code: 'auth/network-request-failed' }), false);
  assert.equal(isPermanentAuthSessionInvalidError({ code: 'auth/internal-error' }), false);
  assert.equal(isPermanentAuthSessionInvalidError({ code: 'auth/user-disabled' }), true);
  assert.equal(isPermanentAuthSessionInvalidError({ code: 'auth/user-token-expired' }), true);
});

test('createFirebaseAuthResilientFetch passes non-Auth URLs directly and recovers via same-origin relay when direct Identity Toolkit fetch fails', async () => {
  const calls: string[] = [];
  const fallbackEvents: string[] = [];

  const mockNativeFetch: typeof fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    calls.push(url);

    if (url.startsWith('https://identitytoolkit.googleapis.com/')) {
      throw new TypeError('Failed to fetch');
    }

    if (url === '/api/firebase-auth-relay') {
      const payload = JSON.parse(String(init?.body || '{}')) as { targetUrl: string };
      assert.ok(payload.targetUrl.startsWith('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword'));
      return new Response(
        JSON.stringify({
          error: { code: 400, message: 'INVALID_LOGIN_CREDENTIALS' },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };

  const resilientFetch = createFirebaseAuthResilientFetch(mockNativeFetch, {
    relayEndpoint: '/api/firebase-auth-relay',
    onRelayFallback: ({ endpointPath }) => fallbackEvents.push(endpointPath),
  });

  // 1. Non-Firebase URLs go straight through untouched
  const healthRes = await resilientFetch('https://example.com/api/health');
  assert.equal(healthRes.status, 200);
  assert.equal(fallbackEvents.length, 0);

  // 2. Blocked Identity Toolkit request automatically falls back to same-origin relay and returns real upstream HTTP 400 JSON
  const authRes = await resilientFetch(
    'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaTestKey123456789012345678901234',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'wrong', returnSecureToken: true }),
    }
  );
  assert.equal(authRes.status, 400);
  const authJson = (await authRes.json()) as { error: { message: string } };
  assert.equal(authJson.error.message, 'INVALID_LOGIN_CREDENTIALS');
  assert.deepEqual(fallbackEvents, ['/v1/accounts:signInWithPassword']);
});

test('security audit: frontend codebase contains no public sign-up APIs and no hardcoded passwords', () => {
  const srcFiles = collectTypeScriptFiles(path.join(process.cwd(), 'src'));
  assert.ok(srcFiles.length > 0);

  const legacyLeakedSecret = String.fromCharCode(
    87, 81, 40, 56, 41, 64, 111, 112, 110, 75, 76, 79, 90, 36, 56, 48, 64, 71, 104
  );

  for (const filePath of srcFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    assert.equal(
      content.includes('createUserWithEmailAndPassword'),
      false,
      `Forbidden public account creation API found in ${filePath}`
    );
    assert.equal(
      content.includes(legacyLeakedSecret),
      false,
      `Plaintext password must never appear in ${filePath}`
    );
    assert.equal(
      /ADMIN_PASSWORD\s*=/.test(content),
      false,
      `Hardcoded ADMIN_PASSWORD constant found in ${filePath}`
    );
    assert.equal(
      /\b(window|globalThis|self)\.fetch\s*=[^=]/.test(content),
      false,
      `Unsafe direct fetch assignment found in ${filePath}; use safelyInstallGlobalFetchWrapper instead`
    );
  }
});

test('safelyInstallGlobalFetchWrapper handles getter-only, inherited, and locked non-configurable fetch descriptors without throwing', async () => {
  // 1. Exact preview iframe scenario: own getter-only property (`set: undefined`, `configurable: true`)
  let getterInvocations = 0;
  const baseFetch: typeof fetch = async () => {
    getterInvocations += 1;
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };

  const getterOnlyWindow: Record<string, unknown> = {};
  Object.defineProperty(getterOnlyWindow, 'fetch', {
    configurable: true,
    enumerable: true,
    get() {
      return baseFetch;
    },
  });

  // Confirm direct assignment in strict mode WOULD throw the exact reported TypeError
  assert.throws(() => {
    (getterOnlyWindow as { fetch: unknown }).fetch = baseFetch;
  }, TypeError);

  let wrapperCalls = 0;
  const firstInstall = safelyInstallGlobalFetchWrapper(getterOnlyWindow, (boundNative) => {
    return async (input, init) => {
      wrapperCalls += 1;
      return boundNative(input, init);
    };
  });

  assert.equal(firstInstall.installedOnGlobal, true);
  assert.equal(typeof firstInstall.resilientFetch, 'function');

  const installedFn = getterOnlyWindow.fetch as typeof fetch;
  const res = await installedFn('https://example.com/ping');
  assert.equal(res.status, 200);
  assert.equal(wrapperCalls, 1);
  assert.equal(getterInvocations, 1);

  // Idempotent second call must not double-wrap
  const secondInstall = safelyInstallGlobalFetchWrapper(getterOnlyWindow, (boundNative) => {
    return async (input, init) => {
      wrapperCalls += 100;
      return boundNative(input, init);
    };
  });
  assert.equal(secondInstall.installedOnGlobal, true);
  await (getterOnlyWindow.fetch as typeof fetch)('https://example.com/ping2');
  assert.equal(wrapperCalls, 2);

  // 2. Prototype-inherited getter-only fetch (e.g., Window.prototype)
  const protoWithGetterOnlyFetch: Record<string, unknown> = {};
  Object.defineProperty(protoWithGetterOnlyFetch, 'fetch', {
    configurable: true,
    get: () => baseFetch,
  });
  const inheritedWindow = Object.create(protoWithGetterOnlyFetch) as Record<string, unknown>;
  const protoInstall = safelyInstallGlobalFetchWrapper(inheritedWindow, (boundNative) => boundNative);
  assert.equal(protoInstall.installedOnGlobal, true);
  assert.equal(typeof inheritedWindow.fetch, 'function');

  // 3. Locked non-configurable getter-only fetch (`configurable: false`, `set: undefined`)
  const lockedWindow: Record<string, unknown> = {};
  Object.defineProperty(lockedWindow, 'fetch', {
    configurable: false,
    enumerable: true,
    get: () => baseFetch,
  });
  const lockedInstall = safelyInstallGlobalFetchWrapper(lockedWindow, (boundNative) =>
    createFirebaseAuthResilientFetch(boundNative)
  );
  assert.equal(lockedInstall.installedOnGlobal, false);
  assert.equal(typeof lockedInstall.resilientFetch, 'function');
  assert.equal(lockedWindow.fetch, baseFetch);
});

