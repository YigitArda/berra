import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
