import { doc, runTransaction, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const USER_RECORDED_SESSION_KEY = 'mahallawy_user_recorded_v1';

export async function recordAuthenticatedUserActivity(): Promise<void> {
  if (typeof window === 'undefined') return;

  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.uid) {
    // Unauthenticated visitors are not counted as verified users
    return;
  }

  try {
    const sessionKey = `${USER_RECORDED_SESSION_KEY}_${currentUser.uid}`;
    const alreadyRecordedThisSession = sessionStorage.getItem(sessionKey) === 'true';

    const userRef = doc(db, 'siteUsers', currentUser.uid);
    const statsRef = doc(db, 'meta', 'userStats');

    await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      const statsSnap = await transaction.get(statsRef);

      let totalUniqueUsers = 0;
      if (statsSnap.exists() && typeof statsSnap.data()?.totalUniqueUsers === 'number') {
        totalUniqueUsers = statsSnap.data().totalUniqueUsers;
      }

      if (!userSnap.exists()) {
        // New verified user registration
        transaction.set(userRef, {
          uid: currentUser.uid,
          email: currentUser.email || null,
          displayName: currentUser.displayName || null,
          firstActiveAt: serverTimestamp(),
          lastActiveAt: serverTimestamp(),
          activityCount: 1,
        });

        transaction.set(
          statsRef,
          {
            id: 'userStats',
            totalUniqueUsers: totalUniqueUsers + 1,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        // Existing user activity update
        const existingData = userSnap.data();
        const currentCount = typeof existingData?.activityCount === 'number' ? existingData.activityCount : 0;

        transaction.update(userRef, {
          lastActiveAt: serverTimestamp(),
          activityCount: currentCount + 1,
          email: currentUser.email || existingData?.email || null,
          displayName: currentUser.displayName || existingData?.displayName || null,
        });

        if (!statsSnap.exists()) {
          transaction.set(
            statsRef,
            {
              id: 'userStats',
              totalUniqueUsers: Math.max(1, totalUniqueUsers),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      }
    });

    try {
      sessionStorage.setItem(sessionKey, 'true');
    } catch {}
  } catch (err) {
    console.warn('[UserTracker] Activity recording info:', err);
  }
}

export function subscribeToUserStats(onUpdate: (count: number | null) => void): () => void {
  const statsRef = doc(db, 'meta', 'userStats');
  return onSnapshot(
    statsRef,
    (snap) => {
      if (snap.exists() && typeof snap.data().totalUniqueUsers === 'number') {
        onUpdate(snap.data().totalUniqueUsers);
      } else {
        onUpdate(0);
      }
    },
    (error) => {
      console.warn('[UserTracker] Stats snapshot listener info:', error);
      onUpdate(null);
    }
  );
}
