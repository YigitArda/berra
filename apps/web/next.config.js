/** @type {import('next').NextConfig} */
const nextConfig = {
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

module.exports = nextConfig;
