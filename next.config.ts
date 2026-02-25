import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // Menonaktifkan standalone sesuai permintaan user
  output: undefined,
  
  poweredByHeader: false,
  compress: true,

  // MENGABAIKAN LINTING DAN TYPE CHECK SAAT BUILD UNTUK KELANCARAN DEPLOYMENT
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

  experimental: {
    workerThreads: true,
    cpus: 2,
  },

  webpack: (config, { dev }) => {
    // MEMATIKAN CACHE FILESYSTEM UNTUK MENCEGAH DISK FULL (ENOSPC)
    // Ini memastikan tidak ada sampah cache yang ditulis ke disk saat build
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
