import { createFirebaseAuthResilientFetch } from '../utils/developerAuth';

export function installResilientFirebaseAuthFetch(): void {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') {
    return;
  }
  const win = window as Window & { __elmahlawyFirebaseAuthFetchInstalled?: boolean };
  if (win.__elmahlawyFirebaseAuthFetchInstalled) {
    return;
  }
  const nativeFetch = window.fetch.bind(window);
  window.fetch = createFirebaseAuthResilientFetch(nativeFetch, {
    relayEndpoint: '/api/firebase-auth-relay',
    directTimeoutMs: 8000,
    onRelayFallback: ({ endpointPath, reason }) => {
      console.warn(
        '[DeveloperAuth] Direct browser request to Firebase Auth endpoint failed; retrying via same-origin relay:',
        { endpointPath, reason }
      );
    },
  });
  win.__elmahlawyFirebaseAuthFetchInstalled = true;
}

installResilientFirebaseAuthFetch();
