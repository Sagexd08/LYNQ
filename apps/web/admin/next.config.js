
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    forceSwcTransforms: false,
  },
  swcMinify: false,
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http:
  },
};
module.exports = nextConfig;
