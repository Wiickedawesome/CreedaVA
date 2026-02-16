import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
    ],
  },
  // Tree-shake Firebase — only bundle the sub-packages actually imported
  experimental: {
    optimizePackageImports: [
      "firebase/app",
      "firebase/auth",
      "firebase/firestore",
      "firebase/ai",
      "firebase/analytics",
    ],
  },
};

export default nextConfig;
