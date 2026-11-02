"use client";

/**
 * FirebaseInit — initializes client-side Firebase services.
 *
 * Bootstraps App Check, Performance Monitoring, and Remote Config.
 * Renders nothing — just runs side-effects.
 *
 * Place this component once in the root layout or auth provider.
 *
 * Why this is deferred rather than immediate:
 * App Check uses reCAPTCHA Enterprise, which pulls ~350 KB of JavaScript —
 * ~43% of all JS on a public page. It was competing with LCP for visitors who
 * will never sign in or send a write. Initialization now runs after first
 * paint (idle) or on the first real interaction, whichever comes first.
 * Interaction is included deliberately: a user action that triggers a
 * Firestore write must have a token minted before that write leaves, so
 * waiting for idle alone would race the click.
 *
 * Note: this changes WHEN the bytes are fetched, not how many. Removing them
 * entirely would mean routing browser writes through server endpoints.
 */

import { useEffect } from "react";
import { initializeAppCheck } from "./app-check";
import { initializePerformance } from "./performance";
import { activateRemoteConfig } from "./remote-config";

let _initialized = false;

/** Runs `task` once, after first paint or on the first interaction. */
function runWhenReady(task: () => void): () => void {
  let done = false;

  const events = ["pointerdown", "keydown", "touchstart", "scroll"] as const;

  const run = () => {
    if (done) return;
    done = true;
    cleanup();
    task();
  };

  const idleHandle =
    typeof window.requestIdleCallback === "function"
      ? window.requestIdleCallback(run, { timeout: 3000 })
      : window.setTimeout(run, 2000);

  function cleanup() {
    for (const event of events) {
      window.removeEventListener(event, run);
    }
    if (typeof window.cancelIdleCallback === "function") {
      window.cancelIdleCallback(idleHandle as number);
    }
    window.clearTimeout(idleHandle as number);
  }

  for (const event of events) {
    window.addEventListener(event, run, { once: true, passive: true });
  }

  return cleanup;
}

export function FirebaseInit() {
  useEffect(() => {
    if (_initialized) return;
    _initialized = true;

    return runWhenReady(() => {
      // 1. App Check — must be first (before any Firestore/Functions calls)
      initializeAppCheck();

      // 2. Performance Monitoring — auto-instruments page loads
      initializePerformance();

      // 3. Remote Config — fetch and activate feature flags
      activateRemoteConfig();
    });
  }, []);

  return null;
}
