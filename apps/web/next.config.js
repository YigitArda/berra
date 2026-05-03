const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');

/** @type {import('next').NextConfig} */
const baseConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

module.exports = (phase) => {
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    return {
      ...baseConfig,
      distDir: '.next-dev',
      async rewrites() {
        return [
          {
            source: '/api/:path*',
            destination: 'http://localhost:4000/api/:path*',
          },
        ];
      },
    };
  }

  return {
    ...baseConfig,
    output: 'export',
    distDir: 'dist',
  };
};
