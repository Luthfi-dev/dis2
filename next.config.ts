import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // Menonaktifkan standalone sesuai permintaan user
  output: undefined,
  
  poweredByHeader: false,
  compress: true,

  // Pastikan validasi dilakukan saat build untuk keamanan kode
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
    // Membatasi penggunaan resource agar tidak overload di hosting
    workerThreads: true,
    cpus: 2,
  },

  webpack: (config, { dev, isServer }) => {
    // SOLUSI KRITIS: Matikan cache filesystem Webpack untuk mencegah ENOSPC (Disk Full)
    // Ini akan membuat build sedikit lebih lambat tapi menjamin tidak ada sampah cache di root/home
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
