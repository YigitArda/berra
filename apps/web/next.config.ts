import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async redirects() {
    return [
      {
        source: '/index.html',
        destination: '/',
        permanent: true,
      },
      {
        source: '/post/:id',
        destination: '/items/:id',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
