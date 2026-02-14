/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination:
          process.env.NODE_ENV === 'development'
            ? 'http://localhost:9002/api/dev-uploads/:path*' // A route to handle serving files in dev
            : '/api/uploads/:path*', // A route to handle serving files in prod
      },
    ];
  },
};

module.exports = nextConfig;
