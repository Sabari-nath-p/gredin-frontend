/** @type {import('next').NextConfig} */
module.exports = {
  output: 'standalone',
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3000',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:3000'}/:path*`,
      },
    ];
  },
}
