import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const rawFunctionsBase = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || "https://us-east4-creeda-va.cloudfunctions.net";
const functionsBase = rawFunctionsBase.replace(/\/$/, "");

const isDev = process.env.NODE_ENV !== "production";

/**
 * Every third-party origin that serves executable JavaScript to this app.
 *
 * `script-src` used to contain a bare `https:`, which allowed a script from any
 * HTTPS host and therefore provided almost no XSS mitigation. Listing the hosts
 * is what makes the directive do work.
 *
 *   www.googletagmanager.com            GA4 gtag.js (marketing layout)
 *   www.google.com, www.recaptcha.net   reCAPTCHA Enterprise (App Check)
 *   www.gstatic.com                    reCAPTCHA + firebase compat SDK (service worker)
 *   apis.google.com                    Firebase Auth popup helper
 *   *.firebaseapp.com                  Firebase `/__/auth/handler` frame
 *   googleads.g.doubleclick.net        Google Ads conversion linker
 *   www.googleadservices.com           Google Ads conversion page
 *   pagead2.googlesyndication.com      Google Ads remarketing
 *   www.google-analytics.com           GA4 auxiliary loader
 *
 * The last four are injected by gtag because the GA4 property has a Google Ads
 * link — nothing in this repo references them. **Measured 2026-11-27:** without
 * them the allowlist produced `Loading the script
 * 'https://googleads.g.doubleclick.net/pagead/viewthroughconversion/…'`
 * violations on `/` and `/pricing`, i.e. conversion tracking would have gone
 * silently dead in production. Re-check this list whenever an ads or analytics
 * account is linked, using the browser console filter “Content Security Policy”.
 */
const SCRIPT_SRC_HOSTS = [
  "'self'",
  // Next.js inlines its bootstrap and the app relies on runtime style/script
  // injection, so inline is required until a nonce pipeline is added.
  "'unsafe-inline'",
  "https://www.googletagmanager.com",
  "https://www.google-analytics.com",
  "https://www.google.com",
  "https://www.recaptcha.net",
  "https://www.gstatic.com",
  "https://apis.google.com",
  "https://*.firebaseapp.com",
  "https://googleads.g.doubleclick.net",
  "https://www.googleadservices.com",
  "https://pagead2.googlesyndication.com",
];

// React's dev-only refresh runtime and several dev tools require eval. The
// production bundle does not, so the escape hatch is not shipped to users.
const SCRIPT_SRC = isDev ? [...SCRIPT_SRC_HOSTS, "'unsafe-eval'"] : SCRIPT_SRC_HOSTS;

const FRAME_ANCESTORS = isDev
  ? "'self' http://localhost:* https://creedava.com https://creeda-va.firebaseapp.com"
  : "'self' https://creedava.com https://creeda-va.firebaseapp.com";

const CONTENT_SECURITY_POLICY = [
  // `default-src` no longer carries `unsafe-eval`: only scripts ever needed it,
  // and `script-src` overrides this for scripts anyway.
  "default-src 'self' https: data:",
  `script-src ${SCRIPT_SRC.join(" ")}`,
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self' https:",
  "frame-src 'self' https:",
  "img-src 'self' data: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  // The messaging service worker imports the compat SDK from gstatic.
  "worker-src 'self' https://www.gstatic.com",
  "object-src 'none'",
  "base-uri 'self'",
  `frame-ancestors ${FRAME_ANCESTORS}`,
].join("; ");

const nextConfig = {
  // firebase-admin uses native modules (grpc, etc.) that must not be bundled
  serverExternalPackages: ["firebase-admin"],

  turbopack: {
    root: __dirname,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        // Curated Unsplash thumbnails for blog featured images.
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          // X-Frame-Options: SAMEORIGIN prevents localhost from framing creedava.com for auth.
          // We remove it or set it to ALLOWALL if we rely on CSP 'frame-ancestors' instead.
          // { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // X-XSS-Protection was removed from every major browser and its
          // `mode=block` behaviour is itself exploitable on the ones that still
          // honour it. CSP is the supported replacement.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: CONTENT_SECURITY_POLICY,
          },
        ],
      },
      {
        // No caching for API routes
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },

    ];
  },

  async rewrites() {
    return [
      {
        source: "/__/auth/(.*)",
        destination: "https://creeda-va.firebaseapp.com/__/auth/$1",
      },
      {
        source: "/handleFormWebhook",
        destination: `${functionsBase}/handleFormWebhook`,
      },
      {
        source: "/getAvailableSlots",
        destination: `${functionsBase}/getAvailableSlots`,
      },
    ];
  },
};

export default nextConfig;
