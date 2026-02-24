import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  
  poweredByHeader: false,
  
  compress: true,

  typescript: {
    ignoreBuildErrors: false,
  },
  
  eslint: {
    ignoreDuringBuilds: false,
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

  experimental: {
    workerThreads: true,
    cpus: 2,
  },

  webpack: (config, { dev, isServer }) => {
    if (!dev) {
      config.cache = false;
    }
    return config;
  },

  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination:
          process.env.NODE_ENV === 'development'
            ? 'http://localhost:9002/api/dev-uploads/:path*'
            : '/api/uploads/:path*',
      },
    ];
  },
};

export default nextConfig;