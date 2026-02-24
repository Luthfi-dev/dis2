
import type {NextConfig} from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Output standalone sangat optimal untuk hosting (Vercel, VPS, dll)
  output: 'standalone',
  
  // Keamanan: Sembunyikan informasi server
  poweredByHeader: false,
  
  // Optimasi: Kompresi aset otomatis
  compress: true,

  typescript: {
    // Pastikan build gagal jika ada error type demi keamanan data
    ignoreBuildErrors: false,
  },
  
  eslint: {
    // Jalankan linting saat build untuk menjaga kualitas kode
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

  // Konfigurasi tambahan untuk mencegah 'garbage files' di root
  // Next.js menggunakan .next/cache secara default. 
  // Penulisan file acak biasanya berasal dari sistem native atau telemetry.
  experimental: {
    // Mengurangi penggunaan memori saat build
    workerThreads: true,
    cpus: 2,
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
