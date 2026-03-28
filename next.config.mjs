const backendPort = process.env.BACKEND_PORT || '5001';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: false,
  allowedDevOrigins: ['*.replit.dev', '*.worf.replit.dev', '127.0.0.1'],
  transpilePackages: [],
  turbopack: {
    resolveAlias: {
      '@shared': './shared',
      '@assets': './attached_assets',
      'use-sync-external-store/shim/index.js': './src/lib/shims/use-sync-external-store-shim.js',
      'use-sync-external-store/shim': './src/lib/shims/use-sync-external-store-shim.js',
      'use-sync-external-store/shim/with-selector.js': './src/lib/shims/use-sync-external-store-shim-with-selector.js',
      'use-sync-external-store/shim/with-selector': './src/lib/shims/use-sync-external-store-shim-with-selector.js',
    },
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `http://localhost:${backendPort}/api/:path*`,
      },
      {
        source: '/objects/:path*',
        destination: `http://localhost:${backendPort}/objects/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `http://localhost:${backendPort}/uploads/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
