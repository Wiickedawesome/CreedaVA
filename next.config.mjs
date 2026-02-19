/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  experimental: {
    reactCompiler: true,
  },
  turbopack: {
    root: '.',
  },
};

export default nextConfig;
