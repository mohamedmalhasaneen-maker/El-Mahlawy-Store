import {
  RATING_PROMPT_DISMISSED_KEY,
  USEFUL_ACTIVITY_COUNT_KEY,
  isLocalRatingSubmitted,
} from './ratingSystem';

export type ActivityType =
  | 'view_product_details'
  | 'search_products'
  | 'select_category'
  | 'sort_products'
  | 'open_order_sheet'
  | 'view_about_page';

export function getUsefulActivityCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = sessionStorage.getItem(USEFUL_ACTIVITY_COUNT_KEY);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function isRatingPromptDismissedInSession(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(RATING_PROMPT_DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setRatingPromptDismissedInSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(RATING_PROMPT_DISMISSED_KEY, 'true');
  } catch {
    // Ignore storage issues
  }
}

type TriggerListener = () => void;
const promptTriggerListeners = new Set<TriggerListener>();

export function listenForRatingPromptTrigger(listener: TriggerListener): () => void {
  promptTriggerListeners.add(listener);
  // Check if threshold was already reached earlier in this session
  if (getUsefulActivityCount() >= 3 && !isRatingPromptDismissedInSession() && !isLocalRatingSubmitted()) {
    listener();
  }
  return () => {
    promptTriggerListeners.delete(listener);
  };
}

export function recordUsefulActivity(
  _type: string,
  _detail?: string
): number {
  if (typeof window === 'undefined') return 0;

  // Don't track if already submitted or dismissed in this session
  if (isLocalRatingSubmitted() || isRatingPromptDismissedInSession()) {
    return getUsefulActivityCount();
  }

  const current = getUsefulActivityCount();
  const updated = current + 1;

  try {
    sessionStorage.setItem(USEFUL_ACTIVITY_COUNT_KEY, updated.toString());
  } catch {
    // Ignore storage issues
  }

  // Threshold condition: at least 3 completed useful activities
  if (updated >= 3) {
    promptTriggerListeners.forEach((listener) => {
      try {
        listener();
      } catch {
        // Ignore listener errors
      }
    });
  }

  return updated;
}
