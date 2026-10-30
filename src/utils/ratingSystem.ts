import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getOrCreateDeviceId } from './visitorTracker';

export const RATING_SUBMITTED_KEY = 'mahallawy_rating_submitted_v1';
export const RATING_PROMPT_DISMISSED_KEY = 'mahallawy_rating_prompt_dismissed_v1';
export const USEFUL_ACTIVITY_COUNT_KEY = 'mahallawy_useful_activities_v1';

export interface RatingDoc {
  id: string;
  stars: number;
  recommend: boolean;
  createdAt: any;
}

export interface RatingStats {
  totalCount: number;
  totalStars: number;
  averageRating: number;
  recommendYes: number;
  recommendNo: number;
  recommendYesPercent: number;
  recommendNoPercent: number;
  starCounts: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  starPercentages: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export const EMPTY_RATING_STATS: RatingStats = {
  totalCount: 0,
  totalStars: 0,
  averageRating: 0,
  recommendYes: 0,
  recommendNo: 0,
  recommendYesPercent: 0,
  recommendNoPercent: 0,
  starCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  starPercentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
};

export function calculateRatingStats(rawDoc: any): RatingStats {
  if (!rawDoc) return EMPTY_RATING_STATS;

  const totalCount = typeof rawDoc.totalCount === 'number' ? Math.max(0, rawDoc.totalCount) : 0;
  const totalStars = typeof rawDoc.totalStars === 'number' ? Math.max(0, rawDoc.totalStars) : 0;

  const star1 = typeof rawDoc.star1 === 'number' ? Math.max(0, rawDoc.star1) : 0;
  const star2 = typeof rawDoc.star2 === 'number' ? Math.max(0, rawDoc.star2) : 0;
  const star3 = typeof rawDoc.star3 === 'number' ? Math.max(0, rawDoc.star3) : 0;
  const star4 = typeof rawDoc.star4 === 'number' ? Math.max(0, rawDoc.star4) : 0;
  const star5 = typeof rawDoc.star5 === 'number' ? Math.max(0, rawDoc.star5) : 0;

  const recommendYes = typeof rawDoc.recommendYes === 'number' ? Math.max(0, rawDoc.recommendYes) : 0;
  const recommendNo = typeof rawDoc.recommendNo === 'number' ? Math.max(0, rawDoc.recommendNo) : 0;

  const averageRating = totalCount > 0 ? Number((totalStars / totalCount).toFixed(1)) : 0;

  const recommendTotal = recommendYes + recommendNo;
  const recommendYesPercent =
    recommendTotal > 0 ? Math.round((recommendYes / recommendTotal) * 100) : 0;
  const recommendNoPercent =
    recommendTotal > 0 ? 100 - recommendYesPercent : 0;

  const calcStarPct = (count: number) => (totalCount > 0 ? Math.round((count / totalCount) * 100) : 0);

  return {
    totalCount,
    totalStars,
    averageRating,
    recommendYes,
    recommendNo,
    recommendYesPercent,
    recommendNoPercent,
    starCounts: { 1: star1, 2: star2, 3: star3, 4: star4, 5: star5 },
    starPercentages: {
      1: calcStarPct(star1),
      2: calcStarPct(star2),
      3: calcStarPct(star3),
      4: calcStarPct(star4),
      5: calcStarPct(star5),
    },
  };
}

export function isLocalRatingSubmitted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(RATING_SUBMITTED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setLocalRatingSubmitted(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RATING_SUBMITTED_KEY, 'true');
  } catch {
    // Ignore storage issues
  }
}

export async function checkDeviceRatingStatus(): Promise<{
  hasRated: boolean;
  existingRating?: RatingDoc | null;
}> {
  if (isLocalRatingSubmitted()) {
    return { hasRated: true };
  }

  const browserId = getOrCreateDeviceId();
  try {
    const ratingRef = doc(db, 'ratings', browserId);
    const snap = await getDoc(ratingRef);
    if (snap.exists()) {
      setLocalRatingSubmitted();
      const data = snap.data();
      return {
        hasRated: true,
        existingRating: {
          id: browserId,
          stars: data.stars,
          recommend: data.recommend,
          createdAt: data.createdAt,
        },
      };
    }
  } catch (err) {
    console.warn('[RatingSystem] Failed checking rating status in Firestore', err);
  }

  return { hasRated: false };
}

export async function submitVisitorRating(
  stars: number,
  recommend: boolean
): Promise<{ success: boolean; alreadyRated?: boolean; message?: string }> {
  if (stars < 1 || stars > 5) {
    throw new Error('يرجى اختيار تقييم من 1 إلى 5 نجوم.');
  }

  const browserId = getOrCreateDeviceId();
  const ratingRef = doc(db, 'ratings', browserId);
  const statsRef = doc(db, 'meta', 'ratings');

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Verify this browserId has not already submitted a rating
      const existingRatingSnap = await transaction.get(ratingRef);
      if (existingRatingSnap.exists()) {
        throw new Error('ALREADY_RATED');
      }

      // 2. Read existing aggregate stats
      const statsSnap = await transaction.get(statsRef);
      let totalCount = 0;
      let totalStars = 0;
      let star1 = 0;
      let star2 = 0;
      let star3 = 0;
      let star4 = 0;
      let star5 = 0;
      let recommendYes = 0;
      let recommendNo = 0;

      if (statsSnap.exists()) {
        const d = statsSnap.data();
        totalCount = typeof d.totalCount === 'number' ? d.totalCount : 0;
        totalStars = typeof d.totalStars === 'number' ? d.totalStars : 0;
        star1 = typeof d.star1 === 'number' ? d.star1 : 0;
        star2 = typeof d.star2 === 'number' ? d.star2 : 0;
        star3 = typeof d.star3 === 'number' ? d.star3 : 0;
        star4 = typeof d.star4 === 'number' ? d.star4 : 0;
        star5 = typeof d.star5 === 'number' ? d.star5 : 0;
        recommendYes = typeof d.recommendYes === 'number' ? d.recommendYes : 0;
        recommendNo = typeof d.recommendNo === 'number' ? d.recommendNo : 0;
      }

      // Increment corresponding star count
      if (stars === 1) star1 += 1;
      else if (stars === 2) star2 += 1;
      else if (stars === 3) star3 += 1;
      else if (stars === 4) star4 += 1;
      else if (stars === 5) star5 += 1;

      if (recommend) recommendYes += 1;
      else recommendNo += 1;

      // 3. Write individual rating doc
      transaction.set(ratingRef, {
        id: browserId,
        stars,
        recommend,
        createdAt: serverTimestamp(),
      });

      // 4. Update aggregate stats doc
      transaction.set(
        statsRef,
        {
          id: 'ratings',
          totalCount: totalCount + 1,
          totalStars: totalStars + stars,
          star1,
          star2,
          star3,
          star4,
          star5,
          recommendYes,
          recommendNo,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    });

    setLocalRatingSubmitted();
    return { success: true };
  } catch (err: any) {
    if (err?.message === 'ALREADY_RATED' || err?.message?.includes('ALREADY_RATED')) {
      setLocalRatingSubmitted();
      return {
        success: false,
        alreadyRated: true,
        message: 'شكرًا ليك ❤️ إنت قيّمت الموقع بالفعل، رأيك وصلنا.',
      };
    }
    console.error('[RatingSystem] Error submitting rating:', err);
    throw err;
  }
}

export function subscribeToRatingStats(
  callback: (stats: RatingStats) => void
): () => void {
  const statsRef = doc(db, 'meta', 'ratings');
  return onSnapshot(
    statsRef,
    (snap) => {
      if (snap.exists()) {
        callback(calculateRatingStats(snap.data()));
      } else {
        callback(EMPTY_RATING_STATS);
      }
    },
    (err) => {
      console.warn('[RatingSystem] Rating stats snapshot error:', err);
      callback(EMPTY_RATING_STATS);
    }
  );
}

export function subscribeToAllRatings(
  callback: (ratings: RatingDoc[]) => void
): () => void {
  const ratingsRef = collection(db, 'ratings');
  const q = query(ratingsRef, limit(100));
  return onSnapshot(
    q,
    (snap) => {
      const list: RatingDoc[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: docSnap.id,
          stars: d.stars || 5,
          recommend: d.recommend !== false,
          createdAt: d.createdAt,
        });
      });
      callback(list);
    },
    (err) => {
      console.warn('[RatingSystem] Admin ratings collection snapshot error:', err);
      callback([]);
    }
  );
}
