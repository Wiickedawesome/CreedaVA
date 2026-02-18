"use client";

/**
 * FirebaseInit — initializes client-side Firebase services.
 *
 * Bootstraps App Check, Performance Monitoring, and Remote Config
 * in a single place. Renders nothing — just runs side-effects.
 *
 * Place this component once in the root layout or auth provider.
 */

import { useEffect } from "react";
import { initializeAppCheck } from "./app-check";
import { initializePerformance } from "./performance";
import { activateRemoteConfig } from "./remote-config";

let _initialized = false;

export function FirebaseInit() {
  useEffect(() => {
    if (_initialized) return;
    _initialized = true;

    // 1. App Check — must be first (before any Firestore/Functions calls)
    initializeAppCheck();

    // 2. Performance Monitoring — auto-instruments page loads
    initializePerformance();

    // 3. Remote Config — fetch and activate feature flags
    activateRemoteConfig();
  }, []);

  return null;
}
