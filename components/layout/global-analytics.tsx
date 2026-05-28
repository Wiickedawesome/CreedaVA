"use client";

/**
 * GlobalAnalytics — site-wide passive event capture.
 *
 * Mounted once in `app/(marketing)/layout.tsx` so we can track visitor
 * activity without instrumenting every button. Events captured:
 *
 *   - session_start     (once per browser session)
 *   - scroll_depth      (25 / 50 / 75 / 100 thresholds, once per page)
 *   - outbound_click    (any <a href> off creedava.com)
 *   - cta_click         (any element with data-analytics-cta="…")
 *   - form_submission   (any <form data-analytics-form="…">) — page-level
 *                       trackEvent calls remain authoritative for the
 *                       contact/join forms which carry richer payloads.
 *
 * Designed to never throw. App Check enforcement on Firestore means a
 * failed trackEvent silently drops; that's expected and acceptable.
 */

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/firebase/analytics";

const SCROLL_THRESHOLDS = [25, 50, 75, 100] as const;

function isExternalHref(href: string): boolean {
  try {
    const url = new URL(href, window.location.origin);
    if (url.origin === window.location.origin) return false;
    // Treat mailto:/tel: as outbound — useful for contact tracking.
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol);
  } catch {
    return false;
  }
}

export function GlobalAnalytics() {
  const pathname = usePathname();
  const firedThresholdsRef = useRef<Set<number>>(new Set());

  // ─── session_start (once per browser session) ────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const KEY = "creedava_session_started";
    if (sessionStorage.getItem(KEY)) return;
    sessionStorage.setItem(KEY, "1");
    const entryReferrer = document.referrer || "";
    const entryQuery = window.location.search || "";
    void trackEvent("session_start", window.location.pathname, {
      ...(entryReferrer ? { entryReferrer } : {}),
      ...(entryQuery ? { entryQuery } : {}),
    });
  }, []);

  // ─── Reset scroll thresholds on route change ─────
  useEffect(() => {
    firedThresholdsRef.current = new Set();
  }, [pathname]);

  // ─── scroll_depth ────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const scrollTop = window.scrollY;
        const viewport = window.innerHeight;
        const docHeight = Math.max(
          document.documentElement.scrollHeight,
          document.body.scrollHeight,
        );
        const scrollable = Math.max(1, docHeight - viewport);
        const pct = Math.min(100, Math.round(((scrollTop + viewport) / docHeight) * 100));
        for (const t of SCROLL_THRESHOLDS) {
          if (pct >= t && !firedThresholdsRef.current.has(t)) {
            firedThresholdsRef.current.add(t);
            void trackEvent("scroll_depth", window.location.pathname, {
              threshold: t,
              scrollable,
            });
          }
        }
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ─── outbound_click / cta_click (delegated) ──────
  useEffect(() => {
    if (typeof window === "undefined") return;

    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const cta = target.closest<HTMLElement>("[data-analytics-cta]");
      if (cta) {
        const ctaName = cta.getAttribute("data-analytics-cta") || "unknown";
        const label = cta.textContent?.trim().slice(0, 80) ?? "";
        void trackEvent("cta_click", window.location.pathname, {
          cta: ctaName,
          ...(label ? { label } : {}),
        });
      }

      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (anchor) {
        const href = anchor.getAttribute("href") || "";
        if (href && isExternalHref(href)) {
          const label = anchor.textContent?.trim().slice(0, 80) ?? "";
          void trackEvent("outbound_click", window.location.pathname, {
            href,
            ...(label ? { label } : {}),
          });
        }
      }
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true } as EventListenerOptions);
  }, []);

  // ─── form_submission (delegated, opt-in via data-analytics-form) ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    function onSubmit(e: SubmitEvent) {
      const form = e.target as HTMLFormElement | null;
      if (!form || !form.matches("form[data-analytics-form]")) return;
      const name = form.getAttribute("data-analytics-form") || "form";
      void trackEvent("form_submission", window.location.pathname, {
        form: name,
      });
    }
    document.addEventListener("submit", onSubmit, { capture: true });
    return () => document.removeEventListener("submit", onSubmit, { capture: true } as EventListenerOptions);
  }, []);

  return null;
}
