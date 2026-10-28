import { FetchProvider } from '@firebase/auth/internal';
import {
  createFirebaseAuthResilientFetch,
  safelyInstallGlobalFetchWrapper,
} from '../utils/developerAuth';

let firebaseAuthFetchBootstrapped = false;

export function installResilientFirebaseAuthFetch(): void {
  if (firebaseAuthFetchBootstrapped || typeof window === 'undefined') {
    return;
  }

  const { resilientFetch } = safelyInstallGlobalFetchWrapper(
    window as unknown as Record<string, unknown>,
    (boundNativeFetch) =>
      createFirebaseAuthResilientFetch(boundNativeFetch, {
        relayEndpoint: '/api/firebase-auth-relay',
        directTimeoutMs: 8000,
        onRelayFallback: ({ endpointPath, reason }) => {
          console.warn(
            '[DeveloperAuth] Direct browser request to Firebase Auth endpoint failed; retrying via same-origin relay:',
            { endpointPath, reason }
          );
        },
      })
  );

  if (resilientFetch) {
    try {
      FetchProvider.initialize(
        resilientFetch,
        typeof Headers !== 'undefined' ? Headers : undefined,
        typeof Response !== 'undefined' ? Response : undefined
      );
    } catch {
      // Safe fallback when global fetch override is already active
    }
    firebaseAuthFetchBootstrapped = true;
  }
}

installResilientFirebaseAuthFetch();
