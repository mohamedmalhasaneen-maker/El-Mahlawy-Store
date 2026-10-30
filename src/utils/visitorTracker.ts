import { doc, runTransaction, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db, isAuthorizedDeveloperEmail, isAuthorizedDeveloperUid, isAuthorizedDeveloperUser } from '../lib/firebase';

const DEVICE_ID_STORAGE_KEY = 'mahallawy_device_id_v1';
const DEVICE_REGISTERED_KEY = 'mahallawy_device_registered_v1';

export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server_id';
  try {
    const existing = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (existing && /^[a-zA-Z0-9_\-]{8,128}$/.test(existing)) {
      return existing;
    }
    const newId =
      'dev_' +
      Date.now().toString(36) +
      '_' +
      Math.random().toString(36).substring(2, 10) +
      Math.random().toString(36).substring(2, 8);
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, newId);
    return newId;
  } catch {
    return 'dev_fallback_' + Math.random().toString(36).substring(2, 12);
  }
}

export async function recordUniqueDeviceVisit(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // 1. Check if this browser already completed unique visit registration locally
    const isLocallyRegistered = localStorage.getItem(DEVICE_REGISTERED_KEY) === 'true';
    if (isLocallyRegistered) {
      return;
    }

    // 2. Check if the current user is an authorized developer testing the app
    const currentUser = auth.currentUser;
    if (
      isAuthorizedDeveloperUser(currentUser) ||
      isAuthorizedDeveloperUid(currentUser?.uid) ||
      isAuthorizedDeveloperEmail(currentUser?.email)
    ) {
      // Mark as registered locally so developer is never counted in public metrics
      try {
        localStorage.setItem(DEVICE_REGISTERED_KEY, 'true');
      } catch {}
      return;
    }

    const deviceId = getOrCreateDeviceId();
    const deviceRef = doc(db, 'uniqueDevices', deviceId);
    const statsRef = doc(db, 'meta', 'visitors');

    await runTransaction(db, async (transaction) => {
      const deviceSnap = await transaction.get(deviceRef);
      if (deviceSnap.exists()) {
        // Already registered in Firestore
        return;
      }

      const statsSnap = await transaction.get(statsRef);
      let currentCount = 0;
      if (statsSnap.exists() && typeof statsSnap.data()?.count === 'number') {
        currentCount = statsSnap.data().count;
      }

      const userAgentSnippet = (
        typeof navigator !== 'undefined' ? navigator.userAgent || '' : ''
      ).slice(0, 300);

      // Record unique device entry
      transaction.set(deviceRef, {
        id: deviceId,
        createdAt: serverTimestamp(),
        userAgent: userAgentSnippet,
      });

      // Increment total unique devices counter
      transaction.set(
        statsRef,
        {
          id: 'visitors',
          count: currentCount + 1,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    });

    try {
      localStorage.setItem(DEVICE_REGISTERED_KEY, 'true');
    } catch {}
  } catch (err) {
    console.warn('[VisitorTracker] Unique device registration info:', err);
  }
}

export function subscribeToVisitorStats(onUpdate: (count: number | null) => void): () => void {
  const statsRef = doc(db, 'meta', 'visitors');
  return onSnapshot(
    statsRef,
    (snap) => {
      if (snap.exists() && typeof snap.data().count === 'number') {
        onUpdate(snap.data().count);
      } else {
        onUpdate(0);
      }
    },
    (error) => {
      console.warn('[VisitorTracker] Stats snapshot listener info:', error);
      onUpdate(null);
    }
  );
}
