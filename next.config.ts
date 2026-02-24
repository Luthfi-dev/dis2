
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // Output standalone sangat optimal untuk hosting modern (Docker, Vercel, VPS)
  output: 'standalone',
  
  // Keamanan: Sembunyikan informasi identitas server
  poweredByHeader: false,
  
  // Optimasi: Kompresi aset otomatis untuk menghemat bandwidth
  compress: true,

  typescript: {
    // Pastikan build gagal jika ada error type demi keamanan data di produksi
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

  experimental: {
    // Optimasi penggunaan memori saat build untuk mencegah crash di server kecil
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
