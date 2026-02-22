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
          {
            key: "Content-Security-Policy",
            value: "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; connect-src 'self' https:; frame-src 'self' https:; img-src 'self' data: https:; style-src 'self' 'unsafe-inline';",
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
