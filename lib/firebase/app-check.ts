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

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY;

  if (!siteKey) {
    console.warn(
      "[App Check] NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY is not set. " +
        "App Check is disabled. Set it in .env.local or apphosting.yaml.",
    );
    return null;
  }

  // In development, enable debug mode so localhost requests aren't blocked.
  // The debug token is logged to the console — register it in Firebase Console
  // under App Check → Apps → Manage debug tokens.
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  const provider =
    process.env.NODE_ENV === "development"
      ? new ReCaptchaEnterpriseProvider(siteKey) // Or use a Debug provider if you prefer explicitly
      : new ReCaptchaEnterpriseProvider(siteKey);

  _appCheck = _initializeAppCheck(app, {
    provider,
    isTokenAutoRefreshEnabled: true,
  });

  return _appCheck;
}
