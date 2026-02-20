/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/site', destination: '/', permanent: true },
      { source: '/programs/:path*', destination: '/cms/programs/:path*', permanent: true },
      { source: '/students/:path*', destination: '/cms/students/:path*', permanent: true },
      { source: '/messages', destination: '/cms/messages', permanent: true },
      { source: '/analytics', destination: '/cms/analytics', permanent: true },
      { source: '/finances', destination: '/cms/finances', permanent: true },
      { source: '/settings', destination: '/cms/settings', permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['undici'],
  },
  webpack: (config) => {
    config.externals = config.externals || [];
    config.externals.push({
      'undici': 'commonjs undici',
    });
    return config;
  },
};

module.exports = nextConfig;
