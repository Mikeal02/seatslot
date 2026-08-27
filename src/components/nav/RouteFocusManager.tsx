import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Accessibility manager for client-side navigation.
 *
 * On every route change (except browser back/forward, where the previous
 * focus/scroll position is more natural):
 *
 * 1. Moves keyboard focus to the page's <main> landmark or its first
 *    heading, so screen-reader users hear the new page title and keyboard
 *    users can Tab into the new content immediately (no need to Tab past
 *    the header on every navigation).
 * 2. Announces the new page via a visually-hidden aria-live="polite"
 *    region so assistive tech users are told a navigation happened.
 *
 * Works with the existing <ScrollManager /> and the AnimatePresence page
 * transitions in App.tsx.
 */
export function RouteFocusManager() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const [announcement, setAnnouncement] = useState("");
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip the very first mount — initial page load already announces
    // itself via the document <title>, and stealing focus on load is jarring.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Respect the browser's natural focus behavior on back/forward.
    if (navigationType === "POP") return;

    // Wait for the new page (and its exit-animation swap) to mount.
    // 420ms matches the shared page transition duration in App.tsx.
    const timer = window.setTimeout(() => {
      // Prefer an explicit focus target if the page provides one.
      const explicit =
        document.querySelector<HTMLElement>("[data-route-focus]");
      const main = document.getElementById("main-content");
      const heading = main?.querySelector<HTMLElement>("h1, h2") ?? null;

      const target = explicit ?? heading ?? main;

      if (target) {
        // Make non-interactive landmarks keyboard-focusable just for this
        // programmatic focus, then release so normal Tab order is preserved.
        const hadTabIndex = target.hasAttribute("tabindex");
        if (!hadTabIndex) target.setAttribute("tabindex", "-1");

        target.focus({ preventScroll: true });

        // Clean up the temporary tabindex on blur so we don't pollute the DOM.
        const cleanup = () => {
          if (!hadTabIndex) target.removeAttribute("tabindex");
          target.removeEventListener("blur", cleanup);
        };
        target.addEventListener("blur", cleanup);
      }

      // Build a friendly announcement from <title> or heading text.
      const pageName =
        heading?.textContent?.trim() ||
        document.title.replace(/\s*[|·-]\s*.*$/, "").trim() ||
        "New page";
      setAnnouncement(`Navigated to ${pageName}`);
    }, 480);

    return () => window.clearTimeout(timer);
  }, [location.key, navigationType]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}
