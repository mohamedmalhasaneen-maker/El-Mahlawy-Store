const ACTIVE_ARRIVAL_CLASS = 'section-arrival-active';
const ARRIVAL_CLEANUP_MS = 1000;

let activeScrollRafId: number | null = null;
let cancelListenersCleanup: (() => void) | null = null;
const arrivalTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

export function findVisibleElementById(sectionId: string): HTMLElement | null {
  if (typeof document === 'undefined' || !sectionId) return null;
  const escaped = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(sectionId) : sectionId;
  const candidates = document.querySelectorAll<HTMLElement>(`#${escaped}`);
  for (const el of candidates) {
    if (el.getClientRects().length > 0) {
      return el;
    }
  }
  return document.getElementById(sectionId);
}

function getStickyHeaderOffset(): number {
  if (typeof document === 'undefined') return 72;
  const headers = document.querySelectorAll<HTMLElement>('header');
  for (const header of headers) {
    if (header.getClientRects().length > 0) {
      const style = window.getComputedStyle(header);
      if (style.position === 'sticky' || style.position === 'fixed') {
        return Math.ceil(header.getBoundingClientRect().height) + 10;
      }
    }
  }
  return 72;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function stopOngoingScrollAnimation(): void {
  if (activeScrollRafId !== null) {
    cancelAnimationFrame(activeScrollRafId);
    activeScrollRafId = null;
  }
  if (cancelListenersCleanup) {
    cancelListenersCleanup();
    cancelListenersCleanup = null;
  }
}

export function triggerSectionArrivalHighlight(target: HTMLElement | null): void {
  if (!target || prefersReducedMotion()) return;
  const existingTimer = arrivalTimers.get(target);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }
  target.classList.remove(ACTIVE_ARRIVAL_CLASS);
  // Force reflow so rapid consecutive clicks replay the arrival transition cleanly
  void target.offsetWidth;
  target.classList.add(ACTIVE_ARRIVAL_CLASS);

  const timer = setTimeout(() => {
    target.classList.remove(ACTIVE_ARRIVAL_CLASS);
    arrivalTimers.delete(target);
  }, ARRIVAL_CLEANUP_MS);
  arrivalTimers.set(target, timer);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function smoothScrollToY(targetY: number, onArrive?: () => void): void {
  if (typeof window === 'undefined') return;
  stopOngoingScrollAnimation();

  const maxScrollY = Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight
  );
  const clampedTargetY = Math.max(0, Math.min(targetY, maxScrollY));
  const startY = window.scrollY;
  const distance = clampedTargetY - startY;

  if (Math.abs(distance) < 4 || prefersReducedMotion()) {
    window.scrollTo({ top: clampedTargetY, behavior: 'auto' });
    onArrive?.();
    return;
  }

  const duration = Math.min(780, Math.max(420, Math.abs(distance) * 0.35));
  const startTime = performance.now();

  const onUserInterrupt = () => {
    stopOngoingScrollAnimation();
  };

  window.addEventListener('wheel', onUserInterrupt, { passive: true, once: true });
  window.addEventListener('touchstart', onUserInterrupt, { passive: true, once: true });
  cancelListenersCleanup = () => {
    window.removeEventListener('wheel', onUserInterrupt);
    window.removeEventListener('touchstart', onUserInterrupt);
  };

  const step = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    const eased = easeInOutCubic(progress);
    window.scrollTo(0, startY + distance * eased);

    if (progress < 1) {
      activeScrollRafId = requestAnimationFrame(step);
    } else {
      stopOngoingScrollAnimation();
      onArrive?.();
    }
  };

  activeScrollRafId = requestAnimationFrame(step);
}

export function smoothScrollToTop(): void {
  smoothScrollToY(0);
}

export function smoothScrollToElement(
  targetOrId: string | HTMLElement | null,
  options?: { highlight?: boolean; extraOffset?: number }
): boolean {
  if (typeof window === 'undefined') return false;
  const target =
    typeof targetOrId === 'string' ? findVisibleElementById(targetOrId) : targetOrId;
  if (!target) return false;

  const headerOffset = getStickyHeaderOffset() + (options?.extraOffset ?? 0);
  const rect = target.getBoundingClientRect();
  const absoluteTop = window.scrollY + rect.top - headerOffset;

  smoothScrollToY(absoluteTop, () => {
    if (options?.highlight !== false) {
      triggerSectionArrivalHighlight(target);
    }
  });
  return true;
}
