"use client";

import type { MouseEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n";

/** Scroll distance after which the button earns its place on screen. */
const SHOW_AFTER_PX = 480;

/**
 * Minimal back-to-top quick action, fixed bottom-right.
 *
 * Stays invisible (but mounted, so the fade can play) until the reader is past
 * the hero, and is removed from the tab order and pointer events while hidden.
 */
export function BackToTop(): ReactNode {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > SHOW_AFTER_PX);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function scrollToTop(event: MouseEvent<HTMLButtonElement>) {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    // The button hides itself at the top; drop focus so the keyboard does not
    // stay parked on an aria-hidden control.
    event.currentTarget.blur();
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label={t.common.backToTop}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`fixed right-6 bottom-6 z-40 grid h-10 w-10 place-items-center rounded-full border border-mk-line-strong bg-mk-paper/90 text-mk-ink-soft backdrop-blur transition-all duration-200 ease-out hover:border-mk-brand hover:text-mk-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mk-brand ${
        visible
          ? "translate-y-0 opacity-100 shadow-(--mk-shadow-card)"
          : "pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M6 11l6-6 6 6" />
      </svg>
    </button>
  );
}
