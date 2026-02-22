/** @type {import('next').NextConfig} */
const rawFunctionsBase = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || "https://us-east4-creeda-va.cloudfunctions.net";
const functionsBase = rawFunctionsBase.replace(/\/$/, "");

const nextConfig = {
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
    ],
  },

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
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
      {
        // Firebase Auth iframe must be frameable — override the DENY above.
        // This rule must come AFTER the catch-all so it wins for duplicate keys.
        source: "/__/auth/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        // Proxy Firebase Auth helper routes so they run first-party on creedava.com.
        // Required because authDomain=creedava.com — without this, browsers block
        // the firebaseapp.com iframe as a third-party (storage partitioning).
        source: "/__/auth/:path*",
        destination: "https://creeda-va.firebaseapp.com/__/auth/:path*",
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
