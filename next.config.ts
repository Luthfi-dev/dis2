import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: undefined,
  
  poweredByHeader: false,
  compress: true,

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

  webpack: (config, { dev }) => {
    // Matikan cache filesystem secara total untuk mencegah disk penuh (ENOSPC)
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
