import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Netflix / IMDb style scroll restoration for React Router BrowserRouter.
 *
 * - On PUSH / REPLACE (forward navigation): scroll to top of the new page.
 * - On POP (browser back / forward): restore the scroll position that was
 *   saved for that history entry.
 *
 * Positions are keyed by `location.key`, which React Router assigns uniquely
 * per history entry, so multi-level back navigation works correctly.
 */
export function ScrollManager() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const positions = useRef<Map<string, number>>(new Map());
  const lastKey = useRef<string>(location.key);

  // Save scroll position of the outgoing page BEFORE the DOM updates.
  useLayoutEffect(() => {
    const prevKey = lastKey.current;
    // Store what the user last saw on the previous history entry.
    if (prevKey && prevKey !== location.key) {
      positions.current.set(prevKey, window.scrollY);
    }
    lastKey.current = location.key;
  }, [location.key]);

  // After the new page mounts, restore or reset scroll.
  useEffect(() => {
    // Ignore hash links — let the browser handle them.
    if (location.hash) return;

    if (navigationType === 'POP') {
      const saved = positions.current.get(location.key);
      // Wait a frame so the page has rendered its content.
      requestAnimationFrame(() => {
        window.scrollTo({ top: saved ?? 0, left: 0, behavior: 'auto' });
      });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [location.key, location.hash, navigationType]);

  // Persist scroll on unload so a refresh preserves position for the current entry.
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  return null;
}
