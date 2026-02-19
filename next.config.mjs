/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    reactCompiler: true,
  },
  turbopack: {
    root: '.',
  },
};

export default nextConfig;
