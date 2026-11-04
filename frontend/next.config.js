/** @type {import('next').NextConfig} */

const path = require('path');

const nextConfig = {
  reactStrictMode: true,

  // Allow Next.js to access shared source files outside frontend/
  outputFileTracingRoot: path.join(__dirname, '../'),

  images: {
    unoptimized: true,
  },

  env: {
    FRONTEND_PUBLIC_URL:
      process.env.FRONTEND_PUBLIC_URL || 'http://localhost:3000',

    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ||
      'https://digital-menu-la22.onrender.com/api',
  },

  async rewrites() {
    return [
      {
        source: '/src/assets/images/:path*',
        destination: '/assets/images/:path*',
      },
      {
        source: '/api/:path*',
        destination: `${
          process.env.BACKEND_INTERNAL_URL ||
          'https://digital-menu-la22.onrender.com'
        }/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;