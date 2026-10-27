import { useEffect, useRef } from 'react';

/**
 * Locks background document scrolling, binds Escape to close, and pushes a
 * lightweight history entry so the mobile hardware/browser Back button
 * dismisses the active drawer or bottom sheet cleanly instead of leaving the page.
 */
export function useMobileOverlay(
  isOpen: boolean,
  onClose: () => void,
  overlayKey: string
): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    try {
      window.history.pushState({ mobileOverlay: overlayKey }, '');
    } catch {
      // Ignore history API restrictions in sandboxed environments
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
      }
    };

    const handlePopState = () => {
      onCloseRef.current();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, overlayKey]);
}
