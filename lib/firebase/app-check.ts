/**
 * Firebase App Check — protects backend resources from abuse.
 *
 * Uses reCAPTCHA Enterprise provider for web apps.
 * Verifies that requests to Firestore, Cloud Functions, and Storage
 * originate from the legitimate creedava.com website.
 *
 * Prerequisites:
 *   1. Enable App Check in Firebase Console
 *   2. Register your site with reCAPTCHA Enterprise
 *   3. Set NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY in env
 *
 * @see https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider
 */

import {
  initializeAppCheck as _initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  getToken,
  type AppCheck,
} from "firebase/app-check";
import { app } from "./config";

let _appCheck: AppCheck | null = null;

/**
 * Initialize App Check with reCAPTCHA Enterprise.
 * Call once from a client-side component (e.g., root layout or auth provider).
 * Safe to call multiple times — returns cached instance.
 */
export function initializeAppCheck(): AppCheck | null {
  if (typeof window === "undefined") return null;
  if (_appCheck) return _appCheck;

  const isDev = process.env.NODE_ENV === "development";
  const appCheckEnabled = process.env.NEXT_PUBLIC_ENABLE_APP_CHECK === "true";
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY;

  // In development: always initialize with Firebase debug token mode.
  // Firebase will print a UUID to the console — register it once in
  // Firebase Console → App Check → Apps → Manage debug tokens.
  // This allows AI / Firestore / Functions calls to work on localhost.
  if (isDev) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    // ReCaptchaEnterpriseProvider is required by the SDK even in debug mode.
    // The key is never sent to Google when debug token overrides it.
    const devKey = siteKey || "debug-placeholder-not-used";
    _appCheck = _initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(devKey),
      isTokenAutoRefreshEnabled: true,
    });
    return _appCheck;
  }

  // Production: require both the enable flag and a real reCAPTCHA key.
  if (!appCheckEnabled) {
    console.warn(
      "[App Check] Disabled via NEXT_PUBLIC_ENABLE_APP_CHECK. " +
        "Enable it after registering your app in Firebase Console → App Check.",
    );
    return null;
  }

  if (!siteKey) {
    console.warn(
      "[App Check] NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY is not set. " +
        "App Check is disabled. Set it in apphosting.yaml.",
    );
    return null;
  }

  _appCheck = _initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });

  return _appCheck;
}

/**
 * Returns App Check headers for HTTP requests to protected endpoints.
 * If App Check is unavailable or fails for any reason, returns an empty
 * header object so callers are never blocked by reCAPTCHA issues.
 */
export async function getAppCheckHeaders(): Promise<Record<string, string>> {
  try {
    const appCheck = initializeAppCheck();
    if (!appCheck) return {};
    const tokenResult = await getToken(appCheck, false);
    if (!tokenResult.token) return {};
    return { "X-Firebase-AppCheck": tokenResult.token };
  } catch {
    // Silently degrade — App Check is an optional security layer.
    // Forms must work even when reCAPTCHA is blocked by ad-blockers,
    // corporate firewalls, or browser privacy settings.
    return {};
  }
}

/**
 * How long to wait for reCAPTCHA before letting the caller proceed anyway.
 * Generous enough for a slow mobile connection, short enough that a visitor on
 * a network that blocks reCAPTCHA is not left staring at a dead button.
 */
const APP_CHECK_WAIT_MS = 10_000;

/**
 * Resolve once an App Check token exists, or after APP_CHECK_WAIT_MS.
 *
 * Auth is the one caller that cannot skip this. App Check is ENFORCED on
 * `identitytoolkit`, so a sign-in request that leaves without a token is
 * rejected outright — measured: 401 "Firebase App Check token is invalid."
 * The visitor sees only a popup that closes and returns them to /login.
 *
 * App Check itself is initialised lazily, on purpose, to keep reCAPTCHA's
 * ~350 KB off public pages. Everywhere else that is harmless because the SDK
 * refreshes the token in the background. Sign-in is the exception: it is the
 * first thing a new visitor does, so a click within the first few seconds used
 * to fire the popup while the reCAPTCHA script was still in flight. Minting the
 * token here removes that race instead of hoping the visitor waits.
 *
 * Returns false when no token could be produced. Callers proceed regardless:
 * enforcement may be off in another environment, and blocking sign-in on a
 * token we could not mint would be worse than trying without one.
 */
export async function ensureAppCheckToken(): Promise<boolean> {
  const appCheck = initializeAppCheck();
  if (!appCheck) return false;

  try {
    const token = await Promise.race([
      getToken(appCheck, false).then((result) => result.token),
      new Promise<null>((resolve) =>
        window.setTimeout(() => resolve(null), APP_CHECK_WAIT_MS),
      ),
    ]);
    return Boolean(token);
  } catch {
    return false;
  }
}
