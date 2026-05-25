/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
    ],
  },
};

module.exports = nextConfig;
