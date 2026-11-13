import type { NextConfig } from 'next';

// Semua /api/* di-proxy ke backend terpisah — frontend murni UI, tanpa CORS
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${BACKEND_URL}/api/:path*` },
      { source: '/uploads/:path*', destination: `${BACKEND_URL}/uploads/:path*` },
    ];
  },
  // Permanent redirect HTTP 301 path lama (bahasa Indonesia) → path standar Inggris.
  // Didefinisikan di level config (bukan page) agar berlaku sebelum routing & konsisten di dev/staging/production.
  async redirects() {
    return [
      { source: '/masuk', destination: '/login', statusCode: 301 },
      { source: '/daftar', destination: '/login', statusCode: 301 },
      { source: '/katalog', destination: '/catalog', statusCode: 301 },
      { source: '/kontak', destination: '/contact', statusCode: 301 },
      { source: '/produk/:path*', destination: '/products/:path*', statusCode: 301 },
    ];
  },
};

export default nextConfig;
